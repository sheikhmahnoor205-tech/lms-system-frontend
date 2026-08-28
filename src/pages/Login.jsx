import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import adminIcon from '../assets/admin_icon.svg';
import teacherIcon from '../assets/teacher_icon.svg';
import studentIcon from '../assets/student_icon.svg';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'admin') setEmail('');
    if (role === 'teacher') setEmail('');
    if (role === 'student') setEmail('');
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(selectedRole, email, password);
    if (res.success) {
      navigate('/');
    } else {
      setErrorMsg(res.error || 'Login failed');
    }
  };

  return (
    <div className="login-page-container p-3">
      {/* Background Subtle Institutional Grid */}
      <div className="login-bg-grid" aria-hidden="true" />

      {/* Ambient Moving Gradient Aurora Orbs */}
      <div className="login-orb login-orb-1" aria-hidden="true" />
      <div className="login-orb login-orb-2" aria-hidden="true" />
      <div className="login-orb login-orb-3" aria-hidden="true" />
      <div className="login-orb login-orb-4" aria-hidden="true" />

      {/* Subtle Floating Educational & Academic Motifs */}
      <div className="login-shapes-container" aria-hidden="true">
        {/* Graduation Cap */}
        <div className="login-shape login-shape-1">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>

        {/* Academic Open Book */}
        <div className="login-shape login-shape-2">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>

        {/* Connected Knowledge Nodes */}
        <div className="login-shape login-shape-3">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </div>

        {/* Scientific / Academic Spark */}
        <div className="login-shape login-shape-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        {/* Compass / Mathematical Tool */}
        <div className="login-shape login-shape-5">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        </div>

        {/* Certificate / Award */}
        <div className="login-shape login-shape-6">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        </div>
      </div>

      <div
        className="glass-card login-glass-card p-4 p-sm-5 animate-fade-in"
        style={{
          maxWidth: '440px',
          width: '100%',
          zIndex: 10
        }}
      >
        {/* Logo Brand Header */}
        <div className="text-center mb-4">
          <div
            className="brand-logo pulse-glow mx-auto mb-3 d-flex align-items-center justify-content-center p-2"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: '#4f46e5',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
              transition: 'all 0.3s ease'
            }}
          >
            {selectedRole === 'admin' && (
              <img src={adminIcon} alt="Admin Icon" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            )}
            {selectedRole === 'teacher' && (
              <img src={teacherIcon} alt="Teacher Icon" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            )}
            {selectedRole === 'student' && (
              <img src={studentIcon} alt="Student Icon" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            )}
          </div>
          <h3 className="fw-extrabold text-dark mb-1">CheckedIn Portal</h3>
          <p className="text-muted small">Select your role to sign in to your tailored portal</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="btn-group w-100 mb-4 btn-group-sm">
          <button
            type="button"
            className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'admin' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handleRoleSelect('admin')}
          >
            <img src={adminIcon} alt="" style={{ width: '18px', height: '18px', filter: selectedRole === 'admin' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
            <span>Admin</span>
          </button>
          <button
            type="button"
            className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'teacher' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handleRoleSelect('teacher')}
          >
            <img src={teacherIcon} alt="" style={{ width: '18px', height: '18px', filter: selectedRole === 'teacher' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
            <span>Teacher</span>
          </button>
          <button
            type="button"
            className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'student' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handleRoleSelect('student')}
          >
            <img src={studentIcon} alt="" style={{ width: '18px', height: '18px', filter: selectedRole === 'student' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
            <span>Student</span>
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-danger p-2 small text-center mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-dark small fw-bold">Email Address:</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-secondary-subtle">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control form-control-custom"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label text-dark small fw-bold">Password:</label>
              <Link to="/forgot-password" className="small text-primary fw-bold text-decoration-none mb-2">
                Forgot Password?
              </Link>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light border-secondary-subtle">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control form-control-custom"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
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

          <button type="submit" className="btn btn-primary-gradient w-100 mb-3 py-2 text-capitalize fw-bold">
            <i className="bi bi-box-arrow-in-right me-1"></i> Sign In as {selectedRole}
          </button>
        </form>
      </div>
    </div>
  );
}