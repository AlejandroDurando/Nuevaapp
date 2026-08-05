export interface Subcategory {
  id: string;
  name: string;
  recurringAmount?: number;
  isHalf?: boolean; // Si es true, contabiliza el 50% del importe ingresado
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  isHalf?: boolean; // Si es true, por defecto todas sus subcategorías contabilizan el 50%
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
  fields: Field[]; // <--- ESTO ES LO NUEVO: El mes guarda sus propios campos
  expenses: Record<string, number>;
  expensesUsd?: Record<string, number>;
  paidStatus: Record<string, boolean>;
  extras: Record<string, { id: string; description: string; amount: number; fieldId: string }[]>;
  recurringApplied?: boolean;
}

export interface AppData {
  theme: 'light' | 'dark';
  fields: Field[]; // Mantenemos esto como "Estructura Maestra/Ultima usada"
  months: Record<string, MonthlyData>;
}