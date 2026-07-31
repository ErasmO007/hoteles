import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  isLoading = false,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#7c3948] to-[#9b4b5d] text-white hover:from-[#6d3140] hover:to-[#843a4b] focus:ring-[#9b4b5d]',
    secondary: 'bg-[#f4e7df] text-[#6d3140] hover:bg-[#e8d6ca] focus:ring-[#8a5c63]',
    danger: 'bg-gradient-to-r from-[#a44d5d] to-[#8b3b49] text-white hover:from-[#953f4f] hover:to-[#792d3c] focus:ring-[#a44d5d]',
    success: 'bg-gradient-to-r from-[#6f5a4d] to-[#8c6f53] text-white hover:from-[#5e4c41] hover:to-[#78624d] focus:ring-[#8c6f53]',
    warning: 'bg-[#c4884c] text-white hover:bg-[#b17637] focus:ring-[#c4884c]',
    outline: 'border border-[#9b4b5d] text-[#7c3948] hover:bg-[#f8ede7] focus:ring-[#9b4b5d]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${props.disabled || isLoading ? disabledStyles : ''}`}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;