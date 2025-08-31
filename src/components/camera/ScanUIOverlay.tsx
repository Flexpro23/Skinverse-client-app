import React from 'react';
import { CheckCircle } from 'lucide-react';
import { IndicatorPill } from '../shared';

import type { ClientInfo, CapturedImage } from '../../store/useAppStore';

export interface ScanUIOverlayProps {
  // Status and progress
  stableStatus: { isReady: boolean };
  stabilityProgress: number;
  debugStatus: {
    yaw: number;
    pitch: number;
    roll: number;
    averageBrightness: number;
    standardDeviation: number;
  };
  
  // Capture flow data
  currentCaptureStep: number;
  capturePositions: ('center' | 'left' | 'right')[];
  capturedImages: CapturedImage[];
  instructions: string;
  showHelpMessage: boolean;
  
  // Client info
  clientInfo: ClientInfo | null;
}

const ScanUIOverlay: React.FC<ScanUIOverlayProps> = ({
  stableStatus,
  stabilityProgress,
  debugStatus,
  currentCaptureStep,
  capturePositions,
  capturedImages,
  instructions,
  showHelpMessage,
  clientInfo
}) => {
  // currentPosition can be derived from currentCaptureStep if needed

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-body font-semibold text-midnight-blue mb-4">
            Instructions
          </h3>
          <p className="text-label text-medium-grey mb-4">
            {instructions}
          </p>
          
          {/* Capture Requirements - Driven by stable state */}
          <div className="space-y-2">
            <IndicatorPill
              label="Face Detection"
              text={stableStatus.isReady ? "Detected" : "Not Found"}
              status={stableStatus.isReady ? "success" : "error"}
            />
            <IndicatorPill
              label="Position"
              text={stableStatus.isReady ? "Aligned" : "Adjust"}
              status={stableStatus.isReady ? "success" : "default"}
            />
            <IndicatorPill
              label="Lighting"
              text={stableStatus.isReady ? "Good" : "Poor"}
              status={stableStatus.isReady ? "success" : "error"}
            />
          </div>

          {/* Capture Readiness */}
          <div className="mt-4 p-3 rounded-lg border-2 border-dashed" style={{
            borderColor: stableStatus.isReady ? '#2E7D32' : '#C5A475',
            backgroundColor: stableStatus.isReady ? '#2E7D3210' : '#C5A47510'
          }}>
            <div className="text-center">
              <div className={`text-label font-semibold ${
                stableStatus.isReady ? 'text-clinical-green' : 'text-bronze'
              }`}>
                {stableStatus.isReady ? '✓ Ready to Capture' : '○ Preparing...'}
              </div>
              {!stableStatus.isReady && stabilityProgress > 0 && (
                <div className="text-xs text-medium-grey mt-1">
                  Hold steady... {stabilityProgress}%
                </div>
              )}
            </div>
          </div>

          {/* Help Message */}
          {showHelpMessage && (
            <div className="mt-4 p-4 bg-alert-red bg-opacity-10 border border-alert-red rounded-lg">
              <p className="text-label text-alert-red">
                Having trouble? Make sure your face is centered and well-lit. Try moving closer to the camera and avoid backlighting.
              </p>
            </div>
          )}
        </div>

        {/* Live Debug Panel */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-body font-semibold text-midnight-blue mb-4">
            Live Debug Panel
          </h3>
          <div className="space-y-2 text-label">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-medium-grey">Yaw:</span>
                <span className="text-midnight-blue font-mono ml-2">
                  {debugStatus.yaw.toFixed(2)}°
                </span>
              </div>
              <div>
                <span className="text-medium-grey">Pitch:</span>
                <span className="text-midnight-blue font-mono ml-2">
                  {debugStatus.pitch.toFixed(2)}°
                </span>
              </div>
              <div>
                <span className="text-medium-grey">Roll:</span>
                <span className="text-midnight-blue font-mono ml-2">
                  {debugStatus.roll.toFixed(2)}°
                </span>
              </div>
              <div>
                <span className="text-medium-grey">Brightness:</span>
                <span className="text-midnight-blue font-mono ml-2">
                  {debugStatus.averageBrightness.toFixed(2)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-medium-grey">Std Dev:</span>
                <span className="text-midnight-blue font-mono ml-2">
                  {debugStatus.standardDeviation.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Captured Images Progress */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-body font-semibold text-midnight-blue mb-4">
            Progress ({capturedImages.length}/3)
          </h3>
          
          <div className="space-y-2">
            {capturePositions.map((position, index) => {
              const captured = capturedImages.find(img => img.position === position);
              const isCurrent = index === currentCaptureStep;
              
              return (
                <div 
                  key={position}
                  className={`flex items-center p-3 rounded-lg border ${
                    captured ? 'border-clinical-green bg-clinical-green bg-opacity-10' :
                    isCurrent ? 'border-bronze bg-bronze bg-opacity-10' :
                    'border-light-border-grey bg-light-border-grey bg-opacity-10'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    captured ? 'bg-clinical-green' :
                    isCurrent ? 'bg-bronze' :
                    'bg-medium-grey'
                  }`} />
                  <span className="text-label font-medium text-midnight-blue capitalize">
                    {position} View
                  </span>
                  {captured && (
                    <CheckCircle className="w-4 h-4 text-clinical-green ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Client Info */}
        {clientInfo && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-body font-semibold text-midnight-blue mb-4">
              Client
            </h3>
            <div className="space-y-2 text-label">
              <div>
                <span className="text-medium-grey">Name:</span>
                <br />
                <span className="text-midnight-blue font-medium">
                  {clientInfo.firstName} {clientInfo.lastName}
                </span>
              </div>
              {clientInfo.phone && (
                <div>
                  <span className="text-medium-grey">Phone:</span>
                  <br />
                  <span className="text-midnight-blue font-medium">
                    {clientInfo.phone}
                  </span>
                </div>
              )}
              <div>
                <span className="text-medium-grey">Type:</span>
                <br />
                <span className={`font-medium ${clientInfo.isReturning ? 'text-clinical-green' : 'text-bronze'}`}>
                  {clientInfo.isReturning ? 'Returning Client' : 'New Client'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanUIOverlay;
