/**
 * Extracts a meaningful error message from an API error response.
 * @param {any} err - The error object thrown by Axios/API call.
 * @returns {string} The user-friendly error message.
 */
export const getErrorMessage = (err) => {
  // If it's a network/connectivity issue
  if (!err.response) {
    return 'Cannot reach the backend server. Make sure Spring Boot is running on port 8080.';
  }

  const status = err.response.status;
  const backendMessage = err.response.data?.message;

  switch (status) {
    case 400:
      return backendMessage || 'Invalid request. Please check your inputs.';
    case 403:
      return 'Access denied.';
    case 404:
      return 'Registration endpoint not found.';
    case 409:
      return backendMessage || 'This email address is already registered.';
    case 500:
      return 'Server error. Check the Spring Boot console.';
    default:
      return backendMessage || `Request failed with status ${status}. Please try again.`;
  }
};
