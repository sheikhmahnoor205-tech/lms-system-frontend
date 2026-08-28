import React, { useState } from 'react';
import { useAttendance, DEFAULT_AVATAR } from '../context/AttendanceContext';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

import './Student.css';

export default function Student() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [warningFilterOnly, setWarningFilterOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [showStudentPassword, setShowStudentPassword] = useState(false);


  const { students, departments, addStudent, updateStudent, deleteStudent } = useAttendance();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';

  React.useEffect(() => {
    if (role === 'Teacher' && currentUser?.department) {
      setDeptFilter(currentUser.department);
    }
  }, [role, currentUser]);

  const [newStudent, setNewStudent] = useState({
    name: '',
    roll: '',
    email: '',
    password: '',
    dept: departments[0]?.name || '',
    grade: 'Semester 1',
    avatar: ''
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll.includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' ? true : student.dept === deptFilter;
    const matchesWarning = !warningFilterOnly || student.attendance < 75;
    return matchesSearch && matchesDept && matchesWarning;
  });


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;
  const startIndex = (currentPage - 1) * studentsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, startIndex + studentsPerPage);

  const handleCreateStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.roll) return;
    
    await addStudent(newStudent);
    setShowAddModal(false);
    setNewStudent({ name: '', roll: '', email: '', password: '', dept: departments[0]?.name || '', grade: 'Semester 1', avatar: '' });
    
    // Auto reset search/filters and navigate to page 1 so newly added student immediately appears
    setSearchTerm('');
    setDeptFilter('All');
    setWarningFilterOnly(false);
    setCurrentPage(1);
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    if (!editStudent || !editStudent.name || !editStudent.roll) return;
    
    await updateStudent(editStudent.id, editStudent);
    setEditStudent(null);
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="right-side">
        <Navbar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

        <main className="dashboard-content">
          {/* STUDENT ROLE SPECIFIC CARD VIEW */}
          {role === 'Student' ? (
            <div>
              <div className="glass-card p-4 mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <h3 className="fw-bold mb-1">My Student Identity & Peer Directory</h3>
                    <p className="text-muted small mb-0">Official digital ID card and registered course classmates</p>
                  </div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-6 px-3 py-2">
                    Roll #{currentUser?.roll || 'Enrolled'}
                  </span>
                </div>
              </div>

              {/* Digital Student ID Card */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-5">
                  <div className="glass-card p-4 text-center position-relative overflow-hidden border-start border-primary border-4">
                    <img
                      src={currentUser?.avatar || DEFAULT_AVATAR}
                      onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                      alt="Avatar"
                      className="rounded-circle mb-3 border border-3 border-primary"
                      width="100"
                      height="100"
                      style={{ objectFit: 'cover' }}
                    />
                    <h4 className="fw-bold mb-1">{currentUser?.name || 'Student'}</h4>
                    <p className="text-muted small mb-2">{currentUser?.department ? `${currentUser.department} • ` : ''}{currentUser?.grade || 'Semester 1'}</p>

                    <div className="d-inline-block px-3 py-1 rounded-pill bg-success-subtle text-success fw-bold small mb-3 border border-success-subtle">
                      Status: Active Student
                    </div>

                    <div className="p-3 border rounded-3 bg-body-tertiary text-start small">
                      <div className="mb-1"><strong>Email:</strong> {currentUser?.email || 'N/A'}</div>
                      <div className="mb-1"><strong>Cumulative Attendance:</strong> <span className="text-success fw-bold">{currentUser?.attendance ?? 100}%</span></div>
                      <div><strong>Library Card:</strong> LIB-{new Date().getFullYear()}-{currentUser?.roll || '001'}</div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-7">
                  <div className="glass-card p-4 h-100">
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-people-fill text-primary"></i>
                      Enrolled Department Classmates ({currentUser?.department || 'My Department'})
                    </h5>
                    {(() => {
                      const classmates = students.filter(s =>
                        (s.dept?.toLowerCase() === (currentUser?.department || '').toLowerCase()) &&
                        (s.roll !== currentUser?.roll && s.email !== currentUser?.email)
                      );

                      return classmates.length > 0 ? (
                        <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          <table className="table table-hover table-custom mb-0">
                            <thead>
                              <tr>
                                <th>Roll #</th>
                                <th>Name</th>
                                <th>Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classmates.map(cm => (
                                <tr key={cm.id || cm.roll}>
                                  <td><span className="badge bg-body-tertiary border font-monospace">#{cm.roll}</span></td>
                                  <td className="fw-semibold">{cm.name}</td>
                                  <td>{cm.grade}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted small mb-0 py-4 text-center">
                          No other classmates enrolled in your department yet.
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ADMIN & TEACHER VIEW */
            <div>
              {/* Header Bar */}
              <div className="glass-card p-4 mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
                      {role === 'Admin' && <i className="bi bi-shield-lock-fill text-primary"></i>}
                      {role === 'Teacher' ? 'Class Students Details' : 'Students & Roster Directory'}
                    </h3>
                    <p className="text-muted small mb-0">Manage enrolled student profiles, attendance thresholds, and credentials</p>
                  </div>

                  {role === 'Admin' && (
                    <button className="btn btn-primary-gradient" onClick={() => setShowAddModal(true)}>
                      <i className="bi bi-shield-lock-fill me-1"></i>
                      <i className="bi bi-person-plus-fill me-1"></i> Add New Student
                    </button>
                  )}
                </div>

                <hr className="my-3 border-secondary-subtle" />

                {/* Controls Bar */}
                <div className="row g-3">
                  <div className="col-12 col-md-5">
                    <div className="position-relative">
                      <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                      <input
                        type="text"
                        className="form-control form-control-custom ps-5"
                        placeholder="Search by student name, roll # or email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <select
                      className="form-select form-select-custom"
                      value={deptFilter}
                      onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                    >
                      <option value="All">All Departments</option>
                      {departments.map(d => (
                        <option key={d._id || d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-3 d-flex align-items-center">
                    <div className="form-check form-switch ms-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="warningSwitch"
                        checked={warningFilterOnly}
                        onChange={(e) => setWarningFilterOnly(e.target.checked)}
                      />
                      <label className="form-check-input-label text-danger fw-semibold small" htmlFor="warningSwitch">
                        Defaulters (&lt;75%) Only
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roster Table */}
              <div className="glass-card p-4">
                <div className="table-responsive">
                  <table className="table table-custom">
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Info</th>
                        <th>Department</th>
                        <th>Semester Grade</th>
                        <th>Cumulative Attendance</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentStudents.length > 0 ? (
                        currentStudents.map(s => (
                          <tr key={s.id}>
                            <td>
                              <span className="badge bg-body-tertiary border text-body font-monospace fs-6">
                                #{s.roll}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <img src={s.avatar || DEFAULT_AVATAR} onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }} alt="Avatar" className="rounded-circle" width="40" height="40" style={{ objectFit: 'cover' }} />
                                <div>
                                  <div className="fw-bold">{s.name}</div>
                                  <div className="small text-muted">{s.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="fw-semibold">{s.dept}</td>
                            <td>{s.grade}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                  <div
                                    className={`progress-bar bg-${s.attendance >= 85 ? 'success' : s.attendance >= 75 ? 'warning' : 'danger'}`}
                                    style={{ width: `${s.attendance}%` }}
                                  ></div>
                                </div>
                                <span className="fw-bold small">{s.attendance}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge-status ${s.attendance >= 85 ? 'badge-present' : s.attendance >= 75 ? 'badge-late' : 'badge-absent'}`}>
                                {s.attendance >= 85 ? 'Active' : s.attendance >= 75 ? 'Warning' : 'Critical Defaulter'}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => setViewStudent(s)} title="View Detail Profile">
                                  <i className="bi bi-eye-fill"></i>
                                </button>
                                {(role === 'Admin' || role === 'Teacher') && (
                                  <button className="btn btn-sm btn-outline-warning" onClick={() => setEditStudent(s)} title="Edit Student Details">
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                )}
                                {role === 'Admin' && (
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteStudent(s.id)} title="Remove Student">
                                    <i className="bi bi-trash-fill"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">
                            No students found matching current filter rules.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary-subtle">
                    <span className="small text-muted">
                      Showing {startIndex + 1} to {Math.min(startIndex + studentsPerPage, filteredStudents.length)} of {filteredStudents.length} entries
                    </span>

                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <form onSubmit={handleCreateStudentSubmit}>
                <div className="modal-header modal-header-custom">
                  <h5 className="modal-title fw-bold">Enroll New Student</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Full Name:</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      required
                      placeholder="e.g. John Doe"
                      value={newStudent.name}
                      onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Roll Number / ID:</label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        required
                        placeholder="e.g. 109"
                        value={newStudent.roll}
                        onChange={e => setNewStudent({ ...newStudent, roll: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Department:</label>
                      <select
                        className="form-select form-select-custom"
                        value={newStudent.dept}
                        onChange={e => setNewStudent({ ...newStudent, dept: e.target.value })}
                      >
                        {departments.map(d => (
                          <option key={d._id || d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Semester / Term:</label>
                      <select
                        className="form-select form-select-custom"
                        value={newStudent.grade}
                        onChange={e => setNewStudent({ ...newStudent, grade: e.target.value })}
                      >
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Email Address:</label>
                    <input
                      type="email"
                      className="form-control form-control-custom"
                      placeholder="student@university.edu"
                      value={newStudent.email}
                      onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Password:</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-secondary-subtle">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type={showStudentPassword ? "text" : "password"}
                        className="form-control form-control-custom"
                        placeholder="Enter temporary password"
                        value={newStudent.password || ''}
                        onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="btn btn-password-toggle border-secondary-subtle"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        title={showStudentPassword ? "Hide password" : "Show password"}
                        aria-label={showStudentPassword ? "Hide password" : "Show password"}
                      >
                        <i className={showStudentPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                      </button>
                    </div>
                    <div className="form-text small text-muted">
                      Optional: If left blank, no default password is set. The student can configure their password manually via <em>Forgot Password</em>.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Student Avatar (Manual URL or File):</label>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      {newStudent.avatar && (
                        <img
                          src={newStudent.avatar}
                          alt="Avatar Preview"
                          className="rounded-circle border border-2 border-primary"
                          width="44"
                          height="44"
                          style={{ objectFit: 'cover' }}
                        />
                      )}
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder="Paste image URL (e.g. https://...)"
                        value={newStudent.avatar}
                        onChange={e => setNewStudent({ ...newStudent, avatar: e.target.value })}
                      />
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">Or pick photo:</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm form-control-custom"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewStudent(prev => ({ ...prev, avatar: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-gradient">Enroll Student</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Student Modal */}
      {viewStudent && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom">
                <h5 className="modal-title fw-bold">Student Profile Overview</h5>
                <button type="button" className="btn-close" onClick={() => setViewStudent(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <img src={viewStudent.avatar || DEFAULT_AVATAR} onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }} alt="Avatar" className="rounded-circle mb-3 border border-3 border-primary" width="90" height="90" style={{ objectFit: 'cover' }} />
                <h4 className="fw-bold mb-1">{viewStudent.name}</h4>
                <p className="text-muted small mb-3">Roll #{viewStudent.roll} • {viewStudent.dept}</p>

                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <div className="p-2 border rounded bg-body-tertiary">
                      <span className="small text-muted d-block">ATTENDANCE</span>
                      <h5 className="fw-bold mb-0 text-primary">{viewStudent.attendance}%</h5>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 border rounded bg-body-tertiary">
                      <span className="small text-muted d-block">CGPA</span>
                      <h5 className="fw-bold mb-0 text-success">{(Number(viewStudent.cgpa) || 0).toFixed(2)}</h5>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 border rounded bg-body-tertiary">
                      <span className="small text-muted d-block">GRADE</span>
                      <h5 className="fw-bold mb-0 text-info">{viewStudent.letterGrade || 'N/A'}</h5>
                    </div>
                  </div>
                </div>

                <div className="p-3 border rounded bg-body-tertiary text-start mb-3 small">
                  <div className="fw-bold mb-2 text-primary border-bottom pb-1">Academic Scores Breakdown (Database)</div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Midterm Exam (Max 25):</span>
                    <strong className="text-primary">{Number(viewStudent.midterm) || 0} / 25</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Final Exam (Max 50):</span>
                    <strong className="text-success">{Number(viewStudent.final) || 0} / 50</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Sectional / Quizzes (Max 25):</span>
                    <strong className="text-warning">{Number(viewStudent.sectional) || 0} / 25</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Total Obtained:</span>
                    <strong className="text-body fw-bold">
                      {(Number(viewStudent.midterm) || 0) + (Number(viewStudent.final) || 0) + (Number(viewStudent.sectional) || 0)} / 100
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between pt-1 border-top fw-bold">
                    <span>SGPA / Semester GPA:</span>
                    <span className="badge bg-info text-dark">{(Number(viewStudent.sgpa) || Number(viewStudent.gpa) || 0).toFixed(2)} / 4.00</span>
                  </div>
                </div>

                <div className="text-start border-top pt-3">
                  <div className="small mb-1"><strong>Email:</strong> {viewStudent.email}</div>
                  <div className="small mb-1"><strong>Semester Term:</strong> {viewStudent.grade}</div>
                  <div className="small mb-1"><strong>Compliance Status:</strong> {viewStudent.attendance >= 75 ? <span className="text-success fw-bold">Satisfactory (&gt;75%)</span> : <span className="text-danger fw-bold">Defaulter Warning (&lt;75%)</span>}</div>
                </div>
              </div>
              <div className="modal-footer modal-footer-custom">
                <button className="btn btn-outline-custom" onClick={() => setViewStudent(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <form onSubmit={handleEditStudentSubmit}>
                <div className="modal-header modal-header-custom">
                  <h5 className="modal-title fw-bold">Edit Student Details</h5>
                  <button type="button" className="btn-close" onClick={() => setEditStudent(null)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Full Name:</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      required
                      placeholder="e.g. John Doe"
                      value={editStudent.name || ''}
                      onChange={e => setEditStudent({ ...editStudent, name: e.target.value })}
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Roll Number / ID:</label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        required
                        placeholder="e.g. 109"
                        value={editStudent.roll || ''}
                        onChange={e => setEditStudent({ ...editStudent, roll: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Department:</label>
                      <select
                        className="form-select form-select-custom"
                        value={editStudent.dept || (departments[0]?.name || '')}
                        onChange={e => setEditStudent({ ...editStudent, dept: e.target.value })}
                      >
                        {departments.map(d => (
                          <option key={d._id || d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Semester / Term:</label>
                      <select
                        className="form-select form-select-custom"
                        value={editStudent.grade || 'Semester 6'}
                        onChange={e => setEditStudent({ ...editStudent, grade: e.target.value })}
                      >
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Email Address:</label>
                    <input
                      type="email"
                      className="form-control form-control-custom"
                      placeholder="student@university.edu"
                      value={editStudent.email || ''}
                      onChange={e => setEditStudent({ ...editStudent, email: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Student Avatar (Manual URL or File):</label>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      {editStudent.avatar && (
                        <img
                          src={editStudent.avatar}
                          alt="Avatar Preview"
                          className="rounded-circle border border-2 border-primary"
                          width="44"
                          height="44"
                          style={{ objectFit: 'cover' }}
                        />
                      )}
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder="Paste image URL (e.g. https://...)"
                        value={editStudent.avatar || ''}
                        onChange={e => setEditStudent({ ...editStudent, avatar: e.target.value })}
                      />
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">Or pick photo:</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm form-control-custom"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditStudent(prev => ({ ...prev, avatar: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setEditStudent(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-gradient">Update Student</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}