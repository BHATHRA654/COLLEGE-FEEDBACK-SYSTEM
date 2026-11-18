import React, { useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NavigationContext } from '../context/NavigationContext';
import { LogOut, User, Menu, ChevronDown, Shield } from 'lucide-react';
import { ROUTE_CONFIG } from '../routes/routeConfig';
import './Navbar.css';

const Navbar = () => {
  const { user, logoutContext } = useContext(AuthContext);
  const { toggleMobileSidebar } = useContext(NavigationContext);
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine page title dynamically based on location path
  const currentRoute = ROUTE_CONFIG.find(route => {
    if (route.path === location.pathname) return true;
    if (location.pathname.startsWith('/feedback/') && route.path.startsWith('/feedback/')) {
      return route.path === location.pathname;
    }
    return false;
  });

  const pageTitle = currentRoute ? currentRoute.label : 'College Feedback System';

  const userInitials = user?.name 
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() 
    : 'U';

  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <button 
            className="mobile-menu-toggle" 
            onClick={toggleMobileSidebar} 
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="navbar-page-title">{pageTitle}</h1>
        </div>
        
        <div className="navbar-actions">
          {/* User Profile Container with Dropdown */}
          <div className="user-profile-container" ref={dropdownRef}>
            <button 
              className="user-profile-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Toggle user menu"
            >
              <div className="avatar">
                {userInitials}
              </div>
              <div className="user-info desktop-only">
                <span className="user-name">{user?.name || 'User'}</span>
                <span className="user-email">{user?.email || ''}</span>
              </div>
              <ChevronDown size={16} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="user-dropdown-menu glass-card animate-fade-in">
                <div className="dropdown-user-header">
                  <div className="dropdown-avatar">{userInitials}</div>
                  <div className="dropdown-user-meta">
                    <span className="meta-name">{user?.name}</span>
                    <span className="meta-email">{user?.email}</span>
                    <span className="user-role badge badge-primary">
                      <Shield size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {user?.role}
                    </span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-btn" onClick={logoutContext}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
