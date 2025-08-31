import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { SkinAnalysisResult } from '../api/gemini';

// Types for our application state
export type AppStatus = 'idle' | 'authenticating' | 'scanning' | 'analyzing' | 'complete' | 'error';

export type CapturedImage = {
  position: 'center' | 'left' | 'right';
  blob: Blob;
  dataUrl: string;
  timestamp: number;
};

export interface ClientInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  isReturning: boolean;
  clientId?: string;
}

export interface ErrorState {
  message: string;
  code?: string;
  timestamp: number;
}

// Main application state interface
interface AppState {
  // Authentication & Client Info
  clientInfo: ClientInfo | null;
  isAuthenticated: boolean;
  
  // Image Capture
  capturedImages: CapturedImage[];
  currentCaptureStep: number; // 0: center, 1: left, 2: right
  
  // Analysis
  analysisResult: SkinAnalysisResult | null;
  
  // App Status & Flow
  appStatus: AppStatus;
  currentScreen: string;
  
  // Error Handling
  error: ErrorState | null;
  
  // Settings
  clinicId: string;
  deviceId: string;
}

// Actions interface
interface AppActions {
  // Client & Authentication Actions
  setClientInfo: (clientInfo: ClientInfo) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  clearClientInfo: () => void;
  
  // Image Capture Actions
  addCapturedImage: (image: CapturedImage) => void;
  clearCapturedImages: () => void;
  setCurrentCaptureStep: (step: number) => void;
  
  // Analysis Actions
  setAnalysisResult: (result: SkinAnalysisResult) => void;
  clearAnalysisResult: () => void;
  
  // App Status Actions
  setAppStatus: (status: AppStatus) => void;
  setCurrentScreen: (screen: string) => void;
  
  // Error Actions
  setError: (error: ErrorState) => void;
  clearError: () => void;
  
  // Settings Actions
  setClinicId: (clinicId: string) => void;
  setDeviceId: (deviceId: string) => void;
  
  // Utility Actions
  resetSession: () => void;
  resetToWelcome: () => void;
}

// Combined store type
type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  clientInfo: null,
  isAuthenticated: false,
  capturedImages: [],
  currentCaptureStep: 0,
  analysisResult: null,
  appStatus: 'idle',
  currentScreen: 'welcome',
  error: null,
  clinicId: 'default-clinic', // This should be set based on the clinic configuration
  deviceId: `device-${Date.now()}`, // Generate a unique device ID
};

// Create the Zustand store
export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Client & Authentication Actions
      setClientInfo: (clientInfo: ClientInfo) => {
        set(
          { clientInfo },
          false,
          'setClientInfo'
        );
      },

      setAuthenticated: (isAuthenticated: boolean) => {
        set(
          { isAuthenticated },
          false,
          'setAuthenticated'
        );
      },

      clearClientInfo: () => {
        set(
          { 
            clientInfo: null,
            isAuthenticated: false
          },
          false,
          'clearClientInfo'
        );
      },

      // Image Capture Actions
      addCapturedImage: (image: CapturedImage) => {
        const currentImages = get().capturedImages;
        const newImages = [...currentImages, image];
        
        set(
          { 
            capturedImages: newImages,
            currentCaptureStep: newImages.length
          },
          false,
          'addCapturedImage'
        );
      },

      clearCapturedImages: () => {
        set(
          { 
            capturedImages: [],
            currentCaptureStep: 0
          },
          false,
          'clearCapturedImages'
        );
      },

      setCurrentCaptureStep: (step: number) => {
        set(
          { currentCaptureStep: step },
          false,
          'setCurrentCaptureStep'
        );
      },

      // Analysis Actions
      setAnalysisResult: (result: SkinAnalysisResult) => {
        set(
          { analysisResult: result },
          false,
          'setAnalysisResult'
        );
      },

      clearAnalysisResult: () => {
        set(
          { analysisResult: null },
          false,
          'clearAnalysisResult'
        );
      },

      // App Status Actions
      setAppStatus: (status: AppStatus) => {
        set(
          { appStatus: status },
          false,
          'setAppStatus'
        );
      },

      setCurrentScreen: (screen: string) => {
        set(
          { currentScreen: screen },
          false,
          'setCurrentScreen'
        );
      },

      // Error Actions
      setError: (error: ErrorState) => {
        set(
          { error },
          false,
          'setError'
        );
      },

      clearError: () => {
        set(
          { error: null },
          false,
          'clearError'
        );
      },

      // Settings Actions
      setClinicId: (clinicId: string) => {
        set(
          { clinicId },
          false,
          'setClinicId'
        );
      },

      setDeviceId: (deviceId: string) => {
        set(
          { deviceId },
          false,
          'setDeviceId'
        );
      },

      // Utility Actions
      resetSession: () => {
        set(
          {
            clientInfo: null,
            isAuthenticated: false,
            capturedImages: [],
            currentCaptureStep: 0,
            analysisResult: null,
            appStatus: 'idle',
            currentScreen: 'welcome',
            error: null,
          },
          false,
          'resetSession'
        );
      },

      resetToWelcome: () => {
        set(
          {
            clientInfo: null,
            isAuthenticated: false,
            capturedImages: [],
            currentCaptureStep: 0,
            analysisResult: null,
            appStatus: 'idle',
            currentScreen: 'welcome',
            error: null,
          },
          false,
          'resetToWelcome'
        );
      },
    }),
    {
      name: 'skinverse-app-store', // Name for Redux DevTools
    }
  )
);

// Selector hooks for convenience
export const useClientInfo = () => useAppStore((state) => state.clientInfo);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useCapturedImages = () => useAppStore((state) => state.capturedImages);
export const useCurrentCaptureStep = () => useAppStore((state) => state.currentCaptureStep);
export const useAnalysisResult = () => useAppStore((state) => state.analysisResult);
export const useAppStatus = () => useAppStore((state) => state.appStatus);
export const useCurrentScreen = () => useAppStore((state) => state.currentScreen);
export const useError = () => useAppStore((state) => state.error);
export const useClinicId = () => useAppStore((state) => state.clinicId);
export const useDeviceId = () => useAppStore((state) => state.deviceId);

// Action hooks for convenience
export const useAppActions = () => useAppStore(useShallow((state) => ({
  setClientInfo: state.setClientInfo,
  setAuthenticated: state.setAuthenticated,
  clearClientInfo: state.clearClientInfo,
  addCapturedImage: state.addCapturedImage,
  clearCapturedImages: state.clearCapturedImages,
  setCurrentCaptureStep: state.setCurrentCaptureStep,
  setAnalysisResult: state.setAnalysisResult,
  clearAnalysisResult: state.clearAnalysisResult,
  setAppStatus: state.setAppStatus,
  setCurrentScreen: state.setCurrentScreen,
  setError: state.setError,
  clearError: state.clearError,
  setClinicId: state.setClinicId,
  setDeviceId: state.setDeviceId,
  resetSession: state.resetSession,
  resetToWelcome: state.resetToWelcome,
})));

// Type exports for use in components
export type AppStateExport = AppState;
export type AppActionsExport = AppActions;

