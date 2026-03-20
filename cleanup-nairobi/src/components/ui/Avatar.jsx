import React from 'react';

const Avatar = ({ 
  src, 
  alt = '', 
  size = 'default',
  fallback = '',
  className = '',
  ...props 
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    default: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium overflow-hidden';

  if (src) {
    return (
      <img 
        src={src} 
        alt={alt}
        className={`${baseClasses} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }

  return (
    <div 
      className={`${baseClasses} ${sizes[size]} ${className}`}
      {...props}
    >
      {fallback || alt.charAt(0).toUpperCase()}
    </div>
  );
};

export default Avatar;