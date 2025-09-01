/**
 * Report Fetch Service - Dynamic report retrieval from Firestore
 * Replaces the static mock data with real-time report fetching
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { mockReportData } from '../data/mockReport';
import type { ReportData } from '../data/mockReport';

export interface ReportFetchResult {
  success: boolean;
  reportData: ReportData | null;
  error?: string;
}

/**
 * Fetch a specific report from Firestore using reportId
 */
export async function fetchReportById(
  clinicId: string,
  clientId: string,
  reportId: string
): Promise<ReportFetchResult> {
  try {
    console.log('📊 Fetching report from Firestore:', { clinicId, clientId, reportId });
    
    // Construct Firestore document path
    const reportRef = doc(db, 'clinics', clinicId, 'clients', clientId, 'reports', reportId);
    
    // Fetch the report document
    const reportSnap = await getDoc(reportRef);
    
    if (reportSnap.exists()) {
      const reportData = reportSnap.data() as ReportData;
      console.log('✅ Report fetched successfully from Firestore');
      
      return {
        success: true,
        reportData
      };
    } else {
      console.warn('⚠️ Report not found in Firestore');
      
      return {
        success: false,
        reportData: null,
        error: 'Report not found'
      };
    }
  } catch (error) {
    console.error('❌ Error fetching report from Firestore:', error);
    
    return {
      success: false,
      reportData: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch report with automatic client ID extraction from phone
 */
export async function fetchReportByIdWithPhoneExtraction(
  clinicId: string,
  clientPhone: string,
  reportId: string
): Promise<ReportFetchResult> {
  const clientId = clientPhone.replace(/[^0-9]/g, '');
  return await fetchReportById(clinicId, clientId, reportId);
}

/**
 * Get the latest report for a specific client
 */
export async function fetchLatestReportForClient(
  clinicId: string,
  clientId: string
): Promise<ReportFetchResult> {
  try {
    console.log('📊 Fetching latest report for client:', { clinicId, clientId });
    
    // This would require a more complex query to get the latest report
    // For now, we'll use the mock data as fallback
    console.log('⚠️ Latest report fetching not yet implemented, using mock data');
    
    return {
      success: true,
      reportData: mockReportData
    };
  } catch (error) {
    console.error('❌ Error fetching latest report:', error);
    
    return {
      success: false,
      reportData: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch report - STRICT MODE (No fallback to mock data)
 */
export async function fetchReportStrict(
  reportId: string,
  clinicId: string = 'skinverse-clinic',
  clientPhone: string
): Promise<ReportFetchResult> {
  try {
    console.log('📊 Fetching report in strict mode:', { reportId, clinicId });
    
    // Fetch real report only
    const result = await fetchReportByIdWithPhoneExtraction(clinicId, clientPhone, reportId);
    
    if (result.success && result.reportData) {
      console.log('✅ Real report fetched successfully');
      return result;
    } else {
      console.error('❌ Report not found:', reportId);
      return {
        success: false,
        reportData: null,
        error: 'Report not found in database'
      };
    }
  } catch (error) {
    console.error('❌ Error fetching report:', error);
    return {
      success: false,
      reportData: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Demo mode fetch (only for development/demo purposes)
 */
export async function fetchDemoReport(): Promise<ReportFetchResult> {
  console.log('📊 Using demo report data');
  return {
    success: true,
    reportData: mockReportData
  };
}

/**
 * Validate report data structure
 */
export function validateReportData(reportData: any): boolean {
  try {
    // Basic validation checks
    return !!(
      reportData &&
      reportData.reportMetadata &&
      reportData.clientProfile &&
      reportData.keyMetrics &&
      reportData.surfaceAnalysis &&
      reportData.predictiveAnalysis &&
      reportData.personalizedRoadmap
    );
  } catch {
    return false;
  }
}
