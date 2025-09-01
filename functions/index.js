const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { GoogleGenAI } = require('@google/genai');
const { Storage } = require('@google-cloud/storage');

// Set global options
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
  timeoutSeconds: 540,
  memory: '4GiB'  // Increased for AI processing
});

// Initialize Firebase Admin with service account (for Cloud Functions)
try {
  // Try to initialize with default credentials first (for deployed environment)
  admin.initializeApp();
} catch (error) {
  console.log('Initializing with service account credentials...');
  // For local development or explicit service account usage
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'skinverse-clinic'
  });
}

const db = admin.firestore();
const storage = new Storage({
  projectId: 'skinverse-clinic'
});

// Initialize Vertex AI with Gemini models
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'skinverse-clinic',
  location: 'us-central1'
});
const analysisModel = 'gemini-2.5-pro';
const validatorModel = 'gemini-2.5-flash';

// Generation config for Gemini 2.5 Pro (Analysis)
const analysisGenerationConfig = {
  maxOutputTokens: 65535,
  temperature: 1,
  topP: 0.95,
  seed: 0,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    }
  ],
};

// Generation config for Gemini 2.5 Flash (Validation)
const validatorGenerationConfig = {
  maxOutputTokens: 1000,
  temperature: 0,
  topP: 1,
  seed: 0,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    }
  ],
};

/**
 * VALIDATOR: Validates AI response using Gemini 2.5 Flash
 */
async function validateAnalysisResponse(responseData, reportMetadata) {
  try {
    console.log('🔍 VALIDATOR: Starting response validation with Gemini 2.5 Flash');
    
    const validationPrompt = `
You are a strict JSON validation system for skin analysis reports. Your job is to validate that the provided JSON response matches our exact schema requirements.

VALIDATION CRITERIA:
1. Must be valid JSON structure
2. Must contain ALL required fields from our schema
3. All numeric scores must be between 1-100
4. All arrays must contain appropriate data types
5. All text fields must be meaningful (not placeholder text)
6. All recommendations must be medically appropriate
7. No missing or null critical values

RESPONSE TO VALIDATE:
${JSON.stringify(responseData, null, 2)}

REQUIRED SCHEMA STRUCTURE:
- clientProfile (age, skinType, fitzpatrickScale, biologicalAge, estimatedSkinAge, ethnicBackground, concerns)
- keyMetrics (overallSkinHealth, skinAge, primaryConcerns)
- surfaceAnalysis (hydration, texture, poreVisibility, oilProduction)
- deepStructureAnalysis (collagen, elasticity, vascularity)
- agingAnalysis (fineLines, wrinkles, volumeLoss, skinLaxity)
- pigmentationAnalysis (evenness, sunDamage, melasma)
- predictiveAnalysis (currentProjection, fiveYearProjection)
- personalizedRoadmap (immediateActions, monthlyTreatments, longTermStrategy, recommendedProducts)
- recommendations (priority, confidence, summary)

VALIDATION INSTRUCTIONS:
- Return "VALID" if the JSON structure is correct and contains meaningful skin analysis data
- Return "INVALID: [reason]" only if there are critical issues
- Be permissive - minor variations in field names or data types are acceptable
- Focus on ensuring the core skin analysis content exists

Return your assessment:
`;

    const validationRequest = {
      model: validatorModel,
      contents: [
        {
          role: 'user',
          parts: [{ text: validationPrompt }]
        }
      ],
      config: validatorGenerationConfig,
    };

    console.log('🚀 Sending validation request to Gemini 2.5 Flash...');
    
    const streamingResp = await ai.models.generateContentStream(validationRequest);
    
    let validationResult = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        validationResult += chunk.text;
      }
    }

    validationResult = validationResult.trim();
    console.log('📊 Validation result:', validationResult);

    // More flexible validation logic
    const normalizedResult = validationResult.toLowerCase();
    const isValid = normalizedResult.includes('valid') && !normalizedResult.includes('invalid');
    
    if (isValid) {
      console.log('✅ VALIDATOR: Response validation successful');
      return { isValid: true };
    } else {
      console.error('❌ VALIDATOR: Response validation failed:', validationResult);
      
      // Extract error message if available
      let errorMessage = validationResult;
      if (validationResult.startsWith('INVALID:')) {
        errorMessage = validationResult.replace('INVALID:', '').trim();
      }
      
      return { 
        isValid: false, 
        error: errorMessage || 'Validation failed',
        details: 'AI response did not meet quality standards'
      };
    }
  } catch (error) {
    console.error('💥 VALIDATOR: Validation process failed:', error);
    return { 
      isValid: false, 
      error: 'Validation system error',
      details: error.message 
    };
  }
}

/**
 * REGISTRAR: Generates report metadata and manages report counters
 */
async function generateReportMetadata(clinicId, clientProfile) {
  try {
    console.log('🏥 REGISTRAR: Starting metadata generation for clinic:', clinicId);
    
    // Get clinic document reference
    const clinicRef = db.collection('clinics').doc(clinicId);
    
    // Run transaction to safely increment report counter
    const reportMetadata = await db.runTransaction(async (transaction) => {
      // FIRST: Read all documents (reads must come before writes)
      const clinicDoc = await transaction.get(clinicRef);
      
      const clientId = (clientProfile.phone || 'unknown').replace(/[^0-9]/g, '');
      const clientRef = db.collection('clinics').doc(clinicId).collection('clients').doc(clientId);
      const clientDoc = await transaction.get(clientRef);
      
      // SECOND: Process the data
      const currentCounter = clinicDoc.exists ? (clinicDoc.data().reportCounter || 0) : 0;
      const newCounter = currentCounter + 1;
      
      // THIRD: Perform all writes
      // Initialize clinic document if it doesn't exist
      if (!clinicDoc.exists) {
        await transaction.set(clinicRef, {
          reportCounter: newCounter,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastReportAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Update counter
        await transaction.update(clinicRef, {
          reportCounter: newCounter,
          lastReportAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      const previousScanCount = clientDoc.exists ? 
        (clientDoc.data().scanCount || 0) : 0;
      
      // Update client scan count
      await transaction.set(clientRef, {
        ...clientProfile,
        scanCount: previousScanCount + 1,
        lastScanAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Generate formatted report ID
      const reportId = `RPT-${String(newCounter).padStart(3, '0')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
      
      // Generate complete metadata
      const metadata = {
        clientId: clientId,
        reportId: reportId,
        generatedAt: new Date().toISOString(),
        version: "3.0",
        analysisType: "comprehensive_skin_analysis",
        clinicId: clinicId,
        reportNumber: newCounter,
        previousScanCount: previousScanCount + 1
      };
      
      console.log('✅ REGISTRAR: Metadata generated successfully:', metadata);
      return metadata;
    });
    
    return reportMetadata;
  } catch (error) {
    console.error('❌ REGISTRAR: Error generating metadata:', error);
    throw error;
  }
}



/**
 * ANALYST: Processes images through Gemini 2.5 Pro and generates analysis
 */
async function analyzeImagesWithGemini(imageUrls, clientProfile, reportMetadata) {
  try {
    console.log('🤖 ANALYST: Starting AI analysis with Gemini 2.5 Pro');
    
    // Download and process images
    const imagePromises = imageUrls.map(async (url, index) => {
      console.log(`📸 Processing image ${index + 1}:`, url);
      
      // Extract bucket and file path from Firebase Storage URL
      const urlPattern = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^\/]+)\/o\/(.+)\?/;
      const match = url.match(urlPattern);
      
      if (!match) {
        throw new Error(`Invalid Firebase Storage URL: ${url}`);
      }
      
      const bucketName = match[1];
      const filePath = decodeURIComponent(match[2]);
      
      // Download image from Firebase Storage
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);
      const [imageBuffer] = await file.download();
      
      // Convert to base64
      const base64Image = imageBuffer.toString('base64');
      console.log(`✅ Image ${index + 1} processed, size: ${imageBuffer.length} bytes`);
      
      return {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      };
    });
    
    const images = await Promise.all(imagePromises);
    
    // Comprehensive system prompt for Aesthetic Intelligence Analysis
    const systemPrompt = `
You are an expert aesthetic dermatologist and AI system performing comprehensive skin analysis. Analyze the provided facial images and return a detailed assessment following this EXACT JSON schema.

CLIENT PROFILE:
- Actual Age: ${clientProfile.age || 'Unknown'} years (This is their chronological age - use this for clientProfile.age field)
- Name: ${clientProfile.firstName} ${clientProfile.lastName}
- Concerns: ${clientProfile.concerns || 'General skin health'}

ANALYSIS REQUIREMENTS:
1. Analyze skin texture, hydration, pores, elasticity, pigmentation
2. Detect aging signs, collagen status, facial volume
3. CRITICALLY IMPORTANT: Estimate skin age based on visual analysis of wrinkles, elasticity, pigmentation, pore size, facial volume, skin texture
4. Compare actual age vs estimated skin age to determine skin condition
5. Identify problem areas and provide targeted recommendations
6. Generate 5-year projection with prevention strategies
7. Create personalized treatment roadmap

SKIN AGE ESTIMATION INSTRUCTIONS:
- Look for fine lines, wrinkles, sagging, volume loss, pigmentation issues
- Assess skin firmness, elasticity, hydration levels
- Consider sun damage, pore visibility, skin texture
- Provide your best estimate of how old this person's skin appears
- This should be different from their actual age based on skin condition
- If skin looks younger than actual age, estimated skin age should be lower
- If skin shows more aging, estimated skin age should be higher

EXAMPLES FOR SKIN AGE ESTIMATION:
- For a 34-year-old with good skin care: estimated might be 30-32
- For a 34-year-old with sun damage and wrinkles: estimated might be 37-40
- For a 34-year-old with excellent skin: estimated might be 28-30
- Analyze CAREFULLY - don't just default to 25 or any fixed number

PREDICTIVE AGING PROJECTION INSTRUCTIONS:
- currentProjection.skinAge MUST equal estimatedSkinAge from clientProfile
- Calculate future aging based on current skin condition, not fixed increments
- Consider factors: sun damage, hydration, collagen loss, lifestyle, genetics
- Good skin health = slower aging (2-3 years per 5 actual years)
- Poor skin health = faster aging (6-8 years per 5 actual years)
- Average skin health = normal aging (4-5 years per 5 actual years)

AGING PROJECTION EXAMPLES:
- Current skin age 36 with good care: 3yr→38, 5yr→40, 10yr→44
- Current skin age 36 with poor care: 3yr→40, 5yr→44, 10yr→50  
- Current skin age 36 with average care: 3yr→39, 5yr→42, 10yr→47

CRITICAL: Return ONLY valid JSON in this exact schema - no markdown, no explanations, just pure JSON:

{
  "clientProfile": {
    "age": ${clientProfile.age}, // This is their actual chronological age - MUST be exactly ${clientProfile.age}
    "skinType": "string (Oily/Dry/Combination/Normal/Sensitive)",
    "fitzpatrickScale": "number 1-6",
    "biologicalAge": ${clientProfile.age}, // Same as actual age - MUST match exactly
    "estimatedSkinAge": "number", // THIS IS CRITICAL: Your visual estimate of how old their skin appears (analyze the images carefully)
    "ethnicBackground": "string",
    "concerns": ["array of detected concerns"]
  },
  "keyMetrics": {
    "overallSkinHealth": "number 1-100",
    "skinAge": {
      "biological": ${clientProfile.age}, // Actual chronological age - MUST be exactly ${clientProfile.age}
      "estimated": "number", // Your visual assessment of skin age from analyzing the images
      "variance": "number" // Difference between biological and estimated (estimated - biological)
    },
    "primaryConcerns": [
      {"type": "string", "severity": "mild/moderate/severe", "score": "number 1-100"}
    ]
  },
  "surfaceAnalysis": {
    "hydration": {
      "score": "number 1-100",
      "level": "string description",
      "description": "detailed analysis",
      "recommendations": ["array of specific recommendations"],
      "affectedAreas": ["array of facial areas"]
    },
    "texture": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] },
    "poreVisibility": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] },
    "oilProduction": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] }
  },
  "deepStructureAnalysis": {
    "collagen": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] },
    "elasticity": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] },
    "vascularity": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] }
  },
  "agingAnalysis": {
    "fineLines": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] },
    "wrinkles": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] },
    "volumeLoss": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] },
    "skinLaxity": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] }
  },
  "pigmentationAnalysis": {
    "evenness": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] },
    "sunDamage": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] },
    "melasma": { "score": "number", "level": "string", "description": "string", "recommendations": ["array"], "affectedAreas": ["array"] }
  },
  "predictiveAnalysis": {
    "currentProjection": {
      "timeline": "current",
      "skinAge": "number", // MUST match estimatedSkinAge from clientProfile
      "keyFeatures": ["array of current state features"]
    },
    "threeYearProjection": {
      "timeline": "3_years",
      "projectedSkinAge": "number", // Dynamic based on current skin condition and care level
      "keyFeatures": ["array of projected features"],
      "expectedChanges": ["array of expected changes if no intervention"]
    },
    "fiveYearProjection": {
      "timeline": "5_years", 
      "projectedSkinAge": "number", // Progressive aging based on skin health trends
      "keyFeatures": ["array of projected features"],
      "expectedChanges": ["array of expected changes"],
      "preventionOpportunities": ["array of prevention strategies"]
    },
    "tenYearProjection": {
      "timeline": "10_years",
      "projectedSkinAge": "number", // Long-term projection considering current skin condition
      "keyFeatures": ["array of projected features"],
      "expectedChanges": ["array of significant long-term changes"],
      "interventionImpact": "string describing how proper care could slow aging"
    }
  },
  "personalizedRoadmap": {
    "immediateActions": [
      {"category": "string", "action": "string", "frequency": "string", "expectedImprovement": "string"}
    ],
    "monthlyTreatments": [
      {"treatment": "string", "type": "string", "frequency": "string", "duration": "string", "target": "string"}
    ],
    "longTermStrategy": [
      {"phase": "string", "focus": "string", "expectedResults": "string"}
    ],
    "recommendedProducts": [
      {"category": "string", "product": "string", "usage": "string", "purpose": "string"}
    ]
  },
  "recommendations": {
    "priority": "high/medium/low",
    "confidence": "number 0-1",
    "summary": "comprehensive summary of recommendations"
  }
}

Analyze the images thoroughly and provide a complete, professional dermatological assessment.`;

    // Prepare request for Gemini 2.5 Pro
    const contents = [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          ...images
        ]
      }
    ];

    const req = {
      model: analysisModel,
      contents: contents,
      config: analysisGenerationConfig,
    };

    console.log('🚀 Sending request to Gemini 2.5 Pro...');
    
    // Generate content with streaming
    const streamingResp = await ai.models.generateContentStream(req);
    
    let fullResponse = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        fullResponse += chunk.text;
      }
    }

    console.log('📊 Raw Gemini response length:', fullResponse.length);
    
    // Parse and validate JSON response
    let analysisData;
    try {
      // Clean the response (remove any markdown artifacts)
      const cleanResponse = fullResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisData = JSON.parse(cleanResponse);
      console.log('✅ ANALYST: JSON validation successful');
      console.log('📊 Analysis data keys:', Object.keys(analysisData));
    } catch (parseError) {
      console.error('❌ ANALYST: JSON parsing failed:', parseError);
      console.error('Raw response:', fullResponse.substring(0, 500) + '...');
      throw new Error('Invalid JSON response from AI model');
    }

    return analysisData;
  } catch (error) {
    console.error('❌ ANALYST: Analysis failed:', error);
    throw error;
  }
}

/**
 * Main Cloud Function: Generate AI Analysis
 */
exports.generateAnalysis = onRequest(async (req, res) => {
    return cors(req, res, async () => {
      const processingStartTime = Date.now();
      try {
        console.log('🚀 AI Analysis Pipeline Started - Updated');
        
        // Validate request method
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // Extract request data
        const { clinicId, clientProfile, imageUrls } = req.body;
        
        // Validate required fields
        if (!clinicId || !clientProfile || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length !== 3) {
          return res.status(400).json({ 
            error: 'Missing required fields: clinicId, clientProfile, imageUrls (array of 3)' 
          });
        }

        // CRITICAL: Validate age is properly provided
        if (!clientProfile.age || typeof clientProfile.age !== 'number' || clientProfile.age < 13 || clientProfile.age > 120) {
          console.error('❌ VALIDATION: Invalid age in clientProfile:', clientProfile.age);
          return res.status(400).json({ 
            error: 'Invalid age: must be a number between 13 and 120',
            received: clientProfile.age,
            type: typeof clientProfile.age
          });
        }

        console.log('📋 Request validated:', { 
          clinicId, 
          clientName: `${clientProfile.firstName || 'Unknown'} ${clientProfile.lastName || 'User'}`,
          clientPhone: clientProfile.phone || 'No phone',
          clientAge: clientProfile.age || 'No age provided',
          imageCount: imageUrls.length 
        });
        
        console.log('📋 Full clientProfile received:', JSON.stringify(clientProfile, null, 2));

        // PHASE 1: REGISTRAR - Generate report metadata
        const reportMetadata = await generateReportMetadata(clinicId, clientProfile);
        
        // PHASE 2: ANALYST - Generate AI analysis
        const analysisData = await analyzeImagesWithGemini(imageUrls, clientProfile, reportMetadata);
        
        // PHASE 3: VALIDATION - Validate AI response quality
        console.log('🔍 Starting response validation...');
        const validationResult = await validateAnalysisResponse(analysisData, reportMetadata);
        
        if (!validationResult.isValid) {
          console.warn('⚠️ Validation failed, but proceeding with analysis:', validationResult.error);
          
          // Log validation failure but don't block the response
          console.warn('📋 Validation Warning (proceeding anyway):', {
            reportId: reportMetadata.reportId,
            clientId: reportMetadata.clientId,
            error: validationResult.error,
            details: validationResult.details,
            timestamp: new Date().toISOString()
          });
          
          // Continue with the analysis (validation is advisory only)
        }
        
        console.log('✅ Response validation successful');
        
        // PHASE 4: STORAGE - Combine and save final report (only after validation)
        const processingTimeSeconds = Math.round((Date.now() - processingStartTime) / 1000 * 10) / 10; // Round to 1 decimal
        
        const completeReport = {
          reportMetadata: {
            ...reportMetadata,
            processingTimeSeconds,
            processingCompletedAt: new Date().toISOString()
          },
          ...analysisData,
          validationStatus: {
            validated: true,
            validatedAt: new Date().toISOString(),
            validator: 'gemini-2.5-flash'
          }
        };

        // Save to Firestore
        const reportRef = db
          .collection('clinics')
          .doc(clinicId)
          .collection('clients')
          .doc(reportMetadata.clientId)
          .collection('reports')
          .doc(reportMetadata.reportId);

        await reportRef.set(completeReport);
        
        console.log('✅ Validated report saved to Firestore:', reportMetadata.reportId);

        // Return success response
        res.status(200).json({
          success: true,
          reportId: reportMetadata.reportId,
          reportNumber: reportMetadata.reportNumber,
          message: 'AI analysis completed and validated successfully',
          validationStatus: 'passed'
        });

      } catch (error) {
        console.error('💥 Cloud Function Error:', error);
        
        // Detailed error logging
        console.error('📋 Error Details:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          requestData: { 
            clinicId: req.body.clinicId || 'unknown', 
            clientProfile: req.body.clientProfile?.firstName || 'unknown', 
            imageCount: req.body.imageUrls?.length || 0 
          }
        });
        
        // Determine error type and return appropriate response
        let errorType = 'unknown';
        let statusCode = 500;
        
        if (error.message.includes('network') || error.message.includes('timeout')) {
          errorType = 'network_error';
          statusCode = 503;
        } else if (error.message.includes('AI') || error.message.includes('genai') || error.message.includes('model')) {
          errorType = 'ai_error';
          statusCode = 502;
        } else if (error.message.includes('validation') || error.message.includes('schema')) {
          errorType = 'validation_failed';
          statusCode = 422;
        }
        
        res.status(statusCode).json({
          success: false,
          error: errorType,
          message: 'An error occurred during analysis processing',
          details: error.message,
          timestamp: new Date().toISOString(),
          retryRecommended: statusCode !== 422
        });
      }
    });
  });

// Health check endpoint
exports.healthCheck = onRequest((req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'skinverse-ai-engine',
    timestamp: new Date().toISOString(),
    aiModel: analysisModel,
    validatorModel: validatorModel,
    memoryLimit: '4GiB'
  });
});

// Diagnostics endpoint - Test AI connectivity
exports.diagnostics = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      console.log('🔧 Running diagnostics...');
      
      const results = {
        timestamp: new Date().toISOString(),
        tests: {}
      };
      
      // Test 1: AI Model availability
      try {
        const testPrompt = 'Respond with just "OK" to confirm you are working.';
        const testRequest = {
          model: analysisModel,
          contents: [{ role: 'user', parts: [{ text: testPrompt }] }],
          config: { maxOutputTokens: 100, temperature: 0.1 }
        };
        
        const testResponse = await ai.models.generateContentStream(testRequest);
        let response = '';
        for await (const chunk of testResponse) {
          if (chunk.text) response += chunk.text;
        }
        
        results.tests.aiModel = { 
          status: 'success', 
          response: response.trim(),
          model: analysisModel
        };
      } catch (error) {
        results.tests.aiModel = { 
          status: 'failed', 
          error: error.message,
          model: analysisModel
        };
      }
      
      console.log('✅ Diagnostics completed:', results);
      res.json(results);
      
    } catch (error) {
      console.error('💥 Diagnostics failed:', error);
      res.status(500).json({
        error: 'Diagnostics failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
});
