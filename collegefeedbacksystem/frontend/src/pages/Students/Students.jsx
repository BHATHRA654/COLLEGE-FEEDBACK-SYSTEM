import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Pencil, Trash2, Plus, Search, X, GraduationCap,
  AlertCircle, CheckCircle, Filter, Mail, Hash,
} from 'lucide-react';
import { studentService }    from '../../services/studentService';
import { departmentService } from '../../services/departmentService';
import { AuthContext }       from '../../context/AuthContext';
import { extractError }      from '../../utils/errorUtils';
import { Modal, ConfirmDialog, LoadingState, EmptyState, DataTable, ErrorAlert, FormField } from '../../components/CommonUI';
import './Students.css';

/* ─── constants ─────────────────────────────────────────────── */
// Only ADMIN and HOD reach this page (protected at route level too)
const CAN_MANAGE = ['ADMIN', 'HOD'];
const canManage  = (role) => CAN_MANAGE.includes(role);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const YEAR_OPTIONS = [1, 2, 3, 4, 5];

/* ─── Toast ─────────────────────────────────────────────────── */
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div className={`stu-toast stu-toast-${type}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
      <button className="stu-toast-close" onClick={onDismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── Student Modal ──────────────────────────────────────────── */
function StudentModal({ isOpen, onClose, onSubmit, initial, departments, existingStudents, isLoading }) {
  const EMPTY = { name: '', email: '', registerNumber: '', year: '', departmentId: '' };
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        name:           initial?.name           ?? '',
        email:          initial?.email          ?? '',
        registerNumber: initial?.registerNumber ?? '',
        year:           initial?.year           ? String(initial.year) : '',
        departmentId:   initial?.department?.id ? String(initial.department.id) : '',
      });
      setErrors({});
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const isEdit     = Boolean(initial?.id);
  const editId     = initial?.id;

  const validate = () => {
    const e = {};
    if (!form.name.trim())                    e.name           = 'Name is required.';
    if (!form.email.trim())                   e.email          = 'Email is required.';
    else if (!EMAIL_REGEX.test(form.email))   e.email          = 'Enter a valid email address.';
    else {
      const emailLower = form.email.trim().toLowerCase();
      const dup = existingStudents.find(
        (s) => s.email?.toLowerCase() === emailLower && s.id !== editId
      );
      if (dup) e.email = `Email is already used by student "${dup.name}".`;
    }
    if (!form.registerNumber.trim()) {
      e.registerNumber = 'Register number is required.';
    } else {
      const regNo = form.registerNumber.trim().toUpperCase();
      const dupReg = existingStudents.find(
        (s) => s.registerNumber?.toUpperCase() === regNo && s.id !== editId
      );
      if (dupReg) e.registerNumber = `Register number is already assigned to "${dupReg.name}".`;
    }
    if (!form.year)         e.year         = 'Academic year is required.';
    if (!form.departmentId) e.departmentId = 'Department is required.';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      name:           form.name.trim(),
      email:          form.email.trim().toLowerCase(),
      registerNumber: form.registerNumber.trim(),
      year:           Number(form.year),
      department:     { id: Number(form.departmentId) },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Student' : 'Add Student'}
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Full Name" id="stu-name" error={errors.name} required>
          <input id="stu-name" type="text"
            className={`form-input${errors.name ? ' input-error' : ''}`}
            placeholder="e.g. Rahul Sharma"
            value={form.name} onChange={handleChange('name')} maxLength={150} autoFocus />
        </FormField>

        <FormField label="Email Address" id="stu-email" error={errors.email} required>
          <input id="stu-email" type="email"
            className={`form-input${errors.email ? ' input-error' : ''}`}
            placeholder="student@college.edu"
            value={form.email} onChange={handleChange('email')} maxLength={255} />
        </FormField>

        <FormField label="Register Number" id="stu-regno" error={errors.registerNumber} required>
          <input id="stu-regno" type="text"
            className={`form-input${errors.registerNumber ? ' input-error' : ''}`}
            placeholder="e.g. 20CS001"
            value={form.registerNumber} onChange={handleChange('registerNumber')} maxLength={50} />
        </FormField>

        <div className="stu-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Academic Year" id="stu-year" error={errors.year} required>
            <select id="stu-year"
              className={`form-input form-select${errors.year ? ' input-error' : ''}`}
              value={form.year} onChange={handleChange('year')}>
              <option value="">-- Select Year --</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Department" id="stu-dept" error={errors.departmentId} required>
            <select id="stu-dept"
              className={`form-input form-select${errors.departmentId ? ' input-error' : ''}`}
              value={form.departmentId} onChange={handleChange('departmentId')}>
              <option value="">-- Select Dept --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.departmentName}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="stu-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading && <span className="spinner" style={{ width: 14, height: 14 }} />}
            {isEdit ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Year badge colours ─────────────────────────────────────── */
const YEAR_CLASS = ['', 'badge-primary', 'badge-success', 'badge-warning', 'badge-danger', 'badge-primary'];

/* ─── Main Page ─────────────────────────────────────────────── */
const Students = () => {
  const { user } = useContext(AuthContext);
  const manage = canManage(user?.role);

  const [students,    setStudents]    = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [search,      setSearch]      = useState('');
  const [deptFilter,  setDeptFilter]  = useState(user?.role !== 'ADMIN' && user?.departmentId ? String(user.departmentId) : '');
  const [yearFilter,  setYearFilter]  = useState('');

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
      const [sRes, dRes] = await Promise.all([
        studentService.getAll(),
        departmentService.getAll(),
      ]);
      if (sRes.success) setStudents(sRes.data ?? []);
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

  /* filter ─────────────────────────────────────────────────────── */
  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.registerNumber.toLowerCase().includes(q);
    const matchDept = deptFilter ? String(s.department?.id) === deptFilter : true;
    const matchYear = yearFilter ? String(s.year) === yearFilter : true;
    return matchSearch && matchDept && matchYear;
  });

  /* modal ─────────────────────────────────────────────────────── */
  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (s) => { setEditTarget(s);   setModalOpen(true); };
  const closeModal = () => { if (!modalLoading) setModalOpen(false); };

  const handleModalSubmit = async (payload) => {
    setModalLoading(true);
    try {
      if (editTarget) {
        const res = await studentService.update(editTarget.id, payload);
        if (res.success) { showToast('Student updated successfully.'); setModalOpen(false); await fetchAll(); }
      } else {
        const res = await studentService.create(payload);
        if (res.success) { showToast('Student added successfully.'); setModalOpen(false); await fetchAll(); }
      }
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setModalLoading(false);
    }
  };

  /* delete ─────────────────────────────────────────────────────── */
  const openDelete  = (s) => setDeleteTarget(s);
  const closeDelete = () => { if (!deleteLoading) setDeleteTarget(null); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await studentService.delete(deleteTarget.id);
      if (res.success) {
        showToast(`"${deleteTarget.name}" removed.`);
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

  /* render ────────────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in">
      <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />

      {/* Header */}
      <div className="stu-page-header">
        <div className="stu-page-title">
          <GraduationCap size={28} color="var(--primary)" />
          <div>
            <h2>Students</h2>
            <p style={{ fontSize: '0.875rem' }}>
              {isLoading ? '…' : `${students.length} student${students.length !== 1 ? 's' : ''} enrolled`}
            </p>
          </div>
        </div>
        {manage && (
          <button className="btn btn-primary" onClick={openCreate} id="add-student-btn">
            <Plus size={18} /> Add Student
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
            id="student-search"
            type="text"
            className="form-input"
            placeholder="Search by name, email or register no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="stu-clear-btn" onClick={() => setSearch('')} aria-label="Clear search" style={{ position: 'absolute', right: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {user?.role === 'ADMIN' ? (
          <select
            id="student-dept-filter"
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

        <select
          id="student-year-filter"
          className="form-select"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="">All Years</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>Year {y}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading students..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={search || deptFilter || yearFilter ? 'No matching students' : 'No students yet'}
          description={
            search || deptFilter || yearFilter
              ? 'Try adjusting your search, department, or year filter.'
              : manage ? 'Add the first student to get started.' : 'No students have been enrolled yet.'
          }
          action={
            !search && !deptFilter && !yearFilter && manage ? (
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={18} /> Add First Student
              </button>
            ) : null
          }
        />
      ) : (
        <DataTable headers={['#', 'Student', 'Register No.', 'Year', 'Department', manage && 'Actions']}>
          {filtered.map((s) => {
            const initials = s.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <tr key={s.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.id}</td>
                <td>
                  <div className="stu-name-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>{initials}</div>
                    <div>
                      <div className="stu-name" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                      <div className="stu-email-sm" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="stu-regno-cell"><Hash size={13} color="var(--text-muted)" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{s.registerNumber}</div>
                </td>
                <td>
                  <span className={`badge ${YEAR_CLASS[s.year] || 'badge-primary'}`}>Year {s.year}</span>
                </td>
                <td>
                  {s.department?.departmentName
                    ? <span className="badge badge-success">{s.department.departmentName}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                {manage && (
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button id={`edit-student-${s.id}`} className="btn-icon btn-icon-primary"
                        onClick={() => openEdit(s)} title="Edit student" aria-label={`Edit ${s.name}`}>
                        <Pencil size={15} />
                      </button>
                      <button id={`delete-student-${s.id}`} className="btn-icon btn-icon-danger"
                        onClick={() => openDelete(s)} title="Remove student" aria-label={`Remove ${s.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </DataTable>
      )}

      <StudentModal isOpen={modalOpen} onClose={closeModal} onSubmit={handleModalSubmit}
        initial={editTarget} departments={departments}
        existingStudents={students} isLoading={modalLoading} />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={closeDelete}
        onConfirm={handleDeleteConfirm}
        title="Remove Student"
        message={`Are you sure you want to remove "${deleteTarget?.name}" (${deleteTarget?.registerNumber})? This action cannot be undone.`}
        isLoading={deleteLoading}
        confirmLabel="Remove"
      />
    </div>
  );
};

export default Students;
