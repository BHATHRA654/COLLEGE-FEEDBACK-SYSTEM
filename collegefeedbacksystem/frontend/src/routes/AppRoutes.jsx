import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Layout
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

// Pages
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import Dashboard from '../pages/Dashboard/Dashboard';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackList from '../components/FeedbackList';
import Departments from '../pages/Departments/Departments';
import Courses from '../pages/Courses/Courses';
import Faculty from '../pages/Faculty/Faculty';
import Students from '../pages/Students/Students';
import Reports from '../pages/Reports/Reports';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * All route-level role enforcement is defined inline here,
 * mirroring the centralized routeConfig.js definitions exactly.
 *
 * Two-layer protection:
 *  1. ProtectedRoute checks authentication and role.
 *  2. Sidebar items are filtered by the same role lists (routeConfig.js).
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Dashboard — all authenticated roles incl. GUEST */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HOD', 'FACULTY', 'STUDENT', 'GUEST']}>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Submit Feedback — STUDENT only */}
      <Route
        path="/feedback/submit"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AppLayout><FeedbackForm /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* My Feedback — STUDENT sees their own submissions */}
      <Route
        path="/feedback/list"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AppLayout><FeedbackList /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* All Feedback — admin/HOD/faculty oversight */}
      <Route
        path="/feedback/all"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HOD', 'FACULTY']}>
            <AppLayout><FeedbackList /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Courses — browsing/management by authenticated non-guest roles */}
      <Route
        path="/courses"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HOD', 'FACULTY', 'STUDENT']}>
            <AppLayout><Courses /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Faculty — browsing for students; management for admin/HOD/faculty */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HOD', 'FACULTY', 'STUDENT']}>
            <AppLayout><Faculty /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Students — admin management only; STUDENT role explicitly excluded */}
      <Route
        path="/students"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HOD']}>
            <AppLayout><Students /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Departments — admin only */}
      <Route
        path="/departments"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppLayout><Departments /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Reports — admin, HOD, faculty */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HOD', 'FACULTY']}>
            <AppLayout><Reports /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

