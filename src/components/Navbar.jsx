import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useAttendance, BLANK_AVATAR } from '../context/AttendanceContext';
import './Navbar.css';

export default function Navbar({ onToggle, isOpen, onOpenExportModal }) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme, notifications, markAllNotificationsRead } = useAttendance();
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = currentUser?.role || 'Admin';

  // Filter notifications by user role AND prioritize notifications matching current route or page context
  const userNotifications = notifications.filter(n => {
    if (!n.roles) return true;
    return n.roles.includes(userRole);
  });

  // Sort/filter notifications so current page notifications are shown or prioritized
  const currentPageNotifications = userNotifications.filter(n => n.link === location.pathname);
  const otherNotifications = userNotifications.filter(n => n.link !== location.pathname);
  const displayedNotifications = [...currentPageNotifications, ...otherNotifications];

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif) => {
    notif.read = true; // mark read
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <header className="navbar-wrapper">
      <div className="navbar-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title="Toggle Navigation Menu"
        >
          <i className={`bi ${isOpen ? 'bi-layout-sidebar-reverse' : 'bi-layout-sidebar'}`}></i>
        </button>

        <div className="live-clock-badge d-none d-md:flex">
          <i className="bi bi-clock-history me-2 text-primary"></i>
          <div>
            <span className="clock-time">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="clock-date ms-2 text-muted">
              {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="navbar-search d-none d-lg:flex">
        <i className="bi bi-search search-icon"></i>
        <input
          type="text"
          className="search-input"
          placeholder="Search student, roll number, department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-shortcut">⌘K</span>
      </div>

      <div className="navbar-right">
        {/* Theme Toggle Button */}
        <button
          className="icon-circle-btn me-2"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
        </button>

        {/* Notifications Dropdown */}
        <div className="dropdown-container me-2" ref={notificationsRef}>
          <button
            className="icon-circle-btn position-relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <i className="bi bi-bell-fill"></i>
            {unreadCount > 0 && (
              <span className="notification-badge-pulse">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="custom-dropdown-panel notifications-panel animate-fade-in">
              <div className="dropdown-panel-header">
                <h6>Notifications ({displayedNotifications.length})</h6>
                <button
                  className="btn btn-link btn-sm p-0 text-primary text-decoration-none"
                  onClick={markAllNotificationsRead}
                >
                  Mark all read
                </button>
              </div>
              <div className="dropdown-panel-body">
                {displayedNotifications.length > 0 ? (
                  displayedNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={`notification-icon-box bg-${n.type === 'warning' ? 'danger' : n.type === 'info' ? 'primary' : 'success'}-subtle`}>
                        <i className={`bi ${n.type === 'warning' ? 'bi-exclamation-triangle-fill text-danger' : n.type === 'info' ? 'bi-info-circle-fill text-primary' : 'bi-check-circle-fill text-success'}`}></i>
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{n.title}</div>
                        <div className="notification-desc">{n.msg}</div>
                        <div className="notification-time">{n.time}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-muted small">No notifications available</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div className="dropdown-container" ref={userMenuRef}>
          <button
            className="user-nav-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <img
              src={currentUser?.avatar || BLANK_AVATAR}
              onError={(e) => { e.target.onerror = null; e.target.src = BLANK_AVATAR; }}
              alt="Avatar"
              className="user-nav-avatar"
            />
            <div className="d-none d-md:block text-start">
              <div className="user-nav-name">{currentUser?.name?.split(' ')[0] || 'User'}</div>
              <div className="user-nav-role">{currentUser?.role || 'Admin'}</div>
            </div>
            <i className="bi bi-chevron-down ms-1 text-muted"></i>
          </button>

          {showUserMenu && (
            <div className="custom-dropdown-panel user-panel animate-fade-in">
              <div className="p-3 border-bottom border-secondary-subtle">
                <div className="fw-bold">{currentUser?.name}</div>
                <div className="small text-muted">{currentUser?.email}</div>
                <span className="badge bg-primary mt-2">{currentUser?.role} Perspective</span>
              </div>
              <div className="py-2">
                {onOpenExportModal && (
                  <button className="dropdown-item-btn" onClick={onOpenExportModal}>
                    <i className="bi bi-download me-2 text-primary"></i> Export System Data
                  </button>
                )}
                <a href="/admin/setting" className="dropdown-item-btn">
                  <i className="bi bi-sliders me-2 text-primary"></i> Preferences
                </a>
                <hr className="my-1" />
                <button className="dropdown-item-btn text-danger fw-semibold" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}