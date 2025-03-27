import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    /*
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.STORAGE_BUCKET,
        messagingSenderId: process.env.MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
    */

    apiKey: "AIzaSyBP_Gygynnv6b8i6BpOR8cQqTtFznwuk8M",
    authDomain: "firstsips-ac.firebaseapp.com",
    projectId: "firstsips-ac",
    storageBucket: "firstsips-ac.firebasestorage.app",
    messagingSenderId: "388573561877",
    appId: "1:388573561877:web:4871eedd71f32bcaa77a1c",
    measurementId: "G-WWGKFNSMC2"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);

// Initialize Firestore
export const FIREBASE_DB = getFirestore(FIREBASE_APP);

// Initialize Firebase Analytics
const analytics = getAnalytics(FIREBASE_APP);