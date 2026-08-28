import React, { useState, useEffect, useMemo } from 'react';
import { useAttendance, DEFAULT_AVATAR } from '../context/AttendanceContext';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function AttendanceMarking() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [savedAlert, setSavedAlert] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Student view – real logs from DB
  const [myLogs, setMyLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const { students, departments, courses, teachers, logs, markBatchAttendance, fetchAttendanceLogs, fetchAttendance, fetchStudents } = useAttendance();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';

  // Resolve current teacher's full profile & assigned courses
  const currentTeacher = useMemo(() => {
    if (role !== 'Teacher') return null;
    return teachers.find(t =>
      (t.id && currentUser?.id && t.id === currentUser.id) ||
      (t._id && currentUser?.id && t._id === currentUser.id) ||
      (t.email && currentUser?.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
    ) || currentUser;
  }, [role, teachers, currentUser]);

  const teacherDept = currentTeacher?.department || currentUser?.department || '';
  const teacherAssignedCourses = currentTeacher?.assignedCourses || currentUser?.assignedCourses || [];

  // Allowed departments for the teacher (strictly their own department)
  const teacherAllowedDepts = useMemo(() => {
    if (role !== 'Teacher') return departments.map(d => d.name || d.id);
    const depts = new Set();
    if (teacherDept) depts.add(teacherDept);
    teacherAssignedCourses.forEach(c => {
      if (c.deptName) depts.add(c.deptName);
      if (c.deptCode) depts.add(c.deptCode);
    });
    return Array.from(depts);
  }, [role, teacherDept, teacherAssignedCourses, departments]);

  // Allowed courses for the teacher (strictly courses assigned to this teacher)
  const teacherAllowedCourses = useMemo(() => {
    if (role !== 'Teacher') return courses;
    if (teacherAssignedCourses.length > 0) {
      return teacherAssignedCourses;
    }
    // Fallback: courses belonging to teacher's department
    const deptObj = departments.find(d =>
      (d.name && d.name.toLowerCase() === teacherDept.toLowerCase()) ||
      (d.code && d.code.toLowerCase() === teacherDept.toLowerCase())
    );
    if (deptObj && Array.isArray(deptObj.courses) && deptObj.courses.length > 0) {
      return deptObj.courses;
    }
    return courses.filter(c =>
      (c.departmentName && c.departmentName.toLowerCase() === teacherDept.toLowerCase()) ||
      (c.departmentCode && c.departmentCode.toLowerCase() === teacherDept.toLowerCase())
    );
  }, [role, teacherAssignedCourses, teacherDept, departments, courses]);

  // Auto-select teacher's primary department on load
  useEffect(() => {
    if (role === 'Teacher') {
      if (teacherAllowedDepts.length > 0) {
        setSelectedDept(teacherAllowedDepts[0]);
      } else if (teacherDept) {
        setSelectedDept(teacherDept);
      }
    }
  }, [role, teacherAllowedDepts, teacherDept]);

  // ── Student view: load real attendance logs from backend ──────────────────
  useEffect(() => {
    if (role !== 'Student') return;
    const id = currentUser?.id || currentUser?._id || currentUser?.roll;
    if (!id) return;

    setLogsLoading(true);
    fetchAttendanceLogs(id)
      .then(fetchedLogs => setMyLogs(fetchedLogs || []))
      .catch(() => setMyLogs([]))
      .finally(() => setLogsLoading(false));
  }, [role, currentUser, fetchAttendanceLogs]);

  // Filter students strictly to those enrolled under this teacher
  const filteredStudents = useMemo(() => {
    if (role === 'Teacher') {
      return students.filter(s => {
        // Must belong to teacher's authorized departments
        const matchesDept = teacherAllowedDepts.some(d =>
          d.toLowerCase() === (s.dept || '').toLowerCase()
        );
        if (!matchesDept) return false;

        // If a specific department is selected
        if (selectedDept !== 'All' && s.dept.toLowerCase() !== selectedDept.toLowerCase()) {
          return false;
        }

        // If a specific course is selected, student must be enrolled in that course
        if (selectedSubject) {
          if (Array.isArray(s.subjects) && s.subjects.length > 0) {
            const isEnrolled = s.subjects.some(sub =>
              sub.name.toLowerCase() === selectedSubject.toLowerCase() ||
              sub.code.toLowerCase() === selectedSubject.toLowerCase()
            );
            if (!isEnrolled) return false;
          }
        }

        return true;
      });
    }

    // Admin view
    return students.filter(s => selectedDept === 'All' ? true : s.dept === selectedDept);
  }, [students, role, teacherAllowedDepts, selectedDept, selectedSubject]);

  // Batch attendance session state
  const [sessionAttendance, setSessionAttendance] = useState({});

  // Sync draft session state with published records from DB for the selected date & subject
  useEffect(() => {
    const map = {};
    filteredStudents.forEach(s => {
      const published = logs.find(l =>
        (l.roll === s.roll || l.studentId === s._id || l.studentId === s.id) &&
        l.date === selectedDate &&
        (selectedSubject ? l.subject === selectedSubject : (l.subject === '' || l.subject === 'General Class'))
      );
      if (published) {
        map[s.id] = published.status;
      }
    });
    setSessionAttendance(map);
  }, [filteredStudents, logs, selectedDate, selectedSubject]);

  const toggleSidebar = () => setIsSidebarOpen(o => !o);

  const handleStatusChange = (studentId, status) => {
    if (role !== 'Teacher') return;
    setSessionAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    if (role !== 'Teacher') return;
    const updated = { ...sessionAttendance };
    filteredStudents.forEach(s => { updated[s.id] = 'present'; });
    setSessionAttendance(updated);
  };

  const handleMarkAllAbsent = () => {
    if (role !== 'Teacher') return;
    const updated = { ...sessionAttendance };
    filteredStudents.forEach(s => { updated[s.id] = 'absent'; });
    setSessionAttendance(updated);
  };

  const handleSaveBatchAttendance = async () => {
    if (role !== 'Teacher') return;
    if (filteredStudents.length === 0) return;

    setIsSaving(true);
    setSaveError('');

    const records = filteredStudents.map(s => ({
      studentId: s._id || s.id,
      roll: s.roll,
      name: s.name,
      dept: s.dept,
      status: sessionAttendance[s.id] || 'present'
    }));

    const markedBy = currentUser?.name ? `${currentUser.name} (Teacher)` : 'Teacher Manual';
    const effectiveSubject = selectedSubject || 'General Class';

    const result = await markBatchAttendance(records, selectedDate, effectiveSubject, markedBy);

    setIsSaving(false);

    if (result && result.errors && result.errors.length > 0 && (!result.saved || result.saved.length === 0)) {
      setSaveError(`Failed to save attendance. Please check the database connection.`);
    } else {
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3500);
    }
  };

  // Metrics for the current session based strictly on published/active records
  const total = filteredStudents.length;
  const publishedForSession = filteredStudents.filter(s => {
    return logs.some(l =>
      (l.roll === s.roll || l.studentId === s._id || l.studentId === s.id) &&
      l.date === selectedDate &&
      (selectedSubject ? l.subject === selectedSubject : (l.subject === '' || l.subject === 'General Class'))
    );
  }).length;

  const presentCount = filteredStudents.filter(s => {
    const st = sessionAttendance[s.id];
    return st === 'present';
  }).length;

  const lateCount = filteredStudents.filter(s => sessionAttendance[s.id] === 'late').length;
  const absentCount = filteredStudents.filter(s => sessionAttendance[s.id] === 'absent').length;

  // Compute overall attendance % for student from real logs
  const computeStudentPct = () => {
    if (myLogs.length === 0) return currentUser?.attendance || 0;
    const pOrL = myLogs.filter(l => l.status === 'present' || l.status === 'late').length;
    return Math.round((pOrL / myLogs.length) * 100);
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="right-side">
        <Navbar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

        <main className="dashboard-content">
          {savedAlert && (
            <div className="alert alert-success alert-dismissible fade show mb-4 animate-fade-in" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              <strong>Attendance Register Published!</strong> {total} student records saved and published to the database for {selectedDate}.
              <button type="button" className="btn-close" onClick={() => setSavedAlert(false)}></button>
            </div>
          )}

          {saveError && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {saveError}
              <button type="button" className="btn-close" onClick={() => setSaveError('')}></button>
            </div>
          )}

          {/* ── STUDENT VIEW ───────────────────────────────────────────── */}
          {role === 'Student' ? (
            <div>
              {/* Header */}
              <div className="glass-card p-4 mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill mb-2">
                      <i className="bi bi-person-circle me-1"></i> STUDENT PORTAL
                    </span>
                    <h3 className="fw-bold mb-1">My Attendance Record</h3>
                    <p className="text-muted small mb-0">Official class attendance records published by your assigned instructors</p>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success-subtle text-success fs-6 px-3 py-2 border border-success-subtle">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Overall Attendance: {computeStudentPct()}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Real Logs Table */}
              <div className="glass-card p-4">
                <h5 className="fw-bold mb-3">
                  Published Teacher Attendance Log
                  {logsLoading && (
                    <span className="ms-2 spinner-border spinner-border-sm text-primary" role="status"></span>
                  )}
                </h5>
                <div className="table-responsive">
                  <table className="table table-custom">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Course / Subject</th>
                        <th>Time Marked</th>
                        <th>Assigned Instructor</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsLoading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Loading attendance records from database…
                          </td>
                        </tr>
                      ) : myLogs.length > 0 ? (
                        [...myLogs].reverse().map((log, idx) => (
                          <tr key={log._id || idx}>
                            <td className="text-muted small">{myLogs.length - idx}</td>
                            <td className="fw-mono">{log.date}</td>
                            <td className="fw-bold">{log.subject || 'General Class'}</td>
                            <td className="fw-mono">{log.time || '—'}</td>
                            <td>
                              <span className="small text-muted">
                                <i className="bi bi-person-badge text-primary me-1"></i>
                                {log.markedBy || 'Assigned Teacher'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge-status badge-${log.status}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">
                            No attendance records published yet. Only officially published records by your assigned instructors will appear here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary pills */}
                {myLogs.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <span className="badge bg-success-subtle text-success border px-3 py-2">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Present: {myLogs.filter(l => l.status === 'present').length}
                    </span>
                    <span className="badge bg-warning-subtle text-warning border px-3 py-2">
                      <i className="bi bi-clock-fill me-1"></i>
                      Late: {myLogs.filter(l => l.status === 'late').length}
                    </span>
                    <span className="badge bg-danger-subtle text-danger border px-3 py-2">
                      <i className="bi bi-x-circle-fill me-1"></i>
                      Absent: {myLogs.filter(l => l.status === 'absent').length}
                    </span>
                    <span className="badge bg-body-secondary text-body border px-3 py-2">
                      Total Published Sessions: {myLogs.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

          ) : (
            /* ── TEACHER & ADMIN VIEW ───────────────────────────────────── */
            <div>
              {/* Header Controls */}
              <div className="glass-card p-4 mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <h3 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        {role === 'Admin' && <i className="bi bi-shield-lock-fill text-primary"></i>}
                        Class Attendance Register
                      </h3>
                      {role === 'Teacher' ? (
                        <span className="badge bg-success-subtle text-success border px-2 py-1">
                          <i className="bi bi-person-check-fill me-1"></i>
                          Authorized Teacher: {currentUser?.name} ({teacherDept})
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-body border px-2 py-1">
                          <i className="bi bi-shield-lock-fill me-1"></i>Official Published Records Only
                        </span>
                      )}
                    </div>
                    <p className="text-muted small mb-0">
                      {role === 'Teacher'
                        ? `Mark and publish attendance for students enrolled in your assigned department (${teacherDept}) and courses.`
                        : 'View official attendance records published by assigned course instructors.'}
                    </p>
                  </div>

                  {role === 'Teacher' && (
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-outline-custom" onClick={handleMarkAllPresent} disabled={isSaving || filteredStudents.length === 0}>
                        <i className="bi bi-check-all me-1 text-success"></i> Mark All Present
                      </button>
                      <button className="btn btn-outline-custom" onClick={handleMarkAllAbsent} disabled={isSaving || filteredStudents.length === 0}>
                        <i className="bi bi-x-circle me-1 text-danger"></i> Mark All Absent
                      </button>
                      <button className="btn btn-primary-gradient" onClick={handleSaveBatchAttendance} disabled={isSaving || filteredStudents.length === 0}>
                        {isSaving
                          ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Publishing…</>
                          : <><i className="bi bi-cloud-arrow-up-fill me-1"></i> Save &amp; Publish Session</>}
                      </button>
                    </div>
                  )}
                </div>

                <hr className="my-3 border-secondary-subtle" />

                {/* Filter Controls */}
                <div className="row g-3">
                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold small">Session Date:</label>
                    <input
                      type="date"
                      className="form-control form-control-custom"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold small">
                      Department:
                      {role === 'Teacher' && <span className="text-muted ms-1 small">(Assigned)</span>}
                    </label>
                    <select
                      className="form-select form-select-custom"
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      disabled={role === 'Teacher' && teacherAllowedDepts.length <= 1}
                    >
                      {role !== 'Teacher' && <option value="All">All Departments</option>}
                      {role === 'Teacher' ? (
                        teacherAllowedDepts.map(deptName => (
                          <option key={deptName} value={deptName}>{deptName}</option>
                        ))
                      ) : (
                        departments && departments.length > 0 ? (
                          departments.map(dept => (
                            <option key={dept.id || dept.name} value={dept.name || dept.id}>{dept.name || dept.id}</option>
                          ))
                        ) : (
                          <option disabled>No Departments</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">
                      Subject / Course Module:
                      {role === 'Teacher' && <span className="text-muted ms-1 small">(Assigned to you)</span>}
                    </label>
                    <select
                      className="form-select form-select-custom"
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                    >
                      <option value="">{role === 'Teacher' ? 'All Assigned Subjects / General Class' : 'Select Course / Subject'}</option>
                      {teacherAllowedCourses && teacherAllowedCourses.length > 0 ? (
                        teacherAllowedCourses.map(course => (
                          <option key={course._id || course.id || course.code} value={course.name}>
                            {course.code ? `${course.code}: ` : ''}{course.name} {course.semester ? `(Sem ${course.semester})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="General Class">General Course / Regular Class</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Header Alert */}
              <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                <div className="small text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Session Status: <strong>{publishedForSession > 0 ? `${publishedForSession} / ${total} Enrolled Students Published` : 'Unpublished (No records saved yet for this date)'}</strong>
                </div>
                {role === 'Teacher' && (
                  <span className="small text-muted">
                    <i className="bi bi-shield-check text-success me-1"></i>
                    Only displaying students enrolled under your department ({teacherDept})
                  </span>
                )}
              </div>

              {/* Quick Metrics Pills */}
              <div className="row g-3 mb-4">
                <div className="col-4">
                  <div className="glass-card p-3 text-center border-start border-success border-4">
                    <span className="text-muted small fw-bold">PRESENT</span>
                    <h4 className="fw-extrabold text-success mb-0">{presentCount}</h4>
                  </div>
                </div>
                <div className="col-4">
                  <div className="glass-card p-3 text-center border-start border-warning border-4">
                    <span className="text-muted small fw-bold">LATE</span>
                    <h4 className="fw-extrabold text-warning mb-0">{lateCount}</h4>
                  </div>
                </div>
                <div className="col-4">
                  <div className="glass-card p-3 text-center border-start border-danger border-4">
                    <span className="text-muted small fw-bold">ABSENT</span>
                    <h4 className="fw-extrabold text-danger mb-0">{absentCount}</h4>
                  </div>
                </div>
              </div>

              {/* Marking Table */}
              <div className="glass-card p-4">
                <div className="table-responsive">
                  <table className="table table-custom">
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Info</th>
                        <th>Department &amp; Grade</th>
                        <th>Cumulative Rate</th>
                        <th>Database Status / Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-5 text-muted">
                            <div className="mb-2">
                              <i className="bi bi-person-x fs-1 text-secondary opacity-50"></i>
                            </div>
                            <h6 className="fw-bold">No Students Enrolled Under Your Assignment</h6>
                            <p className="small text-muted mb-0">
                              {role === 'Teacher'
                                ? `You are assigned to "${teacherDept}". No students matching your selection are enrolled in this class.`
                                : 'No students found for the selected department.'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map(student => {
                          const published = logs.find(l =>
                            (l.roll === student.roll || l.studentId === student._id || l.studentId === student.id) &&
                            l.date === selectedDate &&
                            (selectedSubject ? l.subject === selectedSubject : (l.subject === '' || l.subject === 'General Class'))
                          );

                          const currentStatus = sessionAttendance[student.id] || (published ? published.status : 'present');
                          const isPublished = Boolean(published);

                          return (
                            <tr key={student.id}>
                              <td>
                                <span className="badge bg-body-tertiary border text-body font-monospace fs-6">
                                  #{student.roll}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  <img
                                    src={student.avatar || DEFAULT_AVATAR}
                                    onError={e => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                                    alt="Avatar"
                                    className="rounded-circle"
                                    width="40"
                                    height="40"
                                    style={{ objectFit: 'cover' }}
                                  />
                                  <div>
                                    <div className="fw-bold">{student.name}</div>
                                    <div className="small text-muted">{student.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold">{student.dept}</div>
                                <div className="small text-muted">{student.grade}</div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                    <div
                                      className={`progress-bar bg-${student.attendance >= 85 ? 'success' : student.attendance >= 75 ? 'warning' : 'danger'}`}
                                      style={{ width: `${student.attendance}%` }}
                                    ></div>
                                  </div>
                                  <span className="fw-bold small">{student.attendance}%</span>
                                </div>
                              </td>
                              <td>
                                {role === 'Teacher' ? (
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="btn-group" role="group">
                                      <button
                                        type="button"
                                        className={`btn btn-sm ${currentStatus === 'present' ? 'btn-success' : 'btn-outline-secondary'}`}
                                        onClick={() => handleStatusChange(student.id, 'present')}
                                        disabled={isSaving}
                                      >
                                        <i className="bi bi-check-circle-fill me-1"></i> Present
                                      </button>
                                      <button
                                        type="button"
                                        className={`btn btn-sm ${currentStatus === 'late' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                                        onClick={() => handleStatusChange(student.id, 'late')}
                                        disabled={isSaving}
                                      >
                                        <i className="bi bi-clock-fill me-1"></i> Late
                                      </button>
                                      <button
                                        type="button"
                                        className={`btn btn-sm ${currentStatus === 'absent' ? 'btn-danger' : 'btn-outline-secondary'}`}
                                        onClick={() => handleStatusChange(student.id, 'absent')}
                                        disabled={isSaving}
                                      >
                                        <i className="bi bi-x-circle-fill me-1"></i> Absent
                                      </button>
                                    </div>
                                    {isPublished && (
                                      <span className="badge bg-success-subtle text-success border small" title="Saved in database">
                                        <i className="bi bi-cloud-check-fill me-1"></i>Published
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    {isPublished ? (
                                      <span className={`badge-status badge-${published.status}`}>
                                        <i className="bi bi-check2-circle me-1"></i>
                                        {published.status.toUpperCase()} (Published)
                                      </span>
                                    ) : (
                                      <span className="badge bg-secondary-subtle text-secondary border px-2 py-1">
                                        <i className="bi bi-hourglass-split me-1"></i>Unpublished / Not Marked
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
