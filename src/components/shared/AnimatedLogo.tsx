import React from 'react';
import logo from '../../assets/logo.svg';

export interface AnimatedLogoProps {
  size?: 'small' | 'medium' | 'large' | 'custom';
  animate?: boolean;
  className?: string;
  customSize?: string; // For custom size when size="custom"
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 'medium',
  animate = false,
  className = '',
  customSize,
}) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
    custom: customSize || 'w-24 h-24'
  };
  
  const animationClass = animate ? 'animate-pulse-subtle' : '';
  
  const finalClassName = `${sizeClasses[size]} ${animationClass} ${className}`.trim();
  
  return (
    <div className="flex justify-center items-center">
      <img
        src={logo}
        alt="Skinverse"
        className={finalClassName}
      />
    </div>
  );
};

export default AnimatedLogo;

