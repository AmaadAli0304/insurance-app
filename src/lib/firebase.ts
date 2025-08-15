
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const isConfigValid = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | undefined;
let auth: Auth;

if (isConfigValid) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
} else {
    console.error("Firebase configuration is missing or incomplete. Please check your .env file.");
    // Create a dummy auth object to avoid breaking the app structure
    // The AuthProvider will handle the lack of a real user.
    auth = {} as Auth;
}


export { app, auth };
