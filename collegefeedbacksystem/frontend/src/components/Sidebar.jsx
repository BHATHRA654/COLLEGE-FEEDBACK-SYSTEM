import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NavigationContext } from '../context/NavigationContext';
import SidebarStats from './SidebarStats';
import {
  LayoutDashboard,
  PlusSquare,
  MessageSquare,
  List,
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  BarChart2,
  X
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { ROUTE_CONFIG } from '../routes/routeConfig';
import './Sidebar.css';

const ICON_MAP = {
  LayoutDashboard: <LayoutDashboard size={18} />,
  PlusSquare:      <PlusSquare size={18} />,
  MessageSquare:   <MessageSquare size={18} />,
  List:            <List size={18} />,
  BookOpen:        <BookOpen size={18} />,
  Users:           <Users size={18} />,
  GraduationCap:   <GraduationCap size={18} />,
  Building2:       <Building2 size={18} />,
  BarChart2:       <BarChart2 size={18} />,
};

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const { isMobileOpen, closeMobileSidebar } = useContext(NavigationContext);

  // Sync fallback to localStorage to prevent layout flicker or missing items during context mount
  const storedUserStr = localStorage.getItem('user');
  const storedRole = storedUserStr ? JSON.parse(storedUserStr)?.role : null;
  const userRole = user?.role || storedRole || 'GUEST';

  const visibleItems = ROUTE_CONFIG.filter(
    (item) => item.showInSidebar && item.allowedRoles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobileSidebar} />
      )}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <BrandLogo variant="sidebar" />
          </div>
          <button className="sidebar-close-btn" onClick={closeMobileSidebar} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-title">Navigation</p>
          <ul>
            {visibleItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {ICON_MAP[item.icon]}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <SidebarStats />
      </aside>
    </>
  );
};

export default Sidebar;
