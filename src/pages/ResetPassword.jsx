import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import adminIcon from '../assets/admin_icon.svg';
import teacherIcon from '../assets/teacher_icon.svg';
import studentIcon from '../assets/student_icon.svg';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlEmail = searchParams.get('email') || '';
  const urlRole = searchParams.get('role') || 'student';
  const urlToken = searchParams.get('token') || '';
  const urlOtp = searchParams.get('otp') || '';

  const [selectedRole, setSelectedRole] = useState(urlRole.toLowerCase());
  const [email, setEmail] = useState(urlEmail);
  const [tokenOrOtp, setTokenOrOtp] = useState(urlToken || urlOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (urlRole) setSelectedRole(urlRole.toLowerCase());
    if (urlEmail) setEmail(urlEmail);
    if (urlToken || urlOtp) setTokenOrOtp(urlToken || urlOtp);
  }, [urlRole, urlEmail, urlToken, urlOtp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tokenOrOtp || !tokenOrOtp.trim()) {
      setErrorMsg('Please enter your 6-digit OTP code or reset token from the email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = selectedRole === 'admin'
        ? 'http://localhost:5000/admin-account/reset-password'
        : selectedRole === 'teacher'
        ? 'http://localhost:5000/teacher/reset-password'
        : 'http://localhost:5000/student/reset-password';

      const isOtp = /^\d{6}$/.test(tokenOrOtp.trim());

      const payload = {
        email: email.trim(),
        roll: email.trim(),
        newPassword: newPassword.trim(),
        ...(isOtp ? { otp: tokenOrOtp.trim() } : { token: tokenOrOtp.trim() })
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password. The code may be expired.');
      }

      setIsLoading(false);
      setIsSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setIsLoading(false);
      setErrorMsg(err.message || 'Failed to reset password. Please check your backend connection.');
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
        className="glass-card p-4 p-sm-5 animate-fade-in my-4"
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
        {/* Header Branding */}
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
          <h3 className="fw-extrabold text-dark mb-1">Set New Password</h3>
          <p className="text-muted small mb-0">
            {isSuccess ? 'Your password has been successfully updated' : 'Create a secure new password for your account'}
          </p>
        </div>

        {!isSuccess ? (
          <>
            {/* Role Tabs */}
            <div className="btn-group w-100 mb-4 btn-group-sm">
              <button
                type="button"
                className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'student' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedRole('student')}
              >
                <img src={studentIcon} alt="" style={{ width: '18px', height: '18px', filter: selectedRole === 'student' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
                <span>Student</span>
              </button>
              <button
                type="button"
                className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'teacher' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedRole('teacher')}
              >
                <img src={teacherIcon} alt="" style={{ width: '18px', height: '18px', filter: selectedRole === 'teacher' ? 'brightness(0) invert(1)' : 'grayscale(100%)' }} />
                <span>Teacher</span>
              </button>
              <button
                type="button"
                className={`btn d-flex align-items-center justify-content-center gap-2 py-2 ${selectedRole === 'admin' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedRole('admin')}
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
              <div className="mb-3">
                <label className="form-label text-dark small fw-bold">Email Address or Roll #:</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-secondary-subtle">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="name@university.edu or Roll (e.g. 101)"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-dark small fw-bold">6-Digit OTP Code or Reset Token:</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-secondary-subtle">
                    <i className="bi bi-shield-check"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-custom font-monospace"
                    placeholder="e.g. 849201 or token string"
                    required
                    value={tokenOrOtp}
                    onChange={(e) => setTokenOrOtp(e.target.value)}
                  />
                </div>
                <div className="form-text small text-muted">
                  Found in the password recovery email sent to you.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-dark small fw-bold">New Password:</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-secondary-subtle">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control form-control-custom"
                    placeholder="At least 6 characters"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-password-toggle border-secondary-subtle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-dark small fw-bold">Confirm New Password:</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-secondary-subtle">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-control form-control-custom"
                    placeholder="Re-enter new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-password-toggle border-secondary-subtle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                  </button>
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
                    Updating Password...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1"></i> Confirm & Reset Password
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-3">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-success-subtle text-success rounded-circle mb-3"
              style={{ width: '64px', height: '64px' }}
            >
              <i className="bi bi-check-circle-fill fs-2"></i>
            </div>
            <h4 className="fw-bold mb-2 text-dark">Password Updated!</h4>
            <p className="text-muted small mb-4">
              Your password has been successfully configured. You can now log into your account with your new credentials.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary-gradient w-100 py-2 fw-bold"
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> Proceed to Login
            </button>
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
