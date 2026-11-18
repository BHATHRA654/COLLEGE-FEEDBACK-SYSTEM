import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Users, BookOpen, GraduationCap,
  Building2, BarChart2, PlusCircle, List, ArrowRight,
  TrendingUp, AlertCircle, Loader, UserCheck, Award,
  Star, Shield, ShieldCheck, CheckCircle2, Inbox, RefreshCw
} from 'lucide-react';
import { AuthContext }      from '../../context/AuthContext';
import { facultyService }  from '../../services/facultyService';
import { studentService }  from '../../services/studentService';
import { courseService }   from '../../services/courseService';
import { departmentService } from '../../services/departmentService';
import { feedbackService }   from '../../services/feedbackService';
import { extractError }      from '../../utils/errorUtils';
import './Dashboard.css';

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  HOD:   'Head of Department',
  FACULTY: 'Faculty Member',
  STUDENT: 'Student',
  GUEST:   'Guest User',
};

/* ─── Skeleton Loading Cards ────────────────────────── */
function CardSkeleton({ height = '120px' }) {
  return (
    <div className="db-skeleton-card" style={{ height }}>
      <div className="db-skeleton-pulse db-skeleton-icon"></div>
      <div className="db-skeleton-body">
        <div className="db-skeleton-pulse db-skeleton-line short"></div>
        <div className="db-skeleton-pulse db-skeleton-line long"></div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="db-skeleton-list">
      <div className="db-skeleton-pulse db-skeleton-line long" style={{ marginBottom: '1rem' }}></div>
      <div className="db-skeleton-pulse db-skeleton-line medium" style={{ marginBottom: '1rem' }}></div>
      <div className="db-skeleton-pulse db-skeleton-line short"></div>
    </div>
  );
}

/* ─── Error Alert State ─────────────────────────────── */
function ErrorWidget({ message, onRetry }) {
  return (
    <div className="db-error-widget">
      <div className="db-error-content">
        <AlertCircle size={20} className="db-error-icon" />
        <span className="db-error-text">{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="db-retry-btn">
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────── */
function EmptyWidget({ message, icon }) {
  return (
    <div className="db-empty-widget">
      {icon || <Inbox size={32} className="db-empty-icon" />}
      <p className="db-empty-text">{message}</p>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────── */
function StatCard({ icon, label, value, accent, to, isLoading, error }) {
  const cardContent = (
    <div className="db-stat-card glass-card">
      <div className="db-stat-icon" style={{ background: accent + '1a', color: accent }}>
        {icon}
      </div>
      <div className="db-stat-body">
        <p className="db-stat-label">{label}</p>
        <div className="db-stat-value" style={{ color: accent }}>
          {value}
        </div>
      </div>
    </div>
  );

  if (isLoading) return <CardSkeleton height="96px" />;
  if (error) return <ErrorWidget message={error} />;

  if (to) {
    return <Link to={to} className="db-stat-link">{cardContent}</Link>;
  }
  return cardContent;
}

/* ─── Quick Action Card ──────────────────────────────── */
function ActionCard({ icon, label, description, to, accent }) {
  return (
    <Link to={to} className="db-action-card glass-card">
      <div className="db-action-icon" style={{ background: accent + '1a', color: accent }}>
        {icon}
      </div>
      <div className="db-action-body">
        <h4 className="db-action-label">{label}</h4>
        <p className="db-action-desc">{description}</p>
      </div>
      <div className="db-action-arrow">
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}

/* ─── Profile Info Card ──────────────────────────────── */
function ProfileInfoCard({ user, identityDetails, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="db-profile-card glass-card">
        <ListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="db-profile-card glass-card">
        <ErrorWidget message={error} />
      </div>
    );
  }

  return (
    <div className="db-profile-card glass-card">
      <div className="db-profile-header">
        <div className="db-profile-avatar">
          {user?.name ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'U'}
        </div>
        <div className="db-profile-meta">
          <h4>{user?.name}</h4>
          <p>{user?.email}</p>
          <span className="badge badge-primary">{ROLE_LABEL[user?.role]}</span>
        </div>
      </div>

      <div className="db-profile-details">
        {identityDetails ? (
          <div className="db-profile-grid">
            {identityDetails.departmentName && (
              <div className="db-profile-item">
                <span className="label">Department</span>
                <span className="val">{identityDetails.departmentName}</span>
              </div>
            )}
            {identityDetails.registerNumber && (
              <div className="db-profile-item">
                <span className="label">Register Number</span>
                <span className="val">{identityDetails.registerNumber}</span>
              </div>
            )}
            {identityDetails.year && (
              <div className="db-profile-item">
                <span className="label">Academic Year</span>
                <span className="val">Year {identityDetails.year}</span>
              </div>
            )}
            {identityDetails.designation && (
              <div className="db-profile-item">
                <span className="label">Designation</span>
                <span className="val">{identityDetails.designation}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="db-profile-unlinked">
            <div className="db-info-alert">
              <AlertCircle size={16} />
              <span>Your user account is not linked to any active record. Contact administrator.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role ?? 'GUEST';

  // Stats for Admin / HOD
  const [stats, setStats] = useState({
    feedback: { value: 0, loading: false, error: null },
    faculty: { value: 0, loading: false, error: null },
    students: { value: 0, loading: false, error: null },
    courses: { value: 0, loading: false, error: null },
    departments: { value: 0, loading: false, error: null },
  });

  // Identity state
  const [identity, setIdentity] = useState({ data: null, loading: false, error: null });

  // Faculty and Student Dashboard specific states
  const [facultyFeedback, setFacultyFeedback] = useState({ list: [], loading: false, error: null });
  const [studentFeedback, setStudentFeedback] = useState({ list: [], loading: false, error: null });
  const [departmentCourses, setDepartmentCourses] = useState({ list: [], loading: false, error: null });
  const [departmentColleagues, setDepartmentColleagues] = useState({ list: [], loading: false, error: null });
  const [departmentFaculty, setDepartmentFaculty] = useState({ list: [], loading: false, error: null });

  // Parallel fetch logic for Admin & HOD dashboard stats
  const loadAdminHODStats = useCallback(async () => {
    // We execute stats requests in parallel
    const statFetchers = [
      { key: 'feedback', service: feedbackService.getAll },
      { key: 'faculty', service: facultyService.getAll },
      { key: 'students', service: studentService.getAll },
      { key: 'courses', service: courseService.getAll },
      { key: 'departments', service: departmentService.getAll },
    ];

    statFetchers.forEach(({ key, service }) => {
      setStats(prev => ({ ...prev, [key]: { ...prev[key], loading: true, error: null } }));
      service()
        .then(res => {
          if (res.success) {
            setStats(prev => ({
              ...prev,
              [key]: { value: res.data?.length ?? 0, loading: false, error: null }
            }));
          } else {
            throw new Error(res.message || 'Failed to retrieve data');
          }
        })
        .catch(err => {
          setStats(prev => ({
            ...prev,
            [key]: { value: 0, loading: false, error: extractError(err) }
          }));
        });
    });
  }, []);

  // Resolve Student/Faculty profile record & then load context data
  const resolveProfileAndContext = useCallback(async () => {
    if (role !== 'STUDENT' && role !== 'FACULTY') return;

    setIdentity(prev => ({ ...prev, loading: true, error: null }));

    try {
      const userEmail = (user?.email ?? '').toLowerCase();

      if (role === 'STUDENT') {
        const studentRes = await studentService.getAll();
        if (studentRes.success) {
          const match = (studentRes.data ?? []).find(s => (s.email ?? '').toLowerCase() === userEmail);
          if (match) {
            const resolvedStudent = {
              id: match.id,
              name: match.name,
              email: match.email,
              departmentId: match.department?.id,
              departmentName: match.department?.departmentName || 'Not Assigned',
              registerNumber: match.registerNumber,
              year: match.year
            };
            setIdentity({ data: resolvedStudent, loading: false, error: null });

            // Fetch Student Context Data in Parallel
            loadStudentContext(resolvedStudent);
          } else {
            setIdentity({ data: null, loading: false, error: 'Student record not found for this account email.' });
          }
        } else {
          throw new Error(studentRes.message || 'Failed to resolve students list');
        }
      } else if (role === 'FACULTY') {
        const facultyRes = await facultyService.getAll();
        if (facultyRes.success) {
          const match = (facultyRes.data ?? []).find(f => (f.email ?? '').toLowerCase() === userEmail);
          if (match) {
            const resolvedFaculty = {
              id: match.id,
              name: match.name,
              email: match.email,
              departmentId: match.department?.id,
              departmentName: match.department?.departmentName || 'Not Assigned',
              designation: match.designation
            };
            setIdentity({ data: resolvedFaculty, loading: false, error: null });

            // Fetch Faculty Context Data in Parallel
            loadFacultyContext(resolvedFaculty);
          } else {
            setIdentity({ data: null, loading: false, error: 'Faculty record not found for this account email.' });
          }
        } else {
          throw new Error(facultyRes.message || 'Failed to resolve faculty list');
        }
      }
    } catch (err) {
      setIdentity({ data: null, loading: false, error: extractError(err) });
    }
  }, [role, user?.email]);

  // Load context data for Faculty
  const loadFacultyContext = (faculty) => {
    // 1. Fetch Feedback for this faculty
    setFacultyFeedback(prev => ({ ...prev, loading: true, error: null }));
    feedbackService.getByFaculty(faculty.id)
      .then(res => {
        if (res.success) {
          setFacultyFeedback({ list: res.data ?? [], loading: false, error: null });
        } else {
          throw new Error(res.message);
        }
      })
      .catch(err => {
        setFacultyFeedback({ list: [], loading: false, error: extractError(err) });
      });

    // 2. Fetch all courses (to filter department courses)
    setDepartmentCourses(prev => ({ ...prev, loading: true, error: null }));
    courseService.getAll()
      .then(res => {
        if (res.success) {
          const filtered = (res.data ?? []).filter(c => c.department?.id === faculty.departmentId);
          setDepartmentCourses({ list: filtered, loading: false, error: null });
        } else {
          throw new Error(res.message);
        }
      })
      .catch(err => {
        setDepartmentCourses({ list: [], loading: false, error: extractError(err) });
      });

    // 3. Fetch colleagues (faculty in the same department, excluding current faculty)
    setDepartmentColleagues(prev => ({ ...prev, loading: true, error: null }));
    facultyService.getAll()
      .then(res => {
        if (res.success) {
          const filtered = (res.data ?? []).filter(f => f.department?.id === faculty.departmentId && f.id !== faculty.id);
          setDepartmentColleagues({ list: filtered, loading: false, error: null });
        } else {
          throw new Error(res.message);
        }
      })
      .catch(err => {
        setDepartmentColleagues({ list: [], loading: false, error: extractError(err) });
      });
  };

  // Load context data for Student
  const loadStudentContext = (student) => {
    // 1. Fetch Feedback submitted by this student
    setStudentFeedback(prev => ({ ...prev, loading: true, error: null }));
    feedbackService.getByStudent(student.id)
      .then(res => {
        if (res.success) {
          setStudentFeedback({ list: res.data ?? [], loading: false, error: null });
        } else {
          throw new Error(res.message);
        }
      })
      .catch(err => {
        setStudentFeedback({ list: [], loading: false, error: extractError(err) });
      });

    // 2. Fetch all courses (to filter department courses)
    setDepartmentCourses(prev => ({ ...prev, loading: true, error: null }));
    courseService.getAll()
      .then(res => {
        if (res.success) {
          const filtered = (res.data ?? []).filter(c => c.department?.id === student.departmentId);
          setDepartmentCourses({ list: filtered, loading: false, error: null });
        } else {
          throw new Error(res.message);
        }
      })
      .catch(err => {
        setDepartmentCourses({ list: [], loading: false, error: extractError(err) });
      });

    // 3. Fetch faculty in department
    setDepartmentFaculty(prev => ({ ...prev, loading: true, error: null }));
    facultyService.getAll()
      .then(res => {
        if (res.success) {
          const filtered = (res.data ?? []).filter(f => f.department?.id === student.departmentId);
          setDepartmentFaculty({ list: filtered, loading: false, error: null });
        } else {
          throw new Error(res.message);
        }
      })
      .catch(err => {
        setDepartmentFaculty({ list: [], loading: false, error: extractError(err) });
      });
  };

  // Trigger loading based on roles
  useEffect(() => {
    if (['ADMIN', 'HOD'].includes(role)) {
      loadAdminHODStats();
    } else {
      resolveProfileAndContext();
    }
  }, [role, loadAdminHODStats, resolveProfileAndContext]);

  // Actions configuration
  const ACTIONS = {
    ADMIN: [
      { icon: <Building2 size={20} />, label: 'Departments', description: 'Manage departments & faculties', to: '/departments', accent: '#7C3AED' },
      { icon: <BookOpen size={20} />,  label: 'Courses',     description: 'View & modify course syllabus', to: '/courses',     accent: '#2563EB' },
      { icon: <Users size={20} />,     label: 'Faculty',     description: 'Browse & register instructors', to: '/faculty',     accent: '#059669' },
      { icon: <GraduationCap size={20} />, label: 'Students', description: 'Manage student enrollment list', to: '/students',    accent: '#D97706' },
      { icon: <List size={20} />,      label: 'All Feedback', description: 'Review collected evaluations', to: '/feedback/all', accent: '#DC2626' },
      { icon: <BarChart2 size={20} />, label: 'Reports',     description: 'View ratings metrics & trends', to: '/reports',     accent: '#0891B2' },
    ],
    HOD: [
      { icon: <Building2 size={20} />, label: 'Departments', description: 'View department details', to: '/departments', accent: '#7C3AED' },
      { icon: <BookOpen size={20} />,  label: 'Courses',     description: 'Manage courses syllabus', to: '/courses',     accent: '#2563EB' },
      { icon: <Users size={20} />,     label: 'Faculty',     description: 'Manage department staff', to: '/faculty',     accent: '#059669' },
      { icon: <GraduationCap size={20} />, label: 'Students', description: 'View department students', to: '/students',    accent: '#D97706' },
      { icon: <BarChart2 size={20} />, label: 'Reports',     description: 'View rating metrics & trends', to: '/reports',     accent: '#0891B2' },
    ],
    FACULTY: [
      { icon: <List size={20} />,      label: 'Feedback List', description: 'Browse student evaluations', to: '/feedback/all', accent: '#DC2626' },
      { icon: <BookOpen size={20} />,  label: 'Courses',      description: 'Browse catalog of courses', to: '/courses',      accent: '#2563EB' },
      { icon: <BarChart2 size={20} />, label: 'Reports',      description: 'View average score report', to: '/reports',      accent: '#0891B2' },
    ],
    STUDENT: [
      { icon: <PlusCircle size={20} />, label: 'Submit Feedback', description: 'Rate courses and instructors', to: '/feedback/submit', accent: '#7C3AED' },
      { icon: <List size={20} />,       label: 'My Feedback',     description: 'Review your submission logs', to: '/feedback/list',   accent: '#059669' },
      { icon: <BookOpen size={20} />,   label: 'Courses',         description: 'Browse available courses list', to: '/courses',          accent: '#2563EB' },
      { icon: <Users size={20} />,      label: 'Faculty Members', description: 'Browse campus instructors catalog', to: '/faculty',     accent: '#D97706' },
    ],
    GUEST: [
      { icon: <BookOpen size={20} />, label: 'Courses Catalog', description: 'Browse active catalog list', to: '/courses', accent: '#2563EB' },
      { icon: <Users size={20} />,    label: 'Faculty List',    description: 'Browse active professors', to: '/faculty', accent: '#059669' },
    ],
  };

  const actions = ACTIONS[role] ?? ACTIONS.GUEST;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Helper to calculate average rating
  const calculateAverageRating = (list) => {
    if (!list || list.length === 0) return '0.0';
    const sum = list.reduce((acc, curr) => acc + (curr.rating ?? 0), 0);
    return (sum / list.length).toFixed(1);
  };

  // Render stats section for Admin/HOD
  const renderAdminHODDashboard = () => (
    <div className="db-main-area">
      <section className="db-section animate-fade-in">
        <h2 className="db-section-title">
          {role === 'HOD' && user?.departmentName ? `Overview Statistics - ${user.departmentName}` : 'Overview Statistics'}
        </h2>
        <div className="db-stats-grid">
          <StatCard
            icon={<MessageSquare size={22} />}
            label={role === 'HOD' ? "Total Department Feedback" : "Total Feedback"}
            value={stats.feedback.value}
            isLoading={stats.feedback.loading}
            error={stats.feedback.error}
            accent="#4F46E5"
            to="/feedback/all"
          />
          <StatCard
            icon={<Users size={22} />}
            label={role === 'HOD' ? "Total Department Faculty" : "Total Faculty"}
            value={stats.faculty.value}
            isLoading={stats.faculty.loading}
            error={stats.faculty.error}
            accent="#10B981"
            to="/faculty"
          />
          <StatCard
            icon={<BookOpen size={22} />}
            label={role === 'HOD' ? "Total Department Courses" : "Total Courses"}
            value={stats.courses.value}
            isLoading={stats.courses.loading}
            error={stats.courses.error}
            accent="#F59E0B"
            to="/courses"
          />
          <StatCard
            icon={<GraduationCap size={22} />}
            label={role === 'HOD' ? "Total Department Students" : "Total Students"}
            value={stats.students.value}
            isLoading={stats.students.loading}
            error={stats.students.error}
            accent="#EF4444"
            to="/students"
          />
          {role === 'ADMIN' && (
            <StatCard
              icon={<Building2 size={22} />}
              label="Total Departments"
              value={stats.departments.value}
              isLoading={stats.departments.loading}
              error={stats.departments.error}
              accent="#8B5CF6"
              to="/departments"
            />
          )}
        </div>
      </section>
    </div>
  );

  // Render Faculty Dashboard
  const renderFacultyDashboard = () => {
    const avgRating = calculateAverageRating(facultyFeedback.list);
    const feedbackCount = facultyFeedback.list.length;

    return (
      <div className="db-role-layout">
        <div className="db-role-main">
          {/* Faculty Feedback Statistics */}
          <section className="db-section">
            <h2 className="db-section-title">Feedback Overview</h2>
            <div className="db-stats-grid">
              <div className="db-stat-card glass-card">
                <div className="db-stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}>
                  <MessageSquare size={22} />
                </div>
                <div className="db-stat-body">
                  <p className="db-stat-label">Feedback Received</p>
                  <div className="db-stat-value">
                    {facultyFeedback.loading ? (
                      <Loader size={18} className="spin" />
                    ) : facultyFeedback.error ? (
                      <span className="db-err-val"><AlertCircle size={16} /></span>
                    ) : (
                      feedbackCount
                    )}
                  </div>
                </div>
              </div>

              <div className="db-stat-card glass-card">
                <div className="db-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                  <Star size={22} />
                </div>
                <div className="db-stat-body">
                  <p className="db-stat-label">Average Score</p>
                  <div className="db-stat-value">
                    {facultyFeedback.loading ? (
                      <Loader size={18} className="spin" />
                    ) : facultyFeedback.error ? (
                      <span className="db-err-val"><AlertCircle size={16} /></span>
                    ) : (
                      `${avgRating} / 5.0`
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Department courses list */}
          <section className="db-section">
            <h2 className="db-section-title">My Department Courses</h2>
            {departmentCourses.loading ? (
              <ListSkeleton />
            ) : departmentCourses.error ? (
              <ErrorWidget message={departmentCourses.error} />
            ) : departmentCourses.list.length === 0 ? (
              <EmptyWidget message="No courses mapped to your department yet." />
            ) : (
              <div className="db-list-grid">
                {departmentCourses.list.map(course => (
                  <div key={course.id} className="db-list-item glass-card">
                    <div className="db-item-header">
                      <BookOpen size={18} className="db-item-icon text-primary" />
                      <div>
                        <h4 className="db-item-name">{course.courseName}</h4>
                        <span className="db-item-sub">{course.courseCode}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Feedback comments section */}
          <section className="db-section">
            <h2 className="db-section-title">Recent Feedback Responses</h2>
            {facultyFeedback.loading ? (
              <ListSkeleton />
            ) : facultyFeedback.error ? (
              <ErrorWidget message={facultyFeedback.error} />
            ) : facultyFeedback.list.length === 0 ? (
              <EmptyWidget message="No students have submitted feedback for you yet." />
            ) : (
              <div className="db-feedback-list">
                {facultyFeedback.list.slice(0, 5).map(fb => (
                  <div key={fb.id} className="db-feedback-card glass-card">
                    <div className="db-fb-header">
                      <div className="db-fb-rating">
                        {[...Array(5)].map((_, i) => (
                          <Star
                             key={i}
                             size={16}
                             fill={i < (fb.rating ?? 0) ? '#F59E0B' : 'transparent'}
                             color={i < (fb.rating ?? 0) ? '#F59E0B' : '#E5E7EB'}
                          />
                        ))}
                      </div>
                      <span className="db-fb-date">
                        {fb.submittedDate ? new Date(fb.submittedDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {fb.course && (
                      <div className="db-fb-course-tag">
                        <strong>Course:</strong> {fb.course.courseName} ({fb.course.courseCode})
                      </div>
                    )}
                    <p className="db-fb-comment">
                      {fb.comments ? `"${fb.comments}"` : <em>No written comments provided.</em>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="db-role-side">
          <ProfileInfoCard
            user={user}
            identityDetails={identity.data}
            isLoading={identity.loading}
            error={identity.error}
          />

          <section className="db-section" style={{ marginTop: '1.5rem' }}>
            <h2 className="db-section-title">Department Colleagues</h2>
            {departmentColleagues.loading ? (
              <Loader size={20} className="spin" />
            ) : departmentColleagues.error ? (
              <ErrorWidget message={departmentColleagues.error} />
            ) : departmentColleagues.list.length === 0 ? (
              <EmptyWidget message="No other faculty in department." />
            ) : (
              <div className="db-colleagues-list">
                {departmentColleagues.list.map(col => (
                  <div key={col.id} className="db-colleague-card glass-card">
                    <div className="db-colleague-avatar">
                      {col.name ? col.name.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div className="db-colleague-info">
                      <h5>{col.name}</h5>
                      <p>{col.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  };

  // Render Student Dashboard
  const renderStudentDashboard = () => {
    return (
      <div className="db-role-layout">
        <div className="db-role-main">
          {/* Department courses list */}
          <section className="db-section">
            <h2 className="db-section-title">My Department Courses</h2>
            {departmentCourses.loading ? (
              <ListSkeleton />
            ) : departmentCourses.error ? (
              <ErrorWidget message={departmentCourses.error} />
            ) : departmentCourses.list.length === 0 ? (
              <EmptyWidget message="No courses available for your department." />
            ) : (
              <div className="db-list-grid">
                {departmentCourses.list.map(course => (
                  <div key={course.id} className="db-list-item glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div className="db-item-header">
                      <BookOpen size={18} className="db-item-icon text-primary" />
                      <div>
                        <h4 className="db-item-name">{course.courseName}</h4>
                        <span className="db-item-sub">{course.courseCode}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <Link
                        to="/feedback/submit"
                        state={{ courseId: course.id }}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        Give Feedback
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Feedback history section */}
          <section className="db-section">
            <h2 className="db-section-title">My Feedback Submission Log</h2>
            {studentFeedback.loading ? (
              <ListSkeleton />
            ) : studentFeedback.error ? (
              <ErrorWidget message={studentFeedback.error} />
            ) : studentFeedback.list.length === 0 ? (
              <EmptyWidget message="You haven't submitted any feedback yet." />
            ) : (
              <div className="db-feedback-list">
                {studentFeedback.list.slice(0, 5).map(fb => (
                  <div key={fb.id} className="db-feedback-card glass-card">
                    <div className="db-fb-header">
                      <div>
                        <h5 className="db-fb-faculty-name">{fb.faculty?.name || 'Unknown Faculty'}</h5>
                        <p className="db-fb-faculty-sub">{fb.faculty?.designation}</p>
                      </div>
                      <div className="db-fb-meta-right">
                        <div className="db-fb-rating">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < (fb.rating ?? 0) ? '#F59E0B' : 'transparent'}
                              color={i < (fb.rating ?? 0) ? '#F59E0B' : '#E5E7EB'}
                            />
                          ))}
                        </div>
                        <span className="db-fb-date">
                          {fb.submittedDate ? new Date(fb.submittedDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {fb.course && (
                      <div className="db-fb-course-tag">
                        <strong>Course:</strong> {fb.course.courseName} ({fb.course.courseCode})
                      </div>
                    )}
                    {fb.comments && (
                      <p className="db-fb-comment">
                        "{fb.comments}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="db-role-side">
          <ProfileInfoCard
            user={user}
            identityDetails={identity.data}
            isLoading={identity.loading}
            error={identity.error}
          />

          <section className="db-section" style={{ marginTop: '1.5rem' }}>
            <h2 className="db-section-title">Department Instructors</h2>
            {departmentFaculty.loading ? (
              <Loader size={20} className="spin" />
            ) : departmentFaculty.error ? (
              <ErrorWidget message={departmentFaculty.error} />
            ) : departmentFaculty.list.length === 0 ? (
              <EmptyWidget message="No faculty mapped to your department." />
            ) : (
              <div className="db-colleagues-list">
                {departmentFaculty.list.map(fac => (
                  <div key={fac.id} className="db-colleague-card glass-card">
                    <div className="db-colleague-avatar">
                      {fac.name ? fac.name.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div className="db-colleague-info">
                      <h5>{fac.name}</h5>
                      <p>{fac.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  };

  return (
    <div className="db-page animate-fade-in">
      {/* Dynamic Role Banner */}
      <div className="db-banner glass-card">
        <div className="db-banner-left">
          <p className="db-greeting">{greeting} 👋</p>
          <h1 className="db-name">{user?.name ?? 'Guest User'}</h1>
          <span className="badge badge-primary db-role-badge">
            <ShieldCheck size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {ROLE_LABEL[role]}
          </span>
        </div>
        <div className="db-banner-icon">
          <TrendingUp size={64} color="var(--primary)" opacity={0.12} />
        </div>
      </div>

      {role === 'ADMIN' || role === 'HOD' ? (
        renderAdminHODDashboard()
      ) : role === 'FACULTY' ? (
        renderFacultyDashboard()
      ) : role === 'STUDENT' ? (
        renderStudentDashboard()
      ) : (
        <div className="db-main-area">
          <section className="db-section">
            <h2 className="db-section-title">Quick Actions</h2>
            <div className="db-actions-grid">
              {actions.map((a) => (
                <ActionCard key={a.to} {...a} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

