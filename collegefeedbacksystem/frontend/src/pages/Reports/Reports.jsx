import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, Star, BookOpen, Users, TrendingUp,
  AlertCircle, Loader, Info,
} from 'lucide-react';
import { reportService }  from '../../services/reportService';
import { facultyService } from '../../services/facultyService';
import { courseService }  from '../../services/courseService';
import { extractError } from '../../utils/errorUtils';
import { Modal, ConfirmDialog, LoadingState, EmptyState, DataTable, ErrorAlert } from '../../components/CommonUI';
import './Reports.css';

/* ────────────────────────────────────────────────────────────────
   Backend contract (source: ReportController.java):

   GET /api/reports/summary
     → data: { totalFeedbackCount }

   GET /api/reports/faculty/{id}/average-rating
     → data: { facultyId, averageRating, totalFeedback }
     * averageRating = 0.0  when no feedback exists (not null)
     * totalFeedback = 0    when no feedback exists

   GET /api/reports/course/{id}/average-rating
     → data: { courseId, averageRating, totalFeedback }
     * same zero-handling as above
   ──────────────────────────────────────────────────────────────── */

/* ─── Stat card ──────────────────────────────────────────────── */
function StatCard({ icon, label, value, accent }) {
  const isLoading = value === null;
  return (
    <div className="rpt-stat-card glass-card">
      <div className="rpt-stat-icon" style={{ background: accent + '1a', color: accent }}>
        {icon}
      </div>
      <div className="rpt-stat-body">
        <p className="rpt-stat-label">{label}</p>
        <div className="rpt-stat-value" style={{ color: accent }}>
          {isLoading
            ? <span className="spinner primary" style={{ width: 20, height: 20 }} />
            : value}
        </div>
      </div>
    </div>
  );
}

/* ─── Star row ───────────────────────────────────────────────── */
function StarRow({ filled, color }) {
  return (
    <div className="rpt-star-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={18}
          fill={n <= filled ? 'currentColor' : 'none'}
          color={n <= filled ? color : '#D1D5DB'}
        />
      ))}
    </div>
  );
}

/* ─── Rating meter ───────────────────────────────────────────── */
function RatingMeter({ avg, total }) {
  /*
   * avg   = averageRating (0.0 when no feedback)
   * total = totalFeedback (0   when no feedback)
   *
   * We must ONLY show the meter when total > 0.
   * When total === 0, caller shows the "No feedback yet" state instead.
   */
  const pct    = Math.min((avg / 5) * 100, 100);
  const color  = avg >= 4 ? '#10B981' : avg >= 3 ? '#F59E0B' : '#EF4444';
  const filled = Math.round(avg);

  return (
    <div className="rpt-meter">
      <div className="rpt-meter-top">
        <span className="rpt-avg" style={{ color }}>
          {avg.toFixed(2)}
          <span className="rpt-avg-denom"> / 5</span>
        </span>
        <StarRow filled={filled} color={color} />
      </div>
      <div className="rpt-bar-track">
        <div
          className="rpt-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="rpt-total">
        Based on <strong>{total}</strong> review{total !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

/* ─── Report panel ───────────────────────────────────────────── */
function ReportPanel({ title, icon, items, selectedId, onSelect, data, isLoading, placeholder }) {
  /*
   * data is the raw API response:
   *   null              = not fetched yet (no selection)
   *   { averageRating, totalFeedback } from backend
   *
   * Three display states after selection:
   *   1. isLoading          → spinner
   *   2. data.totalFeedback === 0  → "No feedback yet"
   *   3. data.totalFeedback > 0   → RatingMeter
   */
  const hasFeedback = data !== null && data.totalFeedback > 0;
  const noFeedback  = data !== null && data.totalFeedback === 0;

  return (
    <div className="rpt-panel glass-card">
      <div className="rpt-panel-header">
        {icon}
        <h3>{title}</h3>
      </div>

      {/* Selector */}
      <div className="form-group rpt-panel-select">
        <select
          className="form-input form-select"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="rpt-panel-loading">
          <Loader size={24} className="rpt-spin" color="var(--primary)" />
          <span>Fetching report…</span>
        </div>
      )}

      {/* No selection prompt */}
      {!isLoading && !selectedId && (
        <div className="rpt-hint">
          <Info size={16} />
          Select an option above to view the rating report.
        </div>
      )}

      {/* No feedback yet */}
      {!isLoading && selectedId && noFeedback && (
        <div className="rpt-no-data">
          <Star size={32} color="#D1D5DB" />
          <p>No feedback has been submitted for this selection yet.</p>
        </div>
      )}

      {/* Rating meter — only when totalFeedback > 0 */}
      {!isLoading && selectedId && hasFeedback && (
        <RatingMeter avg={data.averageRating} total={data.totalFeedback} />
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
const Reports = () => {
  /* Dropdown data */
  const [faculty,       setFaculty]       = useState([]);
  const [courses,       setCourses]       = useState([]);

  /* Summary: only totalFeedbackCount */
  const [totalFeedback, setTotalFeedback] = useState(null);   // null = loading

  const [initLoading,   setInitLoading]   = useState(true);
  const [initError,     setInitError]     = useState('');

  /* Faculty panel */
  const [selFaculty,   setSelFaculty]   = useState('');
  const [facultyData,  setFacultyData]  = useState(null);
  const [facultyLoad,  setFacultyLoad]  = useState(false);
  const [facultyErr,   setFacultyErr]   = useState('');

  /* Course panel */
  const [selCourse,    setSelCourse]    = useState('');
  const [courseData,   setCourseData]   = useState(null);
  const [courseLoad,   setCourseLoad]   = useState(false);
  const [courseErr,    setCourseErr]    = useState('');

  /* ── Initial data load ─────────────────────────────────────── */
  const loadInitial = useCallback(async () => {
    setInitLoading(true);
    setInitError('');
    try {
      const [sumRes, facRes, courRes] = await Promise.all([
        reportService.getSummary(),
        facultyService.getAll(),
        courseService.getAll(),
      ]);
      /* summary → only totalFeedbackCount */
      if (sumRes.success)  setTotalFeedback(sumRes.data?.totalFeedbackCount ?? 0);
      if (facRes.success)  setFaculty(facRes.data ?? []);
      if (courRes.success) setCourses(courRes.data ?? []);
    } catch (err) {
      setInitError(extractError(err));
    } finally {
      setInitLoading(false);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  /* ── Faculty select → GET /api/reports/faculty/{id}/average-rating ── */
  const handleFacultySelect = async (id) => {
    setSelFaculty(id);
    setFacultyData(null);
    setFacultyErr('');
    if (!id) return;

    setFacultyLoad(true);
    try {
      const res = await reportService.getFacultyRating(id);
      if (res.success) {
        /*
         * Backend returns { facultyId, averageRating, totalFeedback }
         * averageRating = 0.0 when no feedback (not null)
         * totalFeedback = 0   when no feedback
         */
        setFacultyData(res.data);
      }
    } catch (err) {
      setFacultyErr(extractError(err));
      /* Treat as no-feedback state so the panel still renders */
      setFacultyData({ averageRating: 0, totalFeedback: 0 });
    } finally {
      setFacultyLoad(false);
    }
  };

  /* ── Course select → GET /api/reports/course/{id}/average-rating ── */
  const handleCourseSelect = async (id) => {
    setSelCourse(id);
    setCourseData(null);
    setCourseErr('');
    if (!id) return;

    setCourseLoad(true);
    try {
      const res = await reportService.getCourseRating(id);
      if (res.success) {
        setCourseData(res.data);
      }
    } catch (err) {
      setCourseErr(extractError(err));
      setCourseData({ averageRating: 0, totalFeedback: 0 });
    } finally {
      setCourseLoad(false);
    }
  };

  /* ── Init loading screen ──────────────────────────────────────── */
  if (initLoading) {
    return <LoadingState message="Loading report data..." />;
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in">

      {/* Page header */}
      <div className="rpt-page-header">
        <BarChart2 size={28} color="var(--primary)" />
        <div>
          <h2>Analytics &amp; Reports</h2>
          <p>Feedback insights based on submitted student responses.</p>
        </div>
      </div>

      {/* Init error */}
      <ErrorAlert error={initError} onDismiss={() => setInitError('')} />

      {/* ── Stat cards — only data the backend actually provides ── */}
      <div className="rpt-stats-row">
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Total Feedback Submitted"
          value={totalFeedback}
          accent="#4F46E5"
        />
        <StatCard
          icon={<Users size={22} />}
          label="Faculty Members"
          value={faculty.length}
          accent="#10B981"
        />
        <StatCard
          icon={<BookOpen size={22} />}
          label="Courses"
          value={courses.length}
          accent="#F59E0B"
        />
      </div>

      {/* ── Rating panels ── */}
      <div className="rpt-panels">

        {/* Faculty panel */}
        <div>
          <ReportPanel
            title="Faculty Rating"
            icon={<Users size={20} color="var(--primary)" />}
            items={faculty.map((f) => ({
              id:    f.id,
              label: `${f.name}${f.designation ? ' — ' + f.designation : ''}`,
            }))}
            selectedId={selFaculty}
            onSelect={handleFacultySelect}
            data={facultyData}
            isLoading={facultyLoad}
            placeholder="Select a faculty member…"
          />
          {facultyErr && (
            <p className="rpt-panel-err">
              <AlertCircle size={14} /> {facultyErr}
            </p>
          )}
        </div>

        {/* Course panel */}
        <div>
          <ReportPanel
            title="Course Rating"
            icon={<BookOpen size={20} color="var(--primary)" />}
            items={courses.map((c) => ({
              id:    c.id,
              label: `${c.courseName} (${c.courseCode})`,
            }))}
            selectedId={selCourse}
            onSelect={handleCourseSelect}
            data={courseData}
            isLoading={courseLoad}
            placeholder="Select a course…"
          />
          {courseErr && (
            <p className="rpt-panel-err">
              <AlertCircle size={14} /> {courseErr}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Reports;
