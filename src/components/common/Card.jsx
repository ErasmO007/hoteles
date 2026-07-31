import React from 'react';

const Card = ({ 
  children, 
  title, 
  className = '', 
  actions = null,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className={`rounded-2xl border border-[#ead8cc] bg-[#fdf8f4] p-4 shadow-sm sm:p-6 ${className}`}>
        <div className="animate-pulse">
          {title && (
            <div className="mb-4 h-6 w-1/4 rounded bg-[#ead8cc]"></div>
          )}
          <div className="space-y-3">
            <div className="h-4 bg-[#ead8cc] rounded w-3/4"></div>
            <div className="h-4 bg-[#ead8cc] rounded w-1/2"></div>
            <div className="h-4 bg-[#ead8cc] rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[#ead8cc] bg-[#fdf8f4] shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-[#ead8cc] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {title && <h3 className="text-lg font-semibold text-[#2f1b1d]">{title}</h3>}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
};

export default Card;