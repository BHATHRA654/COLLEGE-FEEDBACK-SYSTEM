import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Pencil, Trash2, Plus, Search, X, Users,
  AlertCircle, CheckCircle, Filter, Mail, Briefcase,
} from 'lucide-react';
import { facultyService }    from '../../services/facultyService';
import { departmentService } from '../../services/departmentService';
import { AuthContext }       from '../../context/AuthContext';
import { extractError }      from '../../utils/errorUtils';
import { Modal, ConfirmDialog, LoadingState, EmptyState, DataTable, ErrorAlert, FormField } from '../../components/CommonUI';
import './Faculty.css';

/* ─── constants ─────────────────────────────────────────────── */
const CAN_MANAGE = ['ADMIN', 'HOD'];
const canManage  = (role) => CAN_MANAGE.includes(role);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Toast ─────────────────────────────────────────────────── */
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div className={`fac-toast fac-toast-${type}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
      <button className="fac-toast-close" onClick={onDismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── Faculty Modal (create / edit) ─────────────────────────── */
function FacultyModal({ isOpen, onClose, onSubmit, initial, departments, isLoading }) {
  const EMPTY = { name: '', email: '', designation: '', departmentId: '' };
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        name:         initial?.name         ?? '',
        email:        initial?.email        ?? '',
        designation:  initial?.designation  ?? '',
        departmentId: initial?.department?.id ? String(initial.department.id) : '',
      });
      setErrors({});
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const isEdit = Boolean(initial?.id);

  const validate = () => {
    const e = {};
    if (!form.name.trim())                    e.name         = 'Name is required.';
    if (!form.email.trim())                   e.email        = 'Email is required.';
    else if (!EMAIL_REGEX.test(form.email))   e.email        = 'Enter a valid email address.';
    if (!form.designation.trim())             e.designation  = 'Designation is required.';
    if (!form.departmentId)                   e.departmentId = 'Department is required.';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSubmit({
      name:        form.name.trim(),
      email:       form.email.trim().toLowerCase(),
      designation: form.designation.trim(),
      department:  { id: Number(form.departmentId) },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Faculty Member' : 'Add Faculty Member'}
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Full Name" id="fac-name" error={errors.name} required>
          <input
            id="fac-name"
            type="text"
            className={`form-input${errors.name ? ' input-error' : ''}`}
            placeholder="e.g. Dr. Anil Kumar"
            value={form.name}
            onChange={handleChange('name')}
            maxLength={150}
            autoFocus
          />
        </FormField>

        <FormField label="Email Address" id="fac-email" error={errors.email} required>
          <input
            id="fac-email"
            type="email"
            className={`form-input${errors.email ? ' input-error' : ''}`}
            placeholder="faculty@college.edu"
            value={form.email}
            onChange={handleChange('email')}
            maxLength={255}
          />
        </FormField>

        <FormField label="Designation" id="fac-designation" error={errors.designation} required>
          <input
            id="fac-designation"
            type="text"
            className={`form-input${errors.designation ? ' input-error' : ''}`}
            placeholder="e.g. Professor, Associate Professor"
            value={form.designation}
            onChange={handleChange('designation')}
            maxLength={100}
          />
        </FormField>

        <FormField label="Department" id="fac-dept" error={errors.departmentId} required>
          <select
            id="fac-dept"
            className={`form-input form-select${errors.departmentId ? ' input-error' : ''}`}
            value={form.departmentId}
            onChange={handleChange('departmentId')}
          >
            <option value="">-- Select Department --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.departmentName}</option>
            ))}
          </select>
        </FormField>

        <div className="fac-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading && <span className="spinner" style={{ width: 14, height: 14 }} />}
            {isEdit ? 'Save Changes' : 'Add Faculty'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Faculty Card (avatar-style table row) ──────────────────── */
function FacultyRow({ f, manage, onEdit, onDelete }) {
  const initials = f.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <tr>
      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{f.id}</td>
      <td>
        <div className="fac-name-cell">
          <div className="fac-avatar">{initials}</div>
          <div>
            <div className="fac-name">{f.name}</div>
            <div className="fac-email-sm">
              <Mail size={12} />
              {f.email}
            </div>
          </div>
        </div>
      </td>
      <td>
        <div className="fac-designation-cell">
          <Briefcase size={14} color="var(--text-muted)" />
          {f.designation}
        </div>
      </td>
      <td>
        {f.department?.departmentName
          ? <span className="badge badge-primary">{f.department.departmentName}</span>
          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </td>
      {manage && (
        <td>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              id={`edit-faculty-${f.id}`}
              className="btn-icon btn-icon-primary"
              onClick={() => onEdit(f)}
              title="Edit faculty member"
              aria-label={`Edit ${f.name}`}
            >
              <Pencil size={15} />
            </button>
            <button
              id={`delete-faculty-${f.id}`}
              className="btn-icon btn-icon-danger"
              onClick={() => onDelete(f)}
              title="Remove faculty member"
              aria-label={`Remove ${f.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
const Faculty = () => {
  const { user } = useContext(AuthContext);
  const manage = canManage(user?.role);

  const [faculty,     setFaculty]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [search,      setSearch]      = useState('');
  const [deptFilter,  setDeptFilter]  = useState(user?.role !== 'ADMIN' && user?.departmentId ? String(user.departmentId) : '');

  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);

  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast    = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);
  const dismissToast = useCallback(() => setToast({ message: '', type: 'success' }), []);

  /* fetch ─────────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fRes, dRes] = await Promise.all([
        facultyService.getAll(),
        departmentService.getAll(),
      ]);
      if (fRes.success) setFaculty(fRes.data ?? []);
      if (dRes.success) setDepartments(dRes.data ?? []);
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.departmentId) {
      setDeptFilter(String(user.departmentId));
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* filter ─────────────────────────────────────────────────────  */
  const filtered = faculty.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      f.designation.toLowerCase().includes(q);
    const matchDept = deptFilter ? String(f.department?.id) === deptFilter : true;
    return matchSearch && matchDept;
  });

  /* modal ─────────────────────────────────────────────────────── */
  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (f) => { setEditTarget(f);   setModalOpen(true); };
  const closeModal = () => { if (!modalLoading) setModalOpen(false); };

  const handleModalSubmit = async (payload) => {
    setModalLoading(true);
    try {
      if (editTarget) {
        // PUT /api/faculty/{id}
        const res = await facultyService.update(editTarget.id, payload);
        if (res.success) {
          showToast('Faculty member updated successfully.');
          setModalOpen(false);
          await fetchAll();
        }
      } else {
        // POST /api/faculty
        const res = await facultyService.create(payload);
        if (res.success) {
          showToast('Faculty member added successfully.');
          setModalOpen(false);
          await fetchAll();
        }
      }
    } catch (err) {
      // Surfaces backend duplicate-email error directly
      showToast(extractError(err), 'error');
    } finally {
      setModalLoading(false);
    }
  };

  /* delete ─────────────────────────────────────────────────────  */
  const openDelete  = (f) => setDeleteTarget(f);
  const closeDelete = () => { if (!deleteLoading) setDeleteTarget(null); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await facultyService.delete(deleteTarget.id);
      if (res.success) {
        showToast(`"${deleteTarget.name}" removed from faculty.`);
        setDeleteTarget(null);
        await fetchAll();
      }
    } catch (err) {
      showToast(extractError(err), 'error');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ─── render ─────────────────────────────────────────────────── */
  const colSpan = manage ? 5 : 4;

  return (
    <div className="animate-fade-in">
      <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />

      {/* Header */}
      <div className="fac-page-header">
        <div className="fac-page-title">
          <Users size={28} color="var(--primary)" />
          <div>
            <h2>Faculty Members</h2>
            <p style={{ fontSize: '0.875rem' }}>
              {isLoading ? '…' : `${faculty.length} member${faculty.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
        </div>
        {manage && (
          <button className="btn btn-primary" onClick={openCreate} id="add-faculty-btn">
            <Plus size={18} />
            Add Faculty
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="filter-toolbar">
        <div className="search-wrapper">
          <span className="search-icon">
            <Search size={18} />
          </span>
          <input
            id="faculty-search"
            type="text"
            className="form-input"
            placeholder="Search by name, email or designation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="fac-clear-btn" onClick={() => setSearch('')} aria-label="Clear search" style={{ position: 'absolute', right: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {user?.role === 'ADMIN' ? (
          <select
            id="faculty-dept-filter"
            className="form-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.departmentName}</option>
            ))}
          </select>
        ) : (
          user?.departmentName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.4)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', height: '42px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Department:</span>
              <span className="badge badge-primary" style={{ margin: 0 }}>{user.departmentName}</span>
            </div>
          )
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading faculty members..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || deptFilter ? 'No matching faculty' : 'No faculty members yet'}
          description={
            search || deptFilter
              ? 'Try adjusting your search or department filter.'
              : manage
              ? 'Add the first faculty member to get started.'
              : 'No faculty members have been added yet.'
          }
          action={
            !search && !deptFilter && manage ? (
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={18} /> Add First Faculty Member
              </button>
            ) : null
          }
        />
      ) : (
        <DataTable headers={['#', 'Faculty Member', 'Designation', 'Department', manage && 'Actions']}>
          {filtered.map((f) => (
            <FacultyRow
              key={f.id}
              f={f}
              manage={manage}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </DataTable>
      )}

      <FacultyModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        initial={editTarget}
        departments={departments}
        isLoading={modalLoading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={closeDelete}
        onConfirm={handleDeleteConfirm}
        title="Remove Faculty Member"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? This action cannot be undone.`}
        isLoading={deleteLoading}
        confirmLabel="Remove"
      />
    </div>
  );
};

export default Faculty;
