import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Unauthorized from '../pages/Unauthorized';

/**
 * ProtectedRoute — enforces authentication AND role-based access.
 *
 * NOT authenticated  → redirect to /login
 * Authenticated, wrong role → render <Unauthorized /> (403 page, no silent redirect)
 * Authenticated, correct role → render children
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div className="spinner primary"></div>
      </div>
    );
  }

  // Step 1: must be authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Step 2: if the route specifies allowed roles, the user's role must be in that list
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Unauthorized />;
  }

  return children;
};

export default ProtectedRoute;
