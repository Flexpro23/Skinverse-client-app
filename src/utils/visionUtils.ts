/**
 * Computer Vision Utility Functions for SkinVerse
 * Handles head pose estimation and lighting quality analysis
 */

import type { NormalizedLandmark } from '@mediapipe/face_mesh';

// 3D model points for head pose estimation (in model coordinate system)
const MODEL_POINTS: number[][] = [
  [0.0, 0.0, 0.0],          // Nose tip
  [0.0, -330.0, -65.0],     // Chin
  [-225.0, 170.0, -135.0],  // Left eye left corner
  [225.0, 170.0, -135.0],   // Right eye right corner
  [-150.0, -150.0, -125.0], // Left mouth corner
  [150.0, -150.0, -125.0],  // Right mouth corner
];

// Corresponding 2D landmark indices in MediaPipe Face Mesh
const LANDMARK_INDICES = {
  NOSE_TIP: 1,
  CHIN: 175,
  LEFT_EYE_LEFT: 33,
  RIGHT_EYE_RIGHT: 362,
  LEFT_MOUTH: 61,
  RIGHT_MOUTH: 291,
  FOREHEAD_CENTER: 9,
  LEFT_CHEEK: 116,
  RIGHT_CHEEK: 345,
  LEFT_EYE_CENTER: 468,
  RIGHT_EYE_CENTER: 473,
};

export interface HeadPose {
  yaw: number;   // Left-right rotation (-90 to +90 degrees)
  pitch: number; // Up-down rotation (-90 to +90 degrees)
  roll: number;  // Tilting rotation (-180 to +180 degrees)
}

export interface LightingQuality {
  isGood: boolean;
  score: number; // 0-100, higher is better
  evenness: number; // 0-100, how evenly lit the face is
  brightness: number; // 0-255, average brightness
  standardDeviation: number; // Raw standard deviation value for debug
}

/**
 * Calculate head pose from MediaPipe landmarks using PnP algorithm
 */
export const calculateHeadPose = (
  landmarks: NormalizedLandmark[],
  imageWidth: number,
  imageHeight: number
): HeadPose => {
  try {
    // BUG FIX: Validate inputs
    if (!landmarks || landmarks.length === 0 || imageWidth <= 0 || imageHeight <= 0) {
      console.warn('Invalid inputs for head pose calculation');
      return { yaw: 0, pitch: 0, roll: 0 };
    }
    
    // BUG FIX: Validate landmark indices before accessing
    const requiredIndices = [
      LANDMARK_INDICES.NOSE_TIP,
      LANDMARK_INDICES.CHIN,
      LANDMARK_INDICES.LEFT_EYE_LEFT,
      LANDMARK_INDICES.RIGHT_EYE_RIGHT,
      LANDMARK_INDICES.LEFT_MOUTH,
      LANDMARK_INDICES.RIGHT_MOUTH
    ];
    
    const maxIndex = landmarks.length - 1;
    for (const index of requiredIndices) {
      if (index > maxIndex) {
        console.warn('Head pose landmark index out of bounds:', { index, maxIndex });
        return { yaw: 0, pitch: 0, roll: 0 };
      }
    }
    
    // Extract 2D points from landmarks
    const imagePoints = [
      [landmarks[LANDMARK_INDICES.NOSE_TIP].x * imageWidth, landmarks[LANDMARK_INDICES.NOSE_TIP].y * imageHeight],
      [landmarks[LANDMARK_INDICES.CHIN].x * imageWidth, landmarks[LANDMARK_INDICES.CHIN].y * imageHeight],
      [landmarks[LANDMARK_INDICES.LEFT_EYE_LEFT].x * imageWidth, landmarks[LANDMARK_INDICES.LEFT_EYE_LEFT].y * imageHeight],
      [landmarks[LANDMARK_INDICES.RIGHT_EYE_RIGHT].x * imageWidth, landmarks[LANDMARK_INDICES.RIGHT_EYE_RIGHT].y * imageHeight],
      [landmarks[LANDMARK_INDICES.LEFT_MOUTH].x * imageWidth, landmarks[LANDMARK_INDICES.LEFT_MOUTH].y * imageHeight],
      [landmarks[LANDMARK_INDICES.RIGHT_MOUTH].x * imageWidth, landmarks[LANDMARK_INDICES.RIGHT_MOUTH].y * imageHeight],
    ];

    // Simplified camera matrix (assuming standard webcam)
    const focalLength = imageWidth;
    const center = [imageWidth / 2, imageHeight / 2];
    
    // Calculate head pose using simplified PnP approach
    const pose = solvePnP(MODEL_POINTS, imagePoints, focalLength, center);
    
    const result = {
      yaw: Math.max(-90, Math.min(90, pose.yaw)),
      pitch: Math.max(-90, Math.min(90, pose.pitch)),
      roll: Math.max(-180, Math.min(180, pose.roll))
    };
    
    // Reduced logging
    
    return result;
  } catch (error) {
    console.error('Error calculating head pose:', error);
    return { yaw: 0, pitch: 0, roll: 0 };
  }
};

/**
 * Simplified PnP solver for head pose estimation
 */
function solvePnP(
  _modelPoints: number[][],
  imagePoints: number[][],
  focalLength: number,
  center: number[]
): HeadPose {
  // This is a simplified implementation. In production, you'd use a proper PnP solver.
  // For now, we'll estimate pose based on facial landmark positions.
  
  // BUG FIX: Add bounds checking and null protection
  if (!imagePoints || imagePoints.length < 6) {
    console.warn('Insufficient image points for head pose calculation');
    return { yaw: 0, pitch: 0, roll: 0 };
  }
  
  const leftEye = imagePoints[2];
  const rightEye = imagePoints[3];
  const nose = imagePoints[0];
  
  // BUG FIX: Validate all points exist
  if (!leftEye || !rightEye || !nose || leftEye.length < 2 || rightEye.length < 2 || nose.length < 2) {
    console.warn('Invalid landmark points for head pose calculation');
    return { yaw: 0, pitch: 0, roll: 0 };
  }
  
  // Calculate yaw (left-right rotation)
  const eyeMidpoint = [(leftEye[0] + rightEye[0]) / 2, (leftEye[1] + rightEye[1]) / 2];
  const noseToCenter = nose[0] - center[0];
  const eyesToCenter = eyeMidpoint[0] - center[0];
  
  // BUG FIX: Protect against division by zero and invalid focal length
  const safeFocalLength = Math.max(focalLength, 1); // Prevent division by zero
  const yaw = Math.atan2(noseToCenter - eyesToCenter, safeFocalLength) * (180 / Math.PI);
  
  // Calculate pitch (up-down rotation)
  const noseToEyeDistance = Math.sqrt(
    Math.pow(nose[0] - eyeMidpoint[0], 2) + Math.pow(nose[1] - eyeMidpoint[1], 2)
  );
  
  // BUG FIX: Protect against division by zero in pitch calculation
  const safeDistance = Math.max(noseToEyeDistance, 0.1); // Prevent division by zero
  const pitch = Math.atan2(nose[1] - eyeMidpoint[1], safeDistance) * (180 / Math.PI);
  
  // Calculate roll (tilt rotation)
  const deltaX = rightEye[0] - leftEye[0];
  const deltaY = rightEye[1] - leftEye[1];
  
  // BUG FIX: Protect against NaN in roll calculation
  const eyeAngle = (deltaX !== 0 || deltaY !== 0) ? Math.atan2(deltaY, deltaX) : 0;
  const roll = eyeAngle * (180 / Math.PI);
  
  // BUG FIX: Validate results and return safe values if any calculation failed
  const result = {
    yaw: isNaN(yaw) ? 0 : yaw,
    pitch: isNaN(pitch) ? 0 : pitch,
    roll: isNaN(roll) ? 0 : roll
  };
  
      // Debug logging removed to prevent console flooding
  
  return result;
}

/**
 * Calculate lighting quality across facial regions
 */
export const calculateLightingQuality = (
  context: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  imageWidth: number,
  imageHeight: number
): LightingQuality => {
  try {
    // BUG FIX: Validate inputs
    if (!context || !landmarks || landmarks.length === 0 || imageWidth <= 0 || imageHeight <= 0) {
      console.warn('Invalid inputs for lighting quality calculation');
      return { isGood: false, score: 0, evenness: 0, brightness: 0, standardDeviation: 0 };
    }
    
    const imageData = context.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    
    // BUG FIX: Validate image data
    if (!data || data.length === 0) {
      console.warn('No image data available for lighting calculation');
      return { isGood: false, score: 0, evenness: 0, brightness: 0, standardDeviation: 0 };
    }
    
    // BUG FIX: Validate landmark indices before accessing
    const maxIndex = landmarks.length - 1;
    const foreheadIndex = LANDMARK_INDICES.FOREHEAD_CENTER;
    const leftCheekIndex = LANDMARK_INDICES.LEFT_CHEEK;
    const rightCheekIndex = LANDMARK_INDICES.RIGHT_CHEEK;
    
    if (foreheadIndex > maxIndex || leftCheekIndex > maxIndex || rightCheekIndex > maxIndex) {
      console.warn('Landmark indices out of bounds:', { 
        requiredIndices: [foreheadIndex, leftCheekIndex, rightCheekIndex], 
        maxIndex 
      });
      return { isGood: false, score: 0, evenness: 0, brightness: 0, standardDeviation: 0 };
    }
    
    // Define facial regions for lighting analysis
    const regions = {
      forehead: getLandmarkRegion(landmarks[foreheadIndex], imageWidth, imageHeight, 30),
      leftCheek: getLandmarkRegion(landmarks[leftCheekIndex], imageWidth, imageHeight, 25),
      rightCheek: getLandmarkRegion(landmarks[rightCheekIndex], imageWidth, imageHeight, 25),
    };
    
    // Calculate brightness for each region
    const regionBrightness = Object.entries(regions).map(([regionName, region]) => {
      const brightness = calculateRegionBrightness(data, region, imageWidth, imageHeight);
      return { name: regionName, brightness };
    });
    
    // Calculate overall metrics
    const averageBrightness = regionBrightness.reduce((sum, region) => sum + region.brightness, 0) / regionBrightness.length;
    const brightnessVariance = calculateVariance(regionBrightness.map(r => r.brightness));
    const standardDeviation = Math.sqrt(brightnessVariance);
    
    // Scoring logic
    const brightnessScore = calculateBrightnessScore(averageBrightness);
    const evennessScore = calculateEvennessScore(standardDeviation);
    const overallScore = (brightnessScore + evennessScore) / 2;
    
    // Reduced logging for performance
    
    // LIBERALIZED THRESHOLDS FOR DEBUGGING
    const result = {
      isGood: averageBrightness > 20 && averageBrightness < 240,  // Very generous
      score: Math.round(overallScore),
      evenness: Math.round(evennessScore),
      brightness: Math.round(averageBrightness),
      standardDeviation: standardDeviation
    };
    
    return result;
  } catch (error) {
    console.error('Error calculating lighting quality:', error);
    return { isGood: false, score: 0, evenness: 0, brightness: 0, standardDeviation: 0 };
  }
};

/**
 * Get pixel region around a landmark
 */
function getLandmarkRegion(
  landmark: NormalizedLandmark,
  imageWidth: number,
  imageHeight: number,
  radius: number
): { x: number; y: number; width: number; height: number } {
  const centerX = Math.round(landmark.x * imageWidth);
  const centerY = Math.round(landmark.y * imageHeight);
  
  return {
    x: Math.max(0, centerX - radius),
    y: Math.max(0, centerY - radius),
    width: Math.min(imageWidth - Math.max(0, centerX - radius), radius * 2),
    height: Math.min(imageHeight - Math.max(0, centerY - radius), radius * 2)
  };
}

/**
 * Calculate average brightness in a region
 */
function calculateRegionBrightness(
  imageData: Uint8ClampedArray,
  region: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number
): number {
  let totalBrightness = 0;
  let pixelCount = 0;
  
  for (let y = region.y; y < region.y + region.height; y++) {
    for (let x = region.x; x < region.x + region.width; x++) {
      if (x >= 0 && x < imageWidth && y >= 0 && y < imageHeight) {
        const index = (y * imageWidth + x) * 4;
        const r = imageData[index];
        const g = imageData[index + 1];
        const b = imageData[index + 2];
        
        // Calculate luminance using standard formula
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
        pixelCount++;
      }
    }
  }
  
  return pixelCount > 0 ? totalBrightness / pixelCount : 0;
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  // BUG FIX: Validate input
  if (!values || values.length === 0) {
    console.warn('Empty values array for variance calculation');
    return 0;
  }
  
  if (values.length === 1) {
    return 0; // Variance of single value is 0
  }
  
  // BUG FIX: Filter out NaN and invalid values
  const validValues = values.filter(val => !isNaN(val) && isFinite(val));
  
  if (validValues.length === 0) {
    console.warn('No valid values for variance calculation');
    return 0;
  }
  
  const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  const squaredDifferences = validValues.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / validValues.length;
  
  // BUG FIX: Ensure result is valid
  return isNaN(variance) || !isFinite(variance) ? 0 : variance;
}

/**
 * Calculate brightness score (0-100)
 */
function calculateBrightnessScore(brightness: number): number {
  // Optimal brightness range is 100-180
  if (brightness >= 100 && brightness <= 180) {
    return 100;
  } else if (brightness >= 80 && brightness <= 200) {
    return 80;
  } else if (brightness >= 60 && brightness <= 220) {
    return 60;
  } else if (brightness >= 40 && brightness <= 240) {
    return 40;
  } else {
    return 20;
  }
}

/**
 * Calculate evenness score based on standard deviation (0-100)
 */
function calculateEvennessScore(standardDeviation: number): number {
  // Lower standard deviation means more even lighting
  if (standardDeviation <= 10) {
    return 100;
  } else if (standardDeviation <= 20) {
    return 80;
  } else if (standardDeviation <= 30) {
    return 60;
  } else if (standardDeviation <= 40) {
    return 40;
  } else {
    return 20;
  }
}

/**
 * Check if head pose is within acceptable range for capture
 */
export const isHeadPoseAcceptable = (pose: HeadPose): boolean => {
  // LIBERALIZED THRESHOLDS FOR DEBUGGING
  const YAW_THRESHOLD = 80;    // degrees - very generous
  const PITCH_THRESHOLD = 80;  // degrees - very generous  
  const ROLL_THRESHOLD = 80;   // degrees - very generous
  
  const result = (
    Math.abs(pose.yaw) <= YAW_THRESHOLD &&
    Math.abs(pose.pitch) <= PITCH_THRESHOLD &&
    Math.abs(pose.roll) <= ROLL_THRESHOLD
  );
  
      // Reduced logging
  
  return result;
};

/**
 * Get descriptive text for head pose guidance
 */
export const getHeadPoseGuidance = (pose: HeadPose): string => {
  const messages = [];
  
  if (Math.abs(pose.yaw) > 15) {
    messages.push(pose.yaw > 0 ? 'Turn head left' : 'Turn head right');
  }
  
  if (Math.abs(pose.pitch) > 15) {
    messages.push(pose.pitch > 0 ? 'Look up' : 'Look down');
  }
  
  if (Math.abs(pose.roll) > 10) {
    messages.push(pose.roll > 0 ? 'Tilt head left' : 'Tilt head right');
  }
  
  return messages.length > 0 ? messages.join(', ') : 'Perfect position!';
};
