import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-bold text-button rounded-lg transition-all duration-100 ease-in-out focus:outline-none focus:ring-2 focus:ring-bronze focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`.trim();
  
  return (
    <button
      className={finalClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

