import React, { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../shared';
import type { CapturedImage } from '../../store/useAppStore';

export interface ScanCompleteModalProps {
  capturedImages: CapturedImage[];
  onViewAnalysis: () => Promise<void>;
  onRetake: () => void;
}

const ScanCompleteModal: React.FC<ScanCompleteModalProps> = ({
  capturedImages,
  onViewAnalysis,
  onRetake
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleViewAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await onViewAnalysis();
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
    }
  };
  return (
    <div className="max-w-md w-full mx-4">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-clinical-green mx-auto mb-6" />
          <h2 className="text-h2 text-midnight-blue mb-4">Scan Complete!</h2>
          <p className="text-body text-medium-grey mb-8">
            {isAnalyzing 
              ? "Processing your images with AI analysis..." 
              : "We've captured all three angles. Ready for analysis."}
          </p>
          
          {/* Captured Images Preview */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {capturedImages.map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={img.dataUrl}
                  alt={`${img.position} view`}
                  className="w-full h-20 object-cover rounded border"
                />
                <div className="absolute top-1 left-1 bg-clinical-green text-white text-xs px-1 rounded">
                  {img.position}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              variant="primary"
              fullWidth
              onClick={handleViewAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </div>
              ) : (
                "View Analysis"
              )}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={onRetake}
              disabled={isAnalyzing}
            >
              Retake Photos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanCompleteModal;
