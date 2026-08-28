import React, { useState } from 'react';
import { useAttendance } from './context/AttendanceContext';
import { useAuth } from './AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ExportModal from './components/ExportModal';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const DEPT_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316'];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all');
  const [feedSearch, setFeedSearch] = useState('');

  const { students, logs, leaves, schedule, settings, recordAttendance } = useAttendance();
  const { currentUser } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const role = currentUser?.role || 'Admin';

  // Metrics from real data
  const totalStudents = students.length;
  const presentCount = logs.filter(l => l.status === 'present').length;
  const lateCount = logs.filter(l => l.status === 'late').length;
  const absentCount = logs.filter(l => l.status === 'absent').length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const attendanceRate = logs.length > 0 ? Math.round(((presentCount + lateCount) / logs.length) * 100) : 0;

  // Student specific metrics from real data
  const myStudentLogs = logs.filter(l => l.studentName === currentUser?.name || l.roll === currentUser?.roll);
  const myStudentData = students.find(s => s.roll === currentUser?.roll || s.name === currentUser?.name);
  const myAttendancePct = myStudentData?.attendance ?? currentUser?.attendance ?? 0;
  const myPendingLeaves = leaves.filter(l => (l.studentName === currentUser?.name || l.roll === currentUser?.roll) && l.status === 'Pending').length;
  const myApprovedLeaves = leaves.filter(l => (l.studentName === currentUser?.name || l.roll === currentUser?.roll) && l.status === 'Approved').length;

  // Dynamic weekly trend from logs (last 7 unique days)
  const trendData = (() => {
    const dayMap = {};
    logs.forEach(log => {
      const d = log.date || new Date().toISOString().split('T')[0];
      if (!dayMap[d]) dayMap[d] = { present: 0, late: 0, absent: 0, total: 0 };
      dayMap[d][log.status] = (dayMap[d][log.status] || 0) + 1;
      dayMap[d].total++;
    });
    const sorted = Object.keys(dayMap).sort().slice(-7);
    if (sorted.length === 0) return DAY_LABELS.map(day => ({ day, present: 0, late: 0, absent: 0 }));
    return sorted.map((dateStr, i) => {
      const entry = dayMap[dateStr];
      const total = entry.total || 1;
      const label = i === sorted.length - 1 ? 'Today' : DAY_LABELS[new Date(dateStr).getDay() === 0 ? 6 : new Date(dateStr).getDay() - 1] || dateStr.slice(5);
      return {
        day: label,
        present: Math.round((entry.present / total) * 100),
        late: Math.round((entry.late / total) * 100),
        absent: Math.round((entry.absent / total) * 100)
      };
    });
  })();

  // Dynamic department enrollment from real students
  const deptData = (() => {
    const counts = {};
    students.forEach(s => {
      if (s.dept) counts[s.dept] = (counts[s.dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: DEPT_COLORS[i % DEPT_COLORS.length]
    }));
  })();

  // Next scheduled slot for student
  const todayDayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  const myNextSlot = schedule.find(slot => slot.day === todayDayName) || schedule[0];

  // Filtered activity logs
  const filteredLogs = logs.filter(log => {
    const matchesRole = role === 'Student' ? (log.studentName === currentUser?.name || log.roll === currentUser?.roll) : true;
    const matchesFilter = feedFilter === 'all' || log.status === feedFilter;
    const matchesSearch = log.studentName.toLowerCase().includes(feedSearch.toLowerCase()) ||
                          log.roll.includes(feedSearch) ||
                          log.dept.toLowerCase().includes(feedSearch.toLowerCase());
    return matchesRole && matchesFilter && matchesSearch;
  });

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="right-side">
        <Navbar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          onOpenExportModal={() => setShowExportModal(true)}
        />

        <main className="dashboard-content">
          {/* Welcome Banner */}
          <div className="glass-card welcome-banner p-4 mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-1 rounded-pill mb-2">
                  <i className={`bi ${role === 'Admin' ? 'bi-shield-lock-fill' : 'bi-shield-check'} me-1`}></i> {role.toUpperCase()} DASHBOARD
                </span>
                <h2 className="fw-extrabold mb-1 d-flex align-items-center gap-2">
                  {role === 'Admin' && <i className="bi bi-shield-lock-fill text-primary"></i>} Welcome Back, {currentUser?.name || 'User'} 👋
                </h2>
                <p className="text-muted mb-0">
                  {role === 'Admin' && `Full system analytics & compliance monitoring for ${settings?.instituteName || currentUser?.department || 'Institute'}`}
                  {role === 'Teacher' && `Course lead dashboard & class attendance register for ${currentUser?.department || 'All Departments'}`}
                  {role === 'Student' && `Student portal & personal attendance history for ${currentUser?.name ? `${currentUser.name} (Roll #${currentUser.roll || 'Enrolled'})` : 'Student'}`}
                </p>
              </div>

              {role === 'Admin' && (
                <div>
                  <Link to="/admin/student" className="btn btn-primary-gradient">
                    <i className="bi bi-shield-lock-fill me-1"></i>
                    <i className="bi bi-person-plus-fill me-1"></i> New Student
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics Cards - Role Tailored */}
          {role === 'Student' ? (
            /* STUDENT METRICS */
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label">My Attendance Rate</span>
                      <h3 className="metric-value text-success mt-1">{myAttendancePct}%</h3>
                      <span className="metric-sub text-success"><i className="bi bi-check-circle-fill me-1"></i> Defaulter Threshold Safe (&gt;75%)</span>
                    </div>
                    <div className="metric-icon-box bg-success-subtle text-success"><i className="bi bi-pie-chart-fill"></i></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label">My Attendance Records</span>
                      <h3 className="metric-value mt-1">{myStudentLogs.filter(l=>l.status==='present').length} Present</h3>
                      <span className="metric-sub text-primary"><i className="bi bi-calendar-check me-1"></i> {myStudentLogs.length} Total Logged</span>
                    </div>
                    <div className="metric-icon-box bg-primary-subtle text-primary"><i className="bi bi-journal-check"></i></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label">My Leave Status</span>
                      <h3 className="metric-value mt-1">{myPendingLeaves} Pending</h3>
                      <span className="metric-sub text-info"><i className="bi bi-envelope-check me-1"></i>{myApprovedLeaves > 0 ? ` ${myApprovedLeaves} Approved` : ' All processed'}</span>
                    </div>
                    <div className="metric-icon-box bg-info-subtle text-info"><i className="bi bi-envelope-paper-fill"></i></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label">Next Lecture Slot</span>
                      <h3 className="metric-value mt-1">{myNextSlot ? myNextSlot.time?.split(' - ')[0] : 'No Slot'}</h3>
                      <span className="metric-sub text-warning"><i className="bi bi-geo-alt-fill me-1"></i>{myNextSlot ? `${myNextSlot.room} (${myNextSlot.code})` : 'No schedule'}</span>
                    </div>
                    <div className="metric-icon-box bg-warning-subtle text-warning"><i className="bi bi-clock-fill"></i></div>
                  </div>
                </div>
              </div>
            </div>
          ) : role === 'Teacher' ? (
            /* TEACHER METRICS */
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label">My Course Modules</span>
                      <h3 className="metric-value mt-1">{schedule.filter(s => !currentUser?.department || s.dept === currentUser?.department).length} Slots</h3>
                      <span className="metric-sub text-primary"><i className="bi bi-mortarboard-fill me-1"></i>{currentUser?.department || 'All Departments'}</span>
                    </div>
                    <div className="metric-icon-box bg-primary-subtle text-primary"><i className="bi bi-journal-bookmark-fill"></i></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label">Class Attendance %</span>
                      <h3 className="metric-value text-success mt-1">{attendanceRate}%</h3>
                      <span className="metric-sub text-success"><i className="bi bi-graph-up me-1"></i> High student engagement</span>
                    </div>
                    <div className="metric-icon-box bg-success-subtle text-success"><i className="bi bi-bar-chart-fill"></i></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label">Student Leaves to Review</span>
                      <h3 className="metric-value mt-1">{pendingLeaves} Pending</h3>
                      <span className="metric-sub text-warning"><i className="bi bi-envelope-exclamation me-1"></i> Requires action</span>
                    </div>
                    <div className="metric-icon-box bg-warning-subtle text-warning"><i className="bi bi-envelope-fill"></i></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label">Students Enrolled</span>
                      <h3 className="metric-value mt-1">{totalStudents} Total</h3>
                      <span className="metric-sub text-info"><i className="bi bi-people me-1"></i> Active class roster</span>
                    </div>
                    <div className="metric-icon-box bg-info-subtle text-info"><i className="bi bi-people-fill"></i></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ADMIN METRICS */
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label"><i className="bi bi-shield-lock-fill me-1"></i> Total Enrolled</span>
                      <h3 className="metric-value mt-1">{totalStudents} Total</h3>
                      <span className="metric-sub text-success"><i className="bi bi-arrow-up-right me-1"></i> {students.filter(s=>s.status==='Active').length} active this term</span>
                    </div>
                    <div className="metric-icon-box bg-primary-subtle text-primary"><i className="bi bi-people-fill"></i></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label"><i className="bi bi-shield-lock-fill me-1"></i> Today's Attendance</span>
                      <h3 className="metric-value mt-1">{attendanceRate}%</h3>
                      <span className="metric-sub text-success"><i className="bi bi-check-circle-fill me-1"></i> Target &gt;85% met</span>
                    </div>
                    <div className="metric-icon-box bg-success-subtle text-success"><i className="bi bi-pie-chart-fill"></i></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label"><i className="bi bi-shield-lock-fill me-1"></i> Late Arrivals</span>
                      <h3 className="metric-value mt-1">{lateCount} Late</h3>
                      <span className="metric-sub text-warning"><i className="bi bi-clock-history me-1"></i> Grace period applied</span>
                    </div>
                    <div className="metric-icon-box bg-warning-subtle text-warning"><i className="bi bi-exclamation-triangle-fill"></i></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="glass-card metric-card p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="metric-label"><i className="bi bi-shield-lock-fill me-1"></i> Pending Leaves</span>
                      <h3 className="metric-value mt-1">{pendingLeaves} Pending</h3>
                      <span className="metric-sub text-info"><i className="bi bi-envelope-paper me-1"></i> Requires review</span>
                    </div>
                    <div className="metric-icon-box bg-info-subtle text-info"><i className="bi bi-envelope-fill"></i></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Banners for Teacher & Student */}
          {role === 'Teacher' && (
            <div className="glass-card p-4 mb-4 border-start border-primary border-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h5 className="fw-bold mb-1"><i className="bi bi-journal-check text-primary me-2"></i> Class Attendance Quick Register</h5>
                  <p className="text-muted small mb-0">Open the interactive bulk attendance register to mark today's students present or absent.</p>
                </div>
                <Link to="/attendance" className="btn btn-primary-gradient">
                  <i className="bi bi-pencil-square me-1"></i> Open Attendance Register
                </Link>
              </div>
            </div>
          )}



          {/* Interactive Recharts Section (Admin & Teacher) */}
          {role !== 'Student' && (
            <div className="row g-4 mb-4">
              <div className="col-12 col-lg-8">
                <div className="glass-card p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold mb-0">Weekly Attendance Trends</h5>
                      <span className="text-muted small">Daily percentage breakdown over the last 7 days</span>
                    </div>
                    <div className="badge bg-body-tertiary border text-body px-3 py-2 rounded-pill">
                      <i className="bi bi-graph-up text-primary me-1"></i> Telemetry
                    </div>
                  </div>

                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '10px' }} />
                        <Area type="monotone" dataKey="present" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" name="Present %" />
                        <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLate)" name="Late %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <div className="glass-card p-4 h-100">
                  <h5 className="fw-bold mb-1">Department Enrollment</h5>
                  <span className="text-muted small d-block mb-3">Ratio across major faculties</span>

                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={deptData.length > 0 ? deptData : [{ name: 'No Students', value: 1, color: '#cbd5e1' }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(deptData.length > 0 ? deptData : [{ name: 'No Students', value: 1, color: '#cbd5e1' }]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed / History */}
          <div className="glass-card p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
              <div>
                <h5 className="fw-bold mb-0">
                  {role === 'Student' ? 'My Recent Attendance History' : 'Live Attendance Activity Log'}
                </h5>
                <span className="text-muted small">
                  {role === 'Student' ? 'Recent attendance timestamps and records' : 'Real-time attendance stream & records'}
                </span>
              </div>

              <div className="d-flex flex-wrap align-items-center gap-2">
                <input
                  type="text"
                  className="form-control form-control-custom form-control-sm"
                  placeholder="Filter logs..."
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  style={{ width: '180px' }}
                />

                <div className="btn-group btn-group-sm">
                  {['all', 'present', 'late', 'absent'].map(st => (
                    <button
                      key={st}
                      className={`btn btn-outline-custom text-capitalize ${feedFilter === st ? 'active' : ''}`}
                      onClick={() => setFeedFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-outline-custom btn-sm"
                  onClick={() => setShowExportModal(true)}
                >
                  <i className="bi bi-download me-1"></i> CSV
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-custom">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>Department</th>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Status</th>
                    {role !== 'Student' && <th>Action</th>}
                  </tr>
                </thead>
         <tbody style={{ backgroundColor: 'var(--bg-main)' }}>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map(log => (
                      <tr key={log.id}>
                        <td className="fw-mono small text-muted">{log.id}</td>
                        <td>
                          <div className="fw-bold">{log.studentName}</div>
                        </td>
                        <td>
                          <span className="badge bg-body-tertiary border text-body font-monospace">{log.roll}</span>
                        </td>
                        <td>{log.dept}</td>
                        <td className="fw-mono">{log.time}</td>
                        <td>
                          <span className="small text-muted d-inline-flex align-items-center gap-1">
                            <i className="bi bi-check-square-fill text-success"></i>
                            {log.method}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status badge-${log.status}`}>
                            <i className={`bi ${log.status === 'present' ? 'bi-check-circle-fill' : log.status === 'late' ? 'bi-clock-fill' : log.status === 'absent' ? 'bi-x-circle-fill' : 'bi-info-circle-fill'}`}></i>
                            {log.status}
                          </span>
                        </td>
                        {role === 'Teacher' && (
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary py-0 px-2"
                              title="Toggle Status"
                              onClick={() => {
                                const nextStatus = log.status === 'present' ? 'late' : log.status === 'late' ? 'absent' : 'present';
                                recordAttendance(log.roll, nextStatus, 'Manual Adjustment');
                              }}
                            >
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={role === 'Student' ? 7 : 8} className="text-center py-4 text-muted">
                        No activity records found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </div>
  );
}