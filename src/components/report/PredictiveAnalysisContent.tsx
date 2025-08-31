import React, { useState } from 'react';
import { CheckCircle, Lightbulb } from 'lucide-react';

interface ProjectionData {
  skinAge?: number;
  projectedSkinAge?: number;
  keyFeatures: string[];
  expectedChanges?: string[];
  preventionOpportunities?: string[];
}

interface PredictiveAnalysisContentProps {
  currentProjection: ProjectionData;
  fiveYearProjection: ProjectionData;
}

const PredictiveAnalysisContent: React.FC<PredictiveAnalysisContentProps> = ({
  currentProjection,
  fiveYearProjection
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState<'now' | 'three' | 'five' | 'ten'>('now');
  
  // Generate timeline data
  const timelineData = {
    now: {
      title: 'Current Status',
      skinAge: 35,
      features: currentProjection.keyFeatures,
      description: 'Your skin\'s current condition based on comprehensive analysis.'
    },
    three: {
      title: '3 Years',
      skinAge: 38,
      features: [
        'Slight increase in fine line visibility',
        'Potential deepening of existing pigmentation',
        'Gradual loss of skin firmness',
        'Continued good overall skin health with care'
      ],
      description: 'Expected changes with current routine and moderate intervention.'
    },
    five: {
      title: '5 Years', 
      skinAge: fiveYearProjection.projectedSkinAge || 42,
      features: fiveYearProjection.expectedChanges || [],
      description: 'Projected development with proactive skin care management.'
    },
    ten: {
      title: '10 Years',
      skinAge: 47,
      features: [
        'Noticeable aging signs without intervention',
        'Significant volume loss potential',
        'Advanced pigmentation concerns',
        'Excellent results possible with consistent care'
      ],
      description: 'Long-term projection highlighting importance of preventive care.'
    }
  };
  
  const currentData = timelineData[activeTimeframe];

  return (
    <div className="space-y-8">
      {/* Interactive Timeline */}
      <div className="bg-white rounded-lg p-8 shadow-md">
        <h3 className="text-xl font-semibold text-midnight-blue mb-6 text-center">Predictive Timeline</h3>
        
        {/* Timeline Navigation */}
        <div className="flex justify-center space-x-2 mb-8">
          {Object.entries(timelineData).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setActiveTimeframe(key as any)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300 text-sm ${
                activeTimeframe === key
                  ? 'bg-bronze text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-midnight-blue hover:bg-bronze hover:text-white border border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-bold">{data.title}</div>
                <div className="text-xs opacity-80">{data.skinAge} years</div>
              </div>
            </button>
          ))}
        </div>

        {/* Timeline Visual */}
        <div className="relative mb-8">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-600"></div>
          <div className="flex justify-between">
            {Object.entries(timelineData).map(([key, data]) => (
              <div 
                key={key}
                className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
                  activeTimeframe === key ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => setActiveTimeframe(key as any)}
              >
                <div className={`w-8 h-8 rounded-full border-4 transition-all duration-300 ${
                  activeTimeframe === key 
                    ? 'bg-bronze border-bronze shadow-lg' 
                    : 'bg-gray-700 border-gray-600 hover:border-bronze'
                }`}></div>
                <div className="mt-2 text-xs text-gray-400 text-center">
                  <div className="font-medium">{data.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Analysis Card */}
        <div className="bg-white rounded-lg p-8 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-midnight-blue">{currentData.title} Analysis</h3>
            <div className="text-sm text-bronze font-medium">{currentData.title}</div>
          </div>

          {/* Skin Age Display */}
          <div className="mb-8">
            <div className="text-center p-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg border border-bronze">
              <div className="text-sm text-gray-400 mb-2">Skin Age</div>
              <div className="text-4xl font-bold text-bronze mb-2">{currentData.skinAge} years</div>
              <div className="text-sm text-gray-300">{currentData.description}</div>
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h4 className="text-lg font-medium text-white mb-4">Key Characteristics</h4>
            <div className="space-y-3">
              {currentData.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-bronze" />
                  </div>
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prevention Opportunities */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-white mb-6">Prevention Opportunities</h3>
          <p className="text-sm text-gray-400 mb-6">
            Proactive measures based on your {currentData.title.toLowerCase()} projection
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                <Lightbulb className="w-4 h-4 text-bronze" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">Daily Protection</h4>
                <p className="text-sm text-gray-300">Consistent sunscreen use and antioxidant serums</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                <Lightbulb className="w-4 h-4 text-bronze" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">Professional Treatments</h4>
                <p className="text-sm text-gray-300">Regular professional assessments and targeted interventions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                <Lightbulb className="w-4 h-4 text-bronze" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">Lifestyle Optimization</h4>
                <p className="text-sm text-gray-300">Nutrition, hydration, and stress management</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
            <div className="text-sm font-medium text-blue-300 mb-2">
              💡 Intervention Impact
            </div>
            <div className="text-sm text-gray-300">
              Following our personalized roadmap can help maintain healthier skin that ages 
              more slowly than predicted, potentially keeping you looking 2-5 years younger.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalysisContent;