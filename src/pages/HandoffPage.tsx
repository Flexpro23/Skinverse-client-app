import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, User, Calendar, FileText, Home } from 'lucide-react';
import { Button, AnimatedLogo } from '../components/shared';
import { useClientInfo, useAnalysisResult, useAppActions } from '../store/useAppStore';

const HandoffPage: React.FC = () => {
  const navigate = useNavigate();
  const clientInfo = useClientInfo();
  const analysisResult = useAnalysisResult();
  const { resetSession } = useAppActions();

  const handleNewSession = () => {
    resetSession();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-light-grey flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-clinical-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-clinical-green" />
            </div>
            <h1 className="text-h1 text-midnight-blue mb-3">Session Complete</h1>
            <p className="text-body text-medium-grey">
              {clientInfo && clientInfo.firstName !== 'Guest' 
                ? `Thank you, ${clientInfo.firstName}! Your skin analysis has been completed and Dr. Smith will be ready for you shortly.`
                : 'Thank you for using SkinVerse. Your analysis has been completed and saved.'
              }
            </p>
          </div>

          {/* Session Summary */}
          <div className="bg-light-grey rounded-lg p-6 mb-8">
            <h2 className="text-h2 text-midnight-blue mb-6">Session Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              
              {/* Client Info */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-bronze bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-bronze" />
                </div>
                <div>
                  <h3 className="text-label font-semibold text-midnight-blue mb-1">Client</h3>
                  {clientInfo ? (
                    <div className="text-label text-medium-grey">
                      <div>{clientInfo.firstName} {clientInfo.lastName}</div>
                      {clientInfo.phone && <div>{clientInfo.phone}</div>}
                      <div className="text-xs mt-1">
                        {clientInfo.isReturning ? 'Returning Client' : 'New Client'}
                      </div>
                    </div>
                  ) : (
                    <p className="text-label text-medium-grey">Guest User</p>
                  )}
                </div>
              </div>

              {/* Scan Info */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-clinical-green bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-clinical-green" />
                </div>
                <div>
                  <h3 className="text-label font-semibold text-midnight-blue mb-1">Scan Details</h3>
                  <div className="text-label text-medium-grey">
                    <div>{new Date().toLocaleDateString()}</div>
                    <div>{new Date().toLocaleTimeString()}</div>
                    <div className="text-xs mt-1">3 angles captured</div>
                  </div>
                </div>
              </div>

              {/* Analysis Results */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-midnight-blue bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-midnight-blue" />
                </div>
                <div>
                  <h3 className="text-label font-semibold text-midnight-blue mb-1">Analysis</h3>
                  {analysisResult ? (
                    <div className="text-label text-medium-grey">
                      <div>Score: {analysisResult.skinHealthScore}/100</div>
                      <div>Type: {analysisResult.skinType}</div>
                      <div className="text-xs mt-1">AI Analysis Complete</div>
                    </div>
                  ) : (
                    <p className="text-label text-medium-grey">Analysis completed</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h2 className="text-h2 text-midnight-blue mb-4">What's Next?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              
              <div className="p-4 border border-clinical-green rounded-lg bg-clinical-green bg-opacity-5">
                <h3 className="text-body font-semibold text-clinical-green mb-2">
                  For Clients
                </h3>
                <p className="text-label text-midnight-blue">
                  Your results have been saved and will be reviewed by our skincare specialist. 
                  Expect personalized recommendations and treatment options based on your analysis.
                </p>
              </div>

              <div className="p-4 border border-bronze rounded-lg bg-bronze bg-opacity-5">
                <h3 className="text-body font-semibold text-bronze mb-2">
                  For Staff
                </h3>
                <p className="text-label text-midnight-blue">
                  Client data and analysis results are now available in the clinic management system. 
                  Schedule a consultation to discuss findings and treatment recommendations.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              variant="primary"
              fullWidth
              onClick={handleNewSession}
              className="flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Start New Session
            </Button>
            
            <div className="text-center">
              <button
                onClick={() => navigate('/analysis')}
                className="text-bronze hover:text-midnight-blue transition-colors text-label font-medium"
              >
                View Analysis Again
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-light-border-grey">
            <AnimatedLogo size="small" className="mb-3" />
            <p className="text-label text-medium-grey">
              Powered by SkinVerse • Precision Luxury Technology
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoffPage;
