import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle } from 'lucide-react';
import VisionCamera from '../components/camera/VisionCamera';
import type { VisionCameraStatus } from '../components/camera/VisionCamera';
import { Button, IndicatorPill, AnimatedLogo } from '../components/shared';
import { useAppActions, useClientInfo, useCapturedImages, useCurrentCaptureStep } from '../store/useAppStore';
import { fileToBase64, getSkinAnalysis } from '../api/gemini';

type CapturePosition = 'center' | 'left' | 'right';

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const clientInfo = useClientInfo();
  const capturedImages = useCapturedImages();
  const currentCaptureStep = useCurrentCaptureStep();
  
  const { 
    addCapturedImage, 
    setCurrentCaptureStep, 
    setAnalysisResult, 
    setAppStatus,
    clearCapturedImages
  } = useAppActions();

  // Local state
  const [currentStatus, setCurrentStatus] = useState<VisionCameraStatus>({
    isAligned: false,
    isLightingGood: false,
    isFaceDetected: false,
    // Initialize debug values to prevent .toFixed() crashes
    yaw: 0,
    pitch: 0,
    roll: 0,
    averageBrightness: 0,
    standardDeviation: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setCameraReady] = useState(false);
  const [capturePositions] = useState<CapturePosition[]>(['center', 'left', 'right']);
  const [instructions, setInstructions] = useState<string>('Position your face in the center frame');
  const [showHelpMessage, setShowHelpMessage] = useState(false);
  const helpTimerRef = useRef<number | null>(null);

  // Current capture position
  const currentPosition = capturePositions[currentCaptureStep] || 'center';
  const isComplete = currentCaptureStep >= capturePositions.length;

  // Update instructions based on current position
  useEffect(() => {
    switch (currentPosition) {
      case 'center':
        setInstructions('Look straight ahead into the camera');
        break;
      case 'left':
        setInstructions('Turn your head to show your left profile');
        break;
      case 'right':
        setInstructions('Turn your head to show your right profile');
        break;
      default:
        setInstructions('Position your face in the frame');
    }
  }, [currentPosition]);

  // No-face-detected timeout handler (15s)
  useEffect(() => {
    if (helpTimerRef.current) {
      clearTimeout(helpTimerRef.current);
    }
    setShowHelpMessage(false);
    helpTimerRef.current = window.setTimeout(() => {
      setShowHelpMessage(true);
    }, 15000);

    return () => {
      if (helpTimerRef.current) {
        clearTimeout(helpTimerRef.current);
        helpTimerRef.current = null;
      }
    };
  }, [currentPosition, capturedImages.length]);

  // Handle status updates from camera - Fixed stale closure bug
  const handleStatusUpdate = useCallback((status: VisionCameraStatus) => {
    // Only log significant changes to prevent console flooding
    setCurrentStatus(prev => {
      if (!prev.isFaceDetected && status.isFaceDetected) {
        console.log('✅ Face detected!');
      } else if (prev.isFaceDetected && !status.isFaceDetected) {
        console.log('❌ Face lost!');
      }
      return status;
    });
  }, []);

  // Process skin analysis with Gemini
  const processAnalysis = useCallback(async () => {
    if (capturedImages.length < 3) return;

    setIsProcessing(true);
    setAppStatus('analyzing');

    try {
      // Convert all images to base64
      const base64Images = await Promise.all(
        capturedImages.map(async (img) => await fileToBase64(img.blob))
      );

      // Get analysis from Gemini
      const analysisResult = await getSkinAnalysis(base64Images);
      
      if (analysisResult) {
        setAnalysisResult(analysisResult);

        // Save to Firebase if client is registered
        if (clientInfo && clientInfo.clientId) {
          const { uploadScanImages, saveScanResult } = await import('../services/firebase');
          // Upload images to storage
          const centerBlob = capturedImages.find(img => img.position === 'center')?.blob;
          const leftBlob = capturedImages.find(img => img.position === 'left')?.blob;
          const rightBlob = capturedImages.find(img => img.position === 'right')?.blob;

          if (!centerBlob || !leftBlob || !rightBlob) {
            throw new Error('Missing captured images for upload');
          }

          const imageUrls = await uploadScanImages(
            'skinverse-clinic', // clinicId
            clientInfo.clientId,
            {
              center: centerBlob,
              left: leftBlob,
              right: rightBlob
            }
          );

          if (imageUrls) {
            // Save scan result
            await saveScanResult(
              'skinverse-clinic',
              clientInfo.clientId,
              {
                performedByDevice: 'skinverse-tablet-001',
                imageUrls,
                analysisResult
              }
            );
          }
        }

        // Navigate to analysis page
        navigate('/analysis');
      }
    } catch (error) {
      console.error('Error processing analysis:', error);
      setAppStatus('error');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImages, clientInfo, setAnalysisResult, setAppStatus, navigate]);

  // Handle image capture
  const handleCapture = useCallback(async (imageData: string) => {
    try {
      // Convert data URL to blob for processing
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Add to captured images
      addCapturedImage({
        position: currentPosition,
        blob,
        dataUrl: imageData,
        timestamp: Date.now()
      });

      // Reset the help timer upon successful capture
      if (helpTimerRef.current) {
        clearTimeout(helpTimerRef.current);
        helpTimerRef.current = null;
      }
      setShowHelpMessage(false);

      // Move to next step
      const nextStep = currentCaptureStep + 1;
      setCurrentCaptureStep(nextStep);

      // If all captures complete, process analysis
      if (nextStep >= capturePositions.length) {
        await processAnalysis();
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      setAppStatus('error');
    }
  }, [currentPosition, currentCaptureStep, addCapturedImage, setCurrentCaptureStep, setAppStatus, capturePositions.length, processAnalysis]);

  // Handle back navigation
  const handleBack = () => {
    if (currentCaptureStep > 0) {
      setCurrentCaptureStep(currentCaptureStep - 1);
    } else {
      clearCapturedImages();
      navigate('/');
    }
  };

  // Handle restart
  const handleRestart = () => {
    clearCapturedImages();
    setCurrentCaptureStep(0);
    setAppStatus('idle');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AnimatedLogo size="large" animate={true} className="mb-8" />
          <h2 className="text-h2 text-midnight-blue mb-4">Analyzing Your Skin</h2>
          <p className="text-body text-medium-grey mb-8">
            Our AI is processing your images to provide personalized insights...
          </p>
          <div className="w-16 h-16 border-4 border-bronze border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <CheckCircle className="w-16 h-16 text-clinical-green mx-auto mb-6" />
            <h2 className="text-h2 text-midnight-blue mb-4">Scan Complete!</h2>
            <p className="text-body text-medium-grey mb-8">
              We've captured all three angles. Your analysis is being processed.
            </p>
            
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

            <div className="space-y-4">
              <Button
                variant="primary"
                fullWidth
                onClick={() => processAnalysis()}
              >
                View Analysis
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleRestart}
              >
                Retake Photos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight-blue">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-midnight-blue hover:text-bronze transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-h2 text-midnight-blue">
              Skin Scan - {currentPosition.charAt(0).toUpperCase() + currentPosition.slice(1)} View
            </h1>
            <p className="text-label text-medium-grey">
              Step {currentCaptureStep + 1} of {capturePositions.length}
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="text-medium-grey hover:text-alert-red transition-colors text-label"
          >
            Restart
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="w-full bg-light-border-grey rounded-full h-2">
            <div 
              className="bg-bronze h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentCaptureStep / capturePositions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            
            {/* Camera Section */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg p-6 h-full">
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                  {/* Stable camera mount - always rendered */}
                  <div className={`transition-opacity duration-500 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}>
                    <VisionCamera
                      onCapture={handleCapture}
                      onStatusUpdate={handleStatusUpdate}
                      onReady={() => setCameraReady(true)}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Overlay shown until camera is ready */}
                  {!isCameraReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bronze"></div>
                      <p className="mt-4 text-medium-grey">Initializing Camera</p>
                      <p className="text-sm text-gray-500">Please allow camera access</p>
                    </div>
                  )}

                  {/* Position Indicator Overlay */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-midnight-blue bg-opacity-80 text-white px-4 py-2 rounded-lg">
                      <div className="text-center">
                        <Camera className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-sm font-semibold">{currentPosition.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {showHelpMessage && (
                  <div className="mt-4 p-4 bg-alert-red bg-opacity-10 border border-alert-red rounded-lg">
                    <p className="text-label text-alert-red">
                      Having trouble? Make sure your face is centered and well-lit. Try moving closer to the camera and avoid backlighting.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Panel */}
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-body font-semibold text-midnight-blue mb-4">
                  Instructions
                </h3>
                <p className="text-label text-medium-grey mb-4">
                  {instructions}
                </p>
                
                {/* Capture Requirements */}
                <div className="space-y-2">
                  <IndicatorPill
                    label="Face Detection"
                    text={currentStatus.isFaceDetected ? "Detected" : "Not Found"}
                    status={currentStatus.isFaceDetected ? "success" : "error"}
                  />
                  <IndicatorPill
                    label="Position"
                    text={currentStatus.isAligned ? "Aligned" : "Adjust"}
                    status={currentStatus.isAligned ? "success" : "default"}
                  />
                  <IndicatorPill
                    label="Lighting"
                    text={currentStatus.isLightingGood ? "Good" : "Poor"}
                    status={currentStatus.isLightingGood ? "success" : "error"}
                  />
                </div>

                {/* Capture Readiness */}
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
                        {(currentStatus.yaw ?? 0).toFixed(2)}°
                      </span>
                    </div>
                    <div>
                      <span className="text-medium-grey">Pitch:</span>
                      <span className="text-midnight-blue font-mono ml-2">
                        {(currentStatus.pitch ?? 0).toFixed(2)}°
                      </span>
                    </div>
                    <div>
                      <span className="text-medium-grey">Roll:</span>
                      <span className="text-midnight-blue font-mono ml-2">
                        {(currentStatus.roll ?? 0).toFixed(2)}°
                      </span>
                    </div>
                    <div>
                      <span className="text-medium-grey">Brightness:</span>
                      <span className="text-midnight-blue font-mono ml-2">
                        {(currentStatus.averageBrightness ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-medium-grey">Std Dev:</span>
                      <span className="text-midnight-blue font-mono ml-2">
                        {(currentStatus.standardDeviation ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Captured Images */}
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
        </div>
      </div>
    </div>
  );
};

export default ScanPage;
