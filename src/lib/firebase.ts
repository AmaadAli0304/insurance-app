
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
// Check if all config keys are present
const isConfigValid = Object.values(firebaseConfig).every(val => val);

let app;

if (isConfigValid) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} else {
    console.error("Firebase configuration is missing or incomplete. Please check your .env file.");
}


const auth = getAuth(app);

export { app, auth };
