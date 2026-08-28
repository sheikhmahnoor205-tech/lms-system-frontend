import React, { createContext, useState, useContext, useEffect } from 'react';
import girlAvatar from './assets/girl.jpg';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('attendflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Automatically initialize user if not logged in
  useEffect(() => {
    if (!currentUser) {
      // Default to dynamic Admin from DB
      fetch('http://localhost:5000/admin-account/profile')
        .then(res => res.json())
        .then(adminData => {
          if (adminData && adminData.name) {
            const userToSet = {
              id: adminData._id,
              name: adminData.name,
              email: adminData.email,
              role: 'Admin',
              department: adminData.department || 'Administration',
              courses: adminData.courses || []
            };
            setCurrentUser(userToSet);
            localStorage.setItem('attendflow_user', JSON.stringify(userToSet));
          }
        })
        .catch(() => {
          // Fallback if backend is starting up
          const fallbackAdmin = {
            id: 'ADM-001',
            name: 'Mahnoor Ahmad',
            email: 'admin@attendflow.edu',
            role: 'Admin',
            department: 'Administration',
            avatar: girlAvatar
          };
          setCurrentUser(fallbackAdmin);
        });
    }
  }, []);

  const login = async (role = 'admin', email = '', password = '') => {
    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'teacher') {
      try {
        if (email && password) {
          const res = await fetch('http://localhost:5000/teacher/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return { success: false, error: errData.message || 'Invalid credentials or database connection failed' };
          }
          const foundTeacher = await res.json();
          const userToSet = {
            id: foundTeacher._id,
            name: foundTeacher.name,
            email: foundTeacher.email,
            role: 'Teacher',
            department: foundTeacher.department,
            designation: foundTeacher.designation || 'Instructor',
            assignedCourses: foundTeacher.assignedCourses || [],
            avatar: foundTeacher.avatar || ''
          };
          setCurrentUser(userToSet);
          localStorage.setItem('attendflow_user', JSON.stringify(userToSet));
          return { success: true, user: userToSet };
        } else {
          // Quick switch / fetch first real teacher from DB
          const tRes = await fetch('http://localhost:5000/teacher');
          if (tRes.ok) {
            const dbTeachers = await tRes.json();
            if (Array.isArray(dbTeachers) && dbTeachers.length > 0) {
              const foundTeacher = dbTeachers[0];
              const userToSet = {
                id: foundTeacher._id,
                name: foundTeacher.name,
                email: foundTeacher.email,
                role: 'Teacher',
                department: foundTeacher.department,
                designation: foundTeacher.designation || 'Instructor',
                assignedCourses: foundTeacher.assignedCourses || [],
                avatar: foundTeacher.avatar || ''
              };
              setCurrentUser(userToSet);
              localStorage.setItem('attendflow_user', JSON.stringify(userToSet));
              return { success: true, user: userToSet };
            }
          }
          return { success: false, error: 'No registered teachers found in database. Please add a teacher from Admin portal first.' };
        }
      } catch (err) {
        console.error(err);
        return { success: false, error: 'Failed to connect to backend server' };
      }
    } else if (normalizedRole === 'student') {
      try {
        if (email && password) {
          const res = await fetch('http://localhost:5000/student/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return { success: false, error: errData.message || 'Invalid student credentials. Access denied.' };
          }

          const candidate = await res.json();
          const userToSet = {
            id: candidate._id || candidate.id,
            name: candidate.name,
            email: candidate.email,
            role: 'Student',
            department: candidate.dept || candidate.department || 'Computer Science',
            roll: candidate.roll,
            grade: candidate.grade || 'Semester 1',
            attendance: candidate.attendance || 0,
            cgpa: candidate.cgpa || 0,
            sgpa: candidate.sgpa || 0,
            midterm: candidate.midterm || 0,
            final: candidate.final || 0,
            sectional: candidate.sectional || 0,
            letterGrade: candidate.letterGrade || 'N/A',
            avatar: candidate.avatar || ''
          };
          setCurrentUser(userToSet);
          localStorage.setItem('attendflow_user', JSON.stringify(userToSet));
          return { success: true, user: userToSet };
        } else {
          // Fetch first real student from database
          const sRes = await fetch('http://localhost:5000/student');
          if (sRes.ok) {
            const dbStudents = await sRes.json();
            if (Array.isArray(dbStudents) && dbStudents.length > 0) {
              const candidate = dbStudents[0];
              const userToSet = {
                id: candidate._id || candidate.id,
                name: candidate.name,
                email: candidate.email,
                role: 'Student',
                department: candidate.dept || candidate.department || 'Computer Science',
                roll: candidate.roll,
                grade: candidate.grade || 'Semester 1',
                attendance: candidate.attendance || 0,
                cgpa: candidate.cgpa || 0,
                sgpa: candidate.sgpa || 0,
                midterm: candidate.midterm || 0,
                final: candidate.final || 0,
                sectional: candidate.sectional || 0,
                letterGrade: candidate.letterGrade || 'N/A',
                avatar: candidate.avatar || ''
              };
              setCurrentUser(userToSet);
              localStorage.setItem('attendflow_user', JSON.stringify(userToSet));
              return { success: true, user: userToSet };
            }
          }
          return { success: false, error: 'No registered students found in database.' };
        }
      } catch (err) {
        console.error('Student backend authentication error:', err);
        return { success: false, error: 'Failed to connect to database server for student authentication' };
      }
    } else {
      // Admin role authentication against backend
      try {
        const res = await fetch('http://localhost:5000/admin-account/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const adminData = await res.json();
          const userToSet = {
            id: adminData._id,
            name: adminData.name,
            email: adminData.email,
            role: 'Admin',
            department: adminData.department || 'Administration',
            avatar: adminData.avatar || girlAvatar,
            courses: adminData.courses || []
          };
          setCurrentUser(userToSet);
          localStorage.setItem('attendflow_user', JSON.stringify(userToSet));
          return { success: true, user: userToSet };
        } else {
          // If login with password failed
          const errData = await res.json().catch(() => ({}));
          return { success: false, error: errData.message || 'Invalid admin credentials' };
        }
      } catch (err) {
        console.error('Admin authentication error:', err);
        // No static fallback – inform the caller that authentication failed.
        return { success: false, error: 'Unable to authenticate admin. Verify that admin credentials exist in the database.' };
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('attendflow_user');
  };

  const switchRole = async (role) => {
    return await login(role);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}