import React, { useState } from 'react';
import FaceMeshModel from './FaceMeshModel';

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

interface FaceHotspotMapProps {
  setActiveTab: (tab: string) => void;
  landmarks?: Landmark[];
  activeTab?: string;
  activeAnalysis?: AnalysisData | null;
}

interface Hotspot {
  id: string;
  x: string; // CSS position (e.g., "50%")
  y: string; // CSS position (e.g., "20%")
  width: string;
  height: string;
  targetTab: string;
  label: string;
  description: string;
}

const FaceHotspotMap: React.FC<FaceHotspotMapProps> = ({ 
  setActiveTab, 
  landmarks = [],
  activeTab,
  activeAnalysis 
}) => {
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  const hotspots: Hotspot[] = [
    {
      id: 'forehead',
      x: '50%',
      y: '15%',
      width: '120px',
      height: '40px',
      targetTab: 'Surface',
      label: 'Forehead',
      description: 'Texture & Oil Analysis'
    },
    {
      id: 'eye-left',
      x: '30%',
      y: '25%',
      width: '25px',
      height: '15px',
      targetTab: 'Aging',
      label: 'Eye Area',
      description: 'Fine Lines & Wrinkles'
    },
    {
      id: 'eye-right',
      x: '70%',
      y: '25%',
      width: '25px',
      height: '15px',
      targetTab: 'Aging',
      label: 'Eye Area',
      description: 'Fine Lines & Wrinkles'
    },
    {
      id: 'nose',
      x: '50%',
      y: '35%',
      width: '30px',
      height: '50px',
      targetTab: 'Surface',
      label: 'Nose',
      description: 'Pore & Texture Analysis'
    },
    {
      id: 'cheek-left',
      x: '25%',
      y: '45%',
      width: '60px',
      height: '80px',
      targetTab: 'Pigmentation',
      label: 'Cheek',
      description: 'Pigmentation & Evenness'
    },
    {
      id: 'cheek-right',
      x: '75%',
      y: '45%',
      width: '60px',
      height: '80px',
      targetTab: 'Pigmentation',
      label: 'Cheek',
      description: 'Pigmentation & Evenness'
    },
    {
      id: 'mouth',
      x: '50%',
      y: '60%',
      width: '50px',
      height: '20px',
      targetTab: 'Aging',
      label: 'Mouth Area',
      description: 'Smile Lines & Volume'
    },
    {
      id: 'jawline',
      x: '50%',
      y: '75%',
      width: '140px',
      height: '30px',
      targetTab: 'Deep Structure',
      label: 'Jawline',
      description: 'Elasticity & Firmness'
    }
  ];

  const handleHotspotClick = (targetTab: string) => {
    setActiveTab(targetTab);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Interactive Analysis Map</h3>
      
      {/* Face Container */}
      <div className="relative">
        {/* 3D Face Model Container */}
        <div className="relative bg-gray-800 rounded-lg aspect-[3/4] max-w-sm mx-auto overflow-hidden h-[400px] border border-gray-600">
          {/* 3D Model */}
          {landmarks.length > 0 ? (
            <FaceMeshModel 
              landmarks={landmarks} 
              className="w-full h-full"
              activeAnalysis={activeAnalysis}
              activeTabName={activeTab}
            />
          ) : (
            /* Fallback while loading */
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-700 to-gray-600">
              <div className="text-gray-400 text-center">
                <div className="text-4xl mb-2">👤</div>
                <div className="text-sm">Loading 3D Model...</div>
              </div>
            </div>
          )}

          {/* Hotspots */}
          {hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              onClick={() => handleHotspotClick(hotspot.targetTab)}
              onMouseEnter={() => setHoveredHotspot(hotspot.id)}
              onMouseLeave={() => setHoveredHotspot(null)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 rounded-full border-2 ${
                hoveredHotspot === hotspot.id
                  ? 'bg-bronze bg-opacity-60 border-bronze scale-110'
                  : 'bg-bronze bg-opacity-30 border-bronze border-opacity-60 hover:bg-opacity-50'
              }`}
              style={{
                left: hotspot.x,
                top: hotspot.y,
                width: hotspot.width,
                height: hotspot.height,
              }}
              title={`${hotspot.label} - ${hotspot.description}`}
            >
              <span className="sr-only">{hotspot.label}</span>
            </button>
          ))}
        </div>

        {/* Hover Tooltip */}
        {hoveredHotspot && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg border border-gray-600 whitespace-nowrap">
            {(() => {
              const hotspot = hotspots.find(h => h.id === hoveredHotspot);
              return (
                <div className="text-center">
                  <div className="font-medium text-bronze">{hotspot?.label}</div>
                  <div className="text-xs text-gray-400">{hotspot?.description}</div>
                </div>
              );
            })()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-400 mb-2">Click on any area to explore detailed analysis</div>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">Eyes → Aging</span>
          <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">Cheeks → Pigmentation</span>
          <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">T-zone → Surface</span>
        </div>
      </div>
    </div>
  );
};

export default FaceHotspotMap;
