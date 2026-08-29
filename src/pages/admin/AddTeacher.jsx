import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useAttendance, BLANK_AVATAR } from '../../context/AttendanceContext';

export default function AddTeacher() {
  const { fetchTeachers: refreshContextTeachers } = useAttendance();
  const [dbDepartments, setDbDepartments] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [dbTeachers, setDbTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dept, setDept] = useState('');
  const [designation, setDesignation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: '', type: 'success' });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('https://lms-system-backend-ljz1.onrender.com/department');
        if (res.ok) {
          const data = await res.json();
          setDbDepartments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Could not fetch departments from backend:', err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const res = await fetch('https://lms-system-backend-ljz1.onrender.com/teacher');
      if (res.ok) {
        const data = await res.json();
        setDbTeachers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Could not fetch teachers from backend:', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Handle Photo / Image Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setAvatar(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlertInfo({ show: false, message: '', type: 'success' });

    try {
      const res = await fetch('https://lms-system-backend-ljz1.onrender.com/teacher/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          department: dept,
          designation,
          avatar: avatar || ''
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setAlertInfo({ show: true, message: 'Teacher added successfully!', type: 'success' });
        setName('');
        setEmail('');
        setPassword('');
        setDept('');
        setDesignation('');
        setAvatar('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await fetchTeachers();
        if (refreshContextTeachers) {
          await refreshContextTeachers();
        }
        setTimeout(() => setAlertInfo({ show: false, message: '', type: 'success' }), 4000);
      } else {
        setAlertInfo({ show: true, message: result.message || 'Failed to save teacher', type: 'danger' });
      }
    } catch (err) {
      console.error(err);
      setAlertInfo({ show: true, message: 'Error connecting to database server to save teacher.', type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div className="right-side">
        <Navbar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <main className="dashboard-content p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="fw-bold mb-1">Add New Teacher</h2>
              <p className="text-muted small mb-0">Create teacher accounts with department binding and optional custom photo</p>
            </div>
          </div>

          {alertInfo.show && (
            <div className={`alert alert-${alertInfo.type} alert-dismissible fade show mb-4`} role="alert" style={{ maxWidth: '650px' }}>
              <i className={`bi ${alertInfo.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
              {alertInfo.message}
              <button type="button" className="btn-close" onClick={() => setAlertInfo({ show: false, message: '', type: 'success' })}></button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="glass-card p-4 mb-5" style={{ maxWidth: '650px' }}>
            {/* Avatar / Photo Upload Section */}
            <div className="mb-4 p-3 rounded-3 bg-body-tertiary border border-secondary-subtle">
              <label className="form-label fw-semibold mb-2 d-block">
                Teacher Photo / Avatar
                <span className="text-muted fw-normal ms-1 small">(Optional)</span>
              </label>
              <div className="d-flex align-items-center gap-3">
                <div className="position-relative">
                  <img
                    src={avatar || BLANK_AVATAR}
                    onError={(e) => { e.target.onerror = null; e.target.src = BLANK_AVATAR; }}
                    alt="Teacher Preview"
                    className="rounded-circle border border-2 border-secondary-subtle shadow-sm"
                    width="68"
                    height="68"
                    style={{ objectFit: 'cover', background: 'var(--card-bg, #fff)' }}
                  />
                  {!avatar && (
                    <span className="position-absolute bottom-0 end-0 badge rounded-pill bg-secondary" style={{ fontSize: '0.65rem' }}>
                      Blank
                    </span>
                  )}
                </div>

                <div className="flex-grow-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="form-control form-control-sm form-control-custom mb-1"
                    onChange={handlePhotoUpload}
                  />
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {avatar ? 'Custom photo attached' : 'If left empty, a blank placeholder icon will be used.'}
                    </span>
                    {avatar && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-danger text-decoration-none p-0"
                        style={{ fontSize: '0.75rem' }}
                        onClick={handleRemovePhoto}
                      >
                        <i className="bi bi-x-circle me-1"></i>Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control form-control-custom"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Dr. Sarah Connor"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Email Address <span className="text-danger">*</span></label>
              <input
                type="email"
                className="form-control form-control-custom"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g., sarah.connor@university.edu"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-secondary-subtle">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-custom"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Leave blank for default 'password123'"
                />
                <button
                  type="button"
                  className="btn btn-password-toggle border-secondary-subtle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Department <span className="text-danger">*</span></label>
              <select
                className="form-select form-control-custom"
                value={dept}
                onChange={e => setDept(e.target.value)}
                required
              >
                <option value="" disabled>Select Department</option>
                {dbDepartments.map(d => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Designation <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control form-control-custom"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="e.g., Assistant Professor, Lecturer"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary-gradient px-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving Teacher…
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus-fill me-1"></i> Save Teacher
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Already Added Teachers (from DB) */}
          <div className="mt-5" style={{ maxWidth: '800px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 className="fw-bold mb-0">Registered Teachers</h4>
              <span className="badge bg-body-secondary text-body border px-2 py-1">
                {dbTeachers.length} Total
              </span>
            </div>

            {loadingTeachers ? (
              <div className="glass-card p-4 text-center text-muted">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Loading teachers from database…
              </div>
            ) : dbTeachers.length > 0 ? (
              <div className="glass-card p-0" style={{ overflow: 'hidden' }}>
                <table className="table table-hover mb-0" style={{ color: 'inherit' }}>
                  <thead style={{ background: 'rgba(99,102,241,0.12)' }}>
                    <tr>
                      <th className="px-3 py-3">Teacher</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Department</th>
                      <th className="px-3 py-3">Designation</th>
                      <th className="px-3 py-3">Assigned Courses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbTeachers.map((t, i) => (
                      <tr key={t._id || i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'middle' }}>
                        <td className="px-3 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={t.avatar || BLANK_AVATAR}
                              onError={(e) => { e.target.onerror = null; e.target.src = BLANK_AVATAR; }}
                              alt={t.name}
                              className="rounded-circle border"
                              width="36"
                              height="36"
                              style={{ objectFit: 'cover' }}
                            />
                            <span className="fw-semibold">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3" style={{ opacity: 0.85 }}>{t.email}</td>
                        <td className="px-3 py-3">
                          <span style={{
                            background: 'rgba(99,102,241,0.15)',
                            color: 'var(--accent, #6366f1)',
                            borderRadius: '6px',
                            padding: '2px 10px',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}>
                            {t.department || t.dept || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3" style={{ opacity: 0.85 }}>{t.designation || '—'}</td>
                        <td className="px-3 py-3">
                          {t.assignedCourses && t.assignedCourses.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {t.assignedCourses.map((ac, cIdx) => (
                                <span key={cIdx} className="badge" style={{
                                  background: 'rgba(99,102,241,0.1)',
                                  color: 'var(--accent, #6366f1)',
                                  border: '1px solid rgba(99,102,241,0.2)',
                                  fontSize: '0.75rem',
                                  padding: '2px 6px'
                                }}>
                                  {ac.code}
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
              <div className="glass-card p-4 text-center text-muted">
                No teachers added yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}