import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import FieldAccordion from './components/FieldAccordion';
import MoneyRain from './components/MoneyRain';
import BudgetCharts from './components/BudgetCharts';
import RecurringModal from './components/RecurringModal';
import { YEARS, MONTHS } from './constants';
import { getAppData, saveAppData, getMonthData, updateMonthData, updateFields } from './services/storageService';
import { Field, AppData } from './types.ts';
import { ArrowLeft, Plus, DollarSign, AlertTriangle, PieChart as PieIcon, BarChart as BarIcon, Eye, EyeOff, LogOut, User, UserCircle } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, signInAnonymously, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCGEW8VYiKC7yPy50O75WU31feOBSWjeW0",
  authDomain: "mis-finanzas-f8215.firebaseapp.com",
  projectId: "mis-finanzas-f8215",
  storageBucket: "mis-finanzas-f8215.firebasestorage.app",
  messagingSenderId: "773839724132",
  appId: "1:773839724132:web:f4b3e7d81e10f51554c971",
  measurementId: "G-VVBP8RGCED"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


// --- HELPER FUNCTIONS ---
const formatNumberDisplay = (val: string | number): string => {
  if (val === '' || val === undefined || val === null) return '';
  const stringVal = val.toString().replace(/\./g, '');
  if (isNaN(Number(stringVal))) return val.toString();
  return Number(stringVal).toLocaleString('es-AR');
};

const parseNumberInput = (val: string): number => {
  const clean = val.replace(/\./g, '');
  return clean === '' ? 0 : parseFloat(clean);
};

// --- COMPONENTE: LOGIN ---
const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar con Google.');
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar como invitado.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
            <DollarSign size={48} className="text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Mis Finanzas</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Gestiona tu presupuesto inteligentemente</p>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="space-y-3">
            <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 shadow-sm flex items-center justify-center gap-3 transition-all hover:shadow-md disabled:opacity-50">
            {loading ? <span>Cargando...</span> : <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="google" /><span>Ingresar con Google</span></>}
            </button>
            <button onClick={handleGuestLogin} disabled={loading} className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 font-semibold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                <UserCircle size={20} /><span>Continuar como Invitado</span>
            </button>
        </div>
      </div>
    </div>
  );
};

// 1. HOME PAGE (MEJORADA: Autocompletado de sueldo)
const HomePage = ({ user }: { user: FirebaseUser | null }) => {
  const navigate = useNavigate();
  
  // Recuerda la última fecha seleccionada
  const [year, setYear] = useState(() => {
    const saved = localStorage.getItem('last_view_year');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });

  const [month, setMonth] = useState(() => {
    const saved = localStorage.getItem('last_view_month');
    return saved ? parseInt(saved) : new Date().getMonth();
  });

  const [salary, setSalary] = useState('');
  const displayName = user?.displayName || (user?.isAnonymous ? 'Invitado' : 'Usuario');
  const photoURL = user?.photoURL;

  // EFECTO: Cargar datos del mes O usar el último sueldo conocido
  useEffect(() => {
    const data = getMonthData(year, month + 1);
    
    if (data.salary > 0) {
      // Si este mes ya tiene un sueldo guardado, lo mostramos
      setSalary(formatNumberDisplay(data.salary));
    } else {
      // Si este mes está vacío, buscamos el "último sueldo conocido" en la memoria
      const lastSalary = localStorage.getItem('last_known_salary');
      if (lastSalary) {
        setSalary(formatNumberDisplay(parseInt(lastSalary)));
      } else {
        setSalary('');
      }
    }
  }, [year, month]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guardamos la fecha para volver aquí luego
    localStorage.setItem('last_view_year', year.toString());
    localStorage.setItem('last_view_month', month.toString());

    const salaryNum = parseNumberInput(salary);
    if (salaryNum > 0) {
      // 1. Guardamos el sueldo en ESTE mes
      updateMonthData(year, month + 1, { salary: salaryNum });
      
      // 2. Guardamos este sueldo como el "por defecto" para el futuro
      localStorage.setItem('last_known_salary', salaryNum.toString());
      
      navigate(`/budget?year=${year}&month=${month + 1}`);
    }
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setSalary(formatNumberDisplay(raw));
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl border dark:border-gray-700">
        
        {/* Header de Usuario */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
                {photoURL ? (
                    <img src={photoURL} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-blue-500" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                        <User size={20} className="text-gray-500 dark:text-gray-300" />
                    </div>
                )}
                <div className="text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Hola,</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate max-w-[150px]">
                        {displayName}
                    </p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Cerrar Sesión"
            >
                <LogOut size={20} />
            </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Configurar Mes</h2>
          <p className="text-gray-500 dark:text-gray-400">Selecciona fecha y sueldo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Año</label>
              <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mes</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white"
              >
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sueldo Mensual</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input 
                type="text" 
                value={salary}
                onChange={handleSalaryChange}
                className="w-full p-3 pl-8 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="0"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
};

// --- BUDGET PAGE ---
const BudgetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  const [appData, setAppData] = useState<AppData>(getAppData());
  const [monthData, setMonthData] = useState(getMonthData(year, month));
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringItems, setRecurringItems] = useState<any[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [activeChart, setActiveChart] = useState<'none' | 'pie' | 'bar'>('none');
  
  // ESTADOS PARA LA CREACIÓN DE CAMPO
  const [newFieldId, setNewFieldId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // SCROLL AUTOMÁTICO AL CREAR
  useEffect(() => {
    if (newFieldId && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 150);
    }
  }, [newFieldId, appData.fields.length]);

  useEffect(() => {
    const currentAppData = getAppData();
    const currentMonthData = getMonthData(year, month);
    setAppData(currentAppData);
    setMonthData(currentMonthData);
    if (!currentMonthData.recurringApplied) {
      const foundRecurring: any[] = [];
      currentAppData.fields.forEach(field => {
        field.categories.forEach(cat => {
          cat.subcategories.forEach(sub => {
            if (sub.recurringAmount && sub.recurringAmount > 0) {
               if (!currentMonthData.expenses[sub.id]) foundRecurring.push({ subId: sub.id, name: sub.name, categoryName: cat.name, fieldName: field.name, amount: sub.recurringAmount });
            }
          });
        });
      });
      if (foundRecurring.length > 0) { setRecurringItems(foundRecurring); setShowRecurringModal(true); } else { updateMonthData(year, month, { recurringApplied: true }); }
    }
  }, [year, month]);

  const handleUpdateExpense = (subId: string, val: number) => {
    const newExpenses = { ...monthData.expenses, [subId]: val };
    updateMonthData(year, month, { expenses: newExpenses });
    setMonthData({ ...monthData, expenses: newExpenses });
  };
  const handleUpdateExpenseUsd = (subId: string, val: number) => {
    const newExpensesUsd = { ...(monthData.expensesUsd || {}), [subId]: val };
    updateMonthData(year, month, { expensesUsd: newExpensesUsd });
    setMonthData({ ...monthData, expensesUsd: newExpensesUsd });
  };
  const handleTogglePaid = (subId: string, val: boolean) => {
    const newPaid = { ...monthData.paidStatus, [subId]: val };
    updateMonthData(year, month, { paidStatus: newPaid });
    setMonthData({ ...monthData, paidStatus: newPaid });
  };
  const handleAddExtra = (fieldId: string, description: string, amount: number) => {
    const currentExtras = monthData.extras[fieldId] || [];
    const newExtras = [...currentExtras, { id: `e_${Date.now()}`, description, amount, fieldId }];
    const extrasMap = { ...monthData.extras, [fieldId]: newExtras };
    updateMonthData(year, month, { extras: extrasMap });
    setMonthData({ ...monthData, extras: extrasMap });
  };
  const handleDeleteExtra = (fieldId: string, extraId: string) => {
    const currentExtras = monthData.extras[fieldId] || [];
    const newExtras = currentExtras.filter(e => e.id !== extraId);
    const extrasMap = { ...monthData.extras, [fieldId]: newExtras };
    updateMonthData(year, month, { extras: extrasMap });
    setMonthData({ ...monthData, extras: extrasMap });
  };
  const handleSaveField = (updatedField: Field) => {
    const newFields = appData.fields.map(f => f.id === updatedField.id ? updatedField : f);
    updateFields(newFields);
    setAppData({ ...appData, fields: newFields });
    setNewFieldId(null);
  };
  const handleDeleteField = (fieldId: string) => {
     if (window.confirm("¿Seguro que quieres eliminar este campo?")) {
         const newFields = appData.fields.filter(f => f.id !== fieldId);
         updateFields(newFields);
         setAppData({...appData, fields: newFields});
     }
  };

  const handleAddNewField = () => {
      const newId = `f_${Date.now()}`;
      const newField: Field = {
          id: newId,
          name: 'Nuevo Campo',
          percentage: 0,
          color: 'gray',
          icon: 'DollarSign',
          categories: [
            { id: `c_${Date.now()}`, name: 'General', subcategories: [] }
          ],
          type: 'standard',
          alertThreshold: 80
      };
      
      const newFields = [...appData.fields, newField];
      updateFields(newFields);
      setAppData({...appData, fields: newFields});
      setNewFieldId(newId);
  };

  const totalExpenses = (Object.values(monthData.expenses) as number[]).reduce((a, b) => a + b, 0) + (Object.values(monthData.extras) as { amount: number }[][]).reduce((acc, items) => acc + items.reduce((sum, item) => sum + item.amount, 0), 0);
  const available = monthData.salary - totalExpenses;
  
  // CALCULO DEL PORCENTAJE TOTAL ASIGNADO (VALIDACIÓN)
  const totalAllocatedPercentage = appData.fields.reduce((acc, field) => acc + field.percentage, 0);

  const alerts = appData.fields.map(field => {
     if (field.type === 'savings') return null;
     const budget = (monthData.salary * field.percentage) / 100;
     const subTotal = Object.keys(monthData.expenses).reduce((acc, key) => {
        const isForThisField = field.categories.some(c => c.subcategories.some(s => s.id === key));
        return isForThisField ? acc + (monthData.expenses[key] || 0) : acc;
      }, 0);
      const extraTotal = (monthData.extras[field.id] || []).reduce((acc, item) => acc + item.amount, 0);
      const totalSpent = subTotal + extraTotal;
      const pct = budget > 0 ? (totalSpent / budget) * 100 : 0;
      const threshold = field.alertThreshold || 80;
      if (pct >= threshold) return { fieldName: field.name, pct, isOver: pct >= 100 };
      return null;
  }).filter(Boolean);

  if (activeChart !== 'none') {
    return (
      <BudgetCharts 
        fields={appData.fields} 
        salary={monthData.salary} 
        expenses={monthData.expenses} 
        extras={monthData.extras}
        theme={appData.theme}
        viewMode={activeChart}
        onBack={() => setActiveChart('none')}
      />
    );
  }

  return (
    <div>
      {showRecurringModal && <RecurringModal items={recurringItems} onConfirm={(ids: string[]) => { const newExpenses = { ...monthData.expenses }; recurringItems.forEach(item => { if (ids.includes(item.subId)) newExpenses[item.subId] = item.amount; }); updateMonthData(year, month, { expenses: newExpenses, recurringApplied: true }); setMonthData({ ...monthData, expenses: newExpenses, recurringApplied: true }); setShowRecurringModal(false); }} onCancel={() => { updateMonthData(year, month, { recurringApplied: true }); setShowRecurringModal(false); }} />}
      
      {/* Header Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-800 dark:to-black rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={120} /></div>
         <div className="relative z-10">
             <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><button onClick={() => navigate('/')} className="text-gray-300 hover:text-white"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">{MONTHS[month - 1]} {year}</h2></div><button onClick={() => setShowBalance(!showBalance)} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">{showBalance ? <Eye size={20} /> : <EyeOff size={20} />}</button></div>
             <div className="grid grid-cols-2 gap-4 mb-6"><div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"><div className="text-xs text-blue-300 uppercase font-bold mb-1">Ingresos</div><div className="text-xl font-mono font-bold">{showBalance ? `$${formatNumberDisplay(monthData.salary)}` : '****'}</div></div><div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"><div className="text-xs text-purple-300 uppercase font-bold mb-1">Gastos</div><div className="text-xl font-mono font-bold">${formatNumberDisplay(totalExpenses)}</div></div></div>
             <div className="flex justify-between items-end">
                <div className="text-center">
                    <div className="text-sm text-gray-400 uppercase mb-1">Disponible Global</div>
                    <div className={`text-3xl font-bold font-mono ${available < 0 ? 'text-red-400' : 'text-green-400'}`}>{showBalance ? `$${formatNumberDisplay(available)}` : '****'}</div>
                </div>
                {/* INDICADOR DE PORCENTAJE ASIGNADO */}
                <div className={`text-xs px-2 py-1 rounded ${totalAllocatedPercentage > 100 ? 'bg-red-500 text-white' : 'bg-green-900/50 text-green-400'}`}>
                    Asignado: {totalAllocatedPercentage}%
                </div>
             </div>
         </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && <div className="mb-6 space-y-2">{alerts.map((alert, idx) => <div key={idx} className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${alert?.isOver ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}><AlertTriangle size={18} /><span>{alert?.fieldName}: {alert?.isOver ? '¡Presupuesto Excedido!' : `Alcanzó el ${alert?.pct.toFixed(0)}%`}</span></div>)}</div>}
      
      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6"><button onClick={() => setActiveChart('pie')} className="bg-white dark:bg-dark-card p-4 rounded-xl shadow hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-700 dark:text-gray-300"><PieIcon size={32} className="text-blue-500"/><span className="font-bold text-sm">Distribución de Gastos</span></button><button onClick={() => setActiveChart('bar')} className="bg-white dark:bg-dark-card p-4 rounded-xl shadow hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-700 dark:text-gray-300"><BarIcon size={32} className="text-purple-500"/><span className="font-bold text-sm">Presupuesto vs Realidad</span></button></div>
      
      {/* LISTA DE CAMPOS */}
      <div className="flex flex-col gap-6 pb-24">
          {appData.fields.map(field => (
              <FieldAccordion 
                key={field.id} 
                field={field} 
                salary={monthData.salary} 
                expenses={monthData.expenses} 
                expensesUsd={monthData.expensesUsd || {}} 
                paidStatus={monthData.paidStatus} 
                extras={monthData.extras} 
                defaultEditing={field.id === newFieldId}
                // PASAMOS EL TOTAL PARA VALIDAR 
                totalAllocatedPercentage={totalAllocatedPercentage}
                onUpdateExpense={handleUpdateExpense} 
                onUpdateExpenseUsd={handleUpdateExpenseUsd} 
                onTogglePaid={handleTogglePaid} 
                onAddExtra={handleAddExtra} 
                onDeleteExtra={handleDeleteExtra} 
                onSaveField={handleSaveField} 
                onDeleteField={handleDeleteField} 
              />
          ))}
          
          {/* BOTÓN AL FINAL DE LA LISTA */}
          <div className="py-6 px-2 flex justify-center z-50 relative">
              <button 
                onClick={handleAddNewField}
                className="w-full max-w-3xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-95"
              >
                  <Plus size={24} /> Crear Nuevo Campo
              </button>
          </div>

          <div ref={bottomRef} style={{height: '20px'}}></div>
      </div>
    </div>
  );
};

// --- APP ---
const App: React.FC = () => {
  const [theme, setTheme] = useState<AppData['theme']>('dark');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); }); return () => unsubscribe(); }, []);
  useEffect(() => { const data = getAppData(); setTheme(data.theme); }, []);
  const handleToggleTheme = () => { const data = getAppData(); const newTheme = data.theme === 'light' ? 'dark' : 'light'; data.theme = newTheme; saveAppData(data); setTheme(newTheme); };
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!user) return <LoginPage onLogin={() => {}} />;
  return <HashRouter><Layout theme={theme} toggleTheme={handleToggleTheme}><MoneyRain /><Routes><Route path="/" element={<HomePage user={user} />} /><Route path="/budget" element={<BudgetPage />} /></Routes></Layout></HashRouter>;
};

export default App;