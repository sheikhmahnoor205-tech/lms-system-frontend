import { StrictMode } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import AddDepartment from './pages/admin/AddDepartment.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import AddTeacher from './pages/admin/AddTeacher.jsx';
import AssignCourse from './pages/admin/AssignCourse.jsx';
import Dashboard from './Dashboard';
import AttendanceMarking from './pages/AttendanceMarking';
import Student from './pages/Student';
import LeaveManagement from './pages/LeaveManagement';
import Schedule from './pages/Schedule';
import Marks from './pages/Marks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './style.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/attendance',
    element: (
      <ProtectedRoute>
        <AttendanceMarking />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/student',
    element: (
      <ProtectedRoute>
        <Student />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/leaves',
    element: (
      <ProtectedRoute>
        <LeaveManagement />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/schedule',
    element: (
      <ProtectedRoute>
        <Schedule />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/marks',
    element: (
      <ProtectedRoute>
        <Marks />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/add-department',
    element: (
      <ProtectedRoute>
        <AddDepartment />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/add-teacher',
    element: (
      <ProtectedRoute>
        <AddTeacher />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/assign-course',
    element: (
      <ProtectedRoute>
        <AssignCourse />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/reports',
    element: (
      <ProtectedRoute>
        <Reports />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/setting',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    )
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: '/reset-password/:token',
    element: <ResetPassword />
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AttendanceProvider>
        <RouterProvider router={router} />
      </AttendanceProvider>
    </AuthProvider>
  </StrictMode>
);