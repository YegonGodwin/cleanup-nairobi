import React from 'react';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

/**
 * Reusable form field component with built-in validation display
 */
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  children,
  helpText,
  ...props
}) => {
  const hasError = touched && error;
  const isValid = touched && !error && value;

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    transition-colors duration-200
  `;

  const inputClasses = `
    ${baseInputClasses}
    ${hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
    ${isValid ? 'border-green-500' : ''}
    ${className}
  `;

  const handleChange = (e) => {
    const newValue = type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(name, newValue);
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur(name);
    }
  };

  const renderInput = () => {
    if (children) {
      // Custom input (like select with options)
      return React.cloneElement(children, {
        name,
        value,
        onChange: handleChange,
        onBlur: handleBlur,
        className: inputClasses,
        disabled,
        ...props
      });
    }

    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
            {...props}
          />
        );

      case 'select':
        return (
          <select
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={inputClasses}
            {...props}
          >
            {props.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={name}
              checked={value || false}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={disabled}
              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              {...props}
            />
            <label className="ml-2 block text-sm text-gray-900">
              {label}
            </label>
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            name={name}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={inputClasses}
            {...props}
          />
        );

      default:
        return (
          <input
            type={type}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
            {...props}
          />
        );
    }
  };

  if (type === 'checkbox') {
    return (
      <div className="space-y-1">
        {renderInput()}
        {hasError && (
          <div className="flex items-center text-red-600 text-sm">
            <FaExclamationCircle className="mr-1" />
            {error}
          </div>
        )}
        {helpText && !hasError && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {renderInput()}
        
        {/* Validation icons */}
        {(hasError || isValid) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError ? (
              <FaExclamationCircle className="text-red-500" />
            ) : isValid ? (
              <FaCheckCircle className="text-green-500" />
            ) : null}
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <div className="flex items-center text-red-600 text-sm">
          <FaExclamationCircle className="mr-1" />
          {error}
        </div>
      )}

      {/* Help text */}
      {helpText && !hasError && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}

      {/* Character count for text inputs */}
      {(type === 'text' || type === 'textarea') && props.maxLength && value && (
        <p className="text-sm text-gray-500 text-right">
          {value.length}/{props.maxLength} characters
        </p>
      )}
    </div>
  );
};

export default FormField;