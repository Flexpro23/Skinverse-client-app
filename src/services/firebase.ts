import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Timestamp, FieldValue } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Prefer long polling to avoid WebChannel Listen 400s in restricted networks / proxies
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const storage = getStorage(app);

// Initialize Analytics only when supported and measurementId is present
void (async () => {
  try {
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      const supported = await analyticsIsSupported();
      if (supported) {
        getAnalytics(app);
      }
    }
  } catch {
    // Ignore analytics initialization errors in development
  }
})();

// Add diagnostic log
console.log("Firebase Service Initialized. Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Types for our data models
export interface ClientProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  createdAt: Timestamp | FieldValue;
  lastSeenAt: Timestamp | FieldValue;
}

export interface ScanResult {
  createdAt: Timestamp | FieldValue;
  performedByDevice: string;
  imageUrls: {
    center: string;
    left: string;
    right: string;
  };
  analysisResult: {
    skinHealthScore: number;
    estimatedSkinAge: number;
    primaryConcern: string;
    skinType: string;
  };
  clinicianNotes?: string;
}

// Global variables for OTP flow
let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

/**
 * Initialize reCAPTCHA verifier for phone authentication
 */
export const initializeRecaptcha = (containerId: string): void => {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
  }
};

/**
 * Send OTP to phone number
 */
export const sendOtpToPhone = async (phoneNumber: string): Promise<boolean> => {
  try {
    if (!recaptchaVerifier) {
      throw new Error('reCAPTCHA not initialized');
    }

    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log('OTP sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

/**
 * Verify OTP code
 */
export const verifyOtp = async (otpCode: string): Promise<boolean> => {
  try {
    if (!confirmationResult) {
      throw new Error('No OTP confirmation result available');
    }

    const result = await confirmationResult.confirm(otpCode);
    console.log('User signed in:', result.user);
    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

/**
 * Get client profile by phone number
 */
export const getClientProfile = async (clinicId: string, phone: string): Promise<ClientProfile | null> => {
  try {
    // In a real implementation, we'd need to query by phone number
    // For now, we'll use phone as the document ID (after sanitizing)
    const clientId = phone.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    const clientRef = doc(db, 'clinics', clinicId, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);

    if (clientSnap.exists()) {
      return clientSnap.data() as ClientProfile;
    } else {
      console.log('No client found with this phone number');
      return null;
    }
  } catch (error) {
    console.error('Error getting client profile:', error);
    return null;
  }
};

/**
 * Create new client profile
 */
export const createClientProfile = async (
  clinicId: string, 
  clientData: Omit<ClientProfile, 'createdAt' | 'lastSeenAt'>
): Promise<string | null> => {
  try {
    const clientId = clientData.phone.replace(/[^0-9]/g, ''); // Use sanitized phone as ID
    const clientRef = doc(db, 'clinics', clinicId, 'clients', clientId);
    
    const newClient: ClientProfile = {
      ...clientData,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp()
    };

    await setDoc(clientRef, newClient);
    console.log('Client profile created successfully');
    return clientId;
  } catch (error) {
    console.error('Error creating client profile:', error);
    return null;
  }
};

/**
 * Update client's last seen timestamp
 */
export const updateClientLastSeen = async (clinicId: string, clientId: string): Promise<boolean> => {
  try {
    const clientRef = doc(db, 'clinics', clinicId, 'clients', clientId);
    await updateDoc(clientRef, {
      lastSeenAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating client last seen:', error);
    return false;
  }
};

/**
 * Upload images to Firebase Storage
 */
export const uploadScanImages = async (
  clinicId: string,
  clientId: string,
  images: { center: Blob; left: Blob; right: Blob }
): Promise<{ center: string; left: string; right: string } | null> => {
  try {
    const timestamp = Date.now();
    const scanId = `scan_${timestamp}`;
    
    const uploadPromises = Object.entries(images).map(async ([position, blob]) => {
      const imageRef = ref(storage, `scans/${clinicId}/${clientId}/${scanId}/${position}.jpg`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return { position, url: downloadURL };
    });

    const uploadResults = await Promise.all(uploadPromises);
    
    const imageUrls = uploadResults.reduce((acc, { position, url }) => {
      acc[position as keyof typeof acc] = url;
      return acc;
    }, {} as { center: string; left: string; right: string });

    return imageUrls;
  } catch (error) {
    console.error('Error uploading images:', error);
    return null;
  }
};

/**
 * Save scan result to Firestore
 */
export const saveScanResult = async (
  clinicId: string,
  clientId: string,
  scanData: Omit<ScanResult, 'createdAt'>
): Promise<string | null> => {
  try {
    const scansRef = collection(db, 'clinics', clinicId, 'clients', clientId, 'scans');
    
    const newScan: ScanResult = {
      ...scanData,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(scansRef, newScan);
    console.log('Scan result saved successfully');
    return docRef.id;
  } catch (error) {
    console.error('Error saving scan result:', error);
    return null;
  }
};

/**
 * Clean up reCAPTCHA verifier
 */
export const cleanupRecaptcha = (): void => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};

