import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraOff, RotateCcw, Zap, ZapOff } from 'lucide-react';
import { IndicatorPill } from '../shared';
import type { HeadPose, LightingQuality } from '../../utils/visionUtils';
import { useMediaPipeFaceMesh } from '../../hooks/useMediaPipeFaceMesh';
import type { FaceAnalysisResult } from '../../hooks/useMediaPipeFaceMesh';

export interface VisionCameraStatus {
  isAligned: boolean;
  isLightingGood: boolean;
  headPose?: HeadPose;
  lightingQuality?: LightingQuality;
  isFaceDetected: boolean;
  // Raw debug values
  yaw: number;
  pitch: number;
  roll: number;
  averageBrightness: number;
  standardDeviation: number;
}

export interface VisionCameraProps {
  onStatusUpdate: (status: VisionCameraStatus) => void;
  className?: string;
  onReady: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

const VisionCamera: React.FC<VisionCameraProps> = ({
  onStatusUpdate,
  className = '',
  onReady,
  videoRef: externalVideoRef,
  canvasRef: externalCanvasRef,
}) => {
  // Refs for video and canvas elements
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use external refs if provided, otherwise use internal refs
  const videoRef = externalVideoRef || internalVideoRef;
  const canvasRef = externalCanvasRef || internalCanvasRef;
  
  // Component state
  const [isInitialized, setIsInitialized] = useState(false);
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const streamRef = useRef<MediaStream | null>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  
  // Vision status state
  const [currentStatus, setCurrentStatus] = useState<VisionCameraStatus>({
    isAligned: false,
    isLightingGood: false,
    isFaceDetected: false,
    // Initialize raw debug values
    yaw: 0,
    pitch: 0,
    roll: 0,
    averageBrightness: 0,
    standardDeviation: 0
  });
  
  // Flash/torch state
  const [isFlashOn, setIsFlashOn] = useState(false);

  /**
   * Initialize camera stream
   */
  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video metadata to load
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              const video = videoRef.current!;
              setDimensions({
                width: video.videoWidth,
                height: video.videoHeight
              });
              resolve();
            };
          }
        });
        
        await videoRef.current.play();
        setIsInitialized(true);
        // Signal readiness to parent as soon as we start rendering frames
        onReady();
      }
    } catch (err) {
      console.error('Error initializing camera:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera');
    } finally {
      setIsLoading(false);
    }
  }, [cameraFacing, onReady]);

  /**
   * Switch camera facing mode - REAL camera flip with proper stream management
   */
  const switchCamera = useCallback(async () => {
    try {
      console.log('Initiating real camera flip...');
      
      // Step 1: Stop current stream first
      if (streamRef.current) {
        console.log('Stopping current stream tracks...');
        streamRef.current.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}, state: ${track.readyState}`);
          track.stop();
        });
        streamRef.current = null;
      }
      
      // Step 2: Toggle facing mode
      setCameraFacing(prev => {
        const newMode = prev === 'user' ? 'environment' : 'user';
        console.log('Real camera switch from', prev, 'to', newMode);
        return newMode;
      });
      
      // Step 3: Camera will reinitialize automatically due to useEffect dependency
      // This will call getUserMedia with the new facingMode
      
    } catch (error) {
      console.error('Error during camera switch:', error);
      setError('Failed to switch camera');
    }
  }, []);

  /**
   * Toggle flash/torch (for rear camera)
   */
  const toggleFlash = useCallback(async () => {
    if (streamRef.current && cameraFacing === 'environment') {
      try {
        const track = streamRef.current.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if ('torch' in capabilities) {
          const torchConstraint = { torch: !isFlashOn } as unknown as MediaTrackConstraintSet;
          await track.applyConstraints({
            advanced: [torchConstraint]
          });
          setIsFlashOn(!isFlashOn);
        }
      } catch (err) {
        console.error('Error toggling flash:', err);
      }
    }
  }, [cameraFacing, isFlashOn]);

  // Manual capture function removed - now using automatic capture only

  /**
   * Handle MediaPipe face analysis results
   */
  const handleFaceAnalysisResults = useCallback((results: FaceAnalysisResult) => {
    const newStatus: VisionCameraStatus = {
      isAligned: results.isAligned,
      isLightingGood: results.isLightingGood,
      headPose: results.headPose || undefined,
      lightingQuality: results.lightingQuality || undefined,
      isFaceDetected: results.isFaceDetected,
      // Pass through raw debug values
      yaw: results.yaw ?? 0,
      pitch: results.pitch ?? 0,
      roll: results.roll ?? 0,
      averageBrightness: results.averageBrightness ?? 0,
      standardDeviation: results.standardDeviation ?? 0
    };
    
    // Reduced logging for performance
    
    setCurrentStatus(newStatus);
    onStatusUpdate(newStatus);
  }, [onStatusUpdate]);

  /**
   * Initialize MediaPipe Face Mesh processing
   */
  const { status: mediaPipeStatus } = useMediaPipeFaceMesh(
    videoRef as React.RefObject<HTMLVideoElement | null>,
    canvasRef as React.RefObject<HTMLCanvasElement | null>,
    overlayCanvasRef as React.RefObject<HTMLCanvasElement | null>,
    {
      onResults: handleFaceAnalysisResults,
      enableLandmarkDrawing: true,
      confidenceThreshold: 0.7
    }
  );

  /**
   * Setup camera canvas dimensions
   */
  useEffect(() => {
    if (isInitialized && canvasRef.current && overlayCanvasRef.current) {
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      overlayCanvas.width = dimensions.width;
      overlayCanvas.height = dimensions.height;
    }
  }, [isInitialized, dimensions]);

  /**
   * Initialize camera on mount and when facing mode changes
   */
  useEffect(() => {
    initializeCamera();
    
    // Cleanup function
    const localVideoEl = videoRef.current;
    return () => {
      const streamToStop: MediaStream | null = (localVideoEl && localVideoEl.srcObject) ? (localVideoEl.srcObject as MediaStream) : null;
      if (streamToStop) {
        streamToStop.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCamera]);

  /**
   * Handle video element click to focus
   */
  const handleVideoClick = useCallback((event: React.MouseEvent<HTMLVideoElement>) => {
    if (streamRef.current && cameraFacing === 'environment') {
      const video = event.currentTarget;
      const rect = video.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      
      // Apply focus point (if supported)
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if ('focusMode' in capabilities) {
        const focusConstraint = { 
          focusMode: 'manual',
          pointsOfInterest: [{ x, y }]
        } as unknown as MediaTrackConstraintSet;
        track.applyConstraints({
          advanced: [focusConstraint]
        }).catch(err => console.log('Focus not supported:', err));
      }
    }
  }, [cameraFacing]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-midnight-blue bg-opacity-10 rounded-lg p-8 ${className}`}>
        <CameraOff className="w-16 h-16 text-alert-red mb-4" />
        <h3 className="text-h2 text-midnight-blue mb-2">Camera Error</h3>
        <p className="text-body text-medium-grey text-center mb-4">{error}</p>
        <button 
          onClick={initializeCamera}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  // Do not render an internal loading UI; parent can handle overlay while we keep a stable DOM

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Stream */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        onClick={handleVideoClick}
      />
      
      {/* Hidden canvas for frame capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Overlay canvas for landmarks visualization */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {/* Processing Indicator (for debugging) */}
      {mediaPipeStatus.isInitialized && (
        <div className="absolute top-4 right-4">
          <IndicatorPill
            label="Processing"
            text={`${mediaPipeStatus.fpsCount} FPS`}
            status="default"
          />
        </div>
      )}
      
      {/* Camera Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        {/* Left controls */}
        <div className="flex gap-2">
          <button
            onClick={switchCamera}
            className="w-12 h-12 bg-midnight-blue bg-opacity-80 rounded-full flex items-center justify-center text-white hover:bg-opacity-100 transition-all"
            title="Switch Camera"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          
          {cameraFacing === 'environment' && (
            <button
              onClick={toggleFlash}
              className={`w-12 h-12 bg-midnight-blue bg-opacity-80 rounded-full flex items-center justify-center text-white hover:bg-opacity-100 transition-all ${
                isFlashOn ? 'bg-bronze bg-opacity-80' : ''
              }`}
              title="Toggle Flash"
            >
              {isFlashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
            </button>
          )}
        </div>
        
        {/* Center area - no manual capture button (automatic capture only) */}
        <div className="flex-1 flex justify-center">
          <div className="text-white text-center bg-midnight-blue bg-opacity-60 rounded-lg px-4 py-2">
            <div className="text-sm font-semibold">Automatic Capture</div>
            <div className="text-xs opacity-80">Hold position to capture</div>
          </div>
        </div>
        
        {/* Right controls (placeholder for future features) */}
        <div className="w-12"></div>
      </div>
      
      {/* Face alignment guide overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Face oval guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={`w-64 h-80 border-4 rounded-full transition-colors ${
              currentStatus.isAligned ? 'border-clinical-green' : 'border-bronze'
            }`}
            style={{
              borderStyle: 'dashed',
              opacity: 0.7
            }}
          />
        </div>
        
        {/* Center crosshair */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-8 h-0.5 bg-white opacity-50 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="w-0.5 h-8 bg-white opacity-50 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisionCamera;
