import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZyz3_2b27HoaL8zNP_dgaQY17UkRy1WQ",
  authDomain: "placetodate-2a806.firebaseapp.com",
  projectId: "placetodate-2a806",
  storageBucket: "placetodate-2a806.firebasestorage.app",
  messagingSenderId: "633934299391",
  appId: "1:633934299391:web:5bd7d0ce8480c3ddc10cca",
  measurementId: "G-6QYBE443HH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };
