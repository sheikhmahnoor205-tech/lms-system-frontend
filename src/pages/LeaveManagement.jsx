import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function LeaveManagement() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState('All');

  const { leaves, applyLeave, updateLeaveStatus } = useAttendance();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';

  const [leaveForm, setLeaveForm] = useState({
    studentName: currentUser?.name || '',
    roll: currentUser?.roll || currentUser?.id || '',
    dept: currentUser?.department || '',
    type: 'Medical',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  React.useEffect(() => {
    if (currentUser) {
      setLeaveForm(prev => ({
        ...prev,
        studentName: currentUser.name || '',
        roll: currentUser.roll || currentUser.id || '',
        dept: currentUser.department || ''
      }));
    }
  }, [currentUser]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const filteredLeaves = leaves.filter(l => {
    let matchesRole = true;
    if (role === 'Student') {
      matchesRole = (l.studentName === currentUser?.name || l.roll === currentUser?.roll);
    } else if (role === 'Teacher') {
      const isStudentLeave = l.applicantRole !== 'Teacher';
      const isOwnTeacherLeave = l.applicantRole === 'Teacher' && (l.studentName === currentUser?.name || l.roll === currentUser?.roll || l.roll === currentUser?.id);
      matchesRole = isStudentLeave || isOwnTeacherLeave;
    }
    const matchesStatus = statusFilter === 'All' ? true : l.status === statusFilter;
    return matchesRole && matchesStatus;
  });

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.reason) return;
    await applyLeave({
      ...leaveForm,
      studentName: currentUser?.name || leaveForm.studentName,
      roll: currentUser?.roll || currentUser?.id || leaveForm.roll,
      dept: currentUser?.department || leaveForm.dept,
      applicantRole: role
    });
    setShowApplyModal(false);
    setLeaveForm({ ...leaveForm, reason: '' });
  };

  const pendingCount = filteredLeaves.filter(l => l.status === 'Pending').length;
  const approvedCount = filteredLeaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = filteredLeaves.filter(l => l.status === 'Rejected').length;

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
                  {role === 'Student' ? 'My Leave Applications' : role === 'Teacher' ? 'Teacher & Student Leave Requests' : 'All Leave Applications & Approval Portal'}
                </h3>
                <p className="text-muted small mb-0">
                  {role === 'Student' ? 'Submit leave requests and monitor approval status' : role === 'Teacher' ? 'Apply for leave or review student leave requests' : 'Review, approve, or reject student and teacher leave applications'}
                </p>
              </div>

              {role !== 'Admin' && (
                <button className="btn btn-primary-gradient" onClick={() => setShowApplyModal(true)}>
                  <i className="bi bi-plus-circle-fill me-1"></i> Apply for Leave
                </button>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="glass-card p-3 border-start border-warning border-4">
                <span className="text-muted small fw-bold">{role === 'Admin' && <i className="bi bi-shield-lock-fill me-1"></i>}PENDING APPROVAL</span>
                <h3 className="fw-extrabold text-warning mb-0">{pendingCount}</h3>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="glass-card p-3 border-start border-success border-4">
                <span className="text-muted small fw-bold">{role === 'Admin' && <i className="bi bi-shield-lock-fill me-1"></i>}APPROVED LEAVES</span>
                <h3 className="fw-extrabold text-success mb-0">{approvedCount}</h3>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="glass-card p-3 border-start border-danger border-4">
                <span className="text-muted small fw-bold">{role === 'Admin' && <i className="bi bi-shield-lock-fill me-1"></i>}REJECTED</span>
                <h3 className="fw-extrabold text-danger mb-0">{rejectedCount}</h3>
              </div>
            </div>
          </div>

          {/* Leave Table */}
          <div className="glass-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                {role === 'Admin' && <i className="bi bi-shield-lock-fill text-primary"></i>}
                {role === 'Student' ? 'My Submitted Applications' : 'Leave Applications Stream'}
              </h5>
              <div className="btn-group btn-group-sm">
                {['All', 'Pending', 'Approved', 'Rejected'].map(st => (
                  <button
                    key={st}
                    className={`btn btn-outline-custom ${statusFilter === st ? 'active' : ''}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {role === 'Admin' && <i className="bi bi-shield-lock-fill me-1"></i>}
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-custom">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Applicant Name</th>
                    <th>Roll / ID</th>
                    <th>Leave Category</th>
                    <th>Date Range</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {role !== 'Student' && <th>{role === 'Admin' ? <><i className="bi bi-shield-lock-fill me-1"></i>Admin Actions</> : 'Actions'}</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map(leave => (
                      <tr key={leave.id}>
                        <td className="fw-mono small text-muted">{leave.id}</td>
                        <td>
                          <div className="fw-bold d-flex align-items-center gap-2">
                            {leave.applicantRole === 'Teacher' && <span className="badge bg-info-subtle text-info border">Teacher</span>}
                            {leave.studentName}
                          </div>
                          <div className="small text-muted">Applied: {leave.appliedOn}</div>
                        </td>
                        <td><span className="badge bg-body-tertiary border text-body font-monospace">#{leave.roll}</span></td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            {leave.type}
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold small">{leave.startDate}</div>
                          <div className="text-muted small">to {leave.endDate}</div>
                        </td>
                        <td style={{ maxWidth: '240px' }} className="text-truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td>
                          <span className={`badge-status ${leave.status === 'Approved' ? 'badge-present' : leave.status === 'Pending' ? 'badge-late' : 'badge-absent'}`}>
                            {leave.status}
                          </span>
                        </td>
                        {role !== 'Student' && (
                          <td>
                            {leave.status === 'Pending' ? (
                              (role === 'Teacher' && leave.applicantRole === 'Teacher') ? (
                                <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                                  <i className="bi bi-clock me-1"></i> Awaiting Admin Approval
                                </span>
                              ) : (
                                <div className="btn-group">
                                  <button
                                    className="btn btn-sm btn-success py-0 px-2"
                                    onClick={() => updateLeaveStatus(leave.id, 'Approved')}
                                    title="Approve Request"
                                  >
                                    {role === 'Admin' && <i className="bi bi-shield-lock-fill me-1"></i>}
                                    <i className="bi bi-check-lg"></i> Approve
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger py-0 px-2"
                                    onClick={() => updateLeaveStatus(leave.id, 'Rejected')}
                                    title="Reject Request"
                                  >
                                    {role === 'Admin' && <i className="bi bi-shield-lock-fill me-1"></i>}
                                    <i className="bi bi-x-lg"></i> Reject
                                  </button>
                                </div>
                              )
                            ) : (
                              <span className="text-muted small">Processed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={role === 'Student' ? 7 : 8} className="text-center py-4 text-muted">No leave requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Apply Leave Modal (Only for Student and Teacher) */}
      {showApplyModal && role !== 'Admin' && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <form onSubmit={handleApplySubmit}>
                <div className="modal-header modal-header-custom">
                  <h5 className="modal-title fw-bold">Submit Leave Application ({role})</h5>
                  <button type="button" className="btn-close" onClick={() => setShowApplyModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="p-3 border rounded bg-body-tertiary mb-3">
                    <div className="fw-bold">{currentUser?.name}</div>
                    <div className="small text-muted">{role} • {currentUser?.department || 'Computer Science'}</div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Leave Type:</label>
                      <select
                        className="form-select form-select-custom"
                        value={leaveForm.type}
                        onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                      >
                        <option value="Medical">Medical / Sick</option>
                        <option value="Casual">Casual Leave</option>
                        <option value="Vacation">Official / Event</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Start Date:</label>
                      <input
                        type="date"
                        className="form-control form-control-custom"
                        value={leaveForm.startDate}
                        onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">End Date:</label>
                    <input
                      type="date"
                      className="form-control form-control-custom"
                      value={leaveForm.endDate}
                      onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Reason for Absence:</label>
                    <textarea
                      className="form-control form-control-custom"
                      rows="3"
                      placeholder="Detail reason for leave request..."
                      value={leaveForm.reason}
                      onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setShowApplyModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-gradient">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
