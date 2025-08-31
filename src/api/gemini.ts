// Gemini API service for skin analysis

export interface SkinAnalysisResult {
  skinHealthScore: number;
  estimatedSkinAge: number;
  primaryConcern: string;
  skinType: string;
}

export interface GeminiApiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Convert file/blob to base64 string
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Analyze skin images using Gemini API
 */
export const getSkinAnalysis = async (images: string[]): Promise<SkinAnalysisResult | null> => {
  try {
    if (images.length !== 3) {
      throw new Error('Exactly 3 images are required (center, left, right)');
    }

    const prompt = `
Please analyze these three facial images (center, left profile, and right profile) and provide a comprehensive skin analysis. 

Analyze the following aspects:
1. Overall skin health and condition
2. Skin type (Normal, Dry, Oily, Combination, Sensitive)
3. Primary concerns (Fine Lines, Wrinkles, Dark Spots, Acne, Puffiness, Uneven Tone, etc.)
4. Estimated skin age based on visible signs of aging

Please respond with ONLY a valid JSON object in this exact format:
{
  "skinHealthScore": number (0-100),
  "estimatedSkinAge": number,
  "primaryConcern": "string",
  "skinType": "string"
}

Important:
- skinHealthScore should be a number from 0-100 where 100 is perfect skin
- estimatedSkinAge should be the estimated age of the skin in years
- primaryConcern should be the most prominent skin concern visible
- skinType should be one of: Normal, Dry, Oily, Combination, Sensitive

Do not include any explanation or additional text, only the JSON object.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...images.map(base64Image => ({
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }))
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 512,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
    }

    const data: GeminiApiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No analysis results received from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    
    try {
      // Parse the JSON response
      const analysisResult: SkinAnalysisResult = JSON.parse(analysisText.trim());
      
      // Validate the response structure
      if (
        typeof analysisResult.skinHealthScore !== 'number' ||
        typeof analysisResult.estimatedSkinAge !== 'number' ||
        typeof analysisResult.primaryConcern !== 'string' ||
        typeof analysisResult.skinType !== 'string'
      ) {
        throw new Error('Invalid analysis result structure');
      }

      // Ensure skinHealthScore is within valid range
      analysisResult.skinHealthScore = Math.max(0, Math.min(100, analysisResult.skinHealthScore));

      console.log('Skin analysis completed successfully:', analysisResult);
      return analysisResult;

    } catch (parseError) {
      console.error('Error parsing Gemini API response:', parseError);
      console.error('Raw response:', analysisText);
      
      // Return a fallback result if parsing fails
      return {
        skinHealthScore: 75,
        estimatedSkinAge: 30,
        primaryConcern: "Analysis in progress",
        skinType: "Normal"
      };
    }

  } catch (error) {
    console.error('Error in getSkinAnalysis:', error);
    
    // Return a fallback result for any API errors
    return {
      skinHealthScore: 75,
      estimatedSkinAge: 30,
      primaryConcern: "Analysis unavailable",
      skinType: "Normal"
    };
  }
};

/**
 * Validate image format and size
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 10MB' };
  }

  // Check minimum dimensions (optional)
  return { valid: true };
};

/**
 * Resize image if needed (basic implementation)
 */
export const resizeImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to resize image'));
        }
      }, 'image/jpeg', 0.8);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

