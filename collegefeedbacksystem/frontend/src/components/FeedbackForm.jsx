import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Star, Send, AlertCircle, CheckCircle, Loader, UserX, ArrowRight } from 'lucide-react';
import { AuthContext }      from '../context/AuthContext';
import { feedbackService } from '../services/feedbackService';
import { courseService }   from '../services/courseService';
import { facultyService }  from '../services/facultyService';
import { studentService }  from '../services/studentService';
import { extractError } from '../utils/errorUtils';
import './FeedbackForm.css';

/* ────────────────────────────────────────────────────────────── */
/* Backend constraints (source of truth: Feedback.java)          */
/* comments   → @Column(length = 500)                            */
/* submittedDate → set server-side via LocalDateTime.now()        */
/* student_id  → nullable = false                                 */
/* course_id   → nullable = false                                 */
/* faculty_id  → nullable = true                                  */
/* rating      → nullable = false, Integer                        */
/* ────────────────────────────────────────────────────────────── */
const COMMENTS_MAX = 500;

/* ─── Star Rating UI ─────────────────────────────────────────── */
const STAR_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

function StarRating({ value, onChange, hasError }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className={`fb-stars-wrap${hasError ? ' fb-stars-error' : ''}`}>
      <div className="fb-stars" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`fb-star${display >= n ? ' fb-star-filled' : ''}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''} — ${STAR_LABELS[n]}`}
            aria-pressed={value === n}
          >
            <Star size={30} fill={display >= n ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <span className={`fb-star-label${display > 0 ? ' fb-star-label-visible' : ''}`}>
        {display > 0 ? STAR_LABELS[display] : ''}
      </span>
    </div>
  );
}

/* ─── Init loading skeleton ──────────────────────────────────── */
function LoadingState() {
  return (
    <div className="fb-init-loading">
      <Loader size={32} className="fb-spinner-icon" color="var(--primary)" />
      <p>Loading your feedback form…</p>
    </div>
  );
}

/* ─── Student-not-found state ────────────────────────────────── */
function ProfileNotFound({ email }) {
  return (
    <div className="fb-profile-missing glass-card">
      <UserX size={48} color="var(--danger)" />
      <h3>Student Profile Not Found</h3>
      <p>
        No student record is linked to your account email{' '}
        <strong>{email}</strong>.
      </p>
      <p>
        Please ask your administrator to create a Student record with this
        email address before you can submit feedback.
      </p>
    </div>
  );
}

/* ─── Success state ──────────────────────────────────────────── */
function SuccessState({ onSubmitAnother }) {
  return (
    <div className="fb-success-state">
      <div className="fb-success-icon">
        <CheckCircle size={52} color="#10B981" />
      </div>
      <h3>Feedback Submitted!</h3>
      <p>Thank you. Your feedback has been recorded successfully.</p>
      <div className="fb-success-actions">
        <Link to="/feedback/list" className="btn btn-secondary fb-history-btn">
          View My Feedback
          <ArrowRight size={16} />
        </Link>
        <button className="btn btn-primary" onClick={onSubmitAnother}>
          Submit Another
        </button>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
const EMPTY_FORM = { courseId: '', facultyId: '', rating: 0, comments: '' };

const FeedbackForm = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const preselectedCourseId = location.state?.courseId || '';

  // Data for dropdowns
  const [courses,     setCourses]     = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // Resolved student entity ID — never exposed to user controls
  const [studentId,   setStudentId]   = useState(null);

  // UI states
  const [initLoading, setInitLoading] = useState(true);   // loading dropdown data
  const [profileMissing, setProfileMissing] = useState(false); // no student record found
  const [submitted,   setSubmitted]   = useState(false);   // show success screen

  // Form state
  const [form,       setForm]       = useState({
    courseId: preselectedCourseId,
    facultyId: '',
    rating: 0,
    comments: ''
  });
  const [errors,     setErrors]     = useState({});
  const [isLoading,  setIsLoading]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  /* ── Load supporting data ──────────────────────────────────── */
  const loadData = useCallback(async () => {
    setInitLoading(true);
    setProfileMissing(false);
    try {
      const [courseRes, facultyRes, studentRes] = await Promise.all([
        courseService.getAll(),
        facultyService.getAll(),
        studentService.getAll(),
      ]);

      if (studentRes.success) {
        // Match by email (case-insensitive). The student ID is stored in state
        // and NEVER exposed in any form input — user cannot change it.
        const userEmail = user?.email?.toLowerCase() ?? '';
        const match = (studentRes.data ?? []).find(
          (s) => (s.email ?? '').toLowerCase() === userEmail
        );

        if (match) {
          setStudentId(match.id);
          const deptId = match.department?.id;

          // Enforce department filter for Student role
          if (courseRes.success) {
            const deptCourses = (courseRes.data ?? []).filter(c => c.department?.id === deptId);
            setCourses(deptCourses);
          }
          if (facultyRes.success) {
            const deptFaculty = (facultyRes.data ?? []).filter(f => f.department?.id === deptId);
            setFacultyList(deptFaculty);
          }
        } else {
          setProfileMissing(true);
        }
      }
    } catch (err) {
      setSubmitError(extractError(err));
    } finally {
      setInitLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Form change handlers ──────────────────────────────────── */
  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
    if (submitError) setSubmitError('');
  };

  const handleRating = (val) => {
    setForm((p) => ({ ...p, rating: val }));
    if (errors.rating) setErrors((p) => ({ ...p, rating: undefined }));
    if (submitError) setSubmitError('');
  };

  /* ── Validation ────────────────────────────────────────────── */
  const validate = () => {
    const e = {};

    if (!form.courseId)
      e.courseId = 'Please select a course.';

    if (!form.rating || form.rating < 1 || form.rating > 5)
      e.rating = 'Please select a rating from 1 to 5.';

    if (form.comments.length > COMMENTS_MAX)
      e.comments = `Comments must not exceed ${COMMENTS_MAX} characters.`;

    return e;
  };

  /* ── Submit ────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Guard: student profile must exist
    if (!studentId) {
      setProfileMissing(true);
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      /**
       * Exact backend payload (POST /api/feedback):
       * - student.id  → required, resolved from email match
       * - course.id   → required, selected by user
       * - faculty.id  → optional, null if not selected
       * - rating      → Integer 1-5
       * - comments    → String max 500 chars, null if empty
       *
       * submittedDate is NOT sent — backend sets it via LocalDateTime.now()
       */
      const payload = {
        student:  { id: studentId },
        course:   { id: Number(form.courseId) },
        faculty:  form.facultyId ? { id: Number(form.facultyId) } : null,
        rating:   Number(form.rating),
        comments: form.comments.trim() || null,
      };

      const res = await feedbackService.create(payload);
      if (res.success) {
        setSubmitted(true);
        setForm(EMPTY_FORM);
        setErrors({});
      }
    } catch (err) {
      setSubmitError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnother = () => {
    setSubmitted(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError('');
  };

  /* ── Char counter colour ───────────────────────────────────── */
  const charCount     = form.comments.length;
  const charOverLimit = charCount > COMMENTS_MAX;
  const charNearLimit = charCount > COMMENTS_MAX * 0.85; // warn at 85%

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="fb-page animate-fade-in">
      <div className="fb-card glass-card">

        {/* Header */}
        <div className="fb-header">
          <Send size={24} color="var(--primary)" />
          <div>
            <h2>Submit Feedback</h2>
            <p>Your responses help improve teaching quality and course delivery.</p>
          </div>
        </div>

        {/* ── Init loading ── */}
        {initLoading && <LoadingState />}

        {/* ── Student profile missing ── */}
        {!initLoading && profileMissing && (
          <ProfileNotFound email={user?.email} />
        )}

        {/* ── Submitted successfully ── */}
        {!initLoading && !profileMissing && submitted && (
          <SuccessState onSubmitAnother={handleSubmitAnother} />
        )}

        {/* ── Form ── */}
        {!initLoading && !profileMissing && !submitted && (
          <>
            {/* Submit-level error banner */}
            {submitError && (
              <div className="alert alert-error fb-alert">
                <AlertCircle size={18} />
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="fb-form">

              {/* Course (required) */}
              <div className="form-group">
                <label className="form-label" htmlFor="fb-course">
                  Course <span className="fb-req">*</span>
                </label>
                <select
                  id="fb-course"
                  className={`form-input form-select${errors.courseId ? ' input-error' : ''}`}
                  value={form.courseId}
                  onChange={handleChange('courseId')}
                >
                  <option value="">— Select a course —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseName} ({c.courseCode})
                    </option>
                  ))}
                </select>
                {errors.courseId && <p className="input-error-msg">{errors.courseId}</p>}
              </div>

              {/* Faculty (optional) */}
              <div className="form-group">
                <label className="form-label" htmlFor="fb-faculty">
                  Faculty Member <span className="fb-opt">(optional)</span>
                </label>
                <select
                  id="fb-faculty"
                  className="form-input form-select"
                  value={form.facultyId}
                  onChange={handleChange('facultyId')}
                >
                  <option value="">— Select a faculty member —</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.designation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating (required, 1–5) */}
              <div className="form-group">
                <label className="form-label">
                  Rating <span className="fb-req">*</span>
                </label>
                <StarRating
                  value={form.rating}
                  onChange={handleRating}
                  hasError={Boolean(errors.rating)}
                />
                {errors.rating && <p className="input-error-msg">{errors.rating}</p>}
              </div>

              {/* Comments (optional, max 500) */}
              <div className="form-group">
                <label className="form-label" htmlFor="fb-comments">
                  Comments <span className="fb-opt">(optional)</span>
                </label>
                <textarea
                  id="fb-comments"
                  className={`form-input fb-textarea${errors.comments ? ' input-error' : ''}`}
                  rows={4}
                  placeholder="Share your experience, suggestions, or any specific feedback…"
                  value={form.comments}
                  onChange={handleChange('comments')}
                  maxLength={COMMENTS_MAX}
                />
                <p
                  className="fb-char-count"
                  style={{
                    color: charOverLimit
                      ? 'var(--danger)'
                      : charNearLimit
                      ? '#D97706'
                      : 'var(--text-muted)',
                  }}
                >
                  {charCount} / {COMMENTS_MAX}
                </p>
                {errors.comments && <p className="input-error-msg">{errors.comments}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary fb-submit"
                disabled={isLoading}
              >
                {isLoading
                  ? <span className="spinner" style={{ width: 18, height: 18 }} />
                  : <Send size={16} />}
                {isLoading ? 'Submitting…' : 'Submit Feedback'}
              </button>

            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default FeedbackForm;
