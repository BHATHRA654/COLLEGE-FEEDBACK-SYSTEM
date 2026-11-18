const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validators = {
  // Authentication validation (Login/Register)
  auth: (data, isRegister = true) => {
    const errors = {};
    if (isRegister) {
      if (!data.name || !data.name.trim()) {
        errors.name = 'Name is required.';
      }
      if (!data.role) {
        errors.role = 'Role is required.';
      }
    }
    if (!data.email || !data.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!data.password) {
      errors.password = 'Password is required.';
    } else if (isRegister && data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Department validation
  department: (data) => {
    const errors = {};
    if (!data.departmentName || !data.departmentName.trim()) {
      errors.departmentName = 'Department name is required.';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Course validation
  course: (data) => {
    const errors = {};
    if (!data.courseName || !data.courseName.trim()) {
      errors.courseName = 'Course name is required.';
    }
    if (!data.courseCode || !data.courseCode.trim()) {
      errors.courseCode = 'Course code is required.';
    }
    if (!data.department || !data.department.id) {
      errors.departmentId = 'Department is required.';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Faculty validation
  faculty: (data) => {
    const errors = {};
    if (!data.name || !data.name.trim()) {
      errors.name = 'Name is required.';
    }
    if (!data.email || !data.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!data.designation || !data.designation.trim()) {
      errors.designation = 'Designation is required.';
    }
    if (!data.department || !data.department.id) {
      errors.departmentId = 'Department is required.';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Student validation
  student: (data) => {
    const errors = {};
    if (!data.name || !data.name.trim()) {
      errors.name = 'Name is required.';
    }
    if (!data.email || !data.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!data.registerNumber || !data.registerNumber.trim()) {
      errors.registerNumber = 'Register number is required.';
    }
    if (!data.department || !data.department.id) {
      errors.departmentId = 'Department is required.';
    }
    if (data.year === undefined || data.year === null || data.year === '') {
      errors.year = 'Academic year is required.';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Feedback validation
  feedback: (data) => {
    const errors = {};
    if (!data.student || !data.student.id) {
      errors.student = 'Student is required.';
    }
    if (!data.course || !data.course.id) {
      errors.courseId = 'Course is required.';
    }
    
    // Rating validation (Coerced safely to match constraints)
    const ratingNum = data.rating !== undefined && data.rating !== null && data.rating !== '' ? Number(data.rating) : NaN;
    if (data.rating === undefined || data.rating === null || data.rating === '' || isNaN(ratingNum)) {
      errors.rating = 'Please choose a rating.';
    } else if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.rating = 'Rating must be an integer between 1 and 5.';
    }

    if (data.comments && data.comments.length > 500) {
      errors.comments = 'Comments maximum 500 characters.';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};
