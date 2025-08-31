import React, { useRef, useEffect, useCallback } from 'react';
import { useMediaPipeFaceMesh } from '../../hooks/useMediaPipeFaceMesh';
import type { FaceAnalysisResult } from '../../hooks/useMediaPipeFaceMesh';
import type { NormalizedLandmark } from '@mediapipe/face_mesh';

export interface VisionStatus {
  isAligned: boolean;
  isLightingGood: boolean;
  isFaceDetected: boolean;
  // Raw debug values
  yaw: number;
  pitch: number;
  roll: number;
  averageBrightness: number;
  standardDeviation: number;
  // Phase 16: Landmark data for 3D face mesh
  landmarks: NormalizedLandmark[] | null;
}

export interface ProcessingEngineProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  statusRef: React.MutableRefObject<VisionStatus | null>;
  isEnabled?: boolean;
  onProcessingReady?: () => void;
}

/**
 * ProcessingEngine - Invisible component that handles all MediaPipe processing
 * Communicates via refs to prevent re-renders in the display layer
 */
const ProcessingEngine: React.FC<ProcessingEngineProps> = ({
  videoRef,
  statusRef,
  isEnabled = true,
  onProcessingReady
}) => {
  // Hidden canvas refs for MediaPipe processing
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Processing status tracking
  const isInitializedRef = useRef(false);

  /**
   * Handle MediaPipe analysis results - Updates ref directly (no re-renders)
   */
  const handleMediaPipeResults = useCallback((results: FaceAnalysisResult) => {
    if (!statusRef.current) {
      // Initialize status object
      statusRef.current = {
        isAligned: false,
        isLightingGood: false,
        isFaceDetected: false,
        yaw: 0,
        pitch: 0,
        roll: 0,
        averageBrightness: 0,
        standardDeviation: 0,
        landmarks: null
      };
    }

    // Update status via ref - NO setState calls to prevent re-renders
    statusRef.current.isFaceDetected = results.isFaceDetected;
    statusRef.current.isAligned = results.isAligned;
    statusRef.current.isLightingGood = results.isLightingGood;
    
    // Update raw debug values
    statusRef.current.yaw = results.yaw || 0;
    statusRef.current.pitch = results.pitch || 0;
    statusRef.current.roll = results.roll || 0;
    statusRef.current.averageBrightness = results.averageBrightness || 0;
    statusRef.current.standardDeviation = results.standardDeviation || 0;
    
    // Phase 16: Update landmark data for 3D face mesh
    statusRef.current.landmarks = results.landmarks;

    // Optional: Log significant state changes only (not every frame)
    if (results.isFaceDetected && results.isAligned && results.isLightingGood) {
      // Only log when ALL conditions are met, and do it sparingly
      if (Math.random() < 0.1) { // 10% chance to reduce console noise
        // console.log('🎯 ProcessingEngine: All conditions optimal for capture'); // Disabled to prevent spam
      }
    }
  }, [statusRef]);

  // Initialize MediaPipe processing
  const { status: mediaPipeStatus, startProcessing, stopProcessing } = useMediaPipeFaceMesh(
    videoRef,
    hiddenCanvasRef,
    overlayCanvasRef,
    {
      onResults: handleMediaPipeResults,
      enableLandmarkDrawing: false, // No visual landmarks needed
      confidenceThreshold: 0.8
    }
  );

  /**
   * Start/stop processing based on enabled state
   */
  useEffect(() => {
    if (!isEnabled) {
      stopProcessing();
      return;
    }

    if (mediaPipeStatus.isInitialized && !mediaPipeStatus.isProcessing) {
      console.log('🚀 ProcessingEngine: Starting background analysis...');
      startProcessing();
      
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        onProcessingReady?.();
      }
    }

    return () => {
      if (mediaPipeStatus.isProcessing) {
        console.log('🛑 ProcessingEngine: Stopping background analysis...');
        stopProcessing();
      }
    };
  }, [isEnabled, mediaPipeStatus.isInitialized, mediaPipeStatus.isProcessing, startProcessing, stopProcessing, onProcessingReady]);

  /**
   * Create hidden canvases for MediaPipe processing
   * These are not rendered in the visible DOM
   */
  useEffect(() => {
    // Create hidden canvas elements for MediaPipe processing
    if (!hiddenCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'none';
      hiddenCanvasRef.current = canvas;
    }
    
    if (!overlayCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'none';
      overlayCanvasRef.current = canvas;
    }

    return () => {
      // Cleanup hidden canvases
      if (hiddenCanvasRef.current) {
        hiddenCanvasRef.current.remove();
      }
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.remove();
      }
    };
  }, []);

  // This component renders nothing visible - it's a pure processing engine
  return null;
};

export default ProcessingEngine;
