/**
 * CENTRALIZED ROUTE CONFIGURATION
 *
 * Single source of truth for:
 *  - which roles can access each route
 *  - which items appear in the sidebar
 *  - icon metadata for nav items
 *
 * Sidebar visibility is driven from this config;
 * route-level protection is also enforced by ProtectedRoute using `allowedRoles`.
 *
 * Roles: ADMIN | HOD | FACULTY | STUDENT | GUEST
 */

// All valid backend roles — do not add extras here
export const ALL_ROLES = ['ADMIN', 'HOD', 'FACULTY', 'STUDENT', 'GUEST'];

// Routes that require authentication (allowedRoles: null means any authenticated user)
// Routes with allowedRoles array enforce specific role access
export const ROUTE_CONFIG = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    // All authenticated users including GUEST can see the dashboard
    allowedRoles: ['ADMIN', 'HOD', 'FACULTY', 'STUDENT', 'GUEST'],
    showInSidebar: true,
  },
  {
    path: '/feedback/submit',
    label: 'Submit Feedback',
    icon: 'PlusSquare',
    // Only students submit feedback
    allowedRoles: ['STUDENT'],
    showInSidebar: true,
  },
  {
    path: '/feedback/list',
    label: 'My Feedback',
    icon: 'MessageSquare',
    // Students see their own; staff/admins see all (handled inside the component)
    allowedRoles: ['STUDENT'],
    showInSidebar: true,
  },
  {
    path: '/feedback/all',
    label: 'All Feedback',
    icon: 'List',
    allowedRoles: ['ADMIN', 'HOD', 'FACULTY'],
    showInSidebar: true,
  },
  {
    path: '/courses',
    label: 'Courses',
    icon: 'BookOpen',
    allowedRoles: ['ADMIN', 'HOD', 'FACULTY', 'STUDENT'],
    showInSidebar: true,
  },
  {
    path: '/faculty',
    label: 'Faculty',
    icon: 'Users',
    allowedRoles: ['ADMIN', 'HOD', 'FACULTY', 'STUDENT'],
    showInSidebar: true,
  },
  {
    path: '/students',
    label: 'Students',
    icon: 'GraduationCap',
    // Students must NOT access admin student management
    allowedRoles: ['ADMIN', 'HOD'],
    showInSidebar: true,
  },
  {
    path: '/departments',
    label: 'Departments',
    icon: 'Building2',
    allowedRoles: ['ADMIN'],
    showInSidebar: true,
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: 'BarChart2',
    allowedRoles: ['ADMIN', 'HOD', 'FACULTY'],
    showInSidebar: true,
  },
];

/**
 * Helper: does a given role have access to a specific path?
 */
export function hasAccess(role, path) {
  const route = ROUTE_CONFIG.find((r) => r.path === path);
  if (!route) return false;
  return route.allowedRoles.includes(role);
}
