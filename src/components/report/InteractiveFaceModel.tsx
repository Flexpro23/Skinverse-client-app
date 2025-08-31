import React, { useEffect, useRef } from 'react';

// Simplified tessellation pattern for face wireframe - key connections
const FACE_CONNECTIONS = [
  // Face outline - connecting sequential points around the perimeter
  ...Array.from({ length: 49 }, (_, i) => [i, i + 1]),
  [49, 0], // Close the face outline
  
  // Eye regions - simplified connections
  ...Array.from({ length: 35 }, (_, i) => [50 + i, 50 + i + 1]),
  [85, 50], // Close left eye
  ...Array.from({ length: 35 }, (_, i) => [86 + i, 86 + i + 1]),
  [121, 86], // Close right eye
  
  // Nose bridge and outline
  ...Array.from({ length: 53 }, (_, i) => [122 + i, 122 + i + 1]),
  
  // Mouth region
  ...Array.from({ length: 59 }, (_, i) => [176 + i, 176 + i + 1]),
  [235, 176], // Close mouth
  
  // Cross-face connections for structure
  [25, 300], [30, 350], [15, 250], [35, 400], // Face structure
  [50, 86], [60, 96], [70, 106], [80, 116], // Eye bridge connections
  [150, 200], [160, 210], [170, 220], // Nose to mouth
];

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface AnalysisData {
  score: number;
  level: string;
  affectedAreas: string[];
}

interface InteractiveFaceModelProps {
  imageUrl?: string;
  landmarks: Landmark[];
  activeAnalysis?: AnalysisData | null;
  activeTabName?: string;
  className?: string;
}

const InteractiveFaceModel: React.FC<InteractiveFaceModelProps> = ({
  imageUrl,
  landmarks,
  activeAnalysis,
  activeTabName,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Get overlay color based on analysis type and affected areas
  const getOverlayColor = (pointIndex: number): string => {
    if (!activeAnalysis || !activeTabName) return 'rgba(255, 255, 255, 0.6)';

    // Map landmark indices to facial regions
    const getPointRegion = (index: number): string => {
      if (index < 50) return 'face_outline';
      if (index < 122) return 'eye_area';
      if (index < 176) return 'nose';
      if (index < 236) return 'mouth';
      if (index < 350) return 'cheek_left';
      if (index < 464) return 'cheek_right';
      return 'general';
    };

    const pointRegion = getPointRegion(pointIndex);
    const affectedAreas = activeAnalysis.affectedAreas;
    
    // Check if this point should be highlighted based on affected areas
    const isAffected = affectedAreas.some(area => {
      const areaLower = area.toLowerCase().replace(/_/g, '').replace(/\s/g, '');
      const regionLower = pointRegion.toLowerCase().replace(/_/g, '');
      
      return (
        areaLower.includes('cheek') && regionLower.includes('cheek') ||
        areaLower.includes('eye') && regionLower.includes('eye') ||
        areaLower.includes('nose') && regionLower.includes('nose') ||
        areaLower.includes('forehead') && regionLower.includes('face') ||
        areaLower.includes('tzone') && (regionLower.includes('nose') || regionLower.includes('face')) ||
        areaLower.includes('mouth') && regionLower.includes('mouth') ||
        areaLower.includes('bilateral') && regionLower.includes('cheek')
      );
    });

    if (!isAffected) return 'rgba(255, 255, 255, 0.6)';

    // Color based on analysis type and score
    const score = activeAnalysis.score;
    
    switch (activeTabName?.toLowerCase()) {
      case 'surface':
        return score < 70 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(6, 182, 212, 0.8)'; // Blue tones
      case 'pigmentation':
        return score < 70 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(234, 179, 8, 0.8)'; // Yellow/amber
      case 'aging':
        return score < 70 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(249, 115, 22, 0.8)'; // Red/orange
      case 'deep structure':
        return score < 70 ? 'rgba(139, 92, 246, 0.8)' : 'rgba(168, 85, 247, 0.8)'; // Purple
      default:
        return 'rgba(197, 164, 117, 0.8)'; // Bronze
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || landmarks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWireframe = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Project 3D landmarks to 2D canvas coordinates
      const projectedPoints = landmarks.map(landmark => ({
        x: landmark.x * canvasWidth,
        y: landmark.y * canvasHeight,
        z: landmark.z
      }));

      // Draw wireframe connections
      FACE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        if (startIdx < projectedPoints.length && endIdx < projectedPoints.length) {
          const start = projectedPoints[startIdx];
          const end = projectedPoints[endIdx];
          
          // Determine line color based on analysis
          const startColor = getOverlayColor(startIdx);
          const endColor = getOverlayColor(endIdx);
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          
          // Use overlay color if affected, otherwise use default white
          if (startColor !== 'rgba(255, 255, 255, 0.6)' || endColor !== 'rgba(255, 255, 255, 0.6)') {
            ctx.strokeStyle = startColor;
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
          }
          
          ctx.stroke();
        }
      });

      // Draw landmark points
      projectedPoints.forEach((point, index) => {
        const color = getOverlayColor(index);
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, color !== 'rgba(255, 255, 255, 0.6)' ? 3 : 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    };

    // Wait for image to load before drawing
    if (image.complete) {
      drawWireframe();
    } else {
      image.onload = drawWireframe;
    }
  }, [landmarks, activeAnalysis, activeTabName]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* User's Photo */}
      {imageUrl && (
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Face Analysis"
          className="w-full h-full object-cover rounded-lg"
          crossOrigin="anonymous"
        />
      )}
      
      {/* Wireframe Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        width={600}
        height={600}
        style={{ borderRadius: '0.5rem' }}
      />
      
      {/* Fallback when no image */}
      {!imageUrl && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
          <div className="text-center text-medium-grey">
            <div className="text-6xl mb-4">👤</div>
            <div className="text-lg">Loading Face Model...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveFaceModel;
