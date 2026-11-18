import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

/**
 * Unauthorized page shown when an authenticated user accesses a
 * route their role does not permit. Never silently redirects.
 */
const Unauthorized = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <ShieldX size={64} color="var(--error, #ef4444)" />
      <h1 style={{ fontSize: '3rem', margin: 0 }}>403</h1>
      <h2 style={{ marginBottom: '0.5rem' }}>Access Denied</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.6 }}>
        You do not have permission to view this page. If you believe this is a
        mistake, please contact your administrator.
      </p>
      <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
        Return to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
