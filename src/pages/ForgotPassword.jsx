import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import adminIcon from '../assets/admin_icon.svg';
import teacherIcon from '../assets/teacher_icon.svg';
import studentIcon from '../assets/student_icon.svg';

export default function ForgotPassword() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.trim()) {
      setErrorMsg('Please enter your registered email address or roll number.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = selectedRole === 'admin'
        ? 'http://localhost:5000/admin-account/forgot-password'
        : selectedRole === 'teacher'
        ? 'http://localhost:5000/teacher/forgot-password'
        : 'http://localhost:5000/student/forgot-password';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          roll: email.trim(),
          role: selectedRole
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch reset email. Please verify the email address.');
      }

      if (data.previewUrl) {
        setEmailPreviewUrl(data.previewUrl);
      }
      if (data.otp) {
        setSentOtp(data.otp);
      }

      setIsLoading(false);
      setSubmitted(true);
    } catch (err) {
      console.error('Forgot password submission error:', err);
      setIsLoading(false);
      setErrorMsg(err.message || 'Unable to connect to the backend server. Please try again.');
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
      {/* Decorative Glow Elements */}
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
        className="glass-card p-4 p-sm-5 animate-fade-in"
        style={{
          maxWidth: '460px',
          width: '100%',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
          borderRadius: '1.25rem',
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
          <h3 className="fw-extrabold text-dark mb-1">Reset Password</h3>
          <p className="text-muted small mb-0">
            {!submitted ? 'Enter your email to receive recovery instructions' : 'Check your inbox for a password reset email'}
          </p>
        </div>

        {!submitted ? (
          <>
            {/* Role Selector Tabs */}
            <div className="btn-group w-100 mb-4 btn-group-sm">
              <button
                type="button"
                className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'student' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => handleRoleSelect('student')}
              >
                <img src={studentIcon} alt="" style={{ width: '18px', height: '18px', filter: selectedRole === 'student' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
                <span>Student</span>
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
                className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'admin' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => handleRoleSelect('admin')}
              >
                <img src={adminIcon} alt="" style={{ width: '18px', height: '18px', filter: selectedRole === 'admin' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
                <span>Admin</span>
              </button>
            </div>

            {errorMsg && (
              <div className="alert alert-danger p-2 small text-center mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label text-dark small fw-bold">Email Address or Roll #:</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-secondary-subtle">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder={selectedRole === 'student' ? "student@university.edu or Roll (e.g. 101)" : "name@attendflow.edu"}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-text small text-muted mt-1">
                  We'll send a password reset link & verification code to your registered email.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary-gradient w-100 mb-3 py-2 text-capitalize fw-bold d-flex align-items-center justify-content-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Sending Reset Email...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-1"></i> Send Recovery Email
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-2">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-success-subtle text-success rounded-circle mb-3"
              style={{ width: '56px', height: '56px' }}
            >
              <i className="bi bi-check-circle-fill fs-3"></i>
            </div>
            <h5 className="fw-bold mb-2">Instructions Sent!</h5>
            <p className="text-muted small px-2 mb-3">
              We've dispatched a password reset link and verification code to <strong className="text-dark">{email}</strong> as a <strong>{selectedRole}</strong>.
            </p>

            {/* Test Mode Preview helper */}
            {emailPreviewUrl && (
              <div className="alert alert-info py-2 px-3 small text-start mb-3 border-info-subtle">
                <div className="fw-bold mb-1 d-flex align-items-center gap-1">
                  <i className="bi bi-info-circle-fill text-info"></i> Development Email Inbox:
                </div>
                <a
                  href={emailPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-info w-100 text-decoration-none mt-1 fw-bold"
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i> View Test Email Preview
                </a>
              </div>
            )}

            <div className="d-grid gap-2 mb-3">
              <button
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}&role=${selectedRole}${sentOtp ? `&otp=${sentOtp}` : ''}`)}
                className="btn btn-primary-gradient py-2 fw-bold"
              >
                <i className="bi bi-key-fill me-1"></i> Enter Code & Reset Password
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmailPreviewUrl('');
                }}
                className="btn btn-outline-secondary btn-sm py-1"
              >
                Didn't receive it? Try again
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-3 pt-3 border-top border-secondary-subtle">
          <Link to="/login" className="small text-primary fw-bold text-decoration-none d-inline-flex align-items-center gap-1">
            <i className="bi bi-arrow-left"></i> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
