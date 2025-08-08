import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBDIG_ylh-bQn1LcYkFzsQEhQXoaM-rI9A",
  authDomain: "training-bordspel.firebaseapp.com",
  databaseURL: "https://training-bordspel-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "training-bordspel",
  storageBucket: "training-bordspel.firebasestorage.app",
  messagingSenderId: "1062515613716",
  appId: "1:1062515613716:web:9f83fc935fd45c6f204701"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);