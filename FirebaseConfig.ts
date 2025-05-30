// Import the functions you need from the SDKs you need
import { ReactNativeFirebase } from "@react-native-firebase/app";
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"


const firebaseConfig = {
  apiKey: "AIzaSyBySBosjKeJ4l-iQ5Ll1OOo40RaPCeBlwo",
  authDomain: "kwentura-39597.firebaseapp.com",
  projectId: "kwentura-39597",
  storageBucket: "kwentura-39597.firebasestorage.app",
  messagingSenderId: "516248841412",
  appId: "1:516248841412:web:b72100855b78de0e27ed91",
  measurementId: "G-SNX7VNLBD5"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { 
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app)