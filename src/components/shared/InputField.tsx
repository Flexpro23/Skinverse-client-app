import React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  // Generate a unique ID if none provided
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  const baseInputClasses = 'input-field transition-all duration-200';
  const errorClasses = error ? 'error' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  
  const finalInputClassName = `${baseInputClasses} ${errorClasses} ${widthClass} ${className}`.trim();
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      <label 
        htmlFor={inputId}
        className="block text-label text-midnight-blue mb-2 font-medium"
      >
        {label}
      </label>
      
      <input
        id={inputId}
        className={finalInputClassName}
        {...props}
      />
      
      {/* Helper text or error message */}
      {(error || helperText) && (
        <div className="mt-2">
          {error ? (
            <p className="text-sm text-alert-red font-medium">
              {error}
            </p>
          ) : helperText ? (
            <p className="text-sm text-medium-grey">
              {helperText}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default InputField;

