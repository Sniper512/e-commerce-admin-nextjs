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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to Firebase Emulators in development
const USE_EMULATOR = false;

if (USE_EMULATOR) {
  const isEmulatorConnected = {
    auth: false,
    firestore: false,
    storage: false,
  };

  // Connect Auth Emulator
  if (!isEmulatorConnected.auth) {
    connectAuthEmulator(auth, "http://localhost:9099", {
      disableWarnings: true,
    });
    isEmulatorConnected.auth = true;
    console.log("🔧 Connected to Auth Emulator");
  }

  // Connect Firestore Emulator
  if (!isEmulatorConnected.firestore) {
    connectFirestoreEmulator(db, "localhost", 8080);
    isEmulatorConnected.firestore = true;
    console.log("🔧 Connected to Firestore Emulator");
  }

  // Connect Storage Emulator
  if (!isEmulatorConnected.storage) {
    connectStorageEmulator(storage, "localhost", 9199);
    isEmulatorConnected.storage = true;
    console.log("🔧 Connected to Storage Emulator");
  }
}

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

export { app };
