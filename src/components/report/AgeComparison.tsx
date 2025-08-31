import React from 'react';

interface AgeComparisonProps {
  biologicalAge: number;
  estimatedSkinAge: number;
  variance: number;
}

const AgeComparison: React.FC<AgeComparisonProps> = ({ 
  biologicalAge, 
  estimatedSkinAge, 
  variance 
}) => {
  const isOlder = variance > 0;
  const isYounger = variance < 0;
  const isPerfect = variance === 0;

  return (
    <div className="bg-white rounded-lg p-8 shadow-md">
      <h3 className="text-lg font-medium text-midnight-blue mb-6">Age Analysis</h3>
      
      <div className="space-y-4">
        {/* Biological Age */}
        <div className="text-center">
          <div className="text-sm text-medium-grey mb-1">Biological Age</div>
          <div className="text-xl font-medium text-midnight-blue">{biologicalAge} years</div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="px-3 text-xs text-medium-grey font-medium">VS</div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Estimated Skin Age - Main Focus */}
        <div className="text-center">
          <div className="text-sm text-medium-grey mb-2">Estimated Skin Age</div>
          <div className="text-4xl font-bold text-bronze mb-2">{estimatedSkinAge} years</div>
        </div>

        {/* Variance Analysis */}
        <div className="text-center pt-2">
          {isPerfect && (
            <div className="text-sm text-clinical-green font-medium">
              Perfect match! Skin age matches biological age
            </div>
          )}
          
          {isOlder && (
            <div className="space-y-1">
              <div className="text-sm text-bronze font-medium">
                +{variance} years older than biological age
              </div>
              <div className="text-xs text-medium-grey">
                Focus on anti-aging and preventive care
              </div>
            </div>
          )}
          
          {isYounger && (
            <div className="space-y-1">
              <div className="text-sm text-clinical-green font-medium">
                {Math.abs(variance)} years younger than biological age
              </div>
              <div className="text-xs text-medium-grey">
                Excellent skin health maintenance
              </div>
            </div>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs text-medium-grey mb-2">
            <span>Younger</span>
            <span>Biological Age</span>
            <span>Older</span>
          </div>
          <div className="relative">
            <div className="w-full h-2 bg-gray-200 rounded-full"></div>
            {/* Biological age marker */}
            <div 
              className="absolute top-0 w-1 h-2 bg-gray-500 rounded"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            ></div>
            {/* Skin age marker */}
            <div 
              className={`absolute top-0 w-3 h-2 rounded transition-all duration-500 ${
                isOlder ? 'bg-bronze' : isYounger ? 'bg-clinical-green' : 'bg-bronze'
              }`}
              style={{ 
                left: `${50 + (variance * 2)}%`, 
                transform: 'translateX(-50%)',
                maxWidth: '90%',
                minWidth: '10%'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeComparison;
