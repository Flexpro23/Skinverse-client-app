import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import type { Results, NormalizedLandmark } from '@mediapipe/face_mesh';
import { 
  calculateHeadPose, 
  calculateLightingQuality, 
  isHeadPoseAcceptable
} from '../utils/visionUtils';
import type { HeadPose, LightingQuality } from '../utils/visionUtils';

export interface MediaPipeStatus {
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  lastProcessingTime: number;
  fpsCount: number;
}

export interface FaceAnalysisResult {
  landmarks: NormalizedLandmark[] | null;
  headPose: HeadPose | null;
  lightingQuality: LightingQuality | null;
  isFaceDetected: boolean;
  isAligned: boolean;
  isLightingGood: boolean;
  confidence: number;
  // Raw debug values for Live Debug Panel
  yaw?: number;
  pitch?: number;
  roll?: number;
  averageBrightness?: number;
  standardDeviation?: number;
}

export interface UseMediaPipeFaceMeshOptions {
  onResults?: (results: FaceAnalysisResult) => void;
  enableLandmarkDrawing?: boolean;
  confidenceThreshold?: number;
}

export const useMediaPipeFaceMesh = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseMediaPipeFaceMeshOptions = {}
) => {
  const {
    onResults,
    enableLandmarkDrawing = true,
    confidenceThreshold = 0.8
  } = options;

  // MediaPipe instance ref
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  // const lastFrameTimeRef = useRef<number>(0); // Removed unused ref to satisfy linter
  const fpsCounterRef = useRef<number>(0);
  const fpsTimestampRef = useRef<number>(Date.now());
  const isProcessingRef = useRef<boolean>(false); // Fix for stale closure bug
  // Stability smoothing to prevent UI flicker
  const stabilityRef = useRef({
    face: false,
    align: false,
    light: false,
    faceGood: 0,
    faceBad: 0,
    alignGood: 0,
    alignBad: 0,
    lightGood: 0,
    lightBad: 0
  });
  const STREAK_ON = 5;   // frames required to turn ON
  const STREAK_OFF = 3;  // frames required to turn OFF

  // Component state
  const [status, setStatus] = useState<MediaPipeStatus>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    lastProcessingTime: 0,
    fpsCount: 0
  });

  const [currentResults, setCurrentResults] = useState<FaceAnalysisResult>({
    landmarks: null,
    headPose: null,
    lightingQuality: null,
    isFaceDetected: false,
    isAligned: false,
    isLightingGood: false,
    confidence: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    averageBrightness: 0,
    standardDeviation: 0
  });

  /**
   * Draw facial landmarks on overlay canvas (moved up to satisfy usage order)
   */
  const drawLandmarks = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number,
    isAligned: boolean
  ) => {
    ctx.fillStyle = isAligned ? '#2E7D32' : '#C5A475';
    ctx.strokeStyle = isAligned ? '#2E7D32' : '#C5A475';
    ctx.lineWidth = 1;
    landmarks.forEach((landmark) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, 2 * Math.PI);
      ctx.fill();
    });
    const faceOval = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
      397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
      172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
    ];
    ctx.beginPath();
    faceOval.forEach((index, i) => {
      if (index < landmarks.length) {
        const x = landmarks[index].x * width;
        const y = landmarks[index].y * height;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();
    const leftEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    const rightEye = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
    [leftEye, rightEye].forEach(eyeIndices => {
      ctx.beginPath();
      eyeIndices.forEach((index, i) => {
        if (index < landmarks.length) {
          const x = landmarks[index].x * width;
          const y = landmarks[index].y * height;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.stroke();
    });
    const mouth = [61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318];
    ctx.beginPath();
    mouth.forEach((index, i) => {
      if (index < landmarks.length) {
        const x = landmarks[index].x * width;
        const y = landmarks[index].y * height;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();
  }, []);

  /**
   * Process MediaPipe results
   */
  const onMediaPipeResults = useCallback((results: Results) => {
    const startTime = performance.now();
    // Reduced logging to prevent console flooding
    try {
      if (!canvasRef.current || !overlayCanvasRef.current) return;

      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const overlayCtx = overlayCanvas.getContext('2d');
      const canvasCtx = canvas.getContext('2d', { willReadFrequently: true });
      if (!overlayCtx || !canvasCtx) return;

      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      const hasFace = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
      const analysisResult: FaceAnalysisResult = {
        landmarks: null,
        headPose: null,
        lightingQuality: null,
        isFaceDetected: hasFace,
        isAligned: false,
        isLightingGood: false,
        confidence: 0,
        yaw: 0,
        pitch: 0,
        roll: 0,
        averageBrightness: 0,
        standardDeviation: 0
      };

      if (hasFace && results.multiFaceLandmarks[0]) {
        const landmarks = results.multiFaceLandmarks[0];
        analysisResult.landmarks = landmarks;
        analysisResult.confidence = 1.0;
        if (videoRef.current) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          canvasCtx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const headPose = calculateHeadPose(landmarks, canvas.width, canvas.height);
          analysisResult.headPose = headPose;
          const alignedNow = isHeadPoseAcceptable(headPose);
          const lightingQuality = calculateLightingQuality(canvasCtx, landmarks, canvas.width, canvas.height);
          analysisResult.lightingQuality = lightingQuality;
          const lightingNow = lightingQuality.isGood;
          // Raw debug values
          analysisResult.yaw = headPose.yaw;
          analysisResult.pitch = headPose.pitch;
          analysisResult.roll = headPose.roll;
          analysisResult.averageBrightness = lightingQuality.brightness;
          analysisResult.standardDeviation = lightingQuality.standardDeviation;
          // Debounce/stabilize indicators
          const s = stabilityRef.current;
          // Face present is already true in this branch
          s.faceGood = Math.min(STREAK_ON, s.faceGood + 1);
          s.faceBad = 0;
          s.face = s.faceGood >= STREAK_ON ? true : s.face;
          // Alignment smoothing
          if (alignedNow) { s.alignGood = Math.min(STREAK_ON, s.alignGood + 1); s.alignBad = 0; }
          else { s.alignBad = Math.min(STREAK_OFF, s.alignBad + 1); s.alignGood = 0; }
          if (s.alignGood >= STREAK_ON) s.align = true;
          if (s.alignBad >= STREAK_OFF) s.align = false;
          // Lighting smoothing
          if (lightingNow) { s.lightGood = Math.min(STREAK_ON, s.lightGood + 1); s.lightBad = 0; }
          else { s.lightBad = Math.min(STREAK_OFF, s.lightBad + 1); s.lightGood = 0; }
          if (s.lightGood >= STREAK_ON) s.light = true;
          if (s.lightBad >= STREAK_OFF) s.light = false;
          analysisResult.isAligned = s.align;
          analysisResult.isLightingGood = s.light;
          if (enableLandmarkDrawing) {
            drawLandmarks(overlayCtx, landmarks, overlayCanvas.width, overlayCanvas.height, analysisResult.isAligned);
          }
        }
      }

      // Update face presence smoothing when no face
      if (!hasFace) {
        const s = stabilityRef.current;
        s.faceBad = Math.min(STREAK_OFF, s.faceBad + 1);
        s.faceGood = 0;
        if (s.faceBad >= STREAK_OFF) {
          s.face = false;
          s.align = false;
          s.light = false;
        }
        analysisResult.isAligned = s.align;
        analysisResult.isLightingGood = s.light;
      }
      setCurrentResults(analysisResult);
      onResults?.(analysisResult);

      const processingTime = performance.now() - startTime;
      fpsCounterRef.current++;
      const now = Date.now();
      if (now - fpsTimestampRef.current >= 1000) {
        setStatus(prev => ({
          ...prev,
          fpsCount: fpsCounterRef.current,
          lastProcessingTime: processingTime
        }));
        fpsCounterRef.current = 0;
        fpsTimestampRef.current = now;
      }
    } catch (error) {
      console.error('Error processing MediaPipe results:', error);
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Processing error'
      }));
    }
  }, [canvasRef, overlayCanvasRef, videoRef, enableLandmarkDrawing, onResults, drawLandmarks]);

  /**
   * Initialize MediaPipe Face Mesh
   */
  const initializeMediaPipe = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, error: null }));
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      await faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: confidenceThreshold,
        minTrackingConfidence: confidenceThreshold
      });
      faceMesh.onResults(onMediaPipeResults);
      faceMeshRef.current = faceMesh;
      setStatus(prev => ({ ...prev, isInitialized: true }));
      console.log('MediaPipe Face Mesh initialized successfully');
    } catch (error) {
      console.error('Error initializing MediaPipe:', error);
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to initialize MediaPipe'
      }));
    }
  }, [confidenceThreshold, onMediaPipeResults]);


  /**
   * Start processing video frames
   */
  const startProcessing = useCallback(() => {
    if (!faceMeshRef.current || !videoRef.current || isProcessingRef.current) {
      return;
    }

    console.log('🚀 Starting MediaPipe processing loop...');
    isProcessingRef.current = true;
    setStatus(prev => ({ ...prev, isProcessing: true }));

    const processFrame = async () => {
      if (!faceMeshRef.current || !videoRef.current || !isProcessingRef.current) {
        console.log('⏹️ Stopping processing - missing refs or stopped');
        return;
      }

      try {
        // Check if video is actually playing and has valid dimensions
        if (videoRef.current.readyState >= 2 && 
            videoRef.current.videoWidth > 0 && 
            videoRef.current.videoHeight > 0) {
          await faceMeshRef.current.send({ image: videoRef.current });
        }
      } catch (error) {
        console.error('MediaPipe processing error:', error);
        // Don't flood console with repeated errors
        if (error.message && !error.message.includes('abort')) {
          console.error('Stopping processing due to critical error');
          isProcessingRef.current = false;
          return;
        }
      }

      // CRITICAL FIX: Use ref instead of stale state
      if (isProcessingRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    };

    processFrame();
  }, [videoRef]); // Removed status.isProcessing dependency

  /**
   * Stop processing video frames
   */
  const stopProcessing = useCallback(() => {
    console.log('🛑 Stopping MediaPipe processing loop...');
    isProcessingRef.current = false;
    setStatus(prev => ({ ...prev, isProcessing: false }));
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  /**
   * Initialize MediaPipe on mount
   */
  useEffect(() => {
    initializeMediaPipe();

    return () => {
      stopProcessing();
      faceMeshRef.current?.close();
    };
  }, [initializeMediaPipe, stopProcessing]);

  /**
   * Auto-start processing when initialized and video is ready
   */
  useEffect(() => {
    if (status.isInitialized && videoRef.current && !isProcessingRef.current) {
      // Small delay to ensure video is playing
      console.log('⏰ Scheduling MediaPipe auto-start in 500ms...');
      const timer = setTimeout(() => {
        console.log('🎬 Auto-starting MediaPipe processing...');
        startProcessing();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [status.isInitialized, startProcessing, videoRef]); // Removed status.isProcessing dependency

  return {
    status,
    results: currentResults,
    startProcessing,
    stopProcessing,
    reinitialize: initializeMediaPipe
  };
};
