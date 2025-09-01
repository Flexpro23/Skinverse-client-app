// Aesthetic Intelligence Report JSON Schema v3.0
// This is our "Single Source of Truth" data contract for the entire report UI

export const mockReportData = {
  reportMetadata: {
    clientId: "CL-2024-001",
    reportId: "RPT-001-20241201",
    generatedAt: "2024-12-01T10:30:00Z",
    version: "3.0",
    analysisType: "comprehensive_skin_analysis",
    clinicId: "skinverse_clinic_main",
    processingTimeSeconds: 73.2,
    processingCompletedAt: "2024-12-01T10:31:13.200Z"
  },
  
  clientProfile: {
    age: 34, // User input age - this should always match user's actual age
    skinType: "Combination",
    fitzpatrickScale: 3,
    biologicalAge: 34, // Must match age exactly
    estimatedSkinAge: 36, // AI estimate based on visual analysis
    ethnicBackground: "Mediterranean",
    concerns: ["fine_lines", "pigmentation", "hydration"]
  },

  keyMetrics: {
    overallSkinHealth: 72,
    skinAge: {
      biological: 34, // Must match clientProfile.age exactly
      estimated: 36, // Must match clientProfile.estimatedSkinAge exactly
      variance: 2 // (estimated - biological) = (36 - 34) = 2
    },
    primaryConcerns: [
      { type: "hydration", severity: "moderate", score: 65 },
      { type: "pigmentation", severity: "mild", score: 78 },
      { type: "fine_lines", severity: "early", score: 82 }
    ]
  },

  surfaceAnalysis: {
    hydration: {
      score: 65,
      level: "Below Average",
      description: "Skin shows signs of dehydration, particularly in the T-zone area. Moisture barrier function is compromised.",
      recommendations: ["hyaluronic_acid", "ceramides", "barrier_repair"],
      affectedAreas: ["forehead", "nose", "chin"]
    },
    texture: {
      score: 78,
      level: "Good",
      description: "Overall skin texture is smooth with minor irregularities around the nose area.",
      recommendations: ["gentle_exfoliation", "retinol"],
      affectedAreas: ["nose_sides"]
    },
    poreVisibility: {
      score: 70,
      level: "Moderate",
      description: "Visible pores primarily concentrated in the T-zone, consistent with combination skin type.",
      recommendations: ["niacinamide", "salicylic_acid"],
      affectedAreas: ["nose", "forehead"]
    },
    oilProduction: {
      score: 75,
      level: "Balanced",
      description: "Oil production is well-regulated with slight excess in the T-zone.",
      recommendations: ["oil_control_serum"],
      affectedAreas: ["t_zone"]
    }
  },

  deepStructureAnalysis: {
    collagen: {
      score: 80,
      level: "Good",
      description: "Collagen density is appropriate for age with early signs of breakdown around the eye area.",
      recommendations: ["vitamin_c", "peptides", "retinol"],
      affectedAreas: ["eye_area", "nasolabial_folds"]
    },
    elasticity: {
      score: 77,
      level: "Good",
      description: "Skin elasticity is maintained well overall with minor loss in the lower face.",
      recommendations: ["collagen_stimulation", "firming_treatments"],
      affectedAreas: ["jawline", "neck"]
    },
    vascularity: {
      score: 85,
      level: "Excellent",
      description: "Healthy blood circulation with no visible signs of redness or broken capillaries.",
      recommendations: ["maintain_current_routine"],
      affectedAreas: []
    }
  },

  agingAnalysis: {
    fineLines: {
      score: 82,
      level: "Early Signs",
      description: "Minimal fine lines beginning to appear around the eyes and mouth area.",
      recommendations: ["retinol", "peptides", "sun_protection"],
      affectedAreas: ["crow_feet", "smile_lines"]
    },
    wrinkles: {
      score: 90,
      level: "Minimal",
      description: "No significant wrinkles detected. Prevention is key at this stage.",
      recommendations: ["preventive_care", "antioxidants"],
      affectedAreas: []
    },
    volumeLoss: {
      score: 88,
      level: "Minimal",
      description: "Facial volume is well-maintained with no significant loss detected.",
      recommendations: ["collagen_support", "healthy_lifestyle"],
      affectedAreas: []
    },
    skinLaxity: {
      score: 85,
      level: "Excellent",
      description: "Skin firmness is excellent for age group with no signs of sagging.",
      recommendations: ["maintain_current_routine"],
      affectedAreas: []
    }
  },

  pigmentationAnalysis: {
    evenness: {
      score: 68,
      level: "Fair",
      description: "Uneven pigmentation detected, particularly melasma patches on the cheeks.",
      recommendations: ["vitamin_c", "arbutin", "kojic_acid", "sun_protection"],
      affectedAreas: ["cheeks", "forehead"]
    },
    sunDamage: {
      score: 75,
      level: "Mild",
      description: "Mild sun damage visible with early age spots formation.",
      recommendations: ["broad_spectrum_spf", "vitamin_c", "tretinoin"],
      affectedAreas: ["cheeks", "nose"]
    },
    melasma: {
      score: 60,
      level: "Moderate",
      description: "Bilateral melasma patterns detected on both cheeks.",
      recommendations: ["hydroquinone", "tretinoin", "chemical_peels"],
      affectedAreas: ["bilateral_cheeks"]
    }
  },

  predictiveAnalysis: {
    currentProjection: {
      timeline: "current",
      skinAge: 36, // Must match clientProfile.estimatedSkinAge exactly
      keyFeatures: [
        "Mild dehydration in T-zone",
        "Early fine lines around eyes",
        "Moderate melasma on cheeks",
        "Good overall skin health"
      ]
    },
    threeYearProjection: {
      timeline: "3_years",
      projectedSkinAge: 39, // Dynamic progression from 36
      keyFeatures: [
        "Slight increase in fine line visibility",
        "Potential deepening of existing pigmentation",
        "Gradual loss of skin firmness"
      ],
      expectedChanges: [
        "Minor progression of existing concerns",
        "Early signs of volume loss may begin",
        "Continued manageable aging with care"
      ]
    },
    fiveYearProjection: {
      timeline: "5_years",
      projectedSkinAge: 42, // Progressive aging with moderate care
      keyFeatures: [
        "Increased collagen breakdown",
        "Developing fine lines around eyes",
        "Enhanced pigmentation concerns",
        "Reduced skin elasticity"
      ],
      expectedChanges: [
        "Increased fine line visibility if untreated",
        "Potential deepening of melasma without proper care",
        "Possible volume loss beginning in mid-face",
        "Continued good skin health with proper prevention"
      ],
      preventionOpportunities: [
        "Consistent retinol use can prevent 60% of projected aging",
        "Proper hydration can improve current dehydration by 80%",
        "Regular chemical peels can reduce pigmentation by 70%"
      ]
    },
    tenYearProjection: {
      timeline: "10_years",
      projectedSkinAge: 49, // Long-term projection considering good vs poor care
      keyFeatures: [
        "Noticeable aging signs without intervention",
        "Significant volume loss potential",
        "Advanced pigmentation concerns"
      ],
      expectedChanges: [
        "Significant fine lines and wrinkles if untreated",
        "Marked volume loss in cheeks and temples",
        "Pronounced sun damage and pigmentation",
        "Loss of skin firmness and elasticity"
      ],
      interventionImpact: "Following our personalized roadmap can help maintain healthier skin that ages more slowly than predicted, potentially keeping you looking 2-5 years younger."
    }
  },

  personalizedRoadmap: {
    immediateActions: [
      {
        category: "Hydration",
        action: "Introduce hyaluronic acid serum",
        frequency: "Twice daily",
        expectedImprovement: "Significant hydration boost within 2-4 weeks"
      },
      {
        category: "Sun Protection",
        action: "Daily broad-spectrum SPF 50+",
        frequency: "Every morning, reapply every 2 hours",
        expectedImprovement: "Prevent further sun damage and pigmentation"
      }
    ],
    
    monthlyTreatments: [
      {
        treatment: "Chemical Peel",
        type: "Glycolic Acid 30%",
        frequency: "Monthly",
        duration: "6 sessions",
        target: "Pigmentation and texture improvement"
      },
      {
        treatment: "Hydrafacial",
        type: "Deep cleansing and hydration",
        frequency: "Bi-monthly",
        duration: "Ongoing",
        target: "Maintain hydration and skin health"
      }
    ],

    longTermStrategy: [
      {
        phase: "0-3 months",
        focus: "Hydration restoration and sun protection establishment",
        expectedResults: "Improved skin barrier, reduced dehydration"
      },
      {
        phase: "3-6 months", 
        focus: "Pigmentation reduction and texture refinement",
        expectedResults: "Visible reduction in melasma, smoother texture"
      },
      {
        phase: "6-12 months",
        focus: "Anti-aging prevention and maintenance",
        expectedResults: "Prevention of further aging, optimized skin health"
      }
    ],

    recommendedProducts: [
      {
        category: "Cleanser",
        product: "Gentle ceramide cleanser",
        usage: "Morning and evening",
        purpose: "Maintain skin barrier"
      },
      {
        category: "Serum",
        product: "Hyaluronic acid + vitamin B5",
        usage: "Twice daily before moisturizer",
        purpose: "Deep hydration"
      },
      {
        category: "Treatment",
        product: "Retinol 0.25% (start low)",
        usage: "3x per week, evening only",
        purpose: "Anti-aging and texture improvement"
      },
      {
        category: "Sun Protection",
        product: "Broad-spectrum SPF 50+ with zinc oxide",
        usage: "Daily, reapply every 2 hours",
        purpose: "UV protection and pigmentation prevention"
      }
    ]
  },

  facialLandmarks: {
    totalPoints: 468,
    confidence: 0.95,
    keyAreas: {
      eyeRegion: { points: 36, quality: "excellent" },
      noseRegion: { points: 27, quality: "excellent" },
      mouthRegion: { points: 20, quality: "excellent" },
      jawline: { points: 17, quality: "good" },
      forehead: { points: 21, quality: "excellent" }
    },
    // 3D coordinate data for facial mesh rendering
    landmarks: (() => {
      const points = [];
      
      // Generate a realistic face-like point cloud with 468 points
      // Face outline (jawline and forehead)
      for (let i = 0; i < 50; i++) {
        const angle = (i / 49) * Math.PI * 2;
        const radius = 0.4 + Math.sin(angle * 2) * 0.1;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius * 0.8 - 0.1,
          z: Math.random() * 0.05 - 0.025
        });
      }
      
      // Eyes region
      for (let i = 0; i < 72; i++) {
        const eyeIndex = i < 36 ? 0 : 1; // Left eye: 0, Right eye: 1
        const localIndex = i % 36;
        const angle = (localIndex / 35) * Math.PI * 2;
        const eyeX = eyeIndex === 0 ? -0.15 : 0.15;
        const eyeRadius = 0.08;
        
        points.push({
          x: eyeX + Math.cos(angle) * eyeRadius,
          y: 0.15 + Math.sin(angle) * eyeRadius * 0.6,
          z: Math.random() * 0.02 + 0.01
        });
      }
      
      // Nose region
      for (let i = 0; i < 54; i++) {
        const t = i / 53;
        points.push({
          x: (Math.random() - 0.5) * 0.12,
          y: 0.1 - t * 0.25,
          z: t * 0.08 + Math.random() * 0.02
        });
      }
      
      // Mouth region
      for (let i = 0; i < 60; i++) {
        const angle = (i / 59) * Math.PI * 2;
        const radius = 0.08 + Math.random() * 0.02;
        points.push({
          x: Math.cos(angle) * radius,
          y: -0.25 + Math.sin(angle) * radius * 0.4,
          z: Math.random() * 0.02
        });
      }
      
      // Cheek and general face points
      for (let i = 0; i < 232; i++) {
        const x = (Math.random() - 0.5) * 0.8;
        const y = (Math.random() - 0.5) * 0.8;
        const distance = Math.sqrt(x * x + y * y);
        
        if (distance < 0.4) {
          points.push({
            x: x,
            y: y,
            z: Math.random() * 0.05 - 0.025
          });
        } else {
          // Regenerate point inside face boundary
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.35;
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius * 0.8,
            z: Math.random() * 0.05 - 0.025
          });
        }
      }
      
      return points.slice(0, 468); // Ensure exactly 468 points
    })()
  },

  recommendations: {
    priority: "high",
    confidence: 0.92,
    summary: "Focus on hydration restoration, sun protection, and pigmentation management for optimal skin health improvement."
  }
};

// Type export for use throughout the application
export type ReportData = typeof mockReportData;
