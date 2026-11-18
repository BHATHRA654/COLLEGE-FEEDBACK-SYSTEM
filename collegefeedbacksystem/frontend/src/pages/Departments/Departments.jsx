import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Pencil, Trash2, Plus, Search, X, Building2 } from 'lucide-react';
import { departmentService } from '../../services/departmentService';
import { AuthContext } from '../../context/AuthContext';
import { Modal, ConfirmDialog, LoadingState, EmptyState, DataTable, ErrorAlert, FormField } from '../../components/CommonUI';
import { validators } from '../../utils/validators';
import { extractError } from '../../utils/errorUtils';
import './Departments.css';

const CAN_MANAGE = ['ADMIN', 'HOD'];
function canManage(role) {
  return CAN_MANAGE.includes(role);
}

const Departments = () => {
  const { user } = useContext(AuthContext);
  const manage = canManage(user?.role);

  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [search, setSearch]           = useState('');

  // Modal
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [formName, setFormName]         = useState('');
  const [validationErr, setValidationErr] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Errors / Success Messages
  const [errorMsg, setErrorMsg]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearNotifications = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await departmentService.getAll();
      if (res.success) setDepartments(res.data ?? []);
    } catch (err) {
      setErrorMsg(extractError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const filtered = departments.filter((d) =>
    d.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    clearNotifications();
    setEditTarget(null);
    setFormName('');
    setValidationErr('');
    setModalOpen(true);
  };

  const openEdit = (dept) => {
    clearNotifications();
    setEditTarget(dept);
    setFormName(dept.departmentName);
    setValidationErr('');
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    clearNotifications();

    const payload = { departmentName: formName.trim() };
    const check = validators.department(payload);

    if (!check.isValid) {
      setValidationErr(check.errors.departmentName);
      return;
    }

    setModalLoading(true);
    try {
      let res;
      if (editTarget) {
        res = await departmentService.update(editTarget.id, payload);
      } else {
        res = await departmentService.create(payload);
      }

      if (res.success) {
        setSuccessMsg(editTarget ? 'Department updated successfully.' : 'Department created successfully.');
        setModalOpen(false);
        await fetchDepartments();
      }
    } catch (err) {
      setErrorMsg(extractError(err));
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    clearNotifications();
    setDeleteLoading(true);
    try {
      const res = await departmentService.delete(deleteTarget.id);
      if (res.success) {
        setSuccessMsg(`"${deleteTarget.departmentName}" deleted.`);
        setDeleteTarget(null);
        await fetchDepartments();
      }
    } catch (err) {
      setErrorMsg(extractError(err));
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Notifications */}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      <ErrorAlert error={errorMsg} onDismiss={() => setErrorMsg('')} />

      {/* Header */}
      <div className="dept-page-header">
        <div className="dept-page-title">
          <Building2 size={28} color="var(--primary)" />
          <div>
            <h2>Departments</h2>
            <p style={{ fontSize: '0.875rem' }}>
              {isLoading ? '…' : `${departments.length} department${departments.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
        </div>
        {manage && (
          <button className="btn btn-primary" onClick={openCreate} id="add-department-btn">
            <Plus size={18} />
            Add Department
          </button>
        )}
      </div>

      {/* Search area */}
      <div className="filter-toolbar">
        <div className="search-wrapper">
          <span className="search-icon">
            <Search size={18} />
          </span>
          <input
            id="department-search"
            type="text"
            className="form-input"
            placeholder="Search departments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="dept-search-clear" onClick={() => setSearch('')} aria-label="Clear search" style={{ position: 'absolute', right: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Layout states */}
      {isLoading ? (
        <LoadingState message="Loading college departments..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? 'No matching departments' : 'No departments yet'}
          description={
            search
              ? `No departments match "${search}".`
              : manage
              ? 'Get started by creating the first department.'
              : 'No departments enrolled yet.'
          }
          action={
            !search && manage ? (
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} /> Add First Department
              </button>
            ) : null
          }
        />
      ) : (
        <DataTable headers={['#', 'Department Name', manage && 'Actions']}>
          {filtered.map((dept) => (
            <tr key={dept.id}>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dept.id}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={16} color="var(--primary)" />
                  <strong>{dept.departmentName}</strong>
                </div>
              </td>
              {manage && (
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      id={`edit-dept-${dept.id}`}
                      className="btn-icon btn-icon-primary"
                      onClick={() => openEdit(dept)}
                      title="Edit department"
                      aria-label={`Edit ${dept.departmentName}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      id={`delete-dept-${dept.id}`}
                      className="btn-icon btn-icon-danger"
                      onClick={() => setDeleteTarget(dept)}
                      title="Delete department"
                      aria-label={`Delete ${dept.departmentName}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </DataTable>
      )}

      {/* Modal form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Department' : 'Add Department'}
        isLoading={modalLoading}
      >
        <form onSubmit={handleModalSubmit} noValidate>
          <FormField label="Department Name" id="dept-name-input" error={validationErr} required>
            <input
              id="dept-name-input"
              type="text"
              className={`form-input${validationErr ? ' input-error' : ''}`}
              placeholder="e.g. Computer Science"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                setValidationErr('');
              }}
              autoFocus
              maxLength={150}
            />
          </FormField>
          <div className="dept-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={modalLoading}>
              {modalLoading && <span className="spinner" style={{ width: 14, height: 14 }} />}
              {editTarget ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteTarget?.departmentName}"? This action cannot be undone.`}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Departments;
