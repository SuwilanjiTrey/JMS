// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore'; // Import Firestore


const firebaseConfig = {
    apiKey: "AIzaSyCQCjFANCjZARPneTFAaDHqkOKe5xD2DPM",
    authDomain: "judiciary-management-system.firebaseapp.com",
    projectId: "judiciary-management-system",
    storageBucket: "judiciary-management-system.firebasestorage.app",
    messagingSenderId: "537393739795",
    appId: "1:537393739795:web:6651221da1f64208f227e6",
    measurementId: "G-REZMV74MS7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);  // Firestore instance
// const analytics = getAnalytics(app);