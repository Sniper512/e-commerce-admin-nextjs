// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getMessaging,
  isSupported as isMessagingSupported,
} from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7-pL5y1WFoC9GX1lZYuZ58A-DpUM6cxc",
  authDomain: "e-commerce-14d5c.firebaseapp.com",
  projectId: "e-commerce-14d5c",
  storageBucket: "e-commerce-14d5c.firebasestorage.app",
  messagingSenderId: "25168298985",
  appId: "1:25168298985:web:09c204c72a11c166280178",
  measurementId: "G-J3BPV9PN4L",
};

// Initialize Firebase
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
const authInstance = getAuth(app);
const dbInstance = getFirestore(app);
const storageInstance = getStorage(app);

// Connect to Firebase Emulators in development
const USE_EMULATOR = process.env.NODE_ENV === "development";

// Track emulator connection state globally
const isEmulatorConnected = {
  auth: false,
  firestore: false,
  storage: false,
};

if (USE_EMULATOR) {
  // Connect Auth Emulator
  if (!isEmulatorConnected.auth) {
    try {
      connectAuthEmulator(authInstance, "http://localhost:9099", {
        disableWarnings: true,
      });
      isEmulatorConnected.auth = true;
      console.log("🔧 Connected to Auth Emulator");
    } catch (error) {
      // Emulator already connected
    }
  }

  // Connect Firestore Emulator
  if (!isEmulatorConnected.firestore) {
    try {
      connectFirestoreEmulator(dbInstance, "localhost", 8080);
      isEmulatorConnected.firestore = true;
      console.log("🔧 Connected to Firestore Emulator");
    } catch (error) {
      // Emulator already connected
    }
  }

  // Connect Storage Emulator
  if (!isEmulatorConnected.storage) {
    try {
      connectStorageEmulator(storageInstance, "localhost", 9199);
      isEmulatorConnected.storage = true;
      console.log("🔧 Connected to Storage Emulator");
    } catch (error) {
      // Emulator already connected
    }
  }
}

// Export Firebase services
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

// Initialize Analytics (only on client side and NOT in emulator mode)
export const analytics =
  typeof window !== "undefined" && !USE_EMULATOR
    ? isSupported().then((yes) => (yes ? getAnalytics(app) : null))
    : null;

// Initialize Messaging (only on client side with notification support and NOT in emulator mode)
export const messaging =
  typeof window !== "undefined" && !USE_EMULATOR
    ? isMessagingSupported().then((yes) => (yes ? getMessaging(app) : null))
    : null;

// Utility function to convert Android Emulator URLs to work with localhost
export const convertEmulatorUrl = (url: string): string => {
  if (!url || !USE_EMULATOR) return url;

  // Replace localhost with the emulator host for Android
  return url.replace("10.0.2.2", "localhost");
};

export { app };
