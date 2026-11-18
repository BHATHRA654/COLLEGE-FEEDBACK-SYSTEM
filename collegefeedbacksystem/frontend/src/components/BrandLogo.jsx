import React from 'react';
import { GraduationCap } from 'lucide-react';
import './BrandLogo.css';

const BrandLogo = ({ variant = 'default' }) => {
  const isAuth = variant === 'auth';
  
  return (
    <div className={`brand-logo-wrap ${variant}`}>
      <div className="brand-icon-box">
        <GraduationCap size={isAuth ? 36 : 22} color="#fff" />
      </div>
      <div className="brand-logo-text">
        <h1 className="brand-logo-title">EduFeedback</h1>
        <p className="brand-logo-subtitle">College System</p>
      </div>
    </div>
  );
};

export default BrandLogo;
