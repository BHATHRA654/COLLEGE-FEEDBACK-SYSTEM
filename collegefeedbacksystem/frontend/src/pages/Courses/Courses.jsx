import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Pencil, Trash2, Plus, Search, X, BookOpen, Filter } from 'lucide-react';
import { courseService } from '../../services/courseService';
import { departmentService } from '../../services/departmentService';
import { AuthContext } from '../../context/AuthContext';
import { Modal, ConfirmDialog, LoadingState, EmptyState, DataTable, ErrorAlert, FormField } from '../../components/CommonUI';
import { validators } from '../../utils/validators';
import { extractError } from '../../utils/errorUtils';
import './Courses.css';

const CAN_MANAGE = ['ADMIN', 'HOD'];
function canManage(role) {
  return CAN_MANAGE.includes(role);
}

const Courses = () => {
  const { user } = useContext(AuthContext);
  const manage = canManage(user?.role);

  const [courses,     setCourses]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [search,      setSearch]      = useState('');
  const [deptFilter,  setDeptFilter]  = useState(user?.role !== 'ADMIN' && user?.departmentId ? String(user.departmentId) : '');

  // Modal
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form, setForm] = useState({ courseName: '', courseCode: '', departmentId: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  // Delete
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearNotifications = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        courseService.getAll(),
        departmentService.getAll(),
      ]);
      if (cRes.success) setCourses(cRes.data ?? []);
      if (dRes.success) setDepartments(dRes.data ?? []);
    } catch (err) {
      setErrorMsg(extractError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.departmentId) {
      setDeptFilter(String(user.departmentId));
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.courseName.toLowerCase().includes(search.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter ? String(c.department?.id) === deptFilter : true;
    return matchSearch && matchDept;
  });

  const openCreate = () => {
    clearNotifications();
    setEditTarget(null);
    setForm({ courseName: '', courseCode: '', departmentId: '' });
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (c) => {
    clearNotifications();
    setEditTarget(c);
    setForm({
      courseName:   c.courseName,
      courseCode:   c.courseCode,
      departmentId: c.department?.id ? String(c.department.id) : '',
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    clearNotifications();

    const payload = {
      courseName: form.courseName.trim(),
      courseCode: form.courseCode.trim().toUpperCase(),
      department: form.departmentId ? { id: Number(form.departmentId) } : null
    };

    const valErrs = {};
    if (!payload.courseName) valErrs.courseName = 'Course name is required.';
    if (!payload.courseCode) valErrs.courseCode = 'Course code is required.';
    if (!user?.role === 'ADMIN' && !form.departmentId) valErrs.departmentId = 'Department is required.';

    if (Object.keys(valErrs).length) {
      setFieldErrors(valErrs);
      return;
    }

    setModalLoading(true);
    try {
      if (editTarget) {
        const res = await courseService.update(editTarget.id, payload);
        if (res.success) {
          setSuccessMsg(`Course "${payload.courseName}" updated successfully.`);
          setModalOpen(false);
          await fetchAll();
        }
      } else {
        const res = await courseService.create(payload);
        if (res.success) {
          setSuccessMsg(`Course "${payload.courseName}" created successfully.`);
          setModalOpen(false);
          await fetchAll();
        }
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
      const res = await courseService.delete(deleteTarget.id);
      if (res.success) {
        setSuccessMsg(`Course "${deleteTarget.courseName}" deleted successfully.`);
        setDeleteTarget(null);
        await fetchAll();
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
      <div className="crs-page-header">
        <div className="crs-page-title">
          <BookOpen size={28} color="var(--primary)" />
          <div>
            <h2>Courses</h2>
            <p style={{ fontSize: '0.875rem' }}>
              {isLoading ? '…' : `${courses.length} course${courses.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
        </div>
        {manage && (
          <button className="btn btn-primary" onClick={openCreate} id="add-course-btn">
            <Plus size={18} />
            Add Course
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
            id="course-search"
            type="text"
            className="form-input"
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="crs-search-clear" onClick={() => setSearch('')} aria-label="Clear search" style={{ position: 'absolute', right: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {user?.role === 'ADMIN' ? (
          <select
            id="course-dept-filter"
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

      {/* Data Layout States */}
      {isLoading ? (
        <LoadingState message="Loading syllabus courses..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search || deptFilter ? 'No matching courses' : 'No courses yet'}
          description={
            search || deptFilter
              ? 'Try modifying your search query or department filter.'
              : manage
              ? 'Add the first course to get started.'
              : 'No courses registered yet.'
          }
          action={
            !search && !deptFilter && manage ? (
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} /> Add First Course
              </button>
            ) : null
          }
        />
      ) : (
        <DataTable headers={['#', 'Code', 'Course Name', 'Department', manage && 'Actions']}>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.id}</td>
              <td>
                <span className="badge badge-primary">{c.courseCode}</span>
              </td>
              <td>
                <strong>{c.courseName}</strong>
              </td>
              <td>
                {c.department?.departmentName ? (
                  <span className="badge badge-success">{c.department.departmentName}</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                )}
              </td>
              {manage && (
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      id={`edit-course-${c.id}`}
                      className="btn-icon btn-icon-primary"
                      onClick={() => openEdit(c)}
                      title="Edit course"
                      aria-label={`Edit ${c.courseName}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      id={`delete-course-${c.id}`}
                      className="btn-icon btn-icon-danger"
                      onClick={() => setDeleteTarget(c)}
                      title="Delete course"
                      aria-label={`Delete ${c.courseName}`}
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

      {/* Course Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Course' : 'Add Course'}
        isLoading={modalLoading}
      >
        <form onSubmit={handleModalSubmit} noValidate>
          <FormField label="Course Name" id="crs-name" error={fieldErrors.courseName} required>
            <input
              id="crs-name"
              type="text"
              className={`form-input${fieldErrors.courseName ? ' input-error' : ''}`}
              placeholder="e.g. Data Structures"
              value={form.courseName}
              onChange={(e) => {
                setForm({ ...form, courseName: e.target.value });
                setFieldErrors({ ...fieldErrors, courseName: '' });
              }}
              maxLength={200}
              autoFocus
            />
          </FormField>

          <FormField label="Course Code" id="crs-code" error={fieldErrors.courseCode} required>
            <input
              id="crs-code"
              type="text"
              className={`form-input${fieldErrors.courseCode ? ' input-error' : ''}`}
              placeholder="e.g. CS101"
              value={form.courseCode}
              onChange={(e) => {
                setForm({ ...form, courseCode: e.target.value });
                setFieldErrors({ ...fieldErrors, courseCode: '' });
              }}
              maxLength={20}
            />
          </FormField>

          <FormField label="Department" id="crs-dept" error={fieldErrors.departmentId} required>
            <select
              id="crs-dept"
              className={`form-input form-select${fieldErrors.departmentId ? ' input-error' : ''}`}
              value={form.departmentId}
              onChange={(e) => {
                setForm({ ...form, departmentId: e.target.value });
                setFieldErrors({ ...fieldErrors, departmentId: '' });
              }}
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.departmentName}</option>
              ))}
            </select>
          </FormField>

          <div className="crs-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
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
              {editTarget ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.courseName}" (${deleteTarget?.courseCode})? This action cannot be undone.`}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Courses;
