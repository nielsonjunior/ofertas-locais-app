// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCtS4U8bL7vxx9ms08C9JFBjys_yd4f4qI",
    authDomain: "ofertaslocais-a8149.firebaseapp.com",
    projectId: "ofertaslocais-a8149",
    storageBucket: "ofertaslocais-a8149.firebasestorage.app",
    messagingSenderId: "387093240340",
    appId: "1:387093240340:web:4232e1612b48da71532501"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
