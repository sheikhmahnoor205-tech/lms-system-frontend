import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

import './Marks.css';

// Default departmental subjects curriculum mapping (marks start at 0 — only set by teachers)


// Calculate letter grade and GPA points from single subject total (0-100)
export const computeSubjectScore = (midterm = 0, final = 0, sectional = 0, creditHours = 3) => {
  const m = Math.max(0, Math.min(25, Number(midterm) || 0));
  const f = Math.max(0, Math.min(50, Number(final) || 0));
  const sec = Math.max(0, Math.min(25, Number(sectional) || 0));
  const ch = Math.max(1, Math.min(6, Number(creditHours) || 3));
  const total = m + f + sec;

  let letterGrade = 'N/A';
  let gpa = 0.00;
  let performanceStatus = 'Not Evaluated';

  if (total > 0 || (midterm !== undefined && final !== undefined && sectional !== undefined)) {
    if (total >= 90) { letterGrade = 'A+'; gpa = 4.00; performanceStatus = 'Outstanding'; }
    else if (total >= 85) { letterGrade = 'A'; gpa = 4.00; performanceStatus = 'Excellent'; }
    else if (total >= 80) { letterGrade = 'A-'; gpa = 3.70; performanceStatus = 'Very Good'; }
    else if (total >= 75) { letterGrade = 'B+'; gpa = 3.30; performanceStatus = 'Good'; }
    else if (total >= 70) { letterGrade = 'B'; gpa = 3.00; performanceStatus = 'Above Average'; }
    else if (total >= 65) { letterGrade = 'B-'; gpa = 2.70; performanceStatus = 'Satisfactory'; }
    else if (total >= 60) { letterGrade = 'C+'; gpa = 2.30; performanceStatus = 'Average'; }
    else if (total >= 55) { letterGrade = 'C'; gpa = 2.00; performanceStatus = 'Pass'; }
    else if (total >= 50) { letterGrade = 'D'; gpa = 1.70; performanceStatus = 'Marginal Pass'; }
    else if (total > 0) { letterGrade = 'F'; gpa = 0.00; performanceStatus = 'Needs Focus'; }
  }

  return {
    midterm: m,
    final: f,
    sectional: sec,
    creditHours: ch,
    totalMarks: total,
    percentage: total,
    letterGrade,
    gpa,
    performanceStatus
  };
};

// Compute comprehensive student performance across all enrolled subjects
export const getStudentEnrolledSubjectsWithMetrics = (student, departments = []) => {
  if (!student) return { subjects: [], totalMarks: 0, maxMarks: 0, percentage: 0, totalCredits: 0, sgpa: 0, cgpa: 0, letterGrade: 'N/A', academicStanding: 'Not Evaluated' };

  const deptKey = student.dept || '';
  const matchedDept = (deptKey && Array.isArray(departments)) ? departments.find(d => (d.name && d.name.toLowerCase() === deptKey.toLowerCase()) || (d.code && d.code.toLowerCase() === deptKey.toLowerCase())) : null;

  let defaultList = [];
  if (matchedDept && Array.isArray(matchedDept.courses) && matchedDept.courses.length > 0) {
    defaultList = matchedDept.courses.map((c) => ({
      code: c.code,
      name: c.name,
      creditHours: 3,
      midterm: 0,
      final: 0,
      sectional: 0
    }));
  }

  // Use real subjects from DB if available, otherwise use database departmental curriculum template
  const rawSubjects = (Array.isArray(student.subjects) && student.subjects.length > 0)
    ? student.subjects
    : defaultList;

  let totalCredits = 0;
  let weightedGPASum = 0;
  let totalScoreSum = 0;

  const subjects = rawSubjects.map(sub => {
    const metrics = computeSubjectScore(sub.midterm, sub.final, sub.sectional, sub.creditHours);
    totalCredits += metrics.creditHours;
    weightedGPASum += (metrics.gpa * metrics.creditHours);
    totalScoreSum += metrics.totalMarks;

    return {
      code: sub.code || '',
      name: sub.name || '',
      ...metrics
    };
  });

  const maxMarks = subjects.length * 100;
  const sgpa = totalCredits > 0 ? Number((weightedGPASum / totalCredits).toFixed(2)) : 0.00;
  const cgpa = Number((student.cgpa || sgpa).toFixed(2));
  const percentage = maxMarks > 0 ? Number(((totalScoreSum / maxMarks) * 100).toFixed(1)) : 0;

  let letterGrade = 'N/A';
  let academicStanding = 'Not Evaluated';

  if (subjects.length > 0) {
    if (sgpa >= 3.85 || percentage >= 90) { letterGrade = 'A+'; academicStanding = "Dean's Honor Roll"; }
    else if (sgpa >= 3.70 || percentage >= 85) { letterGrade = 'A'; academicStanding = "Dean's Honor Roll"; }
    else if (sgpa >= 3.50 || percentage >= 80) { letterGrade = 'A-'; academicStanding = "Dean's Honor Roll"; }
    else if (sgpa >= 3.00 || percentage >= 70) { letterGrade = 'B'; academicStanding = 'Good Standing'; }
    else if (sgpa >= 2.50 || percentage >= 60) { letterGrade = 'C+'; academicStanding = 'Good Standing'; }
    else if (sgpa >= 2.00 || percentage >= 50) { letterGrade = 'C'; academicStanding = 'Good Standing'; }
    else if (percentage > 0) { letterGrade = 'F'; academicStanding = 'Academic Warning'; }
  }

  return {
    subjects,
    totalMarks: totalScoreSum,
    maxMarks,
    percentage,
    totalCredits,
    sgpa,
    cgpa,
    letterGrade,
    academicStanding
  };
};

export default function Marks() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'bulk'
  const [selectedStudentRoll, setSelectedStudentRoll] = useState('');

  // Editing state
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [editSubjectData, setEditSubjectData] = useState({
    midterm: 0,
    final: 0,
    sectional: 0,
    creditHours: 3
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const { students, departments, updateStudentMarks } = useAttendance();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';

  React.useEffect(() => {
    if (role === 'Teacher' && currentUser?.department) {
      setDeptFilter(currentUser.department);
    }
  }, [role, currentUser]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Filter students loaded from database
  const filteredStudents = useMemo(() => {
    return students.filter(m => {
      const matchesSearch = (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.roll || '').includes(searchTerm) ||
        (m.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All' ? true : m.dept === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [students, searchTerm, deptFilter]);

  // Active student for single view
  const activeStudent = useMemo(() => {
    if (role === 'Student') {
      return students.find(s => s.name === currentUser?.name || s.roll === currentUser?.roll || s.email === currentUser?.email) || students[0];
    }
    return students.find(s => s.roll === selectedStudentRoll) || filteredStudents[0] || students[0];
  }, [role, currentUser, selectedStudentRoll, filteredStudents, students]);

  // Active student metrics across all subjects
  const activeStudentMetrics = useMemo(() => {
    return getStudentEnrolledSubjectsWithMetrics(activeStudent, departments);
  }, [activeStudent, departments]);

  // Open edit modal for specific subject or student
  const handleOpenEditModal = (student, subject = null) => {
    if (role !== 'Teacher') return;
    setEditingStudent(student);

    const metrics = getStudentEnrolledSubjectsWithMetrics(student, departments);
    const targetSubject = subject || metrics.subjects[0];

    if (targetSubject) {
      setSelectedSubjectCode(targetSubject.code);
      setEditSubjectData({
        midterm: targetSubject.midterm ?? 0,
        final: targetSubject.final ?? 0,
        sectional: targetSubject.sectional ?? 0,
        creditHours: targetSubject.creditHours ?? 3
      });
    }
  };

  const handleSubjectSelectionChange = (code) => {
    setSelectedSubjectCode(code);
    if (!editingStudent) return;
    const metrics = getStudentEnrolledSubjectsWithMetrics(editingStudent, departments);
    const target = metrics.subjects.find(s => s.code === code);
    if (target) {
      setEditSubjectData({
        midterm: target.midterm ?? 0,
        final: target.final ?? 0,
        sectional: target.sectional ?? 0,
        creditHours: target.creditHours ?? 3
      });
    }
  };

  // Save updated subject marks to database
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (role !== 'Teacher' || !editingStudent || !selectedSubjectCode) return;

    await updateStudentMarks(
      editingStudent.roll,
      editSubjectData.midterm,
      editSubjectData.final,
      editSubjectData.sectional,
      editSubjectData.creditHours,
      selectedSubjectCode
    );

    setSaveSuccessMsg(`Marks updated successfully for ${selectedSubjectCode} (${editingStudent.name})!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
    setEditingStudent(null);
  };

  // Inline quick mark change for teachers in single view
  const handleInlineSubjectMarksChange = async (studentRoll, subjectCode, field, value) => {
    if (role !== 'Teacher') return;
    const s = students.find(item => item.roll === studentRoll);
    if (!s) return;

    const metrics = getStudentEnrolledSubjectsWithMetrics(s, departments);
    const currentSub = metrics.subjects.find(sub => sub.code === subjectCode);
    if (!currentSub) return;

    const midterm = field === 'midterm' ? value : currentSub.midterm;
    const final = field === 'final' ? value : currentSub.final;
    const sectional = field === 'sectional' ? value : currentSub.sectional;
    const creditHours = field === 'creditHours' ? value : currentSub.creditHours;

    await updateStudentMarks(studentRoll, midterm, final, sectional, creditHours, subjectCode);
  };

  // Render comprehensive transcript table showing all enrolled subjects for a student
  const renderStudentTranscript = (student) => {
    if (!student) return null;

    const { subjects, totalMarks, maxMarks, percentage, totalCredits, sgpa, cgpa, letterGrade, academicStanding } = getStudentEnrolledSubjectsWithMetrics(student, departments);

    return (
      <div key={student.id || student.roll} className="mb-4">
        {/* Student Summary Card */}
        <div className="student-summary-card mb-3">
          <div className="table-responsive">
            <table className="student-summary-table">
              <thead>
                <tr>
                  <th>Roll / Reg No</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Enrolled Courses</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-monospace fw-bold text-primary">#{student.roll}</td>
                  <td className="text-uppercase fw-bold">{student.name}</td>
                  <td>{student.dept || 'General'}</td>
                  <td>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">
                      {subjects.length} Enrolled Subjects ({totalCredits} Cr. Hrs)
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>Semester Term</th>
                  <th>Attendance Rate</th>
                  <th>Cumulative CGPA</th>
                  <th>Academic Standing</th>
                </tr>
                <tr>
                  <td>{student.grade || 'Semester 6'}</td>
                  <td>
                    <span className={`badge ${student.attendance >= 75 ? 'bg-success' : 'bg-warning text-dark'} font-monospace px-2 py-1`}>
                      {student.attendance ?? 100}% {student.attendance < 75 ? '(Low Attendance)' : '(Satisfactory)'}
                    </span>
                  </td>
                  <td className="text-success fw-extrabold fs-6 font-monospace">{cgpa.toFixed(2)} / 4.00</td>
                  <td>
                    <span className={`badge-status ${cgpa >= 3.5 ? 'badge-present' : cgpa >= 2.0 ? 'badge-leave' : 'badge-absent'}`}>
                      {academicStanding}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Complete Enrolled Subjects Transcript Table */}
        <div className="transcript-table-container">
          {/* Banner */}
          <div className="semester-banner d-flex justify-content-between align-items-center">
            <span>
              <i className="bi bi-mortarboard-fill me-2"></i>
              Official Enrolled Subjects Academic Evaluation Record
            </span>
            <span className="small opacity-75">{student.dept} • {student.grade || 'All Subjects Evaluation'}</span>
          </div>

          {/* All Subjects Marks Breakdown Table */}
          <div className="table-responsive">
            <table className="transcript-table">
              <thead>
                <tr>
                  <th style={{ width: '4%' }}>#</th>
                  <th style={{ width: '20%', textAlign: 'left' }}>Course Title & Code</th>
                  <th style={{ width: '7%' }}>Cr. Hrs</th>
                  <th style={{ width: '11%' }}>Midterm (25)</th>
                  <th style={{ width: '11%' }}>Final (50)</th>
                  <th style={{ width: '11%' }}>Sectionals (25)</th>
                  <th style={{ width: '9%' }}>Total (100)</th>
                  <th style={{ width: '8%' }}>Grade</th>
                  <th style={{ width: '8%' }}>GPA</th>
                  <th style={{ width: '11%' }}>Status</th>
                  {role === 'Teacher' && <th style={{ width: '6%' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, index) => (
                  <tr key={sub.code}>
                    <td className="text-center font-monospace text-muted">{index + 1}</td>
                    <td>
                      <div className="fw-bold text-dark">{sub.name}</div>
                      <span className="subject-code-tag">{sub.code}</span>
                    </td>
                    <td className="text-center font-monospace fw-bold">{sub.creditHours}</td>

                    {/* Midterm Score */}
                    <td className="text-center">
                      {role === 'Teacher' ? (
                        <input
                          type="number"
                          min="0"
                          max="25"
                          className="marks-input"
                          value={sub.midterm}
                          onChange={(e) => handleInlineSubjectMarksChange(student.roll, sub.code, 'midterm', e.target.value)}
                        />
                      ) : (
                        <span className="marks-score-display fw-bold text-primary">{sub.midterm} / 25</span>
                      )}
                    </td>

                    {/* Final Score */}
                    <td className="text-center">
                      {role === 'Teacher' ? (
                        <input
                          type="number"
                          min="0"
                          max="50"
                          className="marks-input"
                          value={sub.final}
                          onChange={(e) => handleInlineSubjectMarksChange(student.roll, sub.code, 'final', e.target.value)}
                        />
                      ) : (
                        <span className="marks-score-display fw-bold text-success">{sub.final} / 50</span>
                      )}
                    </td>

                    {/* Sectional Score */}
                    <td className="text-center">
                      {role === 'Teacher' ? (
                        <input
                          type="number"
                          min="0"
                          max="25"
                          className="marks-input"
                          value={sub.sectional}
                          onChange={(e) => handleInlineSubjectMarksChange(student.roll, sub.code, 'sectional', e.target.value)}
                        />
                      ) : (
                        <span className="marks-score-display fw-bold text-warning">{sub.sectional} / 25</span>
                      )}
                    </td>

                    {/* Total Score */}
                    <td className="text-center font-monospace fw-extrabold text-dark">
                      {sub.totalMarks}
                    </td>

                    {/* Letter Grade */}
                    <td className="text-center">
                      <span className={`grade-badge grade-${sub.letterGrade.charAt(0)}`}>
                        {sub.letterGrade}
                      </span>
                    </td>

                    {/* GPA */}
                    <td className="text-center font-monospace fw-bold text-primary">
                      {sub.gpa.toFixed(2)}
                    </td>

                    {/* Performance Status */}
                    <td className="text-center">
                      <span className={`badge ${sub.totalMarks >= 75 ? 'bg-success-subtle text-success' : sub.totalMarks >= 50 ? 'bg-info-subtle text-info' : 'bg-danger-subtle text-danger'} small`}>
                        {sub.performanceStatus}
                      </span>
                    </td>

                    {/* Teacher Action */}
                    {role === 'Teacher' && (
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-warning py-0 px-2"
                          title="Edit This Subject"
                          onClick={() => handleOpenEditModal(student, sub)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>

              {/* Cumulative Multi-Subject Total & GPA Footer */}
              <tfoot>
                <tr>
                  <td colSpan="2" className="fw-extrabold text-uppercase text-dark">
                    Cumulative Total ({subjects.length} Subjects)
                  </td>
                  <td className="text-center font-monospace fw-extrabold">{totalCredits} Cr</td>
                  <td colSpan="3" className="text-end fw-bold text-muted small">
                    Aggregate Obtained Score:
                  </td>
                  <td className="text-center font-monospace text-primary fw-extrabold fs-6">
                    {totalMarks} / {maxMarks}
                  </td>
                  <td className="text-center">
                    <span className={`grade-badge grade-${letterGrade.charAt(0)}`}>
                      Grade: {letterGrade}
                    </span>
                  </td>
                  <td className="text-center font-monospace text-success fw-extrabold">
                    SGPA: {sgpa.toFixed(2)}
                  </td>
                  <td colSpan={role === 'Teacher' ? 2 : 1} className="text-center font-monospace text-primary fw-extrabold">
                    CGPA: {cgpa.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="right-side">
        <Navbar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

        <main className="dashboard-content">
          <div className="academic-portal-container">
            {/* Header Card */}
            <div className="marks-header-card p-4 mb-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
                    <i className="bi bi-award-fill text-primary"></i> Academic Performance &amp; Subject GPA Scorecard
                  </h3>
                  <p className="text-muted small mb-0">
                    Comprehensive multi-subject evaluation records, Midterm, Final, Sectionals, and Credit Hours breakdown
                  </p>
                </div>

                {role !== 'Student' && (
                  <div className="d-flex align-items-center gap-2">
                    <div className="btn-group btn-group-sm">
                      <button
                        className={`btn ${viewMode === 'single' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setViewMode('single')}
                      >
                        Single Student View
                      </button>
                      <button
                        className={`btn ${viewMode === 'bulk' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setViewMode('bulk')}
                      >
                        All Students Roster ({filteredStudents.length})
                      </button>
                    </div>

                    {activeStudent && viewMode === 'single' && role === 'Teacher' && (
                      <button className="btn btn-sm btn-primary-gradient" onClick={() => handleOpenEditModal(activeStudent)}>
                        <i className="bi bi-pencil-square me-1"></i> Edit Subject Marks
                      </button>
                    )}
                  </div>
                )}
              </div>

              {saveSuccessMsg && (
                <div className="alert alert-success p-2 small mt-3 mb-0 text-center animate-fade-in" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i> {saveSuccessMsg}
                </div>
              )}

              {/* Controls & Filters Bar */}
              {role !== 'Student' && (
                <div className="row g-3 mt-2 pt-3 border-top">
                  <div className="col-12 col-md-4">
                    <div className="position-relative">
                      <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                      <input
                        type="text"
                        className="form-control form-control-sm form-control-custom ps-5"
                        placeholder="Search by student name or roll..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <select
                      className="form-select form-select-sm form-select-custom"
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                    >
                      <option value="All">All Departments</option>
                      {departments.map(d => (
                        <option key={d._id || d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {viewMode === 'single' && (
                    <div className="col-12 col-md-4">
                      <select
                        className="form-select form-select-sm form-select-custom border-primary fw-semibold"
                        value={selectedStudentRoll || activeStudent?.roll || ''}
                        onChange={(e) => setSelectedStudentRoll(e.target.value)}
                      >
                        {filteredStudents.map(s => (
                          <option key={s.id || s.roll} value={s.roll}>
                            {s.name} (Roll #{s.roll} • {s.dept})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick KPI Stat Cards */}
            {activeStudent && viewMode === 'single' && (
              <div className="marks-kpi-row">
                <div className="marks-kpi-col">
                  <div className="glass-card marks-kpi-card border-start border-success border-4">
                    <span className="kpi-label">Cumulative CGPA</span>
                    <div className="kpi-value text-success">{activeStudentMetrics.cgpa.toFixed(2)} / 4.00</div>
                  </div>
                </div>
                <div className="marks-kpi-col">
                  <div className="glass-card marks-kpi-card border-start border-primary border-4">
                    <span className="kpi-label">Total Aggregate Score</span>
                    <div className="kpi-value text-primary">
                      {activeStudentMetrics.totalMarks} / {activeStudentMetrics.maxMarks}
                    </div>
                  </div>
                </div>
                <div className="marks-kpi-col">
                  <div className="glass-card marks-kpi-card border-start border-info border-4">
                    <span className="kpi-label">Letter Grade & Standing</span>
                    <div className="kpi-value text-body">
                      <span className={`grade-badge grade-${activeStudentMetrics.letterGrade.charAt(0)} me-1`}>
                        {activeStudentMetrics.letterGrade}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>({activeStudentMetrics.percentage}%)</span>
                    </div>
                  </div>
                </div>
                <div className="marks-kpi-col">
                  <div className="glass-card marks-kpi-card border-start border-warning border-4">
                    <span className="kpi-label">Semester SGPA</span>
                    <div className="kpi-value text-warning">
                      {activeStudentMetrics.sgpa.toFixed(2)} / 4.00
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}> ({activeStudentMetrics.totalCredits} Cr)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transcripts Display Area */}
            {students.length === 0 ? (
              <div className="glass-card p-5 text-center text-muted">
                <i className="bi bi-database-x fs-1 d-block mb-3 text-warning"></i>
                <h5 className="fw-bold">No Students in Database</h5>
                <p className="small mb-0">No student records found in the database. Add students to view their subjects and marks.</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="glass-card p-5 text-center text-muted">
                <i className="bi bi-search fs-1 d-block mb-3 text-muted"></i>
                <h5 className="fw-bold">No Matching Records Found</h5>
                <p className="small mb-0">No student records match your search or department filter.</p>
              </div>
            ) : role === 'Student' ? (
              renderStudentTranscript(activeStudent)
            ) : viewMode === 'single' ? (
              renderStudentTranscript(activeStudent)
            ) : (
              /* BULK ROSTER TABLE VIEW SHOWING ALL ENROLLED SUBJECTS */
              <div className="glass-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0">Multi-Subject Student Evaluation Roster</h5>
                    <span className="small text-muted">Displaying marks for all enrolled courses per student</span>
                  </div>
                  <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-2">
                    {filteredStudents.length} Registered Students
                  </span>
                </div>
                <div className="table-responsive">
                  <table className="table table-custom">
                    <thead>
                      <tr>
                        <th>Roll #</th>
                        <th>Student Name & Dept</th>
                        <th>Enrolled Subjects Marks Breakdown</th>
                        <th>Aggregate Marks</th>
                        <th>SGPA</th>
                        <th>CGPA</th>
                        <th>Grade</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s => {
                        const { subjects, totalMarks, maxMarks, percentage, sgpa, cgpa, letterGrade } = getStudentEnrolledSubjectsWithMetrics(s, departments);

                        return (
                          <tr key={s.id || s.roll}>
                            <td>
                              <span className="badge bg-body-tertiary border font-monospace text-primary fw-bold">#{s.roll}</span>
                            </td>
                            <td>
                              <div className="fw-bold">{s.name}</div>
                              <div className="small text-muted">{s.dept} • {s.grade || 'Semester 6'}</div>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '400px' }}>
                                {subjects.map(sub => (
                                  <span key={sub.code} className="subject-chip" title={`${sub.name}: Midterm ${sub.midterm}, Final ${sub.final}, Sectional ${sub.sectional}`}>
                                    <span className="subject-code-tag">{sub.code}</span>
                                    <span className="text-dark fw-bold">{sub.totalMarks}</span>
                                    <span className={`badge ${sub.totalMarks >= 75 ? 'bg-success' : sub.totalMarks >= 50 ? 'bg-warning text-dark' : 'bg-danger'} py-0 px-1`} style={{ fontSize: '10px' }}>
                                      {sub.letterGrade}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="font-monospace fw-bold text-primary">{totalMarks} / {maxMarks}</div>
                              <div className="small text-muted">{percentage}%</div>
                            </td>
                            <td className="font-monospace fw-bold text-dark text-center">{sgpa.toFixed(2)}</td>
                            <td className="font-monospace fw-bold text-success text-center">{cgpa.toFixed(2)}</td>
                            <td className="text-center">
                              <span className={`grade-badge grade-${letterGrade.charAt(0)}`}>
                                {letterGrade}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary"
                                  title="View Multi-Subject Transcript"
                                  onClick={() => {
                                    setSelectedStudentRoll(s.roll);
                                    setViewMode('single');
                                  }}
                                >
                                  <i className="bi bi-eye-fill me-1"></i> Transcript
                                </button>
                                {role === 'Teacher' && (
                                  <button
                                    className="btn btn-outline-warning"
                                    title="Edit Subject Marks"
                                    onClick={() => handleOpenEditModal(s)}
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Subject Marks Modal (Teacher Only) */}
      {editingStudent && role === 'Teacher' && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <form onSubmit={handleSaveMarks}>
                <div className="modal-header modal-header-custom">
                  <h5 className="modal-title fw-bold">Update Subject Marks — {editingStudent.name} (Roll #{editingStudent.roll})</h5>
                  <button type="button" className="btn-close" onClick={() => setEditingStudent(null)}></button>
                </div>
                <div className="modal-body p-4">
                  {/* Select Which Enrolled Subject to Edit */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-primary">Select Enrolled Subject:</label>
                    <select
                      className="form-select form-select-custom border-primary fw-bold"
                      value={selectedSubjectCode}
                      onChange={(e) => handleSubjectSelectionChange(e.target.value)}
                    >
                      {getStudentEnrolledSubjectsWithMetrics(editingStudent, departments).subjects.map(sub => (
                        <option key={sub.code} value={sub.code}>
                          {sub.code} — {sub.name} (Current: {sub.totalMarks}/100, Grade {sub.letterGrade})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-4">
                      <label className="form-label fw-semibold small">Midterm (Max 25):</label>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        className="form-control form-control-custom font-monospace text-center fw-bold"
                        required
                        value={editSubjectData.midterm}
                        onChange={e => setEditSubjectData({ ...editSubjectData, midterm: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label fw-semibold small">Final Exam (Max 50):</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        className="form-control form-control-custom font-monospace text-center fw-bold"
                        required
                        value={editSubjectData.final}
                        onChange={e => setEditSubjectData({ ...editSubjectData, final: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label fw-semibold small">Sectionals (Max 25):</label>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        className="form-control form-control-custom font-monospace text-center fw-bold"
                        required
                        value={editSubjectData.sectional}
                        onChange={e => setEditSubjectData({ ...editSubjectData, sectional: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="p-3 border rounded-3 bg-body-tertiary">
                    <div className="d-flex justify-content-between mb-1 small">
                      <span>Calculated Score for <strong>{selectedSubjectCode}</strong>:</span>
                      <strong className="text-primary fs-6">
                        {(Number(editSubjectData.midterm) || 0) + (Number(editSubjectData.final) || 0) + (Number(editSubjectData.sectional) || 0)} / 100
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>Resulting Grade:</span>
                      <strong className="text-success">
                        {computeSubjectScore(editSubjectData.midterm, editSubjectData.final, editSubjectData.sectional, editSubjectData.creditHours).letterGrade} (GPA: {computeSubjectScore(editSubjectData.midterm, editSubjectData.final, editSubjectData.sectional, editSubjectData.creditHours).gpa.toFixed(2)})
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setEditingStudent(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-gradient">Save Subject Marks</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}