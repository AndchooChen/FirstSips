import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
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