import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchReportStrict } from '../services/reportFetchService';
import { useClientInfo } from '../store/useAppStore';
import type { ReportData } from '../data/mockReport';
import TopNavBar from '../components/report/TopNavBar';
import AgeComparison from '../components/report/AgeComparison';
import SkinProfileCard from '../components/report/SkinProfileCard';
import KeyMetricCard from '../components/report/KeyMetricCard';
import AnalysisCard from '../components/report/AnalysisCard';
import PredictiveAnalysisContent from '../components/report/PredictiveAnalysisContent';
import PersonalizedRoadmapContent from '../components/report/PersonalizedRoadmapContent';

const AnalysisReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const clientInfo = useClientInfo();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealReport, setIsRealReport] = useState(false);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('Dashboard');
  const TABS = ['Dashboard', 'Identity', 'Surface', 'Deep Structure', 'Aging', 'Pigmentation', 'Predictive Analysis', 'Roadmap'];

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('📊 Loading report...', { reportId, clientPhone: clientInfo?.phone });
        
        let result;
        
        if (reportId) {
          // Always try to fetch real report if we have a reportId
          if (clientInfo?.phone) {
            // We have client info - fetch with phone
            result = await fetchReportStrict(reportId, 'skinverse-clinic', clientInfo.phone);
          } else {
            // No client info - fetch without phone constraint (for guest scans)
            console.warn('⚠️ No client phone available, fetching report by ID only');
            result = await fetchReportStrict(reportId, 'skinverse-clinic', '+1234567890'); // Use guest phone
          }
          
          if (result.success && result.reportData) {
            setReportData(result.reportData);
            setIsRealReport(true);
            console.log('✅ Real report loaded successfully:', reportId);
          } else {
            console.error('❌ Failed to fetch real report:', result.error);
            throw new Error(result.error || 'Report not found');
          }
        } else {
          // No reportId - this should redirect to error page
          console.error('❌ No reportId provided - redirecting to error');
          throw new Error('No report ID provided');
        }
      } catch (err) {
        console.error('❌ Error fetching report:', err);
        // Redirect to error page instead of showing inline error
        navigate('/analysis-error', {
          state: {
            type: 'report_fetch_failed',
            message: 'Unable to load analysis report',
            details: err instanceof Error ? err.message : 'Unknown error occurred',
            retryRecommended: true
          }
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReport();
  }, [reportId, clientInfo?.phone]);

  // Debug: Log the actual report data structure
  useEffect(() => {
    if (reportData) {
      console.log('🔍 DEBUG: Full Report Data Structure:', {
        clientProfileAge: reportData.clientProfile?.age,
        actualClientAge: clientInfo?.age,
        processingTime: reportData.reportMetadata?.processingTimeSeconds,
        confidence: reportData.recommendations?.confidence,
        totalPoints: reportData.facialLandmarks?.totalPoints
      });
    }
  }, [reportData, clientInfo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-grey flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-bronze mx-auto mb-4"></div>
          <p className="text-midnight-blue text-lg">Loading Analysis Report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-light-grey flex items-center justify-center">
        <div className="text-center">
          <p className="text-alert-red text-lg mb-4">Error loading report</p>
          <p className="text-medium-grey">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-grey text-midnight-blue">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-h1 text-midnight-blue mb-3">Aesthetic Intelligence Report</h1>
          <p className="text-body text-medium-grey mb-2">Analysis for Client: {reportData.reportMetadata?.clientId || clientInfo?.firstName + ' ' + clientInfo?.lastName || 'Demo Client'}</p>
          <p className="text-sm text-medium-grey mb-2">
            Generated: {reportData.reportMetadata?.generatedAt ? new Date(reportData.reportMetadata.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
          </p>
          
          {/* Status Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isRealReport ? (
                <>
                  <div className="w-3 h-3 bg-success-green rounded-full"></div>
                  <span className="text-sm text-success-green font-medium">AI-Generated Report</span>
                  {reportData.reportMetadata?.reportId && (
                    <span className="text-xs text-medium-grey ml-2">ID: {reportData.reportMetadata.reportId}</span>
                  )}
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-bronze rounded-full"></div>
                  <span className="text-sm text-bronze font-medium">Demo Report</span>
                  <span className="text-xs text-medium-grey ml-2">(Using sample data)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <TopNavBar tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'Dashboard' && (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="text-center mb-8">
                <h2 className="text-h1 text-midnight-blue mb-3">Skin Analysis Overview</h2>
                <p className="text-body text-medium-grey">Comprehensive assessment of your skin's current condition</p>
              </div>

              {/* Key Metrics - Three Hero Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <KeyMetricCard 
                  title="Hydration" 
                  score={reportData.surfaceAnalysis.hydration.score} 
                  level={reportData.surfaceAnalysis.hydration.level} 
                />
                <KeyMetricCard 
                  title="Pigmentation" 
                  score={reportData.pigmentationAnalysis.evenness.score} 
                  level={reportData.pigmentationAnalysis.evenness.level} 
                />
                <KeyMetricCard 
                  title="Fine Lines" 
                  score={reportData.agingAnalysis.fineLines.score} 
                  level={reportData.agingAnalysis.fineLines.level} 
                />
              </div>

              {/* Supporting Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Age Comparison */}
                <AgeComparison 
                  biologicalAge={reportData.keyMetrics.skinAge.biological}
                  estimatedSkinAge={reportData.keyMetrics.skinAge.estimated}
                  variance={reportData.keyMetrics.skinAge.variance}
                />

                {/* Skin Profile */}
                <SkinProfileCard 
                  skinType={reportData.clientProfile.skinType}
                  fitzpatrickScale={reportData.clientProfile.fitzpatrickScale}
                  ethnicBackground={reportData.clientProfile.ethnicBackground}
                  age={reportData.clientProfile.age}
                />
              </div>

              {/* Analysis Summary */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-h2 text-midnight-blue mb-6">Analysis Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-bronze mb-2">
                      {reportData.facialLandmarks?.totalPoints || 468}
                    </div>
                    <div className="text-sm text-medium-grey">Total Data Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-clinical-green mb-2">
                      {reportData.recommendations?.confidence ? 
                        `${Math.round(reportData.recommendations.confidence * 100)}%` : 
                        '95.0%'
                      }
                    </div>
                    <div className="text-sm text-medium-grey">Analysis Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-midnight-blue mb-2">
                      {reportData.reportMetadata?.processingTimeSeconds ? 
                        `${reportData.reportMetadata.processingTimeSeconds}s` : 
                        '70.4s'
                      }
                    </div>
                    <div className="text-sm text-medium-grey">Processing Time</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Identity' && (
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h2 className="text-h2 text-midnight-blue mb-6">Client Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-midnight-blue mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <p><span className="text-medium-grey">Age:</span> <span className="font-semibold text-midnight-blue">{reportData.clientProfile.age} years</span></p>
                    <p><span className="text-medium-grey">Skin Type:</span> <span className="font-semibold text-midnight-blue">{reportData.clientProfile.skinType}</span></p>
                    <p><span className="text-medium-grey">Fitzpatrick Scale:</span> <span className="font-semibold text-midnight-blue">{reportData.clientProfile.fitzpatrickScale}</span></p>
                    <p><span className="text-medium-grey">Ethnic Background:</span> <span className="font-semibold text-midnight-blue">{reportData.clientProfile.ethnicBackground}</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-midnight-blue mb-4">Primary Concerns</h3>
                  <div className="space-y-3">
                    {reportData.clientProfile.concerns.map((concern, index) => (
                      <div key={index} className="bg-light-grey rounded-lg p-4 border border-light-border-grey">
                        <p className="capitalize text-midnight-blue font-medium">{concern.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Surface Analysis Tab */}
          {activeTab === 'Surface' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Surface Analysis</h2>
                <p className="text-gray-400">Detailed analysis of skin surface characteristics and texture</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalysisCard
                  title="Hydration Levels"
                  data={reportData.surfaceAnalysis.hydration}
                />
                <AnalysisCard
                  title="Skin Texture"
                  data={reportData.surfaceAnalysis.texture}
                />
                <AnalysisCard
                  title="Pore Visibility"
                  data={reportData.surfaceAnalysis.poreVisibility}
                />
                <AnalysisCard
                  title="Oil Production"
                  data={reportData.surfaceAnalysis.oilProduction}
                />
              </div>
            </div>
          )}

          {/* Deep Structure Analysis Tab */}
          {activeTab === 'Deep Structure' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Deep Structure Analysis</h2>
                <p className="text-gray-400">Analysis of underlying skin structure and support systems</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalysisCard
                  title="Collagen Density"
                  data={reportData.deepStructureAnalysis.collagen}
                />
                <AnalysisCard
                  title="Skin Elasticity"
                  data={reportData.deepStructureAnalysis.elasticity}
                />
                <AnalysisCard
                  title="Vascular Health"
                  data={reportData.deepStructureAnalysis.vascularity}
                />
              </div>
            </div>
          )}

          {/* Aging Analysis Tab */}
          {activeTab === 'Aging' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Aging Analysis</h2>
                <p className="text-gray-400">Assessment of aging indicators and prevention strategies</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalysisCard
                  title="Fine Lines"
                  data={reportData.agingAnalysis.fineLines}
                />
                <AnalysisCard
                  title="Wrinkles"
                  data={reportData.agingAnalysis.wrinkles}
                />
                <AnalysisCard
                  title="Volume Loss"
                  data={reportData.agingAnalysis.volumeLoss}
                />
                <AnalysisCard
                  title="Skin Laxity"
                  data={reportData.agingAnalysis.skinLaxity}
                />
              </div>
            </div>
          )}

          {/* Pigmentation Analysis Tab */}
          {activeTab === 'Pigmentation' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Pigmentation Analysis</h2>
                <p className="text-gray-400">Comprehensive evaluation of skin tone evenness and pigmentation concerns</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalysisCard
                  title="Skin Tone Evenness"
                  data={reportData.pigmentationAnalysis.evenness}
                />
                <AnalysisCard
                  title="Sun Damage"
                  data={reportData.pigmentationAnalysis.sunDamage}
                />
                <AnalysisCard
                  title="Melasma Assessment"
                  data={reportData.pigmentationAnalysis.melasma}
                />
              </div>
            </div>
          )}

          {/* Predictive Analysis Tab */}
          {activeTab === 'Predictive Analysis' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Predictive Analysis</h2>
                <p className="text-gray-400">AI-powered forecasting of your skin's future development</p>
              </div>

              <PredictiveAnalysisContent 
                currentProjection={reportData.predictiveAnalysis.currentProjection}
                threeYearProjection={reportData.predictiveAnalysis.threeYearProjection}
                fiveYearProjection={reportData.predictiveAnalysis.fiveYearProjection}
                tenYearProjection={reportData.predictiveAnalysis.tenYearProjection}
              />
            </div>
          )}

          {/* Personalized Roadmap Tab */}
          {activeTab === 'Roadmap' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Personalized Roadmap</h2>
                <p className="text-gray-400">Your customized skin health improvement plan</p>
              </div>

              <PersonalizedRoadmapContent roadmap={reportData.personalizedRoadmap} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisReportPage;
