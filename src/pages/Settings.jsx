import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

import './Settings.css';

export default function Settings() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [savedAlert, setSavedAlert] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const { settings, setSettings, theme, toggleTheme } = useAttendance();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';

  const [formData, setFormData] = useState(settings);
  const [userProfile, setUserProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    notifications: true
  });

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  React.useEffect(() => {
    if (currentUser) {
      setUserProfile({
        name: currentUser.name || '',
        email: currentUser.email || '',
        notifications: true
      });
    }
  }, [currentUser]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (role === 'Admin') {
      await setSettings(formData);
    } else if (role === 'Teacher') {
      try {
        await fetch(`https://lms-system-backend-ljz1.onrender.com/teacher/update/${currentUser?.id || currentUser?._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: userProfile.name, email: userProfile.email })
        });
      } catch (err) {
        console.error('Error saving teacher profile:', err);
      }
    } else if (role === 'Student') {
      try {
        await fetch(`https://lms-system-backend-ljz1.onrender.com/student/update/${currentUser?.id || currentUser?._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: userProfile.name, email: userProfile.email })
        });
      } catch (err) {
        console.error('Error saving student profile:', err);
      }
    }
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
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
              <strong>Settings Saved!</strong> Your configuration preferences have been updated.
              <button type="button" className="btn-close" onClick={() => setSavedAlert(false)}></button>
            </div>
          )}

          {/* Header */}
          <div className="glass-card p-4 mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
                  {role === 'Admin' && <i className="bi bi-shield-lock-fill text-primary"></i>}
                  {role === 'Admin' ? 'System Configuration & Parameters' : 'Account & Portal Preferences'}
                </h3>
                <p className="text-muted small mb-0">
                  {role === 'Admin' ? 'Configure attendance parameters and notification alerts' : 'Manage your personal user profile, notification rules, and display mode'}
                </p>
              </div>

              <button className="btn btn-primary-gradient" onClick={handleSaveSettings}>
                {role === 'Admin' && <i className="bi bi-shield-lock-fill me-1"></i>}
                <i className="bi bi-floppy-fill me-1"></i> Save Changes
              </button>
            </div>
          </div>

          {/* TEACHER & STUDENT VIEW */}
          {role !== 'Admin' ? (
            <div className="glass-card p-4">
              <h5 className="fw-bold mb-3">User Profile & Notification Settings</h5>
              <form onSubmit={handleSaveSettings}>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">Full Name:</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      value={userProfile.name}
                      onChange={e => setUserProfile({ ...userProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">Email Address:</label>
                    <input
                      type="email"
                      className="form-control form-control-custom"
                      value={userProfile.email}
                      onChange={e => setUserProfile({ ...userProfile, email: e.target.value })}
                    />
                  </div>
                </div>

                <hr className="my-4 border-secondary-subtle" />

                <h6 className="fw-bold mb-3">Display & Notification Options</h6>
                <div className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-body-tertiary mb-3">
                  <div>
                    <div className="fw-semibold">Color Theme Mode</div>
                    <div className="small text-muted">Toggle between Light and Dark interface modes</div>
                  </div>
                  <button type="button" className="btn btn-outline-custom btn-sm" onClick={toggleTheme}>
                    <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'} me-1`}></i>
                    {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                  </button>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="userNotifSwitch"
                    checked={userProfile.notifications}
                    onChange={e => setUserProfile({ ...userProfile, notifications: e.target.checked })}
                  />
                  <label className="form-check-label fw-semibold small" htmlFor="userNotifSwitch">
                    Receive Email Notifications for Attendance Status Updates
                  </label>
                </div>
              </form>
            </div>
          ) : (
            /* ADMIN VIEW */
            <div className="glass-card p-4 mb-4">
              <ul className="nav nav-pills custom-nav-pills mb-4">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                  >
                    <i className="bi bi-building me-2"></i> General Info
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'timings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timings')}
                  >
                    <i className="bi bi-clock-history me-2"></i> Shift & Grace Rules
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                  >
                    <i className="bi bi-shield-check me-2"></i> Thresholds & Alerts
                  </button>
                </li>
              </ul>

              {activeTab === 'general' && (
                <div className="row g-3 animate-fade-in">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">Institute Name:</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      value={formData.instituteName}
                      onChange={e => setFormData({ ...formData, instituteName: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">Academic Year Session:</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      value={formData.academicYear}
                      onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'timings' && (
                <div className="row g-3 animate-fade-in">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold small">Class Start Time:</label>
                    <input
                      type="time"
                      className="form-control form-control-custom"
                      value={formData.workingHoursStart}
                      onChange={e => setFormData({ ...formData, workingHoursStart: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold small">Class End Time:</label>
                    <input
                      type="time"
                      className="form-control form-control-custom"
                      value={formData.workingHoursEnd}
                      onChange={e => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold small">Late Grace Period (Minutes):</label>
                    <input
                      type="number"
                      className="form-control form-control-custom"
                      value={formData.lateGraceMinutes}
                      onChange={e => setFormData({ ...formData, lateGraceMinutes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="row g-3 animate-fade-in">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small d-flex justify-content-between">
                      <span>Minimum Defaulter Warning Threshold:</span>
                      <span className="text-danger fw-bold">{formData.defaulterThresholdPercent}%</span>
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      min="50"
                      max="90"
                      step="5"
                      value={formData.defaulterThresholdPercent}
                      onChange={e => setFormData({ ...formData, defaulterThresholdPercent: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>


    </div>
  );
}