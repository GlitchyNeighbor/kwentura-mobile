// Import the functions you need from the SDKs you need
import { ReactNativeFirebase } from "@react-native-firebase/app";
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2TdJ_a1JklA42c-Irix5T8Syl-5hwNr8",
  authDomain: "kwentura-3139d.firebaseapp.com",
  projectId: "kwentura-3139d",
  storageBucket: "kwentura-3139d.firebasestorage.app",
  messagingSenderId: "559511714454",
  appId: "1:559511714454:web:5b2f4c0d1f755c352e60b7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { 
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app)