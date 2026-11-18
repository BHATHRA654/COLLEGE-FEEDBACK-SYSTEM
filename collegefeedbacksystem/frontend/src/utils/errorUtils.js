/**
 * Reusable Error Extraction Utility
 * Parses Axios error objects and extracts a user-friendly message based on status code
 * and backend response body payloads.
 */
/**
 * Reusable Error Extraction Utility
 * Parses Axios error objects and extracts a user-friendly message based on status code
 * and backend response body payloads.
 */
export function extractError(err) {
  // If there's no error object, return a fallback
  if (!err) {
    return 'An unknown error occurred.';
  }

  // Check if it's a network error (no response received)
  if (err.message === 'Network Error' || !err.response) {
    return 'Network failure. Please check your internet connection or backend server status.';
  }

  const { status, data } = err.response;

  // Extract message from standard Spring Boot / ApiResponse wrapper if present
  const backendMessage = data?.message || data?.error;
  
  // Strict regex check to prevent java stack traces from reaching the user
  const isStackTrace = typeof backendMessage === 'string' && (
    backendMessage.includes('Exception:') || 
    backendMessage.includes('java.lang') || 
    backendMessage.includes('.java:') ||
    backendMessage.includes('\tat ') ||
    backendMessage.includes('NullPointerException') ||
    backendMessage.includes('BindingResult')
  );
  
  const safeMessage = isStackTrace ? null : backendMessage;

  switch (status) {
    case 400:
      return safeMessage || 'Validation failure. Please check your inputs.';
    case 401:
      // Clear authentication and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return safeMessage || 'Unauthorized access. Please login again.';
    case 403:
      return 'Access Denied. You do not have permissions for this action.';
    case 404:
      return safeMessage || 'Requested resource could not be found.';
    case 409:
      return safeMessage || 'Conflict occurred. This record or key may already exist.';
    case 500:
      return 'Internal Server Error. Please contact your system administrator.';
    default:
      return safeMessage || `Server returned error status ${status}.`;
  }
}
