import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share, RotateCcw } from 'lucide-react';
import { Button } from '../components/shared';
import { useAnalysisResult, useClientInfo, useCapturedImages } from '../store/useAppStore';

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const analysisResult = useAnalysisResult();
  const clientInfo = useClientInfo();
  const capturedImages = useCapturedImages();

  if (!analysisResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-h2 text-midnight-blue mb-4">No Analysis Available</h2>
          <p className="text-body text-medium-grey mb-6">
            Please complete a scan first to view your results.
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Start New Scan
          </Button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-clinical-green';
    if (score >= 60) return 'text-bronze';
    return 'text-alert-red';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 80) return 'bg-clinical-green';
    if (score >= 60) return 'bg-bronze';
    return 'bg-alert-red';
  };

  return (
    <div className="min-h-screen bg-light-grey">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center text-midnight-blue hover:text-bronze transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Scan
          </button>
          
          <h1 className="text-h2 text-midnight-blue">Skin Analysis Results</h1>

          <div className="flex gap-2">
            <button className="p-2 text-medium-grey hover:text-midnight-blue transition-colors">
              <Share className="w-5 h-5" />
            </button>
            <button className="p-2 text-medium-grey hover:text-midnight-blue transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overall Score */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center">
                <h2 className="text-h2 text-midnight-blue mb-6">Overall Skin Health Score</h2>
                
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 144 144">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      fill="none"
                      stroke="#F8F9FA"
                      strokeWidth="12"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      fill="none"
                      stroke="#C5A475"
                      strokeWidth="12"
                      strokeDasharray={`${(analysisResult.skinHealthScore / 100) * 377} 377`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(analysisResult.skinHealthScore)}`}>
                        {analysisResult.skinHealthScore}
                      </div>
                      <div className="text-label text-medium-grey">out of 100</div>
                    </div>
                  </div>
                </div>

                <p className="text-body text-medium-grey">
                  {analysisResult.skinHealthScore >= 80 ? 'Excellent skin health!' :
                   analysisResult.skinHealthScore >= 60 ? 'Good skin health with room for improvement.' :
                   'Your skin would benefit from targeted care.'}
                </p>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-h2 text-midnight-blue mb-6">Detailed Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Skin Type */}
                <div className="p-4 border border-light-border-grey rounded-lg">
                  <h4 className="text-body font-semibold text-midnight-blue mb-2">Skin Type</h4>
                  <div className="text-bronze text-xl font-semibold mb-2">
                    {analysisResult.skinType}
                  </div>
                  <p className="text-label text-medium-grey">
                    {analysisResult.skinType === 'Normal' ? 'Well-balanced skin with minimal concerns.' :
                     analysisResult.skinType === 'Dry' ? 'Needs extra hydration and moisturizing care.' :
                     analysisResult.skinType === 'Oily' ? 'Benefits from oil-control and gentle cleansing.' :
                     analysisResult.skinType === 'Combination' ? 'Requires targeted care for different zones.' :
                     'Needs gentle, hypoallergenic products.'}
                  </p>
                </div>

                {/* Estimated Age */}
                <div className="p-4 border border-light-border-grey rounded-lg">
                  <h4 className="text-body font-semibold text-midnight-blue mb-2">Estimated Skin Age</h4>
                  <div className="text-bronze text-xl font-semibold mb-2">
                    {analysisResult.estimatedSkinAge} years
                  </div>
                  <p className="text-label text-medium-grey">
                    Based on visible signs of aging and skin texture analysis.
                  </p>
                </div>

                {/* Primary Concern */}
                <div className="md:col-span-2 p-4 border border-light-border-grey rounded-lg">
                  <h4 className="text-body font-semibold text-midnight-blue mb-2">Primary Concern</h4>
                  <div className="text-bronze text-xl font-semibold mb-2">
                    {analysisResult.primaryConcern}
                  </div>
                  <p className="text-label text-medium-grey">
                    The most prominent area identified for improvement and targeted treatment.
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-h2 text-midnight-blue mb-6">Recommendations</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-clinical-green bg-opacity-10 border border-clinical-green rounded-lg">
                  <h4 className="text-body font-semibold text-clinical-green mb-2">
                    Professional Treatment
                  </h4>
                  <p className="text-label text-midnight-blue">
                    Consult with our skincare specialist to develop a personalized treatment plan
                    targeting your specific concerns and skin type.
                  </p>
                </div>

                <div className="p-4 bg-bronze bg-opacity-10 border border-bronze rounded-lg">
                  <h4 className="text-body font-semibold text-bronze mb-2">
                    Daily Skincare Routine
                  </h4>
                  <p className="text-label text-midnight-blue">
                    Maintain consistency with gentle cleansing, appropriate moisturizing,
                    and daily SPF protection tailored to your {analysisResult.skinType.toLowerCase()} skin.
                  </p>
                </div>

                <div className="p-4 bg-midnight-blue bg-opacity-10 border border-midnight-blue rounded-lg">
                  <h4 className="text-body font-semibold text-midnight-blue mb-2">
                    Follow-up Scan
                  </h4>
                  <p className="text-label text-midnight-blue">
                    Schedule a follow-up analysis in 4-6 weeks to track progress
                    and adjust your skincare routine as needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Client Info */}
            {clientInfo && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-body font-semibold text-midnight-blue mb-4">Client Information</h3>
                <div className="space-y-3 text-label">
                  <div>
                    <span className="text-medium-grey">Name:</span>
                    <div className="text-midnight-blue font-medium">
                      {clientInfo.firstName} {clientInfo.lastName}
                    </div>
                  </div>
                  {clientInfo.phone && (
                    <div>
                      <span className="text-medium-grey">Phone:</span>
                      <div className="text-midnight-blue font-medium">{clientInfo.phone}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-medium-grey">Scan Date:</span>
                    <div className="text-midnight-blue font-medium">
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Captured Images */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-body font-semibold text-midnight-blue mb-4">Scan Images</h3>
              <div className="grid grid-cols-1 gap-3">
                {capturedImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img.dataUrl}
                      alt={`${img.position} view`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <div className="absolute top-2 left-2 bg-midnight-blue bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                      {img.position.charAt(0).toUpperCase() + img.position.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-body font-semibold text-midnight-blue mb-4">Next Steps</h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/handoff')}
                >
                  Complete Session
                </Button>
                
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/scan')}
                  className="flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Scan
                </Button>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-body font-semibold text-midnight-blue mb-4">Score Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-label text-medium-grey">Overall Health</span>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${getScoreBackground(analysisResult.skinHealthScore)}`} />
                    <span className="text-label font-medium text-midnight-blue">
                      {analysisResult.skinHealthScore}/100
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-medium-grey pt-2 border-t">
                  <p>Scores are based on AI analysis of facial images and may vary with lighting, angle, and image quality.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
