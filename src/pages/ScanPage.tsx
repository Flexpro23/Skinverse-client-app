import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DisplayCamera from '../components/camera/DisplayCamera';
import ProcessingEngine from '../components/camera/ProcessingEngine';
import type { VisionStatus } from '../components/camera/ProcessingEngine';
import CameraOverlayUI from '../components/camera/CameraOverlayUI';
import ScanCompleteModal from '../components/camera/ScanCompleteModal';
import { AnimatedLogo } from '../components/shared';
import { useAppActions, useClientInfo, useCapturedImages, useCurrentCaptureStep } from '../store/useAppStore';
import { fileToBase64, getSkinAnalysis } from '../api/gemini';

type CapturePosition = 'center' | 'left' | 'right';
type ScanStage = 'alignment' | 'capture';

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

  // Master scan stage state - Phase 16
  const [scanStage, setScanStage] = useState<ScanStage>('alignment');
  
  // GO/NO-GO Final: User-controlled ready state - No scanning until user clicks "I'm Ready"
  const [isReady, setIsReady] = useState(false);
  
  // Ref-based communication with ProcessingEngine - No re-renders
  const visionStatusRef = useRef<VisionStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setCameraReady] = useState(false);
  const [capturePositions] = useState<CapturePosition[]>(['center', 'left', 'right']);
  
  // State for landmarks to ensure face mesh updates across all stages
  const [currentLandmarks, setCurrentLandmarks] = useState<any[] | null>(null);
  
  // Stability Engine - Phase 12
  const stabilityCounterRef = useRef(0);
  const [stableStatus, setStableStatus] = useState({ isReady: false });
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const captureLockRef = useRef(false);
  

  
  // Shutter flash state for professional capture feedback
  const [isFlashing, setFlashing] = useState(false);
  
  // Scan completion state for persistent layout
  const [isScanComplete, setIsScanComplete] = useState(false);
  
  // Refs for automatic capture
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Bad frame buffer for resilient stability engine
  const badFrameCounterRef = useRef(0);

  // Current capture position
  const currentPosition = capturePositions[currentCaptureStep] || 'center';
  const isComplete = currentCaptureStep >= capturePositions.length;

  // GO/NO-GO Final: Curved Line Alignment System - Left/Right comparison logic
  const isNoseAlignedWithTarget = useCallback((landmarks: any[], requiredPosition: CapturePosition): boolean => {
    if (!landmarks || landmarks.length === 0) return false;
    
    // Get nose tip position (MediaPipe landmark index 1)
    const noseTip = landmarks[1];
    if (!noseTip) return false;
    
    // Convert normalized coordinates to screen coordinates
    const noseX = noseTip.x * window.innerWidth;
    
    // Even closer target positions with >= comparison for curved lines
    switch (requiredPosition) {
      case 'center':
        const centerTarget = window.innerWidth * 0.5;
        const tolerance = 50; // Smaller tolerance for center
        return Math.abs(noseX - centerTarget) < tolerance;
      case 'left':
        const leftTarget = window.innerWidth * 0.4; // Even closer to center
        return noseX <= leftTarget; // When nose reaches or goes past the curved line
      case 'right':
        const rightTarget = window.innerWidth * 0.6; // Even closer to center
        return noseX >= rightTarget; // When nose reaches or goes past the curved line
      default:
        return false;
    }
  }, []);



  // Process skin analysis with Gemini - stabilized with useCallback
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

        // Navigate to analysis-report page
        navigate('/analysis-report');
      }
    } catch (error) {
      console.error('Error processing analysis:', error);
      setAppStatus('error');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImages, clientInfo, setAnalysisResult, setAppStatus, navigate]);

  // Handle image capture - stabilized to prevent re-renders
  const handleCapture = useCallback(async (imageData: string) => {
    try {
      console.log('📸 Silent capture initiated');
      
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



      // Move to next step
      const nextStep = currentCaptureStep + 1;
      setCurrentCaptureStep(nextStep);

      // If all captures complete, show completion modal
      if (nextStep >= capturePositions.length) {
        setIsScanComplete(true);
      }
      
      console.log('✅ Silent capture completed');
    } catch (error) {
      console.error('Error capturing image:', error);
      setAppStatus('error');
    }
  }, [currentPosition, currentCaptureStep, addCapturedImage, setCurrentCaptureStep, setAppStatus, capturePositions.length, processAnalysis]);

  // Silent Automatic Capture with Shutter Flash - Phase 14 (Modified for Phase 16)
  useEffect(() => {
    if (stableStatus.isReady && !captureLockRef.current && !isComplete && scanStage === 'capture') {
      console.log('🔥 SILENT AUTOMATIC CAPTURE TRIGGERED!');
      captureLockRef.current = true; // Prevent multiple captures
      
      // Trigger shutter flash effect
      setFlashing(true);
      
      // Add a small delay to ensure frame stability
      setTimeout(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          if (context) {
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw current video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Get image data as base64
            const imageData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Silent capture (no re-render)
            handleCapture(imageData);
          }
        }
        
        // Turn off shutter flash after brief duration
        setTimeout(() => setFlashing(false), 150);
      }, 100); // Small delay to ensure frame stability
    }
  }, [stableStatus.isReady, currentCaptureStep, isComplete, handleCapture, scanStage]);

  // Reset capture lock when changing steps
  useEffect(() => {
    captureLockRef.current = false;
    stabilityCounterRef.current = 0;
    badFrameCounterRef.current = 0;
    setStableStatus({ isReady: false });
    setStabilityProgress(0);
    setFlashing(false); // Ensure no flash state persists
    
    // Reset to alignment stage when starting new capture step
    if (currentCaptureStep === 0) {
      setScanStage('alignment');
    }
  }, [currentCaptureStep]);

  // GO/NO-GO Final: Enhanced Position-Aware Stability Engine  
  useEffect(() => {
    // Don't start stability engine until user is ready
    if (!isReady) return;
    
    const intervalId = setInterval(() => {
      const status = visionStatusRef.current;
      if (!status) return;
      const s = status; // Non-null after guard



      // Update landmarks state for face mesh rendering across all stages
      if (s.landmarks && s.landmarks !== currentLandmarks) {
        setCurrentLandmarks(s.landmarks);
      }
      
      // GO/NO-GO Final: Facial Anchor Line alignment checking - NEW GUIDANCE SYSTEM
      const isNoseAligned = s.landmarks ? isNoseAlignedWithTarget(s.landmarks, currentPosition) : false;
      const allConditionsMet = s.isFaceDetected && s.isLightingGood && isNoseAligned;
      
      // Debug logging completely disabled to prevent console spam
      // Only log on successful captures or significant state changes
      if (false) { // Disabled logging
        console.log(`🔍 Facial Anchor Capture Conditions for ${currentPosition}:`, {
          faceDetected: s.isFaceDetected,
          lightingGood: s.isLightingGood,
          noseAligned: isNoseAligned,
          hasLandmarks: !!s.landmarks,
          allMet: allConditionsMet
        });
      }
      
      if (allConditionsMet) {
        // Good conditions - reset bad frame counter and increment stability
        badFrameCounterRef.current = 0;
        stabilityCounterRef.current += 1;
        // GO/NO-GO Final: Increased threshold to 45 frames (1.5 seconds at 30fps)
        const newProgress = Math.min(100, Math.round((stabilityCounterRef.current / 45) * 100));
        setStabilityProgress(newProgress);
        
        // Only log significant milestones to reduce console noise
        if (stabilityCounterRef.current % 10 === 0 || stabilityCounterRef.current >= 45) {
          console.log(`🎯 Position-Aware Stability: ${stabilityCounterRef.current}/45 (${newProgress}%) - ${currentPosition}`);
        }
      } else {
        // Bad conditions - use buffer to forgive momentary issues
        badFrameCounterRef.current += 1;
        
        // Only reset stability if we have sustained bad frames (> 3)
        if (badFrameCounterRef.current > 3) {
          if (stabilityCounterRef.current > 0) {
            stabilityCounterRef.current = Math.max(0, stabilityCounterRef.current - 2);
            const newProgress = Math.round((stabilityCounterRef.current / 45) * 100);
            setStabilityProgress(newProgress);
            
            if (stabilityCounterRef.current === 0) {
              console.log(`❌ Position stability lost for ${currentPosition} - counter reset after buffer`);
              badFrameCounterRef.current = 0; // Reset bad frame counter
            }
          }
        }
        // If bad frame counter <= 3, we "forgive" and don't reset stability
      }

      // GO/NO-GO Final: Check threshold (45 frames = 1.5 seconds at 30fps)
      if (stabilityCounterRef.current >= 45) {
        if (!stableStatus.isReady) {
          if (scanStage === 'alignment') {
            console.log('🟢 ALIGNMENT STAGE COMPLETE - Transitioning to Capture!');
            setStableStatus({ isReady: true });
            // Transition to capture stage after stable alignment
            setTimeout(() => {
              setScanStage('capture');
              console.log('🎯 ENTERING CAPTURE STAGE');
            }, 500); // Small delay for smooth transition
          } else if (scanStage === 'capture') {
            console.log(`🟢 CAPTURE STAGE - Ready for automatic capture at ${currentPosition}!`);
            setStableStatus({ isReady: true });
          }
        }
      } else {
        if (stableStatus.isReady) {
          console.log(`🔴 STABLE STATE LOST for ${currentPosition} - Not ready`);
          setStableStatus({ isReady: false });
          captureLockRef.current = false; // Reset capture lock when losing stability
        }
      }
    }, 100); // Run 10 times per second for smooth updates

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [stableStatus.isReady, scanStage, isReady, currentPosition, isNoseAlignedWithTarget]); // Include all dependencies





  // Handle back navigation
  const handleBack = () => {
    if (currentCaptureStep > 0) {
      setCurrentCaptureStep(currentCaptureStep - 1);
    } else {
      clearCapturedImages();
      navigate('/');
    }
  };

  // GO/NO-GO Final: Handle ready state
  const handleReadyClick = useCallback(() => {
    console.log('🚀 User clicked "I\'m Ready" - Starting scan process');
    setIsReady(true);
  }, []);

  // Handle restart
  const handleRestart = () => {
    clearCapturedImages();
    setCurrentCaptureStep(0);
    setAppStatus('idle');
    setIsScanComplete(false);
    setScanStage('alignment'); // Reset to alignment stage
    setIsReady(false); // Reset ready state
  };

  // Reset scan for retake functionality
  const resetScan = useCallback(() => {
    clearCapturedImages();
    setCurrentCaptureStep(0);
    setAppStatus('idle');
    setIsScanComplete(false);
    setFlashing(false);
    stabilityCounterRef.current = 0;
    badFrameCounterRef.current = 0;
    setStableStatus({ isReady: false });
    setStabilityProgress(0);
    captureLockRef.current = false;
    setScanStage('alignment'); // Reset to alignment stage
    setIsReady(false); // Reset ready state
  }, [clearCapturedImages, setCurrentCaptureStep, setAppStatus]);

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

  // Remove conditional rendering - use persistent layout instead

  return (
    <div className="relative w-full h-screen overflow-hidden bg-midnight-blue">
      
      {/* Header - Always visible */}
      <div className="bg-white shadow-sm relative z-10">
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

      {/* Progress Bar - Always visible */}
      <div className="bg-white border-b relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="w-full bg-light-border-grey rounded-full h-2">
            <div 
              className="bg-bronze h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentCaptureStep / capturePositions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* GO/NO-GO Final: Immersive Full-Screen Camera Experience */}
      <div className={`absolute inset-0 top-[120px] transition-opacity duration-500 ${isScanComplete ? 'opacity-20' : 'opacity-100'}`}>
        <div className="w-full h-full bg-black">
          {/* Immersive Camera Container - No borders, pure full-screen */}
          <div className="relative w-full h-full overflow-hidden">
            {/* DUAL ARCHITECTURE: Display + Processing */}
            
            {/* DisplayCamera - Pure video display with real-time face mesh */}
            <div className={`transition-opacity duration-700 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}>
              <DisplayCamera
                onReady={() => setCameraReady(true)}
                videoRef={videoRef}
                onCameraError={(error) => {
                  console.error('Camera error:', error);
                  setAppStatus('error');
                }}
                showGuidanceOverlay={false}
                className="w-full h-full"
                landmarks={currentLandmarks}
                scanStage={scanStage}
                currentCaptureStep={currentCaptureStep}
                isFaceDetected={visionStatusRef.current?.isFaceDetected || false}
                isAligned={visionStatusRef.current?.isAligned || false}
                isLightingGood={visionStatusRef.current?.isLightingGood || false}
              />
            </div>
            
            {/* ProcessingEngine - Invisible MediaPipe analysis */}
            <ProcessingEngine
              videoRef={videoRef}
              statusRef={visionStatusRef}
              isEnabled={isCameraReady && !isComplete}
            />
            
            {/* Hidden canvas for automatic capture */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {/* Overlay shown until camera is ready */}
            {!isCameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black z-30">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-bronze mb-6"></div>
                <h2 className="text-h2 text-white mb-2">Initializing Camera</h2>
                <p className="text-body text-gray-300">Please allow camera access</p>
              </div>
            )}

            {/* GO/NO-GO Final: Integrated Camera Overlay UI with Facial Anchor Line System */}
            {isCameraReady && (
              <CameraOverlayUI
                scanStage={scanStage}
                currentCaptureStep={currentCaptureStep}
                capturePositions={capturePositions}
                capturedImages={capturedImages}
                isFaceDetected={visionStatusRef.current?.isFaceDetected || false}
                isAligned={visionStatusRef.current?.isAligned || false}
                isLightingGood={visionStatusRef.current?.isLightingGood || false}
                landmarks={currentLandmarks}
                isReady={isReady}
                onReadyClick={handleReadyClick}
                stabilityProgress={stabilityProgress}
                stableStatus={stableStatus}
              />
            )}
          </div>
        </div>
      </div>

      {/* Professional Shutter Flash - Temporary overlay */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-20"></div>
      )}

      {/* Scan Complete Modal - Final overlay */}
      {isScanComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-30">
          <ScanCompleteModal
            capturedImages={capturedImages}
            onViewAnalysis={processAnalysis}
            onRetake={resetScan}
          />
        </div>
      )}
    </div>
  );
};

export default ScanPage;
