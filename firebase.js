import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDoF6r7eo6Sdk4ptkFwWh3plRTh5M8nWgM",
  authDomain: "the-plug-store.firebaseapp.com",
  projectId: "the-plug-store",
  storageBucket: "the-plug-store.firebasestorage.app",
  messagingSenderId: "445957804097",
  appId: "1:445957804097:web:9d19ad93f281397cd376c0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// Firebase Storage is intentionally not initialized while product uploads are paused.
// Re-enable it with the Upload Product form/handler when Storage is configured.
