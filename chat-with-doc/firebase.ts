// Import the functions you need from the SDKs you need

import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD5A8J4cAorOYWWJhWQLLxgNsSR-YxVdLY",
  authDomain: "chat-with-doc-db.firebaseapp.com",
  projectId: "chat-with-doc-db",
  storageBucket: "chat-with-doc-db.appspot.com",
  messagingSenderId: "579791562246",
  appId: "1:579791562246:web:8d7485af75777cf1e44587",
};

// You don't want to have duplicate clients sending requests at the same time
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
