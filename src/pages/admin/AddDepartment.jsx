import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

export default function AddDepartment() {
  const { departments } = useAttendance();
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  // Sidebar state management
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [dbDepartments, setDbDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('https://lms-system-backend-ljz1.onrender.com/department');
        if (res.ok) {
          const data = await res.json();
          setDbDepartments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Could not fetch departments from backend:', err);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartments();
  }, []);
  const [courses, setCourses] = useState([
    { code: '', name: '', semester: '' }
  ]);

  const handleCourseChange = (index, field, value) => {
    setCourses(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addCourseField = () => {
    setCourses(prev => [...prev, { code: '', name: '', semester: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://lms-system-backend-ljz1.onrender.com/department/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deptName,
          code: deptCode,
          description: deptDesc,
          courses: courses.map(c => ({
            code: c.code,
            name: c.name,
            semester: c.semester,
          })),
        }),
      });
      const result = await res.json();
      if (res.ok) {
        alert('Department and courses saved successfully!');
        setDeptName('');
        setDeptCode('');
        setDeptDesc('');
        setCourses([{ code: '', name: '', semester: '' }]);
        // Re-fetch to refresh the table
        const refreshRes = await fetch('https://lms-system-backend-ljz1.onrender.com/department');
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          setDbDepartments(Array.isArray(refreshed) ? refreshed : []);
        }
      } else {
        alert(result.message || 'Failed to save department');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server. Make sure backend is running on port 3000.');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div className="right-side">
        <Navbar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <main className="dashboard-content p-4">
          <h2 className="mb-4">Add New Department</h2>
          <form onSubmit={handleSubmit} className="glass-card p-4" style={{ maxWidth: '600px' }}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Department Name</label>
              <input type="text" className="form-control form-control-custom" value={deptName} onChange={e => setDeptName(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Department Code</label>
              <input type="text" className="form-control form-control-custom" value={deptCode} onChange={e => setDeptCode(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Description (optional)</label>
              <textarea className="form-control form-control-custom" rows={2} value={deptDesc} onChange={e => setDeptDesc(e.target.value)} />
            </div>
            <h4 className="mt-4 mb-3">Courses</h4>
            {courses.map((c, i) => (
              <div key={i} className="row g-3 mb-2">
                <div className="col-4">
                  <input type="text" className="form-control form-control-custom" placeholder="Course Code" value={c.code} onChange={e => handleCourseChange(i, 'code', e.target.value)} required />
                </div>
                <div className="col-5">
                  <input type="text" className="form-control form-control-custom" placeholder="Course Name" value={c.name} onChange={e => handleCourseChange(i, 'name', e.target.value)} required />
                </div>
                <div className="col-3">
                  <input type="text" className="form-control form-control-custom" placeholder="Semester" value={c.semester} onChange={e => handleCourseChange(i, 'semester', e.target.value)} required />
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-outline-custom mb-3" onClick={addCourseField}>+ Add Another Course</button>
            <div className="mt-4">
              <button type="submit" className="btn btn-primary-gradient">Save Department &amp; Courses</button>
            </div>
          </form>

          {/* Already Added Departments + their Courses (from DB) */}
          <div className="mt-5" style={{ maxWidth: '900px' }}>
            <h4 className="mb-3">Already Added Departments &amp; Courses</h4>
            {loadingDepts ? (
              <div className="glass-card p-3 text-center" style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                Loading departments...
              </div>
            ) : dbDepartments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {dbDepartments.map((d, i) => (
                  <div key={d._id || i} className="glass-card p-0" style={{ overflow: 'hidden' }}>
                    {/* Department header row */}
                    <div style={{
                      background: 'rgba(99,102,241,0.12)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        background: 'rgba(99,102,241,0.2)',
                        color: 'var(--accent, #6366f1)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}>{i + 1}</span>
                      <span className="fw-semibold" style={{ fontSize: '1rem' }}>{d.name}</span>
                      <span style={{
                        background: 'rgba(99,102,241,0.15)',
                        color: 'var(--accent, #6366f1)',
                        borderRadius: '6px',
                        padding: '2px 10px',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}>{d.code || '—'}</span>
                      {d.description && (
                        <span style={{ opacity: 0.65, fontSize: '0.85rem' }}>{d.description}</span>
                      )}
                      <span style={{
                        marginLeft: 'auto',
                        background: 'rgba(16,185,129,0.12)',
                        color: '#10b981',
                        borderRadius: '6px',
                        padding: '2px 10px',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}>
                        {d.courses && d.courses.length > 0 ? `${d.courses.length} Course${d.courses.length > 1 ? 's' : ''}` : 'No Courses'}
                      </span>
                    </div>

                    {/* Courses sub-table */}
                    {d.courses && d.courses.length > 0 ? (
                      <table className="table mb-0" style={{ color: 'inherit', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            <th className="px-4 py-2" style={{ opacity: 0.5, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Code</th>
                            <th className="px-4 py-2" style={{ opacity: 0.5, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Name</th>
                            <th className="px-4 py-2" style={{ opacity: 0.5, fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semester</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.courses.map((c, ci) => (
                            <tr key={c._id || ci} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <td className="px-4 py-2">
                                <span style={{
                                  background: 'rgba(99,102,241,0.1)',
                                  color: 'var(--accent, #6366f1)',
                                  borderRadius: '5px',
                                  padding: '1px 8px',
                                  fontWeight: 600,
                                  fontSize: '0.82rem'
                                }}>{c.code}</span>
                              </td>
                              <td className="px-4 py-2">{c.name}</td>
                              <td className="px-4 py-2" style={{ opacity: 0.75 }}>Semester {c.semester}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="px-4 py-3" style={{ opacity: 0.45, fontSize: '0.85rem' }}>
                        No courses linked to this department.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-3 text-center" style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                No departments added yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
