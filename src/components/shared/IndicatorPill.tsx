import React from 'react';

export interface IndicatorPillProps {
  label: string;
  text: string;
  status?: 'default' | 'success' | 'error' | 'warning';
  className?: string;
}

const IndicatorPill: React.FC<IndicatorPillProps> = ({
  label,
  text,
  status = 'default',
  className = '',
}) => {
  const baseClasses = 'indicator-pill inline-flex items-center gap-2';
  const statusClasses = {
    default: 'default',
    success: 'success',
    error: 'error',
    warning: 'bg-yellow-500 text-white'
  };
  
  const finalClassName = `${baseClasses} ${statusClasses[status]} ${className}`.trim();
  
  // Icons for different states
  const renderIcon = () => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <div className="w-2 h-2 rounded-full bg-white opacity-60"></div>
        );
    }
  };
  
  return (
    <div className={finalClassName}>
      {renderIcon()}
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-80">{label}</span>
        <span className="text-sm font-semibold">{text}</span>
      </div>
    </div>
  );
};

export default IndicatorPill;

