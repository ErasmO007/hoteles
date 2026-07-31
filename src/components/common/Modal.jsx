import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  actions = null,
  size = 'md',
  closeOnOutsideClick = true 
}) => {
  const modalRef = useRef();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-2 pt-2 pb-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={handleOutsideClick}></div>
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

        <div ref={modalRef} className={`inline-block w-[calc(100%-1rem)] max-w-full transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full ${sizes[size]} sm:align-middle`}>
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button onClick={onClose} className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1">{children}</div>
          </div>
          {actions && (
            <div className="flex flex-col-reverse gap-2 bg-gray-50 px-4 py-3 sm:flex-row-reverse sm:px-6">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;