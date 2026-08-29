import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

export default function AssignCourse() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [dbTeachers, setDbTeachers] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('All');
  const [selectedCourses, setSelectedCourses] = useState([]); // array of course codes

  // Fetch teachers & departments
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([
        fetch('https://lms-system-backend-ljz1.onrender.com/teacher'),
        fetch('https://lms-system-backend-ljz1.onrender.com/department')
      ]);

      if (tRes.ok) {
        const tData = await tRes.json();
        setDbTeachers(Array.isArray(tData) ? tData : []);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDbDepartments(Array.isArray(dData) ? dData : []);
      }
    } catch (err) {
      console.error('Error fetching data from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get courses to display based on department selection
  const getCoursesToDisplay = () => {
    let list = [];
    if (!selectedDeptId || selectedDeptId === 'All') {
      dbDepartments.forEach(d => {
        if (d.courses) {
          d.courses.forEach(c => {
            list.push({ ...c, deptId: d._id, deptName: d.name, deptCode: d.code });
          });
        }
      });
    } else {
      const d = dbDepartments.find(dept => dept._id === selectedDeptId);
      if (d && d.courses) {
        d.courses.forEach(c => {
          list.push({ ...c, deptId: d._id, deptName: d.name, deptCode: d.code });
        });
      }
    }
    return list;
  };
  
  // Selected department object
  const currentDeptObj = dbDepartments.find(
    d => d._id === selectedDeptId || d.code === selectedDeptId || d.name === selectedDeptId
  );

  // Selected teacher object
  const currentTeacherObj = dbTeachers.find(
    t => t._id === selectedTeacherId || t.email === selectedTeacherId
  );

  const coursesToDisplay = getCoursesToDisplay();

  // Exclude courses already assigned to the selected teacher
  const filteredCourses = currentTeacherObj && Array.isArray(currentTeacherObj.assignedCourses)
    ? coursesToDisplay.filter(c => !currentTeacherObj.assignedCourses.some(ac => ac.code === c.code))
    : coursesToDisplay;

  // Handle department change
  const handleDeptChange = (e) => {
    setSelectedDeptId(e.target.value);
    setSelectedCourses([]); // reset course selection on department change
  };

  // Toggle course selection checkbox
  const handleCourseToggle = (courseCode) => {
    setSelectedCourses(prev =>
      prev.includes(courseCode)
        ? prev.filter(c => c !== courseCode)
        : [...prev, courseCode]
    );
  };

  // Handle Form Submission to Assign Course(s)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      alert('Please select a teacher');
      return;
    }
    if (selectedCourses.length === 0) {
      alert('Please select at least one course to assign');
      return;
    }

    const teacher = currentTeacherObj;

    if (!teacher) {
      alert('Invalid teacher selection');
      return;
    }

    // Prepare assigned courses objects
    const coursesToAssign = coursesToDisplay
      .filter(c => selectedCourses.includes(c.code))
      .map(c => ({
        code: c.code,
        name: c.name,
        semester: c.semester,
        deptCode: c.deptCode,
        deptName: c.deptName
      }));

    // Existing assigned courses for teacher + new ones (avoid duplicates by code)
    const existing = teacher.assignedCourses || [];
    const existingCodes = new Set(existing.map(c => c.code));
    const newAdditions = coursesToAssign.filter(c => !existingCodes.has(c.code));

    const updatedAssigned = [...existing, ...newAdditions];

    try {
      const updatePayload = {
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        designation: teacher.designation,
        assignedCourses: updatedAssigned
      };

      const res = await fetch(`https://lms-system-backend-ljz1.onrender.com/teacher/update/${teacher._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (res.ok) {
        alert(`Successfully assigned ${newAdditions.length || coursesToAssign.length} course(s) to ${teacher.name}!`);
        setSelectedCourses([]);
        setSelectedTeacherId('');
        setSelectedDeptId('All');
        fetchData(); // Refresh DB state
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Failed to assign course');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server.');
    }
  };

  // Remove assigned course from a teacher
  const handleRemoveAssignedCourse = async (teacherObj, courseCode) => {
    if (!window.confirm(`Remove course ${courseCode} from ${teacherObj.name}?`)) return;

    const updated = (teacherObj.assignedCourses || []).filter(c => c.code !== courseCode);

    try {
      const res = await fetch(`https://lms-system-backend-ljz1.onrender.com/teacher/update/${teacherObj._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacherObj.name,
          email: teacherObj.email,
          department: teacherObj.department,
          designation: teacherObj.designation,
          assignedCourses: updated
        })
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to remove course');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing assigned course');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div className="right-side">
        <Navbar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <main className="dashboard-content p-4">
          <h2 className="mb-4">Assign Courses to Teachers</h2>

          {/* Form to Assign Course */}
          <form onSubmit={handleSubmit} className="glass-card p-4 mb-5" style={{ maxWidth: '800px' }}>
            <h4 className="mb-3" style={{ color: 'var(--accent, #6366f1)' }}>
              <i className="bi bi-journal-plus me-2"></i>Assign New Course
            </h4>

            <div className="row g-3">
              {/* Teacher Dropdown */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Select Teacher</label>
                <select
                  className="form-select form-control-custom"
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Choose Teacher --</option>
                  {dbTeachers.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.department || 'No Dept'} - {t.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Dropdown */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Select Department</label>
                <select
                  className="form-select form-control-custom"
                  value={selectedDeptId}
                  onChange={handleDeptChange}
                  required
                >
                  <option value="All">All Departments</option>
                  {dbDepartments.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Courses Table for Selected Department(s) */}
            <div className="mt-4 p-3 rounded" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <label className="form-label fw-semibold mb-3 d-block">
                Select Course(s) to Assign:
              </label>
              {coursesToDisplay && coursesToDisplay.length > 0 ? (
                <div className="glass-card p-0" style={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <table className="table table-hover mb-0 align-middle" style={{ color: 'inherit' }}>
                    <thead style={{ background: 'rgba(99,102,241,0.12)' }}>
                      <tr>
                        <th className="px-3 py-2 text-center" style={{ width: '60px' }}>Select</th>
                        <th className="px-3 py-2">Course Code</th>
                        <th className="px-3 py-2">Course Name</th>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2">Semester</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((c, idx) => {
                        const isChecked = selectedCourses.includes(c.code);
                        return (
                          <tr
                            key={c._id || idx}
                            style={{
                              cursor: 'pointer',
                              background: isChecked ? 'rgba(99,102,241,0.1)' : 'transparent',
                              borderTop: '1px solid rgba(255,255,255,0.06)'
                            }}
                            onClick={() => handleCourseToggle(c.code)}
                          >
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                checked={isChecked}
                                onChange={() => {}} // handled by tr click
                              />
                            </td>
                            <td className="px-3 py-2">
                              <span style={{
                                background: 'rgba(99,102,241,0.15)',
                                color: 'var(--accent, #6366f1)',
                                borderRadius: '5px',
                                padding: '2px 8px',
                                fontWeight: 600,
                                fontSize: '0.85rem'
                              }}>
                                {c.code}
                              </span>
                            </td>
                            <td className="px-3 py-2 fw-semibold">{c.name}</td>
                            <td className="px-3 py-2">
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.78rem' }}>
                                {c.deptName}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle" style={{ fontSize: '0.78rem' }}>
                                Semester {c.semester}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-warning small text-center p-3 glass-card">No courses available.</div>
              )}
            </div>

            <div className="mt-4">
              <button
                type="submit"
                className="btn btn-primary-gradient px-4 py-2"
                disabled={!selectedTeacherId || !selectedDeptId || selectedCourses.length === 0}
              >
                <i className="bi bi-check-circle-fill me-2"></i>Assign Selected Course(s)
              </button>
            </div>
          </form>

          {/* Assigned Courses Table per Teacher */}
          <div className="mb-5" style={{ maxWidth: '900px' }}>
            <h4 className="mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-person-workspace text-primary"></i>
              Teacher Course Assignments
            </h4>

            {loading ? (
              <div className="glass-card p-3 text-center" style={{ opacity: 0.6 }}>Loading assignments...</div>
            ) : dbTeachers.length > 0 ? (
              <div className="glass-card p-0" style={{ overflow: 'hidden' }}>
                <table className="table table-hover mb-0" style={{ color: 'inherit' }}>
                  <thead style={{ background: 'rgba(99,102,241,0.12)' }}>
                    <tr>
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">Teacher</th>
                      <th className="px-3 py-3">Department</th>
                      <th className="px-3 py-3">Designation</th>
                      <th className="px-3 py-3">Assigned Courses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbTeachers.map((t, idx) => (
                      <tr key={t._id || idx} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'middle' }}>
                        <td className="px-3 py-3" style={{ opacity: 0.6 }}>{idx + 1}</td>
                        <td className="px-3 py-3">
                          <div className="fw-semibold">{t.name}</div>
                          <div style={{ opacity: 0.6, fontSize: '0.8rem' }}>{t.email}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span style={{
                            background: 'rgba(99,102,241,0.15)',
                            color: 'var(--accent, #6366f1)',
                            borderRadius: '6px',
                            padding: '2px 10px',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}>
                            {t.department || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3" style={{ opacity: 0.8 }}>{t.designation || '—'}</td>
                        <td className="px-3 py-3">
                          {t.assignedCourses && t.assignedCourses.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                              {t.assignedCourses.map((ac, cIdx) => (
                                <span key={cIdx} className="badge d-inline-flex align-items-center gap-1" style={{
                                  background: 'rgba(99,102,241,0.1)',
                                  color: 'var(--accent, #6366f1)',
                                  border: '1px solid rgba(99,102,241,0.2)',
                                  fontSize: '0.82rem',
                                  padding: '4px 8px',
                                  fontWeight: 500
                                }}>
                                  <strong>{ac.code}</strong>: {ac.name}
                                  <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    style={{ fontSize: '0.55rem', marginLeft: '4px', filter: 'invert(0.5)' }}
                                    onClick={() => handleRemoveAssignedCourse(t, ac.code)}
                                    title="Remove assignment"
                                  ></button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="glass-card p-3 text-center" style={{ opacity: 0.6 }}>
                No teachers registered yet.
              </div>
            )}
          </div>

          {/* Departments & Their Courses Overview Section */}
          <div style={{ maxWidth: '900px' }}>
            <h4 className="mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-building text-primary"></i>
              Departments &amp; Available Courses Overview
            </h4>

            {loading ? (
              <div className="glass-card p-3 text-center" style={{ opacity: 0.6 }}>Loading departments...</div>
            ) : dbDepartments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {dbDepartments.map((d, i) => (
                  <div key={d._id || i} className="glass-card p-0" style={{ overflow: 'hidden' }}>
                    <div style={{
                      background: 'rgba(99,102,241,0.12)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        background: 'rgba(99,102,241,0.2)',
                        color: 'var(--accent, #6366f1)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}>{i + 1}</span>
                      <span className="fw-semibold" style={{ fontSize: '1rem' }}>{d.name}</span>
                      <span style={{
                        background: 'rgba(99,102,241,0.15)',
                        color: 'var(--accent, #6366f1)',
                        borderRadius: '6px',
                        padding: '2px 10px',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}>{d.code || '—'}</span>
                      {d.description && (
                        <span style={{ opacity: 0.65, fontSize: '0.85rem' }}>{d.description}</span>
                      )}
                      <span style={{
                        marginLeft: 'auto',
                        background: 'rgba(16,185,129,0.12)',
                        color: '#10b981',
                        borderRadius: '6px',
                        padding: '2px 10px',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}>
                        {d.courses && d.courses.length > 0 ? `${d.courses.length} Course${d.courses.length > 1 ? 's' : ''}` : 'No Courses'}
                      </span>
                    </div>

                    {d.courses && d.courses.length > 0 ? (
                      <table className="table mb-0" style={{ color: 'inherit', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            <th className="px-4 py-2" style={{ opacity: 0.5, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Code</th>
                            <th className="px-4 py-2" style={{ opacity: 0.5, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Name</th>
                            <th className="px-4 py-2" style={{ opacity: 0.5, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semester</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.courses.map((c, ci) => (
                            <tr key={c._id || ci} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <td className="px-4 py-2">
                                <span style={{
                                  background: 'rgba(99,102,241,0.1)',
                                  color: 'var(--accent, #6366f1)',
                                  borderRadius: '5px',
                                  padding: '1px 8px',
                                  fontWeight: 600,
                                  fontSize: '0.82rem'
                                }}>{c.code}</span>
                              </td>
                              <td className="px-4 py-2">{c.name}</td>
                              <td className="px-4 py-2" style={{ opacity: 0.75 }}>Semester {c.semester}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="px-4 py-3" style={{ opacity: 0.45, fontSize: '0.85rem' }}>
                        No courses linked to this department.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-3 text-center" style={{ opacity: 0.6 }}>
                No departments available.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
