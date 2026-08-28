import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useAttendance, BLANK_AVATAR } from '../context/AttendanceContext';
import './Sidebar.css';

export default function Sidebar({ isOpen, onToggle }) {
  const { currentUser, switchRole, logout } = useAuth();
  const { theme } = useAttendance();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-filtered navigation items
  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: 'bi-grid-1x2-fill', roles: ['Admin', 'Teacher', 'Student'] },
    { path: '/attendance', label: currentUser?.role === 'Student' ? 'My Attendance' : 'Attendance', icon: 'bi-calendar2-check-fill', roles: ['Admin', 'Teacher', 'Student'] },
    { path: '/admin/student', label: 'Students Details', icon: 'bi-people-fill', roles: ['Admin', 'Teacher'] },
    { path: '/admin/leaves', label: currentUser?.role === 'Student' ? 'My Leave Requests' : 'Leave Requests', icon: 'bi-envelope-paper-fill', roles: ['Admin', 'Teacher', 'Student'] },
    { path: '/admin/schedule', label: 'Class Schedule', icon: 'bi-clock-history', roles: ['Admin', 'Teacher', 'Student'] },
    { path: '/admin/marks', label: currentUser?.role === 'Student' ? 'My Academic Marks' : 'Marks & Performance', icon: 'bi-award-fill', roles: ['Admin', 'Teacher', 'Student'] },
    { path: '/admin/add-department', label: 'Add Department', icon: 'bi-building', roles: ['Admin'] },
    { path: '/admin/add-teacher', label: 'Add Teacher', icon: 'bi-person-plus-fill', roles: ['Admin'] },
    { path: '/admin/assign-course', label: 'Assign Course', icon: 'bi-journal-check', roles: ['Admin'] },
    { path: '/admin/reports', label: 'Reports & Export', icon: 'bi-file-earmark-bar-graph-fill', roles: ['Admin'] },
    { path: '/admin/setting', label: 'Settings', icon: 'bi-gear-wide-connected', roles: ['Admin'] },
  ];

  const currentRole = currentUser?.role || 'Admin';
  const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className={`sidebar-wrapper ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo pulse-glow">
          <i className={`bi ${currentRole === 'Admin' ? 'bi-shield-lock-fill' : 'bi-mortarboard-fill'}`}></i>
        </div>
        {isOpen && (
          <div className="brand-text">
            <span className="brand-title d-flex align-items-center gap-1">
              {currentRole === 'Admin' && <i className="bi bi-shield-lock-fill text-primary small"></i>}
              CheckedIn
            </span>
            <span className="brand-subtitle">{currentRole.toUpperCase()} PORTAL</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">{isOpen && `${currentRole.toUpperCase()} MENU`}</div>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}
                title={!isOpen ? item.label : ''}
              >
                <i className={`bi ${item.icon} nav-icon`}></i>
                {isOpen && <span className="nav-text">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile Bottom Card */}
      <div className="sidebar-footer">

        <div className="user-profile-card d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <img
              src={currentUser?.avatar || BLANK_AVATAR}
              onError={(e) => { e.target.onerror = null; e.target.src = BLANK_AVATAR; }}
              alt="User Avatar"
              className="user-avatar"
            />
            {isOpen && (
              <div className="user-info-text">
                <div className="user-name">{currentUser?.name || 'User'}</div>
                <div className="user-role-badge">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                    {currentRole}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            className="btn btn-sm btn-outline-danger border-0 ms-1 p-2"
            onClick={handleLogout}
            title="Log Out"
          >
            <i className="bi bi-box-arrow-right fs-5"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}