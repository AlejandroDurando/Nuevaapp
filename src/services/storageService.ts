import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { AppData, MonthlyData, Field } from '../types';
import { DEFAULT_DATA, INITIAL_FIELDS } from '../constants';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCGEW8VYiKC7yPy50O75WU31feOBSWjeW0",
  authDomain: "mis-finanzas-f8215.firebaseapp.com",
  projectId: "mis-finanzas-f8215",
  storageBucket: "mis-finanzas-f8215.firebasestorage.app",
  messagingSenderId: "773839724132",
  appId: "1:773839724132:web:f4b3e7d81e10f51554c971",
  measurementId: "G-VVBP8RGCED"
};

// Inicializamos la DB
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FUNCIONES ASÍNCRONAS (CLOUD) ---

// 1. Cargar datos desde la Nube
export const fetchAppData = async (userId: string): Promise<AppData> => {
  if (!userId) return DEFAULT_DATA;
  
  const userRef = doc(db, "users", userId);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as AppData;
      // Parches de seguridad por si faltan campos en datos viejos
      if (!data.fields) data.fields = INITIAL_FIELDS;
      if (!data.months) data.months = {};
      return data;
    } else {
      // Usuario nuevo: Crear documento inicial
      await setDoc(userRef, DEFAULT_DATA);
      return DEFAULT_DATA;
    }
  } catch (e) {
    console.error("Error conectando con Firebase:", e);
    return DEFAULT_DATA;
  }
};

// 2. Guardar datos completos (Respaldo general)
export const saveAppData = async (userId: string, data: AppData) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await setDoc(userRef, data, { merge: true });
  } catch (e) {
    console.error("Error guardando en la nube:", e);
  }
};

// 3. Actualizar campos (Categorías/Colores)
export const updateFieldsInDb = async (userId: string, newFields: Field[]) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, { fields: newFields });
  } catch (e) {
    console.error("Error actualizando campos:", e);
  }
};

// 4. Actualizar tema (Light/Dark)
export const toggleThemeInDb = async (userId: string, currentTheme: 'light' | 'dark') => {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  if (userId) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { theme: newTheme });
  }
  return newTheme;
};