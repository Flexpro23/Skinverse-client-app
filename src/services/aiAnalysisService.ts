/**
 * AI Analysis Service - Frontend integration for Skinverse Cloud Function
 * Handles image upload to Firebase Storage and calls the AI analysis backend
 */

import { uploadScanImages } from './firebase';

export interface AnalysisRequest {
  clinicId: string;
  clientProfile: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    age?: number;
    concerns?: string[];
  };
  imageUrls: string[];
}

export interface AnalysisResponse {
  success: boolean;
  reportId?: string;
  reportNumber?: number;
  message: string;
  validationStatus?: string;
  error?: string;
  details?: string;
  timestamp?: string;
  retryRecommended?: boolean;
}

// Cloud Function URL - this will be updated once deployed
const CLOUD_FUNCTION_URL = 'https://us-central1-skinverse-clinic.cloudfunctions.net/generateAnalysis';

/**
 * Upload captured images to Firebase Storage
 */
export async function uploadCapturedImages(
  clinicId: string,
  clientId: string,
  capturedImages: Array<{
    position: 'center' | 'left' | 'right';
    blob: Blob;
  }>
): Promise<string[] | null> {
  try {
    console.log('📤 Uploading captured images to Firebase Storage...');
    
    // Organize images by position
    const centerBlob = capturedImages.find(img => img.position === 'center')?.blob;
    const leftBlob = capturedImages.find(img => img.position === 'left')?.blob;
    const rightBlob = capturedImages.find(img => img.position === 'right')?.blob;

    if (!centerBlob || !leftBlob || !rightBlob) {
      throw new Error('Missing captured images - all three positions required');
    }

    // Upload images using Firebase service
    const imageUrls = await uploadScanImages(clinicId, clientId, {
      center: centerBlob,
      left: leftBlob,
      right: rightBlob
    });

    if (!imageUrls) {
      throw new Error('Failed to upload images to Firebase Storage');
    }

    console.log('✅ Images uploaded successfully:', imageUrls);
    return [imageUrls.center, imageUrls.left, imageUrls.right];
  } catch (error) {
    console.error('❌ Error uploading images:', error);
    return null;
  }
}

/**
 * Call the Cloud Function to generate AI analysis
 */
export async function generateAIAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
  try {
    console.log('🤖 Calling AI Analysis Cloud Function...');
    
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    
    if (!response.ok) {
      // Enhanced error handling for different error types
      console.error('❌ Cloud Function error:', result);
      
      // Return structured error response
      return {
        success: false,
        message: result.message || 'AI analysis failed',
        error: result.error || 'unknown',
        details: result.details || 'No additional details available',
        retryRecommended: result.retryRecommended !== false,
        timestamp: result.timestamp || new Date().toISOString()
      };
    }

    console.log('✅ AI Analysis completed successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error calling AI Analysis service:', error);
    
    // Return network error response
    return {
      success: false,
      message: 'Failed to connect to AI analysis service',
      error: 'network_error',
      details: error instanceof Error ? error.message : 'Network connection failed',
      retryRecommended: true,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Complete pipeline: Upload images and generate analysis
 * NO FALLBACK - Either success or error
 */
export async function processFullAnalysis(
  clinicId: string,
  clientProfile: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    age?: number;
    concerns?: string[];
  },
  capturedImages: Array<{
    position: 'center' | 'left' | 'right';
    blob: Blob;
  }>
): Promise<AnalysisResponse> {
  try {
    console.log('🚀 Starting complete AI analysis pipeline...');
    
    // Step 1: Upload images to Firebase Storage
    const clientId = clientProfile.phone.replace(/[^0-9]/g, '');
    const imageUrls = await uploadCapturedImages(clinicId, clientId, capturedImages);
    
    if (!imageUrls) {
      return {
        success: false,
        message: 'Failed to upload images to storage',
        error: 'upload_failed',
        details: 'Unable to upload scan images to Firebase Storage',
        retryRecommended: true,
        timestamp: new Date().toISOString()
      };
    }

    // Step 2: Call Cloud Function for AI analysis
    const analysisRequest: AnalysisRequest = {
      clinicId,
      clientProfile,
      imageUrls
    };

    const result = await generateAIAnalysis(analysisRequest);
    
    if (result.success) {
      console.log('🎉 Complete analysis pipeline finished successfully');
    } else {
      console.error('💥 Analysis pipeline failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('💥 Error in complete analysis pipeline:', error);
    
    return {
      success: false,
      message: 'Analysis pipeline failed',
      error: 'pipeline_error',
      details: error instanceof Error ? error.message : 'Unknown pipeline error',
      retryRecommended: true,
      timestamp: new Date().toISOString()
    };
  }
}
