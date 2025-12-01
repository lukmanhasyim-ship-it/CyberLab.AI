// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAChCR9-j84BNd9RyPwMJP30vhq_KEeQFc",
  authDomain: "cyberlab-ffba6.firebaseapp.com",
  projectId: "cyberlab-ffba6",
  storageBucket: "cyberlab-ffba6.firebasestorage.app",
  messagingSenderId: "353276112706",
  appId: "1:353276112706:web:424e8f9ef96e4c3368e2db",
  measurementId: "G-LM9VP5ZRMM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };