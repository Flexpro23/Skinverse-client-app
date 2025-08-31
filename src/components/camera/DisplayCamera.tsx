import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraOff, RotateCcw, Zap, ZapOff } from 'lucide-react';

import type { NormalizedLandmark } from '@mediapipe/face_mesh';

export interface DisplayCameraProps {
  className?: string;
  onReady?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onCameraError?: (error: string) => void;
  showGuidanceOverlay?: boolean;
  // Phase 16: Stage-specific props
  scanStage?: 'alignment' | 'capture';
  currentCaptureStep?: number;
  isFaceDetected?: boolean;
  isAligned?: boolean;
  isLightingGood?: boolean;
  landmarks?: NormalizedLandmark[] | null;
}

const DisplayCamera: React.FC<DisplayCameraProps> = ({
  className = '',
  onReady,
  videoRef: externalVideoRef,
  onCameraError,
  showGuidanceOverlay = true,
  // Phase 16: Stage-specific props
  scanStage = 'alignment',
  currentCaptureStep = 0,
  isFaceDetected = false,
  isAligned = false,
  isLightingGood = false,
  landmarks = null
}) => {
  // Refs for video element
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  
  // Phase 16: Face mesh canvas overlay
  const faceMeshCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Minimal state - only for camera initialization
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Initialize camera stream - Pure display only
   */
  const initializeCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    try {
      console.log('📹 DisplayCamera: Initializing camera stream...');
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Request camera with specified facing mode
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          const handleLoadedMetadata = () => {
            if (videoRef.current) {
              videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            }
            resolve();
          };
          
          if (videoRef.current) {
            videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
          }
        });

        await videoRef.current.play();
        
        setIsInitialized(true);
        setError(null);
        onReady?.();
        
        console.log('✅ DisplayCamera: Camera initialized successfully');
      }
    } catch (err) {
      console.error('❌ DisplayCamera: Failed to initialize camera:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown camera error';
      setError(errorMessage);
      onCameraError?.(errorMessage);
    }
  }, [videoRef, onReady, onCameraError]);

  /**
   * Switch between front/back camera
   */
  const switchCamera = useCallback(() => {
    console.log('📷 DisplayCamera: Switching camera...');
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);
    initializeCamera(newFacing);
  }, [cameraFacing, initializeCamera]);

  /**
   * Toggle flash/torch (if available)
   */
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any; // Flash API is not in standard types
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashOn } as any]
        });
        setIsFlashOn(!isFlashOn);
        console.log(`💡 DisplayCamera: Flash ${!isFlashOn ? 'ON' : 'OFF'}`);
      }
    } catch (err) {
      console.error('Flash control error:', err);
    }
  }, [isFlashOn]);

  /**
   * Handle video click for focus
   */
  const handleVideoClick = useCallback(() => {
    // Simple focus indication - no processing
    console.log('👆 DisplayCamera: Video clicked for focus');
  }, []);

  /**
   * Real-time 3D face mesh overlay - Fixed for continuous updating
   */
  const drawFaceMesh = useCallback(() => {
    if (!faceMeshCanvasRef.current || !videoRef.current) {
      return;
    }

    const canvas = faceMeshCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get fresh landmarks - this is the key fix!
    const currentLandmarks = landmarks;
    if (!isFaceDetected || !currentLandmarks || currentLandmarks.length === 0) return;

    // Set mesh style
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    // Convert normalized coordinates to canvas coordinates
    const getCanvasPoint = (landmark: NormalizedLandmark) => ({
      x: landmark.x * canvas.width,
      y: landmark.y * canvas.height
    });

    // Draw key facial feature points
    currentLandmarks.forEach((landmark, index) => {
      // Only draw every 3rd landmark to reduce visual noise
      if (index % 3 === 0) {
        const point = getCanvasPoint(landmark);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw key facial contours using simplified connections
    const drawContour = (indices: number[]) => {
      if (indices.length < 2) return;
      
      ctx.beginPath();
      indices.forEach((index, i) => {
        if (index < currentLandmarks.length) {
          const point = getCanvasPoint(currentLandmarks[index]);
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
      });
      ctx.stroke();
    };

    // Key MediaPipe face mesh indices for major facial features
    try {
      // Face oval (simplified)
      const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
      
      // Eyes (simplified)
      const leftEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
      const rightEye = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
      
      // Mouth (simplified)
      const mouth = [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318];
      
      // Nose (simplified)
      const nose = [1, 2, 5, 4, 6, 19, 94, 168, 8, 9, 10, 151, 195, 197, 196, 3];

      // Draw the contours
      drawContour(faceOval);
      drawContour(leftEye);
      drawContour(rightEye);
      drawContour(mouth);
      drawContour(nose);
      
    } catch (error) {
      // Fallback: draw a simple grid pattern if specific indices fail
      for (let i = 0; i < currentLandmarks.length; i += 20) {
        for (let j = i + 1; j < Math.min(i + 10, currentLandmarks.length); j++) {
          const point1 = getCanvasPoint(currentLandmarks[i]);
          const point2 = getCanvasPoint(currentLandmarks[j]);
          
          ctx.beginPath();
          ctx.moveTo(point1.x, point1.y);
          ctx.lineTo(point2.x, point2.y);
          ctx.stroke();
        }
      }
    }
  }, [landmarks, isFaceDetected]);

  /**
   * Continuous face mesh animation loop - Fixed to work across all stages with landmark dependency
   */
  useEffect(() => {
    if (!isInitialized) return;

    let animationId: number;
    
    const animate = () => {
      drawFaceMesh();
      animationId = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isInitialized, drawFaceMesh, landmarks, scanStage]); // Added landmarks and scanStage as dependencies

  /**
   * Initialize camera on mount
   */
  useEffect(() => {
    initializeCamera(cameraFacing);
    
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        console.log('🧹 DisplayCamera: Cleaning up camera stream');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []); // Only run on mount

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center p-6">
          <CameraOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
          <p className="text-sm text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => initializeCamera(cameraFacing)}
            className="px-4 py-2 bg-bronze text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Pure Video Stream - No processing overlays */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        onClick={handleVideoClick}
      />
      
      {/* Phase 16: Real-time 3D Face Mesh Overlay */}
      <canvas
        ref={faceMeshCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 5 }}
      />
      
      {/* Phase 16: Stage-Specific Guidance Overlays */}
      {showGuidanceOverlay && scanStage === 'alignment' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Anatomical Face Outline for Alignment Stage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Main face oval - more anatomical */}
              <div 
                className={`w-72 h-96 border-4 transition-all duration-500 ${
                  isFaceDetected ? 'border-clinical-green' : 'border-bronze'
                }`}
                style={{
                  borderRadius: '50% 50% 45% 45%',
                  borderStyle: 'solid',
                  opacity: 0.8,
                  transform: 'translateY(-10px)' // Slight upward shift for better positioning
                }}
              />
              
              {/* Chin area */}
              <div 
                className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-12 border-4 transition-all duration-500 ${
                  isFaceDetected ? 'border-clinical-green' : 'border-bronze'
                }`}
                style={{
                  borderRadius: '0 0 50% 50%',
                  borderTop: 'none',
                  opacity: 0.6
                }}
              />
              
              {/* Eye area guides */}
              <div className="absolute top-24 left-1/2 transform -translate-x-1/2 flex justify-between w-32">
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  isFaceDetected ? 'bg-clinical-green' : 'bg-bronze'
                }`} style={{ opacity: 0.7 }} />
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  isFaceDetected ? 'bg-clinical-green' : 'bg-bronze'
                }`} style={{ opacity: 0.7 }} />
              </div>
              
              {/* Nose guide */}
              <div className={`absolute top-36 left-1/2 transform -translate-x-1/2 w-1 h-8 transition-all duration-500 ${
                isFaceDetected ? 'bg-clinical-green' : 'bg-bronze'
              }`} style={{ opacity: 0.6 }} />
            </div>
          </div>
          
          {/* Status Indicators for Alignment */}
          <div className="absolute top-8 left-8 space-y-3">
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 ${
              isFaceDetected ? 'bg-clinical-green bg-opacity-20 border border-clinical-green' : 'bg-gray-800 bg-opacity-50 border border-gray-600'
            }`}>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isFaceDetected ? 'bg-clinical-green' : 'bg-gray-400'
              }`} />
              <span className={`text-sm font-medium transition-all duration-300 ${
                isFaceDetected ? 'text-clinical-green' : 'text-gray-300'
              }`}>
                Face Detection
              </span>
            </div>
            
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 ${
              isAligned ? 'bg-clinical-green bg-opacity-20 border border-clinical-green' : 'bg-gray-800 bg-opacity-50 border border-gray-600'
            }`}>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isAligned ? 'bg-clinical-green' : 'bg-gray-400'
              }`} />
              <span className={`text-sm font-medium transition-all duration-300 ${
                isAligned ? 'text-clinical-green' : 'text-gray-300'
              }`}>
                Position
              </span>
            </div>
            
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 ${
              isLightingGood ? 'bg-clinical-green bg-opacity-20 border border-clinical-green' : 'bg-gray-800 bg-opacity-50 border border-gray-600'
            }`}>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isLightingGood ? 'bg-clinical-green' : 'bg-gray-400'
              }`} />
              <span className={`text-sm font-medium transition-all duration-300 ${
                isLightingGood ? 'text-clinical-green' : 'text-gray-300'
              }`}>
                Lighting
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Phase 16: Capture Stage Guide */}
      {showGuidanceOverlay && scanStage === 'capture' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated "Match the Lines" Guide */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Center position guide */}
              {currentCaptureStep === 0 && (
                <div className="w-80 h-96 border-4 border-bronze animate-pulse" 
                     style={{
                       borderRadius: '50% 50% 45% 45%',
                       borderStyle: 'dashed',
                       opacity: 0.8
                     }}>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-bronze opacity-70"></div>
                    <div className="w-0.5 h-8 bg-bronze opacity-70 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              )}
              
              {/* Left profile guide */}
              {currentCaptureStep === 1 && (
                <div className="relative">
                  <div className="w-72 h-88 border-4 border-bronze animate-pulse transform -rotate-12" 
                       style={{
                         borderRadius: '60% 40% 45% 55%',
                         borderStyle: 'dashed',
                         opacity: 0.8
                       }}>
                  </div>
                  <div className="absolute top-8 right-4 text-bronze font-semibold">
                    ← Turn Left
                  </div>
                </div>
              )}
              
              {/* Right profile guide */}
              {currentCaptureStep === 2 && (
                <div className="relative">
                  <div className="w-72 h-88 border-4 border-bronze animate-pulse transform rotate-12" 
                       style={{
                         borderRadius: '40% 60% 55% 45%',
                         borderStyle: 'dashed',
                         opacity: 0.8
                       }}>
                  </div>
                  <div className="absolute top-8 left-4 text-bronze font-semibold">
                    Turn Right →
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Capture Stage Instructions */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="bg-midnight-blue bg-opacity-80 text-white px-6 py-3 rounded-lg text-center">
              <p className="text-sm font-medium">
                {currentCaptureStep === 0 && "Look straight ahead - auto-capture in progress"}
                {currentCaptureStep === 1 && "Turn to show your left profile"}
                {currentCaptureStep === 2 && "Turn to show your right profile"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Camera Controls - Static positioning */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        {/* Switch Camera Button */}
        <button
          onClick={switchCamera}
          className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
          title="Switch Camera"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Flash Toggle */}
        <button
          onClick={toggleFlash}
          className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
          title={isFlashOn ? "Turn Off Flash" : "Turn On Flash"}
        >
          {isFlashOn ? (
            <Zap className="w-5 h-5 text-yellow-400" />
          ) : (
            <ZapOff className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Loading Overlay - Only until initialized */}
      {!isInitialized && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bronze mb-4"></div>
          <p className="text-medium-grey">Initializing Camera</p>
          <p className="text-sm text-gray-500 mt-2">Please allow camera access</p>
        </div>
      )}
    </div>
  );
};

export default DisplayCamera;
