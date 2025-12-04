import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from '../firebase'; // Importa la DB desde el archivo de arriba
import { AppData, Field } from '../types';
import { DEFAULT_DATA, INITIAL_FIELDS } from '../constants';

export const fetchAppData = async (userId: string): Promise<AppData> => {
  if (!userId) return DEFAULT_DATA;
  const userRef = doc(db, "users", userId);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as AppData;
      if (!data.fields) data.fields = INITIAL_FIELDS;
      if (!data.months) data.months = {};
      return data;
    } else {
      return DEFAULT_DATA; 
    }
  } catch (e) {
    console.error("Error conectando con Firebase:", e);
    return DEFAULT_DATA;
  }
};

export const saveAppData = async (userId: string, data: AppData) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await setDoc(userRef, data, { merge: true });
  } catch (e) {
    console.error("Error guardando:", e);
  }
};

export const updateFieldsInDb = async (userId: string, newFields: Field[]) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { fields: newFields });
};

export const toggleThemeInDb = async (userId: string, currentTheme: 'light' | 'dark') => {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  if (userId) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { theme: newTheme });
  }
  return newTheme;
};