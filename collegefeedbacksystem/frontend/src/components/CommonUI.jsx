import React from 'react';
import { X } from 'lucide-react';
import './CommonUI.css';

export const Modal = ({ isOpen, onClose, title, children, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="com-modal-overlay" onClick={isLoading ? undefined : onClose}>
      <div className="com-modal glass animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="com-modal-header">
          <h3>{title}</h3>
          <button className="com-modal-close" onClick={onClose} disabled={isLoading} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="com-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, isLoading, confirmLabel = 'Delete', confirmVariant = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} isLoading={isLoading}>
      <div className="com-confirm-dialog">
        <p className="com-confirm-message">{message}</p>
        <div className="com-confirm-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button 
            className={`btn btn-${confirmVariant}`} 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading && <span className="spinner" style={{ width: 14, height: 14 }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const LoadingState = ({ message = 'Loading details...' }) => (
  <div className="com-loading-state">
    <div className="spinner primary" style={{ width: 36, height: 36, borderWidth: 3 }} />
    <p>{message}</p>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="com-empty-state glass-card">
    {Icon && <Icon size={44} color="var(--text-muted)" />}
    <h3>{title}</h3>
    <p>{description}</p>
    {action && (
      <div className="com-empty-action">
        {action}
      </div>
    )}
  </div>
);

export const ErrorAlert = ({ error, onDismiss }) => {
  if (!error) return null;
  return (
    <div className="alert alert-error auth-alert animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <X size={16} style={{ cursor: 'pointer' }} onClick={onDismiss} />
        <span>{error}</span>
      </div>
    </div>
  );
};

export const FormField = ({ label, id, error, required, children }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>
      {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
    </label>
    {children}
    {error && <p className="input-error-msg" style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error}</p>}
  </div>
);

export const DataTable = ({ headers, children }) => (
  <div className="table-container">
    <table>
      <thead>
        <tr>
          {headers.filter(Boolean).map((header, idx) => (
            <th key={idx}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  </div>
);

