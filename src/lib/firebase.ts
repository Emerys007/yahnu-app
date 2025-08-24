
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB__NsNRENbO-J-DJR50xg7lAv0FGqOhgA",
  authDomain: "yahnu-50c61.firebaseapp.com",
  projectId: "yahnu-50c61",
  storageBucket: "yahnu-50c61.appspot.com",
  messagingSenderId: "657221346567",
  appId: "1:657221346567:web:005b1d7c09e71d4b9211a2",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
