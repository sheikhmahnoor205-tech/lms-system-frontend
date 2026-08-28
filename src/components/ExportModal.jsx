import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';

export default function ExportModal({ isOpen, onClose }) {
  const { logs, students } = useAttendance();
  const [format, setFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('today');

  if (!isOpen) return null;

  const handleExport = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let filteredLogs = logs;
    if (dateRange === 'today') {
      filteredLogs = logs.filter(log => log.date === todayStr);
    } else if (dateRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filteredLogs = logs.filter(log => {
        const logDate = log.date ? new Date(log.date) : null;
        return logDate && logDate >= oneWeekAgo;
      });
    } else if (dateRange === 'month') {
      filteredLogs = logs.filter(log => log.date && log.date.startsWith(currentMonthPrefix));
    }

    if (format === 'csv') {
      const headers = ['ID', 'Student Name', 'Roll No', 'Department', 'Time', 'Status', 'Method', 'Date'];
      const csvRows = [headers.join(',')];

      filteredLogs.forEach(log => {
        csvRows.push([
          log.id,
          `"${log.studentName || log.name || 'Student'}"`,
          log.roll || '',
          `"${log.dept || ''}"`,
          log.time || '',
          log.status || 'present',
          `"${log.method || 'Teacher Manual'}"`,
          log.date || ''
        ].join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${dateRange}_${todayStr}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      window.print();
    }
    onClose();
  };

  const currentMonthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
  const todayLabel = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date());

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content modal-content-custom">
          <div className="modal-header modal-header-custom">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-arrow-down-fill text-primary"></i> Export Attendance Reports
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            <div className="mb-3">
              <label className="form-label fw-semibold small">Export Format:</label>
              <div className="row g-2">
                <div className="col-6">
                  <div
                    className={`p-3 border rounded-3 text-center cursor-pointer ${format === 'csv' ? 'border-primary bg-primary-subtle' : ''}`}
                    onClick={() => setFormat('csv')}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-filetype-csv display-6 text-primary d-block mb-1"></i>
                    <span className="fw-semibold">CSV Spreadsheet</span>
                  </div>
                </div>
                <div className="col-6">
                  <div
                    className={`p-3 border rounded-3 text-center cursor-pointer ${format === 'pdf' ? 'border-primary bg-primary-subtle' : ''}`}
                    onClick={() => setFormat('pdf')}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-printer-fill display-6 text-danger d-block mb-1"></i>
                    <span className="fw-semibold">Printable PDF</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold small">Time Horizon:</label>
              <select className="form-select form-select-custom" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="today">Today ({todayLabel})</option>
                <option value="week">This Week</option>
                <option value="month">Current Month ({currentMonthLabel})</option>
                <option value="all">Full Academic History ({logs.length} records)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer modal-footer-custom">
            <button className="btn btn-outline-custom" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary-gradient" onClick={handleExport}>
              <i className="bi bi-download me-1"></i> Generate & Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
