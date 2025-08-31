import React from 'react';
import { Clock, Target, Package, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface ImmediateAction {
  category: string;
  action: string;
  frequency: string;
  expectedImprovement: string;
}

interface MonthlyTreatment {
  treatment: string;
  type: string;
  frequency: string;
  duration: string;
  target: string;
}

interface LongTermPhase {
  phase: string;
  focus: string;
  expectedResults: string;
}

interface RecommendedProduct {
  category: string;
  product: string;
  usage: string;
  purpose: string;
}

interface PersonalizedRoadmapData {
  immediateActions: ImmediateAction[];
  monthlyTreatments: MonthlyTreatment[];
  longTermStrategy: LongTermPhase[];
  recommendedProducts: RecommendedProduct[];
}

interface PersonalizedRoadmapContentProps {
  roadmap: PersonalizedRoadmapData;
}

const PersonalizedRoadmapContent: React.FC<PersonalizedRoadmapContentProps> = ({ roadmap }) => {
  return (
    <div className="space-y-10">
      {/* Immediate Actions */}
      <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-bronze">
        <div className="flex items-center space-x-3 mb-6">
          <AlertCircle className="w-6 h-6 text-bronze" />
          <h3 className="text-xl font-semibold text-midnight-blue">Immediate Actions</h3>
          <span className="text-sm bg-bronze text-white px-2 py-1 rounded">Start Today</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roadmap.immediateActions.map((action, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 border-l-4 border-bronze">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-midnight-blue">{action.category}</h4>
                <span className="text-xs bg-bronze text-white px-2 py-1 rounded">{action.frequency}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{action.action}</p>
              <div className="text-xs text-clinical-green bg-green-50 rounded p-2">
                <strong>Expected:</strong> {action.expectedImprovement}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Professional Treatments */}
      <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-midnight-blue">
        <div className="flex items-center space-x-3 mb-6">
          <Calendar className="w-6 h-6 text-midnight-blue" />
          <h3 className="text-xl font-semibold text-midnight-blue">Professional Treatments</h3>
          <span className="text-sm bg-midnight-blue text-white px-2 py-1 rounded">Clinic-Based</span>
        </div>
        
        <div className="space-y-6">
          {roadmap.monthlyTreatments.map((treatment, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 border-l-4 border-midnight-blue">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-midnight-blue text-lg">{treatment.treatment}</h4>
                  <p className="text-sm text-gray-600">{treatment.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Schedule</div>
                  <div className="text-sm font-medium text-midnight-blue">{treatment.frequency}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</div>
                  <div className="text-sm text-gray-700">{treatment.duration}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Target</div>
                  <div className="text-sm text-gray-300">{treatment.target}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Long-term Strategy */}
      <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-clinical-green">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-clinical-green" />
          <h3 className="text-xl font-semibold text-midnight-blue">Long-term Strategy</h3>
          <span className="text-sm bg-clinical-green text-white px-2 py-1 rounded">12-Month Plan</span>
        </div>
        
        <div className="space-y-4">
          {roadmap.longTermStrategy.map((phase, index) => (
            <div key={index} className="relative">
              {/* Phase connector line */}
              {index < roadmap.longTermStrategy.length - 1 && (
                <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-purple-500 opacity-30"></div>
              )}
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{index + 1}</span>
                </div>
                <div className="flex-1 bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{phase.phase}</h4>
                    <Clock className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{phase.focus}</p>
                  <div className="text-xs text-purple-300 bg-purple-900 bg-opacity-40 rounded p-2">
                    <strong>Expected Results:</strong> {phase.expectedResults}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Products */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 bg-opacity-20 border border-green-500 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Package className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Recommended Products</h3>
          <span className="text-sm bg-green-500 text-white px-2 py-1 rounded">At-Home Care</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmap.recommendedProducts.map((product, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-400">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-white">{product.category}</h4>
                  <p className="text-sm text-green-300">{product.product}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              </div>
              
              <div className="space-y-2 mt-3">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Usage</div>
                  <div className="text-sm text-gray-300">{product.usage}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Purpose</div>
                  <div className="text-sm text-gray-300">{product.purpose}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gray-800 border border-bronze rounded-lg p-8">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-6 h-6 text-bronze" />
          <h3 className="text-xl font-semibold text-white">Treatment Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-bronze mb-1">2</div>
            <div className="text-sm text-gray-400">Immediate Actions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-bronze mb-1">{roadmap.monthlyTreatments.length}</div>
            <div className="text-sm text-gray-400">Professional Treatments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-bronze mb-1">{roadmap.recommendedProducts.length}</div>
            <div className="text-sm text-gray-400">Recommended Products</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-bronze bg-opacity-10 border border-bronze rounded-lg">
          <div className="text-sm font-medium text-bronze mb-2">💡 Success Tip</div>
          <div className="text-sm text-gray-300">
            Consistency is key to achieving optimal results. Start with immediate actions, 
            then gradually incorporate professional treatments and long-term strategies for 
            comprehensive skin health improvement.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedRoadmapContent;
