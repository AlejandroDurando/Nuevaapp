import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGEW8VYiKC7yPy50O75WU31feOBSWjeW0",
  // USA ESTE (El original de Firebase):
  authDomain: "mis-finanzas-f8215.firebaseapp.com", 
  
  // ... resto de la config ...
  projectId: "mis-finanzas-f8215",
  storageBucket: "mis-finanzas-f8215.firebasestorage.app",
  messagingSenderId: "773839724132",
  appId: "1:773839724132:web:f4b3e7d81e10f51554c971",
  measurementId: "G-VVBP8RGCED"
};

// Inicializamos UNA sola vez
const app = initializeApp(firebaseConfig);

// Exportamos las herramientas listas para usar
export const auth = getAuth(app);
export const db = getFirestore(app);