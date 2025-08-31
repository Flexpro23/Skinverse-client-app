import React, { useState, useCallback } from 'react';
import VisionCamera from './camera/VisionCamera';
import type { VisionCameraStatus } from './camera/VisionCamera';
import { AnimatedLogo, Button } from './shared';

const CameraTestPage: React.FC = () => {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState<VisionCameraStatus>({
    isAligned: false,
    isLightingGood: false,
    isFaceDetected: false,
    yaw: 0,
    pitch: 0,
    roll: 0,
    averageBrightness: 0,
    standardDeviation: 0
  });
  const [showCamera, setShowCamera] = useState(false);

  const handleCapture = useCallback((imageData: string) => {
    console.log('Image captured:', imageData.substring(0, 50) + '...');
    setCapturedImages(prev => [...prev, imageData]);
  }, []);

  const handleStatusUpdate = useCallback((status: VisionCameraStatus) => {
    setCurrentStatus(status);
  }, []);

  const clearCapturedImages = () => {
    setCapturedImages([]);
  };

  const toggleCamera = () => {
    setShowCamera(!showCamera);
  };

  return (
    <div className="min-h-screen bg-light-grey p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <AnimatedLogo size="medium" animate={true} className="mb-4" />
          <h1 className="text-h1 text-midnight-blue mb-4">
            SkinVerse Vision Camera Test
          </h1>
          <p className="text-body text-medium-grey mb-6">
            Real-time face detection and skin analysis camera
          </p>
          
          <Button 
            variant="primary" 
            onClick={toggleCamera}
            className="mb-8"
          >
            {showCamera ? 'Hide Camera' : 'Start Camera'}
          </Button>
        </div>

        {showCamera && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Camera Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-h2 text-midnight-blue mb-4">Live Camera Feed</h2>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <VisionCamera
                    onCapture={handleCapture}
                    onStatusUpdate={handleStatusUpdate}
                    className="w-full h-full"
                    onReady={() => { /* no-op */ }}
                  />
                </div>
              </div>
            </div>

            {/* Status Panel */}
            <div className="space-y-6">
              {/* Real-time Status */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-body font-semibold text-midnight-blue mb-4">
                  Real-time Analysis
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-label text-medium-grey">Face Detected:</span>
                    <span className={`text-label font-semibold ${
                      currentStatus.isFaceDetected ? 'text-clinical-green' : 'text-alert-red'
                    }`}>
                      {currentStatus.isFaceDetected ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-label text-medium-grey">Aligned:</span>
                    <span className={`text-label font-semibold ${
                      currentStatus.isAligned ? 'text-clinical-green' : 'text-bronze'
                    }`}>
                      {currentStatus.isAligned ? 'Perfect' : 'Adjusting'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-label text-medium-grey">Lighting:</span>
                    <span className={`text-label font-semibold ${
                      currentStatus.isLightingGood ? 'text-clinical-green' : 'text-alert-red'
                    }`}>
                      {currentStatus.isLightingGood ? 'Good' : 'Poor'}
                    </span>
                  </div>

                  {currentStatus.headPose && (
                    <>
                      <hr className="border-light-border-grey my-3" />
                      <div className="text-xs text-medium-grey space-y-1">
                        <div className="flex justify-between">
                          <span>Yaw:</span>
                          <span>{currentStatus.headPose.yaw.toFixed(1)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pitch:</span>
                          <span>{currentStatus.headPose.pitch.toFixed(1)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Roll:</span>
                          <span>{currentStatus.headPose.roll.toFixed(1)}°</span>
                        </div>
                      </div>
                    </>
                  )}

                  {currentStatus.lightingQuality && (
                    <>
                      <hr className="border-light-border-grey my-3" />
                      <div className="text-xs text-medium-grey space-y-1">
                        <div className="flex justify-between">
                          <span>Light Score:</span>
                          <span>{currentStatus.lightingQuality.score}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Evenness:</span>
                          <span>{currentStatus.lightingQuality.evenness}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Brightness:</span>
                          <span>{currentStatus.lightingQuality.brightness}/255</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Capture readiness indicator */}
                <div className="mt-4 p-3 rounded-lg border-2 border-dashed" style={{
                  borderColor: currentStatus.isFaceDetected && currentStatus.isAligned && currentStatus.isLightingGood 
                    ? '#2E7D32' : '#C5A475',
                  backgroundColor: currentStatus.isFaceDetected && currentStatus.isAligned && currentStatus.isLightingGood 
                    ? '#2E7D3210' : '#C5A47510'
                }}>
                  <div className="text-center">
                    <div className={`text-label font-semibold ${
                      currentStatus.isFaceDetected && currentStatus.isAligned && currentStatus.isLightingGood 
                        ? 'text-clinical-green' : 'text-bronze'
                    }`}>
                      {currentStatus.isFaceDetected && currentStatus.isAligned && currentStatus.isLightingGood 
                        ? '✓ Ready to Capture' : '○ Preparing...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Captured Images */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-body font-semibold text-midnight-blue">
                    Captured Images ({capturedImages.length})
                  </h3>
                  {capturedImages.length > 0 && (
                    <Button 
                      variant="secondary" 
                      onClick={clearCapturedImages}
                      className="text-xs py-2 px-3"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {capturedImages.length === 0 ? (
                  <div className="text-center py-8 text-medium-grey">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-label">No images captured yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {capturedImages.map((imageData, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageData}
                          alt={`Capture ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs">#{index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!showCamera && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-h2 text-midnight-blue mb-6">How to Use the Vision Camera</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-body font-semibold text-midnight-blue mb-3">Features</h3>
                  <ul className="space-y-2 text-label text-medium-grey">
                    <li>• Real-time face detection using MediaPipe</li>
                    <li>• Head pose estimation (yaw, pitch, roll)</li>
                    <li>• Lighting quality analysis</li>
                    <li>• Live landmark visualization</li>
                    <li>• Camera switching (front/back)</li>
                    <li>• Flash control (rear camera)</li>
                    <li>• Automatic capture readiness detection</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-body font-semibold text-midnight-blue mb-3">Instructions</h3>
                  <ul className="space-y-2 text-label text-medium-grey">
                    <li>1. Click "Start Camera" to initialize</li>
                    <li>2. Allow camera permissions when prompted</li>
                    <li>3. Position your face within the oval guide</li>
                    <li>4. Ensure good lighting (score ≥70)</li>
                    <li>5. Keep head aligned (follow guidance)</li>
                    <li>6. Click capture when ready</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-bronze bg-opacity-10 rounded-lg">
                <p className="text-label text-midnight-blue">
                  <strong>Note:</strong> This is a test implementation of the computer vision system.
                  The camera will only capture when all conditions are met: face detected, properly aligned, and good lighting.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraTestPage;
