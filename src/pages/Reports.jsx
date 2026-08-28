import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ExportModal from '../components/ExportModal';


export default function Reports() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);


  const { students, settings } = useAttendance();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const threshold = settings?.defaulterThresholdPercent ?? 75;
  const defaulters = students.filter(s => (s.attendance ?? 100) < threshold);

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="right-side">
        <Navbar isOpen={isSidebarOpen} onToggle={toggleSidebar} onOpenExportModal={() => setShowExportModal(true)} />

        <main className="dashboard-content">
          {/* Header */}
          <div className="glass-card p-4 mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">
                  {role === 'Admin' && <i className="bi bi-shield-lock-fill text-primary"></i>}
                  {role === 'Student' ? 'My Attendance Transcript & Reports' : 'Reports & Defaulter Analytics'}
                </h3>
                <p className="text-muted small mb-0">
                  {role === 'Student' ? 'Generate official attendance statements and downloadable certificates' : 'Generate official compliance reports and alert lists'}
                </p>
              </div>

              <button className="btn btn-primary-gradient" onClick={() => setShowExportModal(true)}>
                {role === 'Admin' && <i className="bi bi-shield-lock-fill me-1"></i>}
                <i className="bi bi-file-earmark-arrow-down-fill me-1"></i> Generate PDF / CSV Report
              </button>
            </div>
          </div>

          {role !== 'Student' && (
            /* Defaulter Alert Box for Admin / Teacher */
            <div className="glass-card p-4 mb-4 border-start border-danger border-4">
              <div className="mb-3">
                <h5 className="fw-bold text-danger mb-0">
                  <i className="bi bi-exclamation-octagon-fill me-2"></i> Low Attendance Warning Alert (&lt;{threshold}%)
                </h5>
                <span className="text-muted small">{defaulters.length} students currently require formal warning notifications</span>
              </div>

              <div className="table-responsive">
                <table className="table table-custom">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Department</th>
                      <th>Attendance %</th>
                      <th>Deficit Classes</th>
                      <th>Current Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaulters.length > 0 ? (
                      defaulters.map(s => (
                        <tr key={s.id}>
                          <td><span className="badge bg-danger-subtle text-danger font-monospace">#{s.roll}</span></td>
                          <td className="fw-bold">{s.name}</td>
                          <td>{s.dept}</td>
                          <td><span className="fw-bold text-danger">{s.attendance}%</span></td>
                          <td>Need {Math.max(1, Math.ceil((threshold - (s.attendance || 0)) * 0.4))} more classes</td>
                          <td><span className="badge bg-danger text-white">Critical Warning</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-3 text-muted">All students meet the {threshold}% minimum threshold.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report Customization Tools */}
          <div className="glass-card p-4">
            <h5 className="fw-bold mb-3">{role === 'Student' ? 'Available Document Downloads' : 'Custom Data Exporter'}</h5>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 border rounded-3 text-center bg-body-tertiary">
                  <i className="bi bi-calendar-month display-5 text-primary mb-2 d-block"></i>
                  <h6>{role === 'Student' ? 'Monthly Transcript' : 'Monthly Digest'}</h6>
                  <p className="small text-muted mb-3">Full monthly summary breakdown</p>
                  <button className="btn btn-outline-custom btn-sm w-100" onClick={() => setShowExportModal(true)}>
                    Export File
                  </button>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="p-3 border rounded-3 text-center bg-body-tertiary">
                  <i className="bi bi-person-lines-fill display-5 text-cyan-500 mb-2 d-block"></i>
                  <h6>{role === 'Student' ? 'Official Statement' : 'Student Ledger'}</h6>
                  <p className="small text-muted mb-3">Detailed log history statement</p>
                  <button className="btn btn-outline-custom btn-sm w-100" onClick={() => setShowExportModal(true)}>
                    Export File
                  </button>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="p-3 border rounded-3 text-center bg-body-tertiary">
                  <i className="bi bi-shield-check display-5 text-success mb-2 d-block"></i>
                  <h6>{role === 'Student' ? 'Verification Certificate' : 'Audit Compliance Log'}</h6>
                  <p className="small text-muted mb-3">Verification digital certificate</p>
                  <button className="btn btn-outline-custom btn-sm w-100" onClick={() => setShowExportModal(true)}>
                    Export File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />

    </div>
  );
}
