import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  className = '', 
  required = false,
  ...props 
}, ref) => {
  const baseStyles = 'w-full rounded-xl border border-[#ead8cc] bg-white px-3 py-2.5 shadow-sm transition-colors duration-200 focus:border-[#9b4b5d] focus:ring-[#9b4b5d] sm:px-4';
  const errorStyles = 'border-[#a44d5d] focus:border-[#a44d5d] focus:ring-[#a44d5d]';
  
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-[#6d3140]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`${baseStyles} ${error ? errorStyles : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-[#a44d5d]">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;