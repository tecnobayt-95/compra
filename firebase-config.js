import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXcRyqqLPyzW143HZ9yIZxdYCn2zMHtEc",
  authDomain: "compra-a374e.firebaseapp.com",
  projectId: "compra-a374e",
  storageBucket: "compra-a374e.firebasestorage.app",
  messagingSenderId: "578365329816",
  appId: "1:578365329816:web:3a4a2feb1909e03a42dbed"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
