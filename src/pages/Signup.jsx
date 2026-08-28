import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import studentIcon from '../assets/student_icon.svg';
import teacherIcon from '../assets/teacher_icon.svg';
import adminIcon from '../assets/admin_icon.svg';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      if (selectedRole === 'student') {
        const studentPayload = {
          name: fullName,
          email: email.trim().toLowerCase(),
          password: password.trim(),
          roll: String(Math.floor(100 + Math.random() * 900)),
          dept: 'Computer Science',
          grade: 'Semester 1'
        };
        const storeRes = await fetch('http://localhost:5000/student/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentPayload)
        });
        if (!storeRes.ok) {
          const errData = await storeRes.json().catch(() => ({}));
          setErrorMsg(errData.message || 'Failed to register student in database');
          return;
        }
      } else if (selectedRole === 'teacher') {
        const teacherPayload = {
          name: fullName,
          email: email.trim().toLowerCase(),
          password: password.trim(),
          department: 'Computer Science',
          designation: 'Lecturer'
        };
        const storeRes = await fetch('http://localhost:5000/teacher/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teacherPayload)
        });
        if (!storeRes.ok) {
          const errData = await storeRes.json().catch(() => ({}));
          setErrorMsg(errData.message || 'Failed to register teacher in database');
          return;
        }
      }

      const loginRes = await login(selectedRole, email.trim(), password.trim());
      if (loginRes.success) {
        navigate('/');
      } else {
        setErrorMsg(loginRes.error || 'Registration completed, but auto-login failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg('Network error during registration. Please check backend server.');
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Glow Accents */}
      <div
        className="position-absolute rounded-circle"
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          top: '-10%',
          left: '-10%',
          filter: 'blur(40px)'
        }}
      />
      <div
        className="position-absolute rounded-circle"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
          bottom: '-10%',
          right: '-10%',
          filter: 'blur(40px)'
        }}
      />

      <div
        className="glass-card p-4 p-sm-5 animate-fade-in my-4"
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
          borderRadius: '1.25rem',
          zIndex: 10
        }}
      >
        {/* Header Icon & Title */}
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
          <h3 className="fw-extrabold text-dark mb-1">Create Account</h3>
          <p className="text-muted small">Register to get access to CheckedIn portal</p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger p-2 small mb-3 text-center border-danger-subtle">
            <i className="bi bi-exclamation-triangle-fill me-1"></i> {errorMsg}
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="btn-group w-100 mb-4 btn-group-sm">
          <button
            type="button"
            className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'student' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedRole('student')}
          >
            <img src={studentIcon} alt="" style={{ width: '16px', height: '16px', filter: selectedRole === 'student' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
            <span>Student</span>
          </button>
          <button
            type="button"
            className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'teacher' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedRole('teacher')}
          >
            <img src={teacherIcon} alt="" style={{ width: '16px', height: '16px', filter: selectedRole === 'teacher' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
            <span>Teacher</span>
          </button>
          <button
            type="button"
            className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'admin' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedRole('admin')}
          >
            <img src={adminIcon} alt="" style={{ width: '16px', height: '16px', filter: selectedRole === 'admin' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
            <span>Admin</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label text-dark small fw-bold">First Name:</label>
              <input
                type="text"
                className="form-control form-control-custom"
                placeholder="John"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div className="col-6">
              <label className="form-label text-dark small fw-bold">Last Name:</label>
              <input
                type="text"
                className="form-control form-control-custom"
                placeholder="Doe"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-dark small fw-bold">Email Address:</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-secondary-subtle">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control form-control-custom"
                placeholder="name@university.edu"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-dark small fw-bold">Password:</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-secondary-subtle">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control form-control-custom"
                placeholder="••••••••"
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

          <div className="mb-4">
            <label className="form-label text-dark small fw-bold">Confirm Password:</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-secondary-subtle">
                <i className="bi bi-shield-check"></i>
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control form-control-custom"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-password-toggle border-secondary-subtle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "Hide password" : "Show password"}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <i className={showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary-gradient w-100 mb-3 py-2 text-capitalize fw-bold">
            <i className="bi bi-person-plus-fill me-1"></i> Register as {selectedRole}
          </button>
        </form>

        <div className="text-center mt-3 pt-3 border-top border-secondary-subtle">
          <span className="small text-muted me-1">Already have an account?</span>
          <Link to="/login" className="small text-primary fw-bold text-decoration-none">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
