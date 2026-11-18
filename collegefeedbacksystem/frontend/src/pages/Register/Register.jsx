import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { departmentService } from '../../services/departmentService';
import { getErrorMessage } from '../../utils/errorHelper';
import BrandLogo from '../../components/BrandLogo';
import '../Login/Auth.css';

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'HOD',     label: 'Head of Department' },
  { value: 'ADMIN',   label: 'Administrator' },
  { value: 'GUEST',   label: 'Guest' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'STUDENT', departmentId: ''
  });
  const [departments, setDepartments] = useState([]);
  const [showPwd,   setShowPwd]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState('');
  const [success,   setSuccess]   = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getAll();
        if (response.success) {
          setDepartments(response.data);
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name     = 'Full name is required.';
    if (!form.email.trim())             e.email    = 'Email is required.';
    else if (!EMAIL_RE.test(form.email)) e.email   = 'Enter a valid email address.';
    if (!form.password)                 e.password = 'Password is required.';
    else if (form.password.length < 6)  e.password = 'Password must be at least 6 characters.';
    
    if (form.role === 'HOD' && !form.departmentId) {
      e.departmentId = 'Department is required for HOD.';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccess('');

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    try {
      const response = await authService.register({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role:     form.role,
        departmentId: ['STUDENT', 'FACULTY', 'HOD'].includes(form.role) && form.departmentId ? Number(form.departmentId) : null,
      });

      if (response.success) {
        setSuccess('Account created successfully! Redirecting to login…');
        setTimeout(() => navigate('/login'), 2200);
      } else {
        setApiError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card glass animate-fade-in">

        {/* Branding */}
        <div className="auth-brand" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <BrandLogo variant="auth" />
        </div>

        {apiError && (
          <div className="alert alert-error auth-alert">
            <AlertCircle size={16} />
            {apiError}
          </div>
        )}

        {success && (
          <div className="alert alert-success auth-alert">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">

          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <User size={17} />
              </span>
              <input
                id="reg-name"
                type="text"
                className={`form-input auth-input${errors.name ? ' input-error' : ''}`}
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange('name')}
                autoFocus
                maxLength={150}
              />
            </div>
            {errors.name && <p className="input-error-msg">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={17} />
              </span>
              <input
                id="reg-email"
                type="email"
                className={`form-input auth-input${errors.email ? ' input-error' : ''}`}
                placeholder="you@college.edu"
                value={form.email}
                onChange={handleChange('email')}
                autoComplete="email"
                maxLength={255}
              />
            </div>
            {errors.email && <p className="input-error-msg">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Lock size={17} />
              </span>
              <input
                id="reg-password"
                type={showPwd ? 'text' : 'password'}
                className={`form-input auth-input auth-input-padded-right${errors.password ? ' input-error' : ''}`}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange('password')}
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                className="auth-toggle-pwd"
                onClick={() => setShowPwd((p) => !p)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="input-error-msg">{errors.password}</p>}
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">Role</label>
            <select
              id="reg-role"
              className="form-input form-select"
              value={form.role}
              onChange={handleChange('role')}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Department Select (for Student, Faculty, HOD) */}
          {['STUDENT', 'FACULTY', 'HOD'].includes(form.role) && (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-dept">Department</label>
              <select
                id="reg-dept"
                className={`form-input form-select${errors.departmentId ? ' input-error' : ''}`}
                value={form.departmentId || ''}
                onChange={handleChange('departmentId')}
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                ))}
              </select>
              {errors.departmentId && <p className="input-error-msg">{errors.departmentId}</p>}
            </div>
          )}

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={isLoading || Boolean(success)}
          >
            {isLoading
              ? <span className="spinner" style={{ width: 18, height: 18 }} />
              : <UserPlus size={18} />}
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
