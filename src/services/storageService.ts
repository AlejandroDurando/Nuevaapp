import { AppData, MonthlyData, Field } from '../types';
import { DEFAULT_DATA, INITIAL_FIELDS } from '../constants';

const STORAGE_KEY = 'finance_app_v1';

export const getAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_DATA;
    const parsed = JSON.parse(stored);
    // Ensure fields exist if migration needed
    if (!parsed.fields) parsed.fields = INITIAL_FIELDS;
    return parsed;
  } catch (e) {
    console.error("Error loading data", e);
    return DEFAULT_DATA;
  }
};

export const saveAppData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving data", e);
  }
};

export const getMonthData = (year: number, month: number): MonthlyData => {
  const data = getAppData();
  const key = `${year}-${String(month).padStart(2, '0')}`;
  return data.months[key] || { salary: 0, expenses: {}, expensesUsd: {}, paidStatus: {}, extras: {} };
};

export const updateMonthData = (year: number, month: number, updates: Partial<MonthlyData>) => {
  const data = getAppData();
  const key = `${year}-${String(month).padStart(2, '0')}`;
  
  const current = data.months[key] || { salary: 0, expenses: {}, expensesUsd: {}, paidStatus: {}, extras: {} };
  data.months[key] = { ...current, ...updates };
  
  saveAppData(data);
};

export const updateFields = (newFields: Field[]) => {
  const data = getAppData();
  data.fields = newFields;
  saveAppData(data);
};

export const toggleTheme = () => {
  const data = getAppData();
  const newTheme = data.theme === 'dark' ? 'light' : 'dark';
  data.theme = newTheme;
  saveAppData(data);
  return newTheme;
};