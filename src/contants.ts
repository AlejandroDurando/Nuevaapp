import { Field, AppData } from './types';
import { 
  Home, Car, Smile, Shield, DollarSign, Zap, ShoppingBag, 
  Coffee, Plane, Briefcase, GraduationCap, Heart, Music, 
  Smartphone, Wifi, Droplet, Flame, TrendingUp, Target
} from 'lucide-react';

export const INITIAL_FIELDS: Field[] = [
  {
    id: 'f_living',
    name: 'Gastos para Vivir',
    percentage: 50,
    color: 'blue',
    icon: 'Home',
    type: 'standard',
    categories: [
      {
        id: 'c_home',
        name: 'Casa',
        subcategories: [
          { id: 's_rent', name: 'Alquiler' },
          { id: 's_services', name: 'Servicios (Luz/Gas/Agua)' },
          { id: 's_internet', name: 'Internet' }
        ]
      },
      {
        id: 'c_food',
        name: 'Alimentación',
        subcategories: [
          { id: 's_supermarket', name: 'Supermercado' }
        ]
      },
      {
        id: 'c_transport',
        name: 'Transporte',
        subcategories: [
          { id: 's_fuel', name: 'Combustible/Transporte Público' }
        ]
      }
    ]
  },
  {
    id: 'f_investment',
    name: 'Inversión',
    percentage: 30,
    color: 'purple',
    icon: 'TrendingUp',
    type: 'standard',
    categories: [
      {
        id: 'c_invest',
        name: 'Crecimiento',
        subcategories: [
          { id: 's_stocks', name: 'Cedears/Acciones' },
          { id: 's_crypto', name: 'Criptomonedas' },
          { id: 's_education', name: 'Cursos/Formación' }
        ]
      }
    ]
  },
  {
    id: 'f_fun',
    name: 'Disfrute',
    percentage: 20,
    color: 'pink',
    icon: 'Smile',
    type: 'standard',
    categories: [
      {
        id: 'c_outing',
        name: 'Ocio',
        subcategories: [
          { id: 's_dining', name: 'Cenas/Salidas' },
          { id: 's_hobbies', name: 'Hobbies' },
          { id: 's_travel', name: 'Viajes' }
        ]
      }
    ]
  }
];

export const DEFAULT_APP_DATA: AppData = {
  theme: 'dark',
  fields: INITIAL_FIELDS,
  months: {}
};

export const COLORS = [
  'blue', 'purple', 'green', 'red', 'yellow', 'pink', 'indigo', 'teal', 'orange', 'gray'
];

export const ICON_MAP: Record<string, any> = {
  Home, Car, Smile, Shield, DollarSign, Zap, ShoppingBag,
  Coffee, Plane, Briefcase, GraduationCap, Heart, Music,
  Smartphone, Wifi, Droplet, Flame, TrendingUp, Target
};

export const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i);
export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];