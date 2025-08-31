import React from 'react';
import { Camera, Check } from 'lucide-react';
import type { NormalizedLandmark } from '@mediapipe/face_mesh';

export interface CameraOverlayUIProps {
  // Core scan state
  scanStage: 'alignment' | 'capture';
  currentCaptureStep: number;
  capturePositions: ('center' | 'left' | 'right')[];
  capturedImages: Array<{ position: string }>;
  
  // Vision status
  isFaceDetected: boolean;
  isAligned: boolean;
  isLightingGood: boolean;
  landmarks: NormalizedLandmark[] | null;
  
  // Flow control
  isReady: boolean;
  onReadyClick: () => void;
  
  // Progress
  stabilityProgress: number;
  stableStatus: { isReady: boolean };
}

const CameraOverlayUI: React.FC<CameraOverlayUIProps> = ({
  scanStage,
  currentCaptureStep,
  capturePositions,
  capturedImages,
  isFaceDetected,
  isAligned,
  isLightingGood,
  landmarks,
  isReady,
  onReadyClick,
  stabilityProgress,
  stableStatus
}) => {
  const currentPosition = capturePositions[currentCaptureStep] || 'center';
  
  // Calculate nose center position from landmarks for Facial Anchor Line - FIXED
  const getNosePosition = (): { x: number; y: number } | null => {
    if (!landmarks || landmarks.length === 0) return null;
    
    // MediaPipe nose tip landmark index is 1
    const noseTip = landmarks[1];
    if (!noseTip) return null;
    
    // Convert normalized coordinates to screen coordinates
    // Use the actual camera overlay dimensions for accurate positioning
    const overlayRect = document.querySelector('.absolute.inset-0.pointer-events-none')?.getBoundingClientRect();
    const containerWidth = overlayRect?.width || window.innerWidth;
    const containerHeight = overlayRect?.height || window.innerHeight;
    
    return {
      x: noseTip.x * containerWidth,
      y: noseTip.y * containerHeight
    };
  };
  
  const nosePosition = getNosePosition();
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Step Counter - Always visible */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-midnight-blue bg-opacity-90 text-white px-6 py-3 rounded-lg">
          <div className="text-center">
            <Camera className="w-6 h-6 mx-auto mb-1" />
            <p className="text-sm font-semibold">
              Step {currentCaptureStep + 1} of {capturePositions.length}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {currentPosition.charAt(0).toUpperCase() + currentPosition.slice(1)} View
            </p>
          </div>
        </div>
      </div>

      {/* I'm Ready Button - Full-screen immersive overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="bg-midnight-blue bg-opacity-95 backdrop-blur-sm rounded-2xl p-10 text-center max-w-lg mx-4 shadow-2xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-bronze rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Ready to Begin?</h1>
              <p className="text-lg text-gray-300 mb-2">
                Your personalized skin analysis
              </p>
              <p className="text-base text-gray-400">
                Position yourself comfortably in front of the camera and click when ready to start.
              </p>
            </div>
            <button
              onClick={onReadyClick}
              className="bg-bronze hover:bg-bronze-dark text-white font-bold py-5 px-10 rounded-xl transition-all duration-300 pointer-events-auto transform hover:scale-105 shadow-lg text-lg"
            >
              I'm Ready to Start
            </button>
          </div>
        </div>
      )}

      {/* Stage 1: Alignment Overlays */}
      {isReady && scanStage === 'alignment' && (
        <>
          {/* Premium Anatomical Face Outline */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Main face oval - even larger for better visibility */}
              <div 
                className={`w-[600px] h-[700px] border-4 transition-all duration-700 ${
                  isFaceDetected ? 'border-clinical-green shadow-lg' : 'border-bronze'
                }`}
                style={{
                  borderRadius: '50% 50% 45% 45%',
                  borderStyle: 'solid',
                  opacity: 0.9,
                  transform: 'translateY(-30px)',
                  filter: isFaceDetected ? 'drop-shadow(0 0 25px rgba(46, 125, 50, 0.4))' : 'none'
                }}
              />
              
              {/* Enhanced chin area - proportionally bigger */}
              <div 
                className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-36 h-20 border-4 transition-all duration-700 ${
                  isFaceDetected ? 'border-clinical-green' : 'border-bronze'
                }`}
                style={{
                  borderRadius: '0 0 50% 50%',
                  borderTop: 'none',
                  opacity: 0.7
                }}
              />
              
              {/* Eye area guides - larger and more prominent */}
              <div className="absolute top-40 left-1/2 transform -translate-x-1/2 flex justify-between w-60">
                <div className={`w-6 h-6 rounded-full transition-all duration-700 ${
                  isFaceDetected ? 'bg-clinical-green shadow-md' : 'bg-bronze'
                }`} style={{ opacity: 0.8 }} />
                <div className={`w-6 h-6 rounded-full transition-all duration-700 ${
                  isFaceDetected ? 'bg-clinical-green shadow-md' : 'bg-bronze'
                }`} style={{ opacity: 0.8 }} />
              </div>
              
              {/* Nose guide - larger and more prominent */}
              <div className={`absolute top-56 left-1/2 transform -translate-x-1/2 w-3 h-16 transition-all duration-700 ${
                isFaceDetected ? 'bg-clinical-green' : 'bg-bronze'
              }`} style={{ opacity: 0.7, borderRadius: '2px' }} />
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-6">
            <div className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-300 ${
              isFaceDetected ? 'bg-clinical-green bg-opacity-20 border border-clinical-green' : 'bg-gray-800 bg-opacity-70 border border-gray-600'
            }`}>
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                isFaceDetected ? 'bg-clinical-green' : 'bg-gray-400'
              }`} />
              <span className={`text-base font-medium transition-all duration-300 ${
                isFaceDetected ? 'text-clinical-green' : 'text-gray-300'
              }`}>
                Face Detection
              </span>
            </div>
            
            <div className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-300 ${
              isAligned ? 'bg-clinical-green bg-opacity-20 border border-clinical-green' : 'bg-gray-800 bg-opacity-70 border border-gray-600'
            }`}>
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                isAligned ? 'bg-clinical-green' : 'bg-gray-400'
              }`} />
              <span className={`text-base font-medium transition-all duration-300 ${
                isAligned ? 'text-clinical-green' : 'text-gray-300'
              }`}>
                Position
              </span>
            </div>
            
            <div className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-300 ${
              isLightingGood ? 'bg-clinical-green bg-opacity-20 border border-clinical-green' : 'bg-gray-800 bg-opacity-70 border border-gray-600'
            }`}>
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                isLightingGood ? 'bg-clinical-green' : 'bg-gray-400'
              }`} />
              <span className={`text-base font-medium transition-all duration-300 ${
                isLightingGood ? 'text-clinical-green' : 'text-gray-300'
              }`}>
                Lighting
              </span>
            </div>
          </div>
          
          {/* Progress Indicator */}
          {!stableStatus.isReady && stabilityProgress > 0 && (
            <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
              <div className="bg-midnight-blue bg-opacity-80 text-white px-4 py-2 rounded-lg text-center">
                <p className="text-sm font-medium">
                  Hold steady... {stabilityProgress}%
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stage 2: Facial Anchor Line Guidance System */}
      {isReady && scanStage === 'capture' && (
        <>
          {/* Static Target Lines - Fixed positions on screen */}
          <div className="absolute inset-0">
            {/* Left Curved Target Line - Even closer to center */}
            {currentCaptureStep === 1 && (
              <div 
                className="absolute h-full"
                style={{ 
                  left: '40%', // Even closer to center
                  top: 0,
                  width: '8px'
                }}
              >
                <svg 
                  className="h-full w-full"
                  style={{ 
                    opacity: 0.9,
                    filter: 'drop-shadow(0 0 15px rgba(197, 164, 117, 0.8))'
                  }}
                >
                  <path
                    d="M 4 0 Q 15 40 4 80 Q -5 120 4 160 Q 15 200 4 240 Q -5 280 4 320 Q 15 360 4 400 Q -5 440 4 480 Q 15 520 4 560 Q -5 600 4 640 Q 15 680 4 720 Q -5 760 4 800"
                    stroke="#C5A475"
                    strokeWidth="3"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-bronze text-white px-3 py-1 rounded text-xs font-bold">
                  LEFT
                </div>
              </div>
            )}
            
            {/* Right Curved Target Line - Even closer to center */}
            {currentCaptureStep === 2 && (
              <div 
                className="absolute h-full"
                style={{ 
                  left: '60%', // Even closer to center
                  top: 0,
                  width: '8px'
                }}
              >
                <svg 
                  className="h-full w-full"
                  style={{ 
                    opacity: 0.9,
                    filter: 'drop-shadow(0 0 15px rgba(197, 164, 117, 0.8))'
                  }}
                >
                  <path
                    d="M 4 0 Q -5 40 4 80 Q 15 120 4 160 Q -5 200 4 240 Q 15 280 4 320 Q -5 360 4 400 Q 15 440 4 480 Q -5 520 4 560 Q 15 600 4 640 Q -5 680 4 720 Q 15 760 4 800"
                    stroke="#C5A475"
                    strokeWidth="3"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-bronze text-white px-3 py-1 rounded text-xs font-bold">
                  RIGHT
                </div>
              </div>
            )}
            
            {/* Center Target Line (for step 0) - Straight */}
            {currentCaptureStep === 0 && (
              <div 
                className="absolute h-full w-1 bg-bronze shadow-lg"
                style={{ 
                  left: '50%', 
                  top: 0,
                  transform: 'translateX(-50%)',
                  opacity: 0.9,
                  filter: 'drop-shadow(0 0 15px rgba(197, 164, 117, 0.8))'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-bronze text-white px-3 py-1 rounded text-xs font-bold">
                  CENTER
                </div>
              </div>
            )}
          </div>
          
          {/* Dynamic Facial Anchor Line - Thin line with light shadow */}
          {nosePosition && (
            <div 
              className="absolute h-full bg-clinical-green transition-none"
              style={{ 
                left: `${nosePosition.x}px`,
                top: 0,
                width: '1px',
                transform: 'translateX(-50%)',
                opacity: 0.9,
                filter: 'drop-shadow(0 0 8px rgba(46, 125, 50, 0.6))',
                zIndex: 10
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-clinical-green text-white px-2 py-1 rounded text-xs font-medium shadow-sm">
                NOSE
              </div>
            </div>
          )}
          
          {/* Instructional Prompts */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="bg-midnight-blue bg-opacity-90 text-white px-8 py-4 rounded-lg text-center">
              <p className="text-lg font-medium mb-2">
                {currentCaptureStep === 0 && "Align your nose with the center line"}
                {currentCaptureStep === 1 && "Turn left until your nose crosses the curved line"}
                {currentCaptureStep === 2 && "Turn right until your nose crosses the curved line"}
              </p>
              <p className="text-sm text-gray-300">
                {currentCaptureStep === 0 && "Keep your nose on the center line for auto-capture"}
                {currentCaptureStep === 1 && "Move the green nose line to or past the left curved line"}
                {currentCaptureStep === 2 && "Move the green nose line to or past the right curved line"}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Captured Images Progress Indicator */}
      {isReady && (
        <div className="absolute top-8 right-8">
          <div className="flex space-x-2">
            {capturePositions.map((position, index) => {
              const captured = capturedImages.find(img => img.position === position);
              const isCurrent = index === currentCaptureStep;
              
              return (
                <div 
                  key={position}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    captured ? 'border-clinical-green bg-clinical-green' :
                    isCurrent ? 'border-bronze bg-bronze bg-opacity-20' :
                    'border-gray-400 bg-gray-400 bg-opacity-20'
                  }`}
                >
                  {captured ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <span className={`text-xs font-bold ${
                      isCurrent ? 'text-bronze' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraOverlayUI;
