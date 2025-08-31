import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
// import { FACEMESH_TESSELLATION } from '@mediapipe/face_mesh';

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

// Landmark point structure
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

interface FaceMeshModelProps {
  landmarks: Landmark[];
  className?: string;
  activeAnalysis?: AnalysisData | null;
  activeTabName?: string;
}

// 3D Face component that renders inside the Canvas
const FaceMesh: React.FC<{ 
  landmarks: Landmark[]; 
  activeAnalysis?: AnalysisData | null;
  activeTabName?: string;
}> = ({ landmarks, activeAnalysis, activeTabName }) => {
  const wireframeRef = useRef<THREE.LineSegments>(null);
  const overlayWireframeRef = useRef<THREE.LineSegments>(null);
  
  // Create wireframe geometry from landmarks using connections
  const wireframeGeometry = useMemo(() => {
    if (landmarks.length < 468) return null;
    
    const vertices: number[] = [];
    const colors: number[] = [];
    
    // Create line segments based on face connections
    FACE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      if (startIdx < landmarks.length && endIdx < landmarks.length) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        
        // Add start point
        vertices.push(start.x, start.y, start.z);
        colors.push(1, 1, 1); // White
        
        // Add end point
        vertices.push(end.x, end.y, end.z);
        colors.push(1, 1, 1); // White
      }
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return geometry;
  }, [landmarks]);

  // Get overlay color based on analysis type and affected areas
  const getOverlayColor = (pointIndex: number): string => {
    if (!activeAnalysis || !activeTabName) return '#C5A475';

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

    if (!isAffected) return '#C5A475';

    // Color based on analysis type and score
    const score = activeAnalysis.score;
    
    switch (activeTabName?.toLowerCase()) {
      case 'surface':
        return score < 70 ? '#3B82F6' : '#06B6D4'; // Blue tones for hydration/surface
      case 'pigmentation':
        return score < 70 ? '#F59E0B' : '#EAB308'; // Yellow/amber for pigmentation issues
      case 'aging':
        return score < 70 ? '#EF4444' : '#F97316'; // Red/orange for aging concerns
      case 'deep structure':
        return score < 70 ? '#8B5CF6' : '#A855F7'; // Purple for deep structure
      default:
        return '#C5A475';
    }
  };

  // Create colored overlay wireframe for affected areas
  const overlayWireframeGeometry = useMemo(() => {
    if (!activeAnalysis || !activeTabName || landmarks.length < 468) return null;

    const vertices: number[] = [];
    const colors: number[] = [];

    // Create overlay connections only for affected areas
    FACE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      if (startIdx < landmarks.length && endIdx < landmarks.length) {
        const startColor = getOverlayColor(startIdx);
        const endColor = getOverlayColor(endIdx);
        
        // Only include lines where at least one point is affected
        if (startColor !== '#C5A475' || endColor !== '#C5A475') {
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];
          
          // Add start point with slight Z offset
          vertices.push(start.x, start.y, start.z + 0.002);
          const startColorObj = new THREE.Color(startColor);
          colors.push(startColorObj.r, startColorObj.g, startColorObj.b);
          
          // Add end point
          vertices.push(end.x, end.y, end.z + 0.002);
          const endColorObj = new THREE.Color(endColor);
          colors.push(endColorObj.r, endColorObj.g, endColorObj.b);
        }
      }
    });

    if (vertices.length === 0) return null;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return geometry;
  }, [landmarks, activeAnalysis, activeTabName]);

  // Optional: Add subtle rotation animation
  useFrame((state) => {
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
    if (overlayWireframeRef.current) {
      overlayWireframeRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group>
      {/* Main wireframe mesh */}
      {wireframeGeometry && (
        <lineSegments ref={wireframeRef} geometry={wireframeGeometry}>
          <lineBasicMaterial 
            color="#ffffff" 
            transparent={true}
            opacity={activeAnalysis ? 0.3 : 0.6}
            linewidth={1}
          />
        </lineSegments>
      )}

      {/* Analysis overlay wireframe - colored lines for affected areas */}
      {overlayWireframeGeometry && (
        <lineSegments ref={overlayWireframeRef} geometry={overlayWireframeGeometry}>
          <lineBasicMaterial 
            transparent={true}
            opacity={0.9}
            linewidth={2}
            vertexColors={true}
          />
        </lineSegments>
      )}
    </group>
  );
};

// Main component
const FaceMeshModel: React.FC<FaceMeshModelProps> = ({ 
  landmarks, 
  className = '', 
  activeAnalysis,
  activeTabName 
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas 
        camera={{ 
          position: [0, 0, 1.2], 
          fov: 45,
          near: 0.1,
          far: 100
        }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]} // Device pixel ratio for crisp rendering
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.6}
          color="#ffffff"
        />
        <directionalLight 
          position={[-5, -5, 5]} 
          intensity={0.3}
          color="#C5A475"
        />
        
        {/* The 3D face mesh */}
        <FaceMesh 
          landmarks={landmarks} 
          activeAnalysis={activeAnalysis}
          activeTabName={activeTabName}
        />
        
        {/* Camera controls */}
        <OrbitControls 
          enableZoom={true} 
          enablePan={false}
          enableRotate={true}
          minDistance={0.8}
          maxDistance={2.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default FaceMeshModel;
