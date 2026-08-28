import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AttendanceContext = createContext();

// Backend APIs (MongoDB)
const STUDENT_API = 'http://localhost:5000/student';
const DEPARTMENT_API = 'http://localhost:5000/department';
const TEACHER_API = 'http://localhost:5000/teacher';
const ASSIGN_API = 'http://localhost:5000/assigncourse';
const SCHEDULE_API = 'http://localhost:5000/schedule';
const ATTENDANCE_API = 'http://localhost:5000/attendance';
const LEAVE_API = 'http://localhost:5000/leave';
const SETTING_API = 'http://localhost:5000/setting';
const NOTIFICATION_API = 'http://localhost:5000/notification';

export const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2364748b" style="background:%23e2e8f0;border-radius:50%25"><circle cx="50" cy="36" r="22"/><path d="M 15 90 C 15 62, 32 54, 50 54 C 68 54, 85 62, 85 90 Z"/></svg>`;

export const BLANK_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2394a3b8" style="background:%23f1f5f9;border-radius:50%25"><circle cx="50" cy="38" r="20"/><path d="M 18 88 C 18 64, 34 56, 50 56 C 66 56, 82 64, 82 88 Z"/></svg>`;

export const INITIAL_COURSES = [];
export const INITIAL_DEPARTMENTS = [];
export const INITIAL_TEACHERS = [];

export function AttendanceProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [settings, setSettingsState] = useState({
    instituteName: 'TechVision Institute of Technology',
    academicYear: '2025-2026',
    workingHoursStart: '08:30',
    workingHoursEnd: '17:00',
    lateGraceMinutes: 15,
    emailAlertsDefaulters: true,
    defaulterThresholdPercent: 75
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('attendflow_theme') || 'light';
  });

  const [notifications, setNotifications] = useState([]);

  // Fetch Students from MongoDB
  const fetchStudents = async () => {
    try {
      const res = await axios.get(STUDENT_API);
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map(s => {
          const midterm = Number(s.midterm) || 0;
          const final = Number(s.final) || 0;
          const sectional = Number(s.sectional) || 0;
          const totalMarks = s.totalMarks !== undefined && s.totalMarks !== null ? Number(s.totalMarks) : (midterm + final + sectional);
          const gpa = Number(s.gpa) || 0;
          const sgpa = Number(s.sgpa) || gpa;
          const cgpa = Number(s.cgpa) || gpa;

          return {
            ...s,
            subjects: s.subjects || [],
            id: s._id || s.id || `STU-${s.roll}`,
            midterm,
            final,
            sectional,
            totalMarks,
            percentage: s.percentage !== undefined ? Number(s.percentage) : totalMarks,
            creditHours: Number(s.creditHours) || 3,
            gpa,
            sgpa,
            cgpa,
            letterGrade: s.letterGrade || (totalMarks > 0 ? (totalMarks >= 50 ? 'Pass' : 'F') : 'N/A'),
            performanceStatus: s.performanceStatus || (totalMarks > 0 ? (totalMarks >= 80 ? 'Outstanding' : totalMarks >= 65 ? 'Satisfactory' : 'Needs Focus') : 'Not Evaluated'),
            academicStanding: s.academicStanding || (cgpa >= 3.5 ? "Dean's Honor Roll" : cgpa >= 2.0 ? 'Good Standing' : (totalMarks > 0 ? 'Under Evaluation' : 'Not Evaluated'))
          };
        });
        setStudents(mapped);
      }
    } catch (err) {
      console.log('Error fetching students from database:', err);
    }
  };

  // Fetch Departments and dynamic Courses from MongoDB
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(DEPARTMENT_API);
      if (res.data && Array.isArray(res.data)) {
        setDepartments(res.data);

        // Flatten courses from departments
        const allCourses = [];
        res.data.forEach(d => {
          if (Array.isArray(d.courses)) {
            d.courses.forEach(c => {
              allCourses.push({
                ...c,
                id: c._id || c.code,
                departmentId: d._id,
                departmentName: d.name,
                departmentCode: d.code
              });
            });
          }
        });
        setCourses(allCourses);
      }
    } catch (err) {
      console.log('Error fetching departments from database:', err);
    }
  };

  // Fetch Teachers from MongoDB
  const fetchTeachers = async () => {
    try {
      const res = await axios.get(TEACHER_API);
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map(t => ({
          ...t,
          id: t._id || t.id
        }));
        setTeachers(mapped);
      }
    } catch (err) {
      console.log('Error fetching teachers from database:', err);
    }
  };

  // Fetch Schedule from MongoDB
  const fetchSchedule = async () => {
    try {
      const res = await axios.get(SCHEDULE_API);
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map(s => ({ ...s, id: s._id || s.id }));
        setSchedule(mapped);
      }
    } catch (err) {
      console.log('Error fetching schedule from database:', err);
    }
  };

  // Fetch Attendance Records from MongoDB
  const fetchAttendance = async () => {
    try {
      const res = await axios.get(ATTENDANCE_API);
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map(l => ({
          ...l,
          id: l._id || l.id,
          studentName: l.name || 'Student',
          method: l.markedBy || 'Teacher Manual'
        }));
        setLogs(mapped);
      }
    } catch (err) {
      console.log('Error fetching attendance records from database:', err);
    }
  };

  // Fetch Leaves from MongoDB
  const fetchLeaves = async () => {
    try {
      const res = await axios.get(LEAVE_API);
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map(l => ({
          ...l,
          id: l._id || l.id
        }));
        setLeaves(mapped);
      }
    } catch (err) {
      console.log('Error fetching leaves from database:', err);
    }
  };

  // Fetch System Settings from MongoDB
  const fetchSettings = async () => {
    try {
      const res = await axios.get(SETTING_API);
      if (res.data && res.data.instituteName) {
        setSettingsState(res.data);
      }
    } catch (err) {
      console.log('Error fetching settings from database:', err);
    }
  };

  // Fetch Live Notifications from MongoDB
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(NOTIFICATION_API);
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map(n => ({
          ...n,
          id: n._id || n.id
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.log('Error fetching notifications from database:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
    fetchTeachers();
    fetchSchedule();
    fetchAttendance();
    fetchLeaves();
    fetchSettings();
    fetchNotifications();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('attendflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Student CRUD
  const addStudent = async (newStudent) => {
    const newId = `STU-${Math.floor(100 + Math.random() * 900)}`;
    const payload = {
      id: newId,
      _id: newId,
      ...newStudent,
      attendance: 100,
      status: 'Active',
      avatar: newStudent.avatar || DEFAULT_AVATAR,
      midterm: 0,
      final: 0,
      sectional: 0,
      creditHours: 3,
      gpa: 0,
      sgpa: 0,
      cgpa: 0,
      letterGrade: 'N/A'
    };

    try {
      const { _id, id, ...backendPayload } = payload;
      await axios.post(`${STUDENT_API}/store`, backendPayload);
      
      // Also post notification to MongoDB
      await axios.post(`${NOTIFICATION_API}/store`, {
        roles: ['Admin', 'Teacher'],
        title: 'New Student Enrolled',
        msg: `${newStudent.name} enrolled in ${newStudent.dept}.`,
        type: 'info',
        link: '/admin/student'
      });

      await fetchStudents();
      await fetchNotifications();
    } catch (err) {
      console.log('Error adding student to DB:', err);
      setStudents(prev => [payload, ...prev]);
    }
  };

  const updateStudent = async (id, updatedData) => {
    const { _id, id: itemId, ...cleanData } = updatedData;
    const payload = {
      ...cleanData,
      avatar: updatedData.avatar || DEFAULT_AVATAR
    };
    
    const targetId = id || updatedData._id || updatedData.id || updatedData.roll;

    try {
      await axios.post(`${STUDENT_API}/update/${targetId}`, payload);
      await fetchStudents();
    } catch (err) {
      console.log('Error updating student in DB:', err);
      setStudents(prev => prev.map(s => (s.id === targetId || s._id === targetId || s.roll === updatedData.roll) ? { ...s, ...payload } : s));
    }
  };

  const deleteStudent = async (id) => {
    try {
      await axios.get(`${STUDENT_API}/deletedata/${id}`);
      await fetchStudents();
    } catch (err) {
      console.log('Error deleting student from DB:', err);
      setStudents(prev => prev.filter(s => s.id !== id && s._id !== id));
    }
  };

  // Attendance CRUD
  const recordAttendance = async (rollOrId, status, method = 'Teacher Manual', date = null, subject = '') => {
    const s = students.find(st => st.roll === rollOrId || st.id === rollOrId || st._id === rollOrId);
    if (!s) return false;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date || now.toISOString().split('T')[0];

    try {
      await axios.post(`${ATTENDANCE_API}/store`, {
        studentId: s._id || s.id,
        roll: s.roll,
        name: s.name,
        dept: s.dept,
        date: dateStr,
        subject,
        status,
        time: status === 'absent' ? '--:--' : timeStr,
        markedBy: method
      });
      await fetchAttendance();
      await fetchStudents();
    } catch (err) {
      console.error('Error saving attendance to backend:', err);
    }
    return true;
  };

  const markBatchAttendance = async (records, date, subject = '', markedBy = 'Teacher Manual') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date || now.toISOString().split('T')[0];

    const payload = records.map(r => {
      const s = students.find(st => st.id === r.studentId || st._id === r.studentId || st.roll === r.studentId);
      if (!s) return null;
      return {
        studentId: s._id || s.id,
        roll: s.roll,
        name: s.name,
        dept: s.dept,
        status: r.status
      };
    }).filter(Boolean);

    if (payload.length === 0) return { saved: [], errors: [] };

    try {
      const res = await axios.post(`${ATTENDANCE_API}/batch`, {
        records: payload,
        date: dateStr,
        subject,
        time: timeStr,
        markedBy
      });
      await fetchAttendance();
      await fetchStudents();
      return res.data;
    } catch (err) {
      console.error('Error saving batch attendance to backend:', err);
      return { saved: [], errors: [{ error: err.message }] };
    }
  };

  const fetchAttendanceLogs = async (studentId) => {
    if (!studentId) return [];
    try {
      const res = await axios.get(`${ATTENDANCE_API}/student/${studentId}`);
      return res.data.logs || [];
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
      return [];
    }
  };

  const updateStudentMarks = async (roll, midterm, final, sectional, creditHours = 3, subjectCode = null, fullSubjects = null) => {
    const s = students.find(item => item.roll === roll || item.id === roll || item._id === roll);
    if (!s) return;

    const targetId = s._id || s.id || s.roll;
    let payload;
    if (fullSubjects && Array.isArray(fullSubjects)) {
      payload = { subjects: fullSubjects };
    } else if (subjectCode) {
      payload = {
        code: subjectCode,
        midterm: Number(midterm) || 0,
        final: Number(final) || 0,
        sectional: Number(sectional) || 0,
        creditHours: Number(creditHours) || 3
      };
    } else {
      payload = {
        midterm: Number(midterm) || 0,
        final: Number(final) || 0,
        sectional: Number(sectional) || 0,
        creditHours: Number(creditHours) || 3
      };
    }

    try {
      await axios.post(`${STUDENT_API}/update-marks/${targetId}`, payload);
      await fetchStudents();
    } catch (err) {
      console.log('Error updating marks via API, falling back to updateStudent:', err);
      await updateStudent(targetId, payload);
    }
  };

  // Schedule CRUD
  const addScheduleSlot = async (slot) => {
    try {
      await axios.post(`${SCHEDULE_API}/store`, slot);
      await fetchSchedule();
    } catch (err) {
      console.log('Error adding schedule slot:', err);
      setSchedule(prev => [...prev, { ...slot, id: Date.now() }]);
    }
  };

  const deleteScheduleSlot = async (slotId) => {
    try {
      await axios.get(`${SCHEDULE_API}/deletedata/${slotId}`);
      await fetchSchedule();
    } catch (err) {
      console.log('Error deleting schedule slot:', err);
      setSchedule(prev => prev.filter(item => item.id !== slotId && item._id !== slotId));
    }
  };

  // Leave CRUD (Real MongoDB)
  const applyLeave = async (leaveData) => {
    try {
      const res = await axios.post(`${LEAVE_API}/store`, leaveData);
      
      // Save notification to MongoDB
      const recipientRoles = leaveData.applicantRole === 'Teacher' ? ['Admin'] : ['Teacher', 'Admin'];
      await axios.post(`${NOTIFICATION_API}/store`, {
        roles: recipientRoles,
        title: leaveData.applicantRole === 'Teacher' ? 'Teacher Leave Application' : 'New Student Leave Request',
        msg: `${leaveData.studentName} applied for ${leaveData.type} Leave.`,
        type: 'warning',
        link: '/admin/leaves'
      });

      await fetchLeaves();
      await fetchNotifications();
      return res.data;
    } catch (err) {
      console.log('Error applying leave to DB:', err);
      const created = {
        ...leaveData,
        id: `LV-${Math.floor(100 + Math.random() * 900)}`,
        status: 'Pending',
        appliedOn: new Date().toISOString().split('T')[0]
      };
      setLeaves(prev => [created, ...prev]);
    }
  };

  const updateLeaveStatus = async (id, newStatus) => {
    try {
      await axios.post(`${LEAVE_API}/update-status/${id}`, { status: newStatus });
      await fetchLeaves();
    } catch (err) {
      console.log('Error updating leave status in DB:', err);
      setLeaves(prev => prev.map(l => (l.id === id || l._id === id) ? { ...l, status: newStatus } : l));
    }
  };

  // Settings CRUD (Real MongoDB)
  const updateSettings = async (newSettings) => {
    try {
      const res = await axios.post(`${SETTING_API}/update`, newSettings);
      setSettingsState(res.data);
    } catch (err) {
      console.log('Error updating settings in DB:', err);
      setSettingsState(newSettings);
    }
  };

  // Notifications CRUD (Real MongoDB)
  const markAllNotificationsRead = async () => {
    try {
      await axios.post(`${NOTIFICATION_API}/mark-all-read`);
      await fetchNotifications();
    } catch (err) {
      console.log('Error marking notifications read in DB:', err);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // Department CRUD
  const addDepartment = async (deptObj, courseArray = []) => {
    const payload = {
      name: deptObj.name,
      code: deptObj.code,
      description: deptObj.description || '',
      courses: courseArray.map(c => ({
        code: c.code,
        name: c.name,
        semester: c.semester || '1'
      }))
    };
    try {
      await axios.post(`${DEPARTMENT_API}/store`, payload);
      await fetchDepartments();
    } catch (err) {
      console.log('Error adding department to DB:', err);
      setDepartments(prev => [...prev, deptObj]);
    }
  };

  const addCourse = (courseObj) => setCourses(prev => [...prev, courseObj]);

  // Teacher CRUD
  const addTeacher = async (teacherObj) => {
    try {
      await axios.post(`${TEACHER_API}/store`, teacherObj);
      await fetchTeachers();
    } catch (err) {
      console.log('Error adding teacher to DB:', err);
      const newId = `TEA-${Math.floor(100 + Math.random() * 900)}`;
      setTeachers(prev => [...prev, { id: newId, ...teacherObj }]);
    }
  };

  const updateTeacher = async (id, updatedData) => {
    const { _id, id: itemId, ...cleanData } = updatedData;
    const targetId = id || updatedData._id || updatedData.id || updatedData.email;
    try {
      await axios.post(`${TEACHER_API}/update/${targetId}`, cleanData);
      await fetchTeachers();
    } catch (err) {
      console.log('Error updating teacher in database:', err);
    }
  };

  const deleteTeacher = async (id) => {
    try {
      await axios.get(`${TEACHER_API}/deletedata/${id}`);
      await fetchTeachers();
    } catch (err) {
      console.log('Error deleting teacher from database:', err);
    }
  };

  return (
    <AttendanceContext.Provider value={{
      students,
      departments,
      courses,
      teachers,
      logs,
      leaves,
      schedule,
      settings,
      theme,
      notifications,
      toggleTheme,
      addStudent,
      updateStudent,
      deleteStudent,
      recordAttendance,
      markBatchAttendance,
      fetchAttendanceLogs,
      updateStudentMarks,
      addScheduleSlot,
      deleteScheduleSlot,
      applyLeave,
      updateLeaveStatus,
      setSettings: updateSettings,
      markAllNotificationsRead,
      fetchStudents,
      fetchDepartments,
      fetchTeachers,
      fetchSchedule,
      fetchAttendance,
      fetchLeaves,
      fetchSettings,
      fetchNotifications,
      addDepartment,
      addCourse,
      addTeacher,
      updateTeacher,
      deleteTeacher
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  return useContext(AttendanceContext);
}