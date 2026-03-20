/**
 * Comprehensive validation utilities for form inputs
 * Provides reusable validation functions with user-friendly error messages
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (supports international formats)
const PHONE_REGEX = /^(\+\d{1,3}[- ]?)?\d{10}$/;

// Password strength regex (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * Validation functions that return error message or null if valid
 */
export const validators = {
  // Required field validation
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Email validation
  email: (value) => {
    if (!value) return null; // Allow empty if not required
    if (!EMAIL_REGEX.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  // Phone validation
  phone: (value) => {
    if (!value) return null; // Allow empty if not required
    if (!PHONE_REGEX.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number (e.g., +254700000000)';
    }
    return null;
  },

  // Password validation
  password: (value) => {
    if (!value) return null; // Allow empty if not required
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!PASSWORD_REGEX.test(value)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return null;
  },

  // Password confirmation validation
  passwordConfirm: (value, data) => {
    if (!value) return null; // Allow empty if not required
    if (value !== data.password) {
      return 'Passwords do not match';
    }
    return null;
  },

  // Minimum length validation
  minLength: (value, minLength, fieldName = 'Field') => {
    if (!value) return null; // Allow empty if not required
    if (value.trim().length < minLength) {
      return `${fieldName} must be at least ${minLength} characters long`;
    }
    return null;
  },

  // Maximum length validation
  maxLength: (value, maxLength, fieldName = 'Field') => {
    if (!value) return null; // Allow empty if not required
    if (value.length > maxLength) {
      return `${fieldName} must be no more than ${maxLength} characters long`;
    }
    return null;
  },

  // Location validation
  location: (value) => {
    if (!value || !value.trim()) {
      return 'Location is required';
    }
    if (value.trim().length < 3) {
      return 'Location must be at least 3 characters long';
    }
    return null;
  },

  // Description validation
  description: (value) => {
    if (!value || !value.trim()) {
      return 'Description is required';
    }
    if (value.trim().length < 10) {
      return 'Description must be at least 10 characters long';
    }
    if (value.length > 500) {
      return 'Description must be no more than 500 characters long';
    }
    return null;
  },

  // Waste type validation
  wasteType: (value) => {
    const validTypes = ['plastic', 'organic', 'paper', 'metal', 'glass', 'electronic', 'hazardous', 'mixed', 'other'];
    if (!value) {
      return 'Waste type is required';
    }
    if (!validTypes.includes(value)) {
      return 'Please select a valid waste type';
    }
    return null;
  },

  // File validation
  file: (file, options = {}) => {
    if (!file) return null; // Allow empty if not required

    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      fieldName = 'File'
    } = options;

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      const typesList = allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ');
      return `${fieldName} must be one of the following types: ${typesList}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / (1024 * 1024));
      return `${fieldName} size must be less than ${sizeMB}MB`;
    }

    return null;
  },

  // Coordinates validation
  coordinates: (latitude, longitude) => {
    if (latitude === null || longitude === null) {
      return 'Location coordinates are required';
    }
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return 'Invalid location coordinates';
    }
    if (latitude < -90 || latitude > 90) {
      return 'Invalid latitude value';
    }
    if (longitude < -180 || longitude > 180) {
      return 'Invalid longitude value';
    }
    return null;
  },

  // Role validation
  role: (value) => {
    const validRoles = ['Citizen', 'Driver', 'Operator', 'Manager', 'Admin'];
    if (!value) {
      return 'Role is required';
    }
    if (!validRoles.includes(value)) {
      return 'Please select a valid role';
    }
    return null;
  },

  // Zone validation
  zone: (value) => {
    if (!value || !value.trim()) {
      return 'Zone/Location is required';
    }
    if (value.trim().length < 2) {
      return 'Zone must be at least 2 characters long';
    }
    return null;
  }
};

/**
 * Validate multiple fields at once
 * @param {Object} data - Object containing field values
 * @param {Object} rules - Object containing validation rules for each field
 * @returns {Object} - Object containing errors for each field
 */
export const validateFields = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(fieldName => {
    const fieldRules = rules[fieldName];
    const fieldValue = data[fieldName];

    // Apply each validation rule for this field
    for (const rule of fieldRules) {
      let error = null;

      if (typeof rule === 'function') {
        error = rule(fieldValue, data);
      } else if (typeof rule === 'object') {
        const { validator, ...params } = rule;
        error = validator(fieldValue, ...Object.values(params));
      }

      if (error) {
        errors[fieldName] = error;
        break; // Stop at first error for this field
      }
    }
  });

  return errors;
};

/**
 * Real-time validation hook for forms
 * @param {Object} initialData - Initial form data
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} - Form state and validation functions
 */
export const useFormValidation = (initialData, rulesOrFn) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const getValidationRules = (currentData) => {
    return typeof rulesOrFn === 'function' ? rulesOrFn(currentData) : rulesOrFn;
  };

  // Validate single field
  const validateField = (fieldName, value, currentData) => {
    const validationRules = getValidationRules(currentData);
    const fieldRules = validationRules[fieldName];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      let error = null;

      if (typeof rule === 'function') {
        error = rule(value, currentData);
      } else if (typeof rule === 'object') {
        const { validator, ...params } = rule;
        error = validator(value, ...Object.values(params));
      }

      if (error) {
        return error;
      }
    }

    return null;
  };

  // Handle field change
  const handleChange = (fieldName, value) => {
    const newData = { ...data, [fieldName]: value };
    setData(newData);

    // Real-time validation for touched fields
    if (touched[fieldName]) {
      const error = validateField(fieldName, value, newData);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  // Handle field blur (mark as touched)
  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate on blur
    const error = validateField(fieldName, data[fieldName], data);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  // Validate all fields
  const validateAll = () => {
    const validationRules = getValidationRules(data);
    const allErrors = validateFields(data, validationRules);
    setErrors(allErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));
    
    return Object.keys(allErrors).length === 0;
  };

  // Reset form
  const reset = () => {
    setData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};

// Import useState for the hook
import { useState } from 'react';