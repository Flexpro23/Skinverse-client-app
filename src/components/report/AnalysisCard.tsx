import React from 'react';
import ScoreGauge from './ScoreGauge';

interface AnalysisData {
  score: number;
  level: string;
  description: string;
  recommendations: string[];
  affectedAreas: string[];
}

interface AnalysisCardProps {
  title: string;
  data: AnalysisData;
  className?: string;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ 
  title, 
  data, 
  className = '' 
}) => {
  const { score, level, description, recommendations, affectedAreas } = data;

  // Helper function to format area names
  const formatAreaName = (area: string): string => {
    return area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to format recommendation names
  const formatRecommendation = (rec: string): string => {
    return rec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-8 ${className}`}>
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-h2 text-midnight-blue mb-2">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-medium-grey">Current Level:</span>
            <span className={`text-sm font-medium ${
              score >= 85 ? 'text-clinical-green' : 
              score >= 70 ? 'text-midnight-blue' : 
              'text-bronze'
            }`}>
              {level}
            </span>
          </div>
        </div>
        
        {/* Score Gauge */}
        <div className="ml-4">
          <ScoreGauge score={score} size="md" showLabel={false} />
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* Affected Areas */}
      {affectedAreas && affectedAreas.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-medium-grey mb-3 uppercase tracking-wide">
            Affected Areas
          </h4>
          <div className="flex flex-wrap gap-2">
            {affectedAreas.map((area, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-300"
              >
                {formatAreaName(area)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-bronze mb-3 uppercase tracking-wide">
            Recommended Actions
          </h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border-l-4 border-bronze"
              >
                <div className="flex-shrink-0 w-5 h-5 bg-bronze rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {formatRecommendation(rec)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Overall Assessment</span>
          <span className={`font-medium ${
            score >= 85 ? 'text-teal-400' : 
            score >= 70 ? 'text-blue-400' : 
            score >= 50 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {score >= 85 ? 'Excellent condition' :
             score >= 70 ? 'Good condition' :
             score >= 50 ? 'Needs improvement' :
             'Requires attention'}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              score >= 85 ? 'bg-teal-400' : 
              score >= 70 ? 'bg-blue-400' : 
              score >= 50 ? 'bg-yellow-400' :
              'bg-red-400'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;
