import React, { useState, useEffect, useContext } from 'react';
import { MessageSquare, Users, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { facultyService } from '../services/facultyService';
import { studentService } from '../services/studentService';
import { courseService } from '../services/courseService';
import { departmentService } from '../services/departmentService';
import { feedbackService } from '../services/feedbackService';

const SidebarStats = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;

    let cancelled = false;
    setLoading(true);

    Promise.allSettled([
      feedbackService.getAll(),
      facultyService.getAll(),
      studentService.getAll(),
      courseService.getAll(),
      departmentService.getAll(),
    ]).then(([fb, fac, stu, crs, dep]) => {
      if (cancelled) return;
      const count = (r) => (r.status === 'fulfilled' && r.value?.success ? (r.value.data?.length ?? 0) : 0);
      setStats({
        feedback: count(fb),
        faculty: count(fac),
        students: count(stu),
        courses: count(crs),
        departments: count(dep),
      });
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user?.role]);

  if (user?.role !== 'ADMIN') return null;

  const rows = [
    { icon: <MessageSquare size={15} />, label: 'Feedback', value: stats?.feedback, accent: '#4F46E5' },
    { icon: <Users size={15} />, label: 'Faculty', value: stats?.faculty, accent: '#059669' },
    { icon: <BookOpen size={15} />, label: 'Courses', value: stats?.courses, accent: '#2563EB' },
    { icon: <GraduationCap size={15} />, label: 'Students', value: stats?.students, accent: '#D97706' },
    { icon: <Building2 size={15} />, label: 'Departments', value: stats?.departments, accent: '#7C3AED' },
  ];

  return (
    <div className="sidebar-stats">
      <p className="sidebar-section-title">Overview</p>
      {rows.map((r) => (
        <div key={r.label} className="sidebar-stat-row">
          <span className="sidebar-stat-icon" style={{ background: r.accent + '1a', color: r.accent }}>
            {r.icon}
          </span>
          <span className="sidebar-stat-label">{r.label}</span>
          <span className="sidebar-stat-value" style={{ color: r.accent }}>
            {loading ? '–' : (r.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SidebarStats;
