import React from 'react';

interface SkinProfileCardProps {
  skinType: string;
  fitzpatrickScale: number;
  ethnicBackground: string;
  age: number;
}

const SkinProfileCard: React.FC<SkinProfileCardProps> = ({ 
  skinType, 
  fitzpatrickScale, 
  ethnicBackground,
  age 
}) => {
  // Helper function to get Fitzpatrick description
  const getFitzpatrickDescription = (scale: number): string => {
    const descriptions = {
      1: "Very fair skin, always burns, never tans",
      2: "Fair skin, usually burns, tans minimally",
      3: "Medium skin, sometimes burns, tans gradually",
      4: "Olive skin, rarely burns, tans easily",
      5: "Brown skin, very rarely burns, tans darkly",
      6: "Dark brown/black skin, never burns, tans very darkly"
    };
    return descriptions[scale as keyof typeof descriptions] || "Unknown classification";
  };

  // Helper function to get skin type description
  const getSkinTypeDescription = (type: string): string => {
    const descriptions = {
      "Normal": "Balanced oil and moisture levels across the face",
      "Dry": "Lacks oil and moisture, may feel tight or flaky", 
      "Oily": "Excess oil production, especially in T-zone",
      "Combination": "Mixed areas of oily and dry skin",
      "Sensitive": "Easily irritated, reactive to products or environment"
    };
    return descriptions[type as keyof typeof descriptions] || "Unique skin characteristics";
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-md">
      <h3 className="text-lg font-medium text-midnight-blue mb-6">Skin Profile</h3>
      
      <div className="space-y-6">
        {/* Primary Skin Type */}
        <div className="border-b border-gray-300 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl font-semibold text-midnight-blue">{skinType}</div>
            <div className="text-sm text-bronze font-medium">Primary Type</div>
          </div>
          <div className="text-sm text-medium-grey leading-relaxed">
            {getSkinTypeDescription(skinType)}
          </div>
        </div>

        {/* Fitzpatrick Scale */}
        <div className="border-b border-gray-300 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-medium text-midnight-blue">Type {fitzpatrickScale}</div>
            <div className="text-sm text-bronze font-medium">Fitzpatrick Scale</div>
          </div>
          <div className="text-sm text-medium-grey leading-relaxed">
            {getFitzpatrickDescription(fitzpatrickScale)}
          </div>
          
          {/* Visual scale indicator */}
          <div className="mt-3">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <div
                  key={level}
                  className={`w-6 h-3 rounded-sm transition-all duration-300 ${
                    level === fitzpatrickScale 
                      ? 'bg-bronze ring-2 ring-bronze ring-opacity-50' 
                      : 'bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: level === fitzpatrickScale ? '#C5A475' : 
                      level <= fitzpatrickScale ? `hsl(${30 + level * 15}, 40%, ${70 - level * 8}%)` : '#4B5563'
                  }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-medium-grey mt-1">
              <span>Light</span>
              <span>Dark</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-medium-grey">Ethnic Background</span>
            <span className="text-sm text-midnight-blue font-medium">{ethnicBackground}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-medium-grey">Age</span>
            <span className="text-sm text-midnight-blue font-medium">{age} years</span>
          </div>
        </div>

        {/* Skin Care Recommendations Based on Type */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="text-sm font-medium text-bronze mb-2">Key Considerations</div>
          <div className="text-xs text-medium-grey space-y-1">
            {skinType === 'Combination' && (
              <>
                <div>• Use different products for T-zone and cheeks</div>
                <div>• Focus on balancing oil production</div>
              </>
            )}
            {skinType === 'Oily' && (
              <>
                <div>• Use oil-free, non-comedogenic products</div>
                <div>• Include salicylic acid for pore management</div>
              </>
            )}
            {skinType === 'Dry' && (
              <>
                <div>• Focus on hydration and barrier repair</div>
                <div>• Use ceramides and hyaluronic acid</div>
              </>
            )}
            {fitzpatrickScale <= 3 && (
              <div>• High priority on sun protection (SPF 30+)</div>
            )}
            {fitzpatrickScale >= 4 && (
              <div>• Monitor for hyperpigmentation concerns</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinProfileCard;
