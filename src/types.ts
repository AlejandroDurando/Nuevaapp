export interface Subcategory {
  id: string;
  name: string;
  recurringAmount?: number;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Field {
  id: string;
  name: string;
  percentage: number;
  color: string;
  icon: string;
  categories: Category[];
  type: 'standard' | 'savings';
  alertThreshold?: number;
}

export interface MonthlyData {
  salary: number;
  expenses: Record<string, number>;
  expensesUsd?: Record<string, number>;
  paidStatus: Record<string, boolean>;
  extras: Record<string, { id: string; description: string; amount: number; fieldId: string }[]>;
  recurringApplied?: boolean;
}

export interface AppData {
  theme: 'light' | 'dark';
  fields: Field[]; 
  months: Record<string, MonthlyData>;
}