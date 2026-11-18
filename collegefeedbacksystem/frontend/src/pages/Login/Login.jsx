import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthContext }  from '../../context/AuthContext';
import { authService } from '../../services/authService';
import BrandLogo from '../../components/BrandLogo';
import './Auth.css';

const Login = () => {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [error,     setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginContext } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Backend returns: { success, message, data: { token, role, username, email } }
      const response = await authService.login({ email: email.trim(), password });

      if (response.success) {
        // Map backend fields → normalized user object
        const userData = {
          name:  response.data.username,
          email: response.data.email,
          role:  response.data.role,
          departmentName: response.data.departmentName,
          departmentId: response.data.departmentId,
        };
        loginContext(userData, response.data.token);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to connect to the server. Please try again.'
      );
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

        {/* Error */}
        {error && (
          <div className="alert alert-error auth-alert">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={17} />
              </span>
              <input
                id="login-email"
                type="email"
                className="form-input auth-input"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Lock size={17} />
              </span>
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                className="form-input auth-input auth-input-padded-right"
                placeholder="Your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                required
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
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={isLoading}
          >
            {isLoading
              ? <span className="spinner" style={{ width: 18, height: 18 }} />
              : <LogIn size={18} />}
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
