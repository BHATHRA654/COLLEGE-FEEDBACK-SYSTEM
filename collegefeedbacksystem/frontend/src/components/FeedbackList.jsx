import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2, Star, MessageSquare, AlertCircle, Search, X,
  Filter, BookOpen, User, PlusCircle, Loader,
} from 'lucide-react';
import { AuthContext }      from '../context/AuthContext';
import { feedbackService } from '../services/feedbackService';
import { studentService }  from '../services/studentService';
import { facultyService }  from '../services/facultyService';
import { extractError } from '../utils/errorUtils';
import { Modal, ConfirmDialog, LoadingState, EmptyState, DataTable, ErrorAlert } from './CommonUI';
import './FeedbackList.css';

function formatDate(raw) {
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/* ─── Role constants ─────────────────────────────────────────── */
const ADMIN_ROLES  = ['ADMIN', 'HOD'];       // see all + delete
const FACULTY_ROLE = 'FACULTY';              // see own-relevant only
const STUDENT_ROLE = 'STUDENT';              // see own submissions only

/* ─── Sub-components ─────────────────────────────────────────── */

/** Star rating badge */
function RatingBadge({ rating }) {
  const cls =
    rating >= 4 ? 'badge-success' : rating <= 2 ? 'badge-danger' : 'badge-warning';
  return (
    <span className={`badge ${cls} fl-rating-badge`}>
      <Star size={11} fill="currentColor" />
      {rating} / 5
    </span>
  );
}

/** Stars row (filled/empty icons, used in student card view) */
function StarRow({ rating }) {
  return (
    <div className="fl-star-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          fill={n <= rating ? 'currentColor' : 'none'}
          color={n <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </div>
  );
}



/* ────────────────────────────────────────────────────────────────
   STUDENT VIEW — personal feedback history cards
   ──────────────────────────────────────────────────────────────── */
function StudentView({ feedbacks, isLoading, error }) {
  if (isLoading) return <LoadingState message="Loading your feedback submissions..." />;
  if (error)    return <ErrorAlert error={error} />;

  if (feedbacks.length === 0) {
    return (
      <div className="fl-empty glass-card">
        <MessageSquare size={48} color="var(--text-muted)" />
        <h3>No feedback submitted yet</h3>
        <p>You haven't submitted any feedback. Use the button below to share your experience.</p>
        <Link to="/feedback/submit" className="btn btn-primary" style={{ marginTop: '1rem', gap: '0.4rem' }}>
          <PlusCircle size={16} /> Submit Feedback
        </Link>
      </div>
    );
  }

  return (
    <div className="fl-cards">
      {feedbacks.map((f) => (
        <div key={f.id} className="fl-card glass-card">
          <div className="fl-card-top">
            {/* Course */}
            <div className="fl-card-course">
              <BookOpen size={16} color="var(--primary)" />
              <div>
                <div className="fl-card-course-name">
                  {f.course?.courseName ?? '—'}
                </div>
                {f.course?.courseCode && (
                  <span className="badge badge-primary fl-card-code">
                    {f.course.courseCode}
                  </span>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="fl-card-rating">
              <StarRow rating={f.rating} />
              <span className="fl-card-rating-label">{f.rating} / 5</span>
            </div>
          </div>

          {/* Faculty */}
          {f.faculty?.name && (
            <div className="fl-card-faculty">
              <User size={14} color="var(--text-muted)" />
              <span>{f.faculty.name}</span>
              {f.faculty.designation && (
                <span className="fl-card-designation">· {f.faculty.designation}</span>
              )}
            </div>
          )}

          {/* Comments */}
          {f.comments && (
            <p className="fl-card-comments">&ldquo;{f.comments}&rdquo;</p>
          )}

          {/* Date */}
          <p className="fl-card-date">Submitted on {formatDate(f.submittedDate)}</p>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   FACULTY VIEW — feedback about them, with search
   ──────────────────────────────────────────────────────────────── */
function FacultyView({ feedbacks, isLoading, error }) {
  const [search, setSearch] = useState('');

  const filtered = feedbacks.filter((f) => {
    const q = search.toLowerCase();
    return (
      (f.course?.courseName ?? '').toLowerCase().includes(q) ||
      (f.course?.courseCode ?? '').toLowerCase().includes(q) ||
      (f.comments ?? '').toLowerCase().includes(q)
    );
  });

  if (isLoading) return <LoadingState message="Loading student feedbacks..." />;
  if (error)    return <ErrorAlert error={error} />;

  return (
    <>
      {feedbacks.length > 0 && (
        <div className="filter-toolbar">
          <div className="search-wrapper">
            <span className="search-icon">
              <Search size={17} />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by course or comments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="fl-clear-btn" onClick={() => setSearch('')} aria-label="Clear" style={{ position: 'absolute', right: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="fl-empty glass-card">
          <MessageSquare size={48} color="var(--text-muted)" />
          <h3>{search ? 'No matching feedback' : 'No feedback yet'}</h3>
          <p>
            {search
              ? 'Try adjusting your search.'
              : 'No students have submitted feedback about you yet.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Course</th>
                <th style={{ width: 100 }}>Rating</th>
                <th>Comments</th>
                <th style={{ width: 120 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{f.id}</td>
                  <td>
                    <div className="fl-name">{f.course?.courseName ?? '—'}</div>
                    {f.course?.courseCode && (
                      <span className="badge badge-primary fl-code">{f.course.courseCode}</span>
                    )}
                  </td>
                  <td><RatingBadge rating={f.rating} /></td>
                  <td>
                    <div className="fl-comments">
                      {f.comments ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(f.submittedDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {search && (
            <p style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Showing {filtered.length} of {feedbacks.length} entries
            </p>
          )}
        </div>
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────
   ADMIN / HOD VIEW — full table with search + course filter + delete
   ──────────────────────────────────────────────────────────────── */
function AdminView({ feedbacks, isLoading, error, onDelete }) {
  const [search,  setSearch]  = useState('');
  const [rFilter, setRFilter] = useState(''); // rating filter: '', '5', '4', '3', '2', '1'

  const filtered = feedbacks.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      (f.student?.name  ?? '').toLowerCase().includes(q) ||
      (f.course?.courseName ?? '').toLowerCase().includes(q) ||
      (f.course?.courseCode ?? '').toLowerCase().includes(q) ||
      (f.faculty?.name  ?? '').toLowerCase().includes(q) ||
      (f.comments ?? '').toLowerCase().includes(q);
    const matchRating = rFilter ? String(f.rating) === rFilter : true;
    return matchSearch && matchRating;
  });

  if (isLoading) return <LoadingState message="Loading all feedback entries..." />;
  if (error)    return <ErrorAlert error={error} />;

  return (
    <>
      <div className="filter-toolbar">
        <div className="search-wrapper">
          <span className="search-icon">
            <Search size={17} />
          </span>
          <input
            id="feedback-search"
            type="text"
            className="form-input"
            placeholder="Search by student, course, faculty or comments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="fl-clear-btn" onClick={() => setSearch('')} aria-label="Clear search" style={{ position: 'absolute', right: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={15} />
            </button>
          )}
        </div>

        <select
          id="feedback-rating-filter"
          className="form-select"
          value={rFilter}
          onChange={(e) => setRFilter(e.target.value)}
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>Rating {r}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="fl-empty glass-card">
          <MessageSquare size={48} color="var(--text-muted)" />
          <h3>{search || rFilter ? 'No matching feedback' : 'No feedback yet'}</h3>
          <p>
            {search || rFilter
              ? 'Try adjusting your search or rating filter.'
              : 'No students have submitted feedback yet.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 55 }}>#</th>
                <th>Student</th>
                <th>Course</th>
                <th>Faculty</th>
                <th style={{ width: 95 }}>Rating</th>
                <th>Comments</th>
                <th style={{ width: 115 }}>Date</th>
                <th style={{ width: 70 }}>Del.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{f.id}</td>
                  <td>
                    <div className="fl-name">{f.student?.name ?? '—'}</div>
                    {f.student?.email && (
                      <div className="fl-sub">{f.student.email}</div>
                    )}
                  </td>
                  <td>
                    <div className="fl-name">{f.course?.courseName ?? '—'}</div>
                    {f.course?.courseCode && (
                      <span className="badge badge-primary fl-code">{f.course.courseCode}</span>
                    )}
                  </td>
                  <td>
                    {f.faculty?.name
                      ? <div className="fl-name">{f.faculty.name}</div>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td><RatingBadge rating={f.rating} /></td>
                  <td>
                    <div className="fl-comments">
                      {f.comments ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(f.submittedDate)}
                  </td>
                  <td>
                    <button
                      id={`delete-feedback-${f.id}`}
                      className="btn-icon btn-icon-danger"
                      onClick={() => onDelete(f.id)}
                      title="Delete feedback"
                      aria-label={`Delete feedback #${f.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(search || rFilter) && (
            <p style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Showing {filtered.length} of {feedbacks.length} entries
            </p>
          )}
        </div>
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────────────────────── */
const FeedbackList = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role ?? '';

  const [feedbacks,   setFeedbacks]   = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState('');
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleteLoad,  setDeleteLoad]  = useState(false);
  const [successMsg,  setSuccessMsg]  = useState('');

  /* ── Data fetching — strictly role-separated ─────────────────── */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setFeedbacks([]);

    try {
      if (ADMIN_ROLES.includes(role)) {
        /* ── ADMIN / HOD: GET /api/feedback (full list) ── */
        const res = await feedbackService.getAll();
        if (res.success) setFeedbacks(res.data ?? []);

      } else if (role === FACULTY_ROLE) {
        /* ── FACULTY: resolve faculty entity ID by email, then
              GET /api/feedback/faculty/{facultyId} ── */
        const fRes = await facultyService.getAll();
        if (fRes.success) {
          const userEmail = (user?.email ?? '').toLowerCase();
          const match = (fRes.data ?? []).find(
            (f) => (f.email ?? '').toLowerCase() === userEmail
          );
          if (match) {
            const fbRes = await feedbackService.getByFaculty(match.id);
            if (fbRes.success) setFeedbacks(fbRes.data ?? []);
          } else {
            setError(
              'Your faculty profile was not found. Contact the administrator to link your account.'
            );
          }
        }

      } else if (role === STUDENT_ROLE) {
        /* ── STUDENT: resolve student entity ID by email, then
              GET /api/feedback/student/{studentId} ── */
        const sRes = await studentService.getAll();
        if (sRes.success) {
          const userEmail = (user?.email ?? '').toLowerCase();
          const match = (sRes.data ?? []).find(
            (s) => (s.email ?? '').toLowerCase() === userEmail
          );
          if (match) {
            const fbRes = await feedbackService.getByStudent(match.id);
            if (fbRes.success) setFeedbacks(fbRes.data ?? []);
          } else {
            setError(
              'Your student profile was not found. Contact the administrator to link your account.'
            );
          }
        }

      } else {
        setError('You do not have permission to view feedback.');
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  }, [role, user?.email]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Delete (ADMIN / HOD only) ───────────────────────────────── */
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoad(true);
    try {
      const res = await feedbackService.delete(deleteId);
      if (res.success) {
        setSuccessMsg('Feedback entry deleted successfully.');
        setDeleteId(null);
        await fetchData();
        setTimeout(() => setSuccessMsg(''), 4500);
      }
    } catch (err) {
      setError(extractError(err));
      setDeleteId(null);
    } finally {
      setDeleteLoad(false);
    }
  };

  /* ── Page title ──────────────────────────────────────────────── */
  const title = ADMIN_ROLES.includes(role)
    ? 'All Feedback'
    : role === FACULTY_ROLE
    ? 'Feedback About Me'
    : 'My Feedback';

  const subtitle = isLoading
    ? '…'
    : `${feedbacks.length} entr${feedbacks.length !== 1 ? 'ies' : 'y'}`;

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in">

      {/* Page header */}
      <div className="fl-header">
        <MessageSquare size={28} color="var(--primary)" />
        <div>
          <h2>{title}</h2>
          <p style={{ fontSize: '0.875rem' }}>{subtitle}</p>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="alert alert-success fl-toast">
          {successMsg}
        </div>
      )}

      {/* Role-specific views */}
      {role === STUDENT_ROLE && (
        <StudentView feedbacks={feedbacks} isLoading={isLoading} error={error} />
      )}

      {role === FACULTY_ROLE && (
        <FacultyView feedbacks={feedbacks} isLoading={isLoading} error={error} />
      )}

      {ADMIN_ROLES.includes(role) && (
        <AdminView
          feedbacks={feedbacks}
          isLoading={isLoading}
          error={error}
          onDelete={(id) => setDeleteId(id)}
        />
      )}

      {/* Delete confirmation — ADMIN/HOD only */}
      {ADMIN_ROLES.includes(role) && (
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Feedback"
          message="This feedback entry will be permanently removed. This action cannot be undone."
          isLoading={deleteLoad}
        />
      )}
    </div>
  );
};

export default FeedbackList;
