import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Home, Phone } from 'lucide-react';
import { Button } from '../components/shared';

interface ErrorState {
  type: 'validation_failed' | 'ai_error' | 'network_error' | 'unknown';
  message: string;
  details?: string;
  reportId?: string;
}

const AnalysisErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get error details from navigation state
  const errorState = (location.state as ErrorState) || {
    type: 'unknown',
    message: 'An unexpected error occurred during analysis'
  };

  const getErrorConfig = (type: ErrorState['type']) => {
    switch (type) {
      case 'validation_failed':
        return {
          title: 'Analysis Quality Check Failed',
          description: 'Our AI detected inconsistencies in the analysis results. This can happen due to lighting conditions, image quality, or processing issues.',
          color: 'text-bronze',
          bgColor: 'bg-bronze',
          icon: AlertTriangle,
          retryMessage: 'Please retake your scan with better lighting and positioning.'
        };
      case 'ai_error':
        return {
          title: 'AI Processing Error',
          description: 'Our AI analysis service encountered an error while processing your images. This is usually temporary.',
          color: 'text-alert-red',
          bgColor: 'bg-alert-red',
          icon: AlertTriangle,
          retryMessage: 'Please try again in a few moments.'
        };
      case 'network_error':
        return {
          title: 'Connection Error',
          description: 'Unable to connect to our analysis service. Please check your internet connection.',
          color: 'text-medium-grey',
          bgColor: 'bg-medium-grey',
          icon: AlertTriangle,
          retryMessage: 'Please check your connection and try again.'
        };
      default:
        return {
          title: 'Analysis Error',
          description: 'Something went wrong during your skin analysis.',
          color: 'text-alert-red',
          bgColor: 'bg-alert-red',
          icon: AlertTriangle,
          retryMessage: 'Please try again or contact support if the issue persists.'
        };
    }
  };

  const config = getErrorConfig(errorState.type);
  const IconComponent = config.icon;

  const handleRetry = () => {
    // Clear any cached data and go back to scan
    navigate('/scan', { replace: true });
  };

  const handleContactSupport = () => {
    // In a real app, this would open a support channel
    window.location.href = 'tel:+1-800-SKINVERSE';
  };

  return (
    <div className="min-h-screen bg-light-grey flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          
          {/* Error Icon */}
          <div className={`w-20 h-20 ${config.bgColor} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6`}>
            <IconComponent className={`w-10 h-10 ${config.color}`} />
          </div>

          {/* Error Title */}
          <h1 className="text-h1 text-midnight-blue mb-4">
            {config.title}
          </h1>

          {/* Error Description */}
          <p className="text-body text-medium-grey mb-6">
            {config.description}
          </p>

          {/* Error Details (if available) */}
          {errorState.details && (
            <div className="bg-light-grey rounded-lg p-4 mb-6">
              <h3 className="text-label font-semibold text-midnight-blue mb-2">Technical Details:</h3>
              <p className="text-sm text-medium-grey font-mono">
                {errorState.details}
              </p>
              {errorState.reportId && (
                <p className="text-xs text-medium-grey mt-2">
                  Report ID: {errorState.reportId}
                </p>
              )}
            </div>
          )}

          {/* Retry Message */}
          <div className={`p-4 ${config.bgColor} bg-opacity-10 rounded-lg mb-8`}>
            <p className={`text-label ${config.color} font-medium`}>
              {config.retryMessage}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            
            {/* Primary Action - Retry */}
            <Button
              variant="primary"
              fullWidth
              onClick={handleRetry}
              className="flex items-center justify-center"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Try New Scan
            </Button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/')}
                className="flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>

              <Button
                variant="secondary"
                onClick={handleContactSupport}
                className="flex items-center justify-center"
              >
                <Phone className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>

        </div>

        {/* Additional Help Text */}
        <div className="mt-8 text-center">
          <h3 className="text-body font-semibold text-midnight-blue mb-3">
            Tips for Better Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-medium-grey">
            <div className="p-3 bg-white rounded-lg">
              <strong className="text-midnight-blue">Good Lighting</strong>
              <br />Use natural light or bright, even lighting
            </div>
            <div className="p-3 bg-white rounded-lg">
              <strong className="text-midnight-blue">Clean Face</strong>
              <br />Remove makeup and clean your face before scanning
            </div>
            <div className="p-3 bg-white rounded-lg">
              <strong className="text-midnight-blue">Steady Position</strong>
              <br />Keep still and follow the positioning guides
            </div>
          </div>
        </div>

        {/* Error Reporting */}
        <div className="mt-6 text-center">
          <p className="text-xs text-medium-grey">
            Error occurred at {new Date().toLocaleString()}
            {errorState.reportId && ` • Report ID: ${errorState.reportId}`}
          </p>
        </div>

      </div>
    </div>
  );
};

export default AnalysisErrorPage;
