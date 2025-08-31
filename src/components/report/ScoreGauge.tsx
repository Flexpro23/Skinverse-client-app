import React from 'react';
import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ 
  score, 
  size = 'md', 
  showLabel = true,
  className = '' 
}) => {
  // Clamp score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  // Size configurations
  const sizeConfig = {
    sm: { radius: 30, strokeWidth: 6, fontSize: 'text-sm' },
    md: { radius: 45, strokeWidth: 8, fontSize: 'text-lg' },
    lg: { radius: 60, strokeWidth: 10, fontSize: 'text-2xl' }
  };
  
  const config = sizeConfig[size];
  const { radius, strokeWidth } = config;
  
  // Calculate circle properties
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return '#14b8a6'; // clinical-green - excellent
    if (score >= 70) return '#3b82f6'; // blue - good
    return '#C5A475'; // bronze - needs attention
  };
  
  const getScoreLevel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Attention';
  };
  
  const scoreColor = getScoreColor(normalizedScore);
  const scoreLevel = getScoreLevel(normalizedScore);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#E5E7EB" // light-grey
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          
          {/* Progress circle */}
          <motion.circle
            stroke={scoreColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: 1.5,
              delay: 0.2,
              ease: "easeOut"
            }}
          />
        </svg>
        
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className={`font-bold ${config.fontSize}`}
            style={{ color: scoreColor }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.8,
              ease: "backOut"
            }}
          >
            {Math.round(normalizedScore)}
          </motion.div>
          {size !== 'sm' && (
            <motion.div
              className="text-xs text-medium-grey font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              /100
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Score label */}
      {showLabel && (
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <div 
            className="text-sm font-semibold"
            style={{ color: scoreColor }}
          >
            {scoreLevel}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ScoreGauge;
