import { mockReportData } from '../data/mockReport';

// In the future, this will take a clientId and make a real API call.
// For now, it returns our static mock data after a short delay to simulate a network request.
export const getAnalysisReport = async (clientId?: string): Promise<typeof mockReportData> => {
  console.log("Fetching mock analysis report...", clientId ? `for client: ${clientId}` : '');
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log("Mock report fetched.");
  return mockReportData;
};
