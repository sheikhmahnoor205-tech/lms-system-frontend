import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function Schedule() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeDay, setActiveDay] = useState('Monday');

  const [showAddSlotModal, setShowAddSlotModal] = useState(false);

  const { schedule, departments, teachers, addScheduleSlot, deleteScheduleSlot } = useAttendance();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';

  const [newSlot, setNewSlot] = useState({
    day: 'Monday',
    time: '09:00 AM - 10:30 AM',
    subject: '',
    code: '',
    room: '',
    instructor: teachers[0]?.name || '',
    dept: departments[0]?.name || ''
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const handleAddSlotSubmit = (e) => {
    e.preventDefault();
    if (role !== 'Admin') {
      alert('Access Denied: Only administrators are authorized to add class timetable slots.');
      return;
    }
    if (!newSlot.subject || !newSlot.subject.trim()) return;

    addScheduleSlot(newSlot);
    setShowAddSlotModal(false);
    setNewSlot({
      day: activeDay,
      time: '09:00 AM - 10:30 AM',
      subject: '',
      code: '',
      room: '',
      instructor: teachers[0]?.name || '',
      dept: departments[0]?.name || ''
    });
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="right-side">
        <Navbar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

        <main className="dashboard-content">
          {/* Header */}
          <div className="glass-card p-4 mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
                  {role === 'Admin' && <i className="bi bi-shield-lock-fill text-primary"></i>}
                  {role === 'Student' ? 'My Department Class Schedule' : role === 'Teacher' ? 'Assigned Lecture Schedule' : 'Institute Timetable Manager'}
                </h3>
                <p className="text-muted small mb-0">
                  {role === 'Student' ? 'Real-time lecture timetable and classroom allocations' : 'Manage department timetable schedules and hall allocations'}
                </p>
              </div>

              {role === 'Admin' && (
                <button className="btn btn-primary-gradient" onClick={() => setShowAddSlotModal(true)}>
                  <i className="bi bi-shield-lock-fill me-1"></i>
                  <i className="bi bi-calendar-plus-fill me-1"></i> Add Timetable Slot
                </button>
              )}
            </div>
          </div>

          {/* Day Navigation Tabs */}
          <div className="glass-card p-2 mb-4">
            <div className="d-flex flex-wrap gap-2">
              {days.map((day) => (
                <button
                  key={day}
                  className={`btn flex-grow-1 py-2 fw-semibold ${activeDay === day ? 'btn-primary-gradient' : 'btn-outline-custom'}`}
                  onClick={() => setActiveDay(day)}
                >
                  <i className="bi bi-calendar-day me-1"></i> {day}
                </button>
              ))}
            </div>
          </div>

          {/* Timetable Cards - Enrolled / Day Filtered */}
          {(() => {
            const visibleSchedule = schedule.filter(item => {
              const matchesDay = item.day ? item.day === activeDay : true;
              let matchesUser = true;
              if (role === 'Student') {
                matchesUser = currentUser?.department ? (item.dept?.toLowerCase() === currentUser.department.toLowerCase()) : true;
              } else if (role === 'Teacher') {
                // Teachers only see slots explicitly assigned to them by instructor name
                matchesUser = item.instructor === currentUser?.name;
              }
              return matchesDay && matchesUser;
            });

            return (
              <div className="row g-4">
                {visibleSchedule.length > 0 ? (
                  visibleSchedule.map((item) => (
                    <div key={item.id} className="col-12 col-md-6">
                      <div className="glass-card p-4 h-100 position-relative overflow-hidden border-start border-primary border-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-bold">
                            <i className="bi bi-clock me-1"></i> {item.time}
                          </span>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-body-tertiary border text-body font-monospace px-2 py-1">
                              {item.code}
                            </span>
                            {role === 'Admin' && deleteScheduleSlot && (
                              <button
                                className="btn btn-sm btn-outline-danger p-1 border-0"
                                title="Delete Slot (Admin Only)"
                                onClick={() => {
                                  if (window.confirm(`Delete ${item.subject} slot?`)) {
                                    deleteScheduleSlot(item.id);
                                  }
                                }}
                              >
                                <i className="bi bi-trash3-fill"></i>
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className="fw-bold mb-2">{item.subject}</h4>
                        <div className="text-muted small mb-3">Department: {item.dept}</div>

                        <div className="d-flex align-items-center justify-content-between pt-3 border-top border-secondary-subtle">
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-person-badge-fill text-primary fs-5"></i>
                            <div>
                              <div className="fw-semibold small">{item.instructor}</div>
                              <div className="text-muted small">Course Lead</div>
                            </div>
                          </div>

                          <div className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
                            <i className="bi bi-geo-alt-fill me-1"></i> {item.room}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5 glass-card text-muted">
                    No scheduled classes for your enrolled subjects on {activeDay}.
                  </div>
                )}
              </div>
            );
          })()}
        </main>
      </div>

      {/* Add Slot Modal - Admin Access Only */}
      {showAddSlotModal && role === 'Admin' && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <form onSubmit={handleAddSlotSubmit}>
                <div className="modal-header modal-header-custom">
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-shield-lock-fill text-primary"></i>
                    Add Class Timetable Slot (Admin)
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddSlotModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Lecture Day:</label>
                      <select
                        className="form-select form-select-custom"
                        value={newSlot.day}
                        onChange={e => setNewSlot({ ...newSlot, day: e.target.value })}
                      >
                        {days.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Department:</label>
                      <select
                        className="form-select form-select-custom"
                        value={newSlot.dept}
                        onChange={e => setNewSlot({ ...newSlot, dept: e.target.value })}
                      >
                        {departments.map(d => (
                          <option key={d._id || d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Subject / Course Name:</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      required
                      placeholder="e.g. Cloud Computing"
                      value={newSlot.subject}
                      onChange={e => setNewSlot({ ...newSlot, subject: e.target.value })}
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Course Code:</label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        value={newSlot.code}
                        onChange={e => setNewSlot({ ...newSlot, code: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Hall / Room No:</label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        value={newSlot.room}
                        onChange={e => setNewSlot({ ...newSlot, room: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Instructor:</label>
                    {teachers.length > 0 ? (
                      <select
                        className="form-select form-select-custom"
                        value={newSlot.instructor}
                        onChange={e => setNewSlot({ ...newSlot, instructor: e.target.value })}
                        required
                      >
                        <option value="" disabled>-- Select Instructor --</option>
                        {teachers.map(t => (
                          <option key={t.id || t._id || t.name} value={t.name}>
                            {t.name} ({t.department || 'Instructor'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder="e.g. Prof. Sarah Connor"
                        value={newSlot.instructor}
                        onChange={e => setNewSlot({ ...newSlot, instructor: e.target.value })}
                        required
                      />
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Time Slot:</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      placeholder="09:00 AM - 10:30 AM"
                      value={newSlot.time}
                      onChange={e => setNewSlot({ ...newSlot, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setShowAddSlotModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-gradient">Add Slot</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
