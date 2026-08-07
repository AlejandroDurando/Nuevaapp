import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HashRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import FieldAccordion from './components/FieldAccordion';
import MoneyRain from './components/MoneyRain';
import BudgetCharts from './components/BudgetCharts';
import RecurringModal from './components/RecurringModal';
import PinLock from './components/PinLock';
import { YEARS, MONTHS, INITIAL_FIELDS } from './constants';
import { fetchAppData, saveAppData } from './services/storageService';
import { Field, AppData, MonthlyData } from './types';
import { ArrowLeft, Plus, DollarSign, AlertTriangle, PieChart as PieIcon, BarChart as BarIcon, Eye, EyeOff, LogOut, User, UserCircle, Users, Lock, Unlock, X, CheckCircle } from 'lucide-react';
import { auth } from './firebase'; 
import { signInWithPopup, signInAnonymously, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const googleProvider = new GoogleAuthProvider();

const DEFAULT_APP_DATA: AppData = {
  theme: 'dark',
  fields: INITIAL_FIELDS,
  months: {}
};

// --- HELPERS ---
const formatNumberDisplay = (val: string | number): string => {
  if (val === '' || val === undefined || val === null) return '';
  if (typeof val === 'number') {
      return val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return val;
};

const parseNumberInput = (val: string): number => {
  const clean = val.replace(/\./g, '');
  const dotDecimal = clean.replace(',', '.');
  return parseFloat(dotDecimal) || 0;
};

const handleMoneyInput = (raw: string): string => {
    if (!/^[0-9.,]*$/.test(raw)) return raw;
    if (raw.endsWith(',')) return raw;
    const parts = raw.split(',');
    if (parts.length > 1) {
        const integerPart = parts[0].replace(/\./g, '');
        const decimalPart = parts[1].substring(0, 2); 
        return Number(integerPart).toLocaleString('es-AR') + ',' + decimalPart;
    }
    const clean = raw.replace(/\./g, '').replace(/,/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('es-AR');
};

// --- LÓGICA DE DATOS: CORREGIDA PARA "AMNESIA TOTAL" ---
const getMonthDataSafe = (appData: AppData, year: number, month: number): MonthlyData => {
    const currentKey = `${year}-${String(month).padStart(2, '0')}`;
    const currentMonth = appData.months[currentKey];

    // 1. Si el mes ya existe y tiene datos, USARLOS (Independencia total)
    if (currentMonth && currentMonth.fields && currentMonth.fields.length > 0) {
        return currentMonth;
    }

    // 2. Si es un mes NUEVO, SIEMPRE usar los valores por defecto (70/20/10)
    // Ya NO miramos el mes anterior ni la configuración global modificada.
    // Usamos INITIAL_FIELDS directo para garantizar que nazca "limpio".
    const freshStartFields = JSON.parse(JSON.stringify(INITIAL_FIELDS));

    return { 
        salary: 0, 
        expenses: {}, 
        expensesUsd: {}, 
        paidStatus: {}, 
        extras: {},
        ...currentMonth, // Mantiene gastos si ya existían
        fields: freshStartFields 
    };
};

const GroupSelector = ({ onJoinGroup, user }: { onJoinGroup: (id: string) => void, user: any }) => {
  const [groupName, setGroupName] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = groupName.trim().toLowerCase().replace(/\s+/g, '_');
    if (cleanName.length > 2) onJoinGroup(cleanName);
  };
  return (
    <div>
       <h3 className="text-xl font-extrabold text-[#0E2F76] dark:text-[#F4FEFF] mb-2">Unirse o Crear Grupo</h3>
       <p className="text-xs sm:text-sm text-[#0E2F76]/70 dark:text-[#A9C0E0] mb-5">Ingresa un nombre único (ej: <b>pareja_2025</b>) para sincronizar gastos entre varios dispositivos.</p>
       <form onSubmit={handleSubmit} className="space-y-4">
         <input autoFocus type="text" placeholder="Nombre del grupo..." value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full p-4 bg-[#F4FEFF] dark:bg-[#080D1A] border border-[#A9C0E0]/50 dark:border-[#1E2D4A] rounded-2xl text-base font-bold text-[#0E2F76] dark:text-[#F4FEFF] focus:ring-2 focus:ring-[#0E2F76] outline-none transition-all placeholder:text-[#A9C0E0]"/>
         <button type="submit" disabled={groupName.length < 3} className="w-full py-3.5 bg-[#0E2F76] hover:bg-[#133D96] text-white font-bold rounded-2xl shadow-lg shadow-[#0E2F76]/20 disabled:opacity-40 transition-all active:scale-98">Entrar al Grupo</button>
       </form>
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleGoogleLogin = async () => {
    setLoading(true); setError('');
    try { await signInWithPopup(auth, googleProvider); } 
    catch (err: any) { console.error(err); setError('Error al iniciar con Google.'); setLoading(false); }
  };
  const handleGuestLogin = async () => {
    setLoading(true); setError('');
    try { await signInAnonymously(auth); } 
    catch (err: any) { console.error(err); setError('Error al iniciar como invitado.'); setLoading(false); }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 transition-colors font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#0F1A30] p-8 sm:p-10 rounded-3xl shadow-2xl border border-[#A9C0E0]/30 dark:border-[#1E2D4A] text-center backdrop-blur-xl">
        <div className="mb-6 flex justify-center">
          <div className="bg-[#0E2F76] dark:bg-[#1E2D4A] p-5 rounded-2xl shadow-lg shadow-[#0E2F76]/20">
            <DollarSign size={44} className="text-[#F4FEFF]" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold mb-2 text-[#0E2F76] dark:text-[#F4FEFF] tracking-tight">Mis Finanzas</h1>
        <p className="text-sm text-[#0E2F76]/70 dark:text-[#A9C0E0] mb-8 font-medium">Gestiona tu presupuesto inteligentemente</p>
        {error && <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold">{error}</div>}
        <div className="space-y-3.5">
            <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-4 px-5 bg-white dark:bg-[#080D1A] hover:bg-[#F4FEFF] text-[#0E2F76] dark:text-[#F4FEFF] font-bold rounded-2xl border border-[#A9C0E0]/40 dark:border-[#1E2D4A] shadow-sm flex items-center justify-center gap-3 transition-all hover:shadow-md disabled:opacity-50 active:scale-98">
              {loading ? <span>Cargando...</span> : <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-1" alt="google" /><span>Ingresar con Google</span></>}
            </button>
            <button onClick={handleGuestLogin} disabled={loading} className="w-full py-4 px-5 bg-[#A9C0E0]/20 hover:bg-[#A9C0E0]/30 dark:bg-[#1E2D4A]/50 dark:hover:bg-[#1E2D4A] text-[#0E2F76] dark:text-[#A9C0E0] font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-98">
              <UserCircle size={22} />
              <span>Continuar como Invitado</span>
            </button>
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ user, appData, onSave, groupId, onOpenGroupModal, onSetupPin, onChangeGroup }: { user: FirebaseUser | null, appData: AppData, onSave: (data: AppData) => void, groupId: string | null, onOpenGroupModal: () => void, onSetupPin: () => void, onChangeGroup: () => void }) => {
  const navigate = useNavigate();
  const [year, setYear] = useState(() => { const s = localStorage.getItem('last_view_year'); return s ? parseInt(s) : new Date().getFullYear(); });
  const [month, setMonth] = useState(() => { const s = localStorage.getItem('last_view_month'); return s ? parseInt(s) : new Date().getMonth(); });
  const [salary, setSalary] = useState('');
  const [showSalary, setShowSalary] = useState(() => localStorage.getItem('pref_show_salary') !== 'hidden');
  const toggleShowSalary = () => { const newState = !showSalary; setShowSalary(newState); localStorage.setItem('pref_show_salary', newState ? 'visible' : 'hidden'); };
  const displayName = user?.displayName || (user?.isAnonymous ? 'Invitado' : 'Usuario');
  const photoURL = user?.photoURL;
  const hasPin = !!localStorage.getItem('app_pin');

  useEffect(() => {
    const monthData = getMonthDataSafe(appData, year, month + 1);
    if (monthData.salary > 0) setSalary(formatNumberDisplay(monthData.salary));
    else setSalary('');
  }, [year, month, appData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('last_view_year', year.toString());
    localStorage.setItem('last_view_month', month.toString());
    const salaryNum = parseNumberInput(salary);
    if (salaryNum > 0) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const currentMonthData = getMonthDataSafe(appData, year, month + 1);
      
      const newData = { 
          ...appData, 
          months: { 
              ...appData.months, 
              [key]: { ...currentMonthData, salary: salaryNum } 
          } 
      };
      onSave(newData);
      navigate(`/budget?year=${year}&month=${month + 1}`);
    }
  };
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSalary(handleMoneyInput(e.target.value)); };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh]">
      <div className="w-full max-w-md bg-white dark:bg-[#0F1A30] p-8 rounded-3xl shadow-xl border border-[#A9C0E0]/30 dark:border-[#1E2D4A]">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#A9C0E0]/20 dark:border-[#1E2D4A]">
            <div className="flex items-center gap-3">
                {photoURL ? <img src={photoURL} className="w-11 h-11 rounded-2xl border-2 border-[#0E2F76] shadow-sm" alt="profile" /> : <div className="w-11 h-11 rounded-2xl bg-[#0E2F76] flex items-center justify-center border-2 border-[#0E2F76] shadow-sm"><User size={22} className="text-[#F4FEFF]" /></div>}
                <div className="text-left"><p className="text-xs text-[#0E2F76]/60 dark:text-[#A9C0E0]">Hola,</p><p className="text-base font-extrabold text-[#0E2F76] dark:text-[#F4FEFF] truncate max-w-[150px]">{displayName}</p></div>
            </div>
            <div className="flex gap-2">
                <button onClick={onSetupPin} className={`p-2.5 rounded-xl transition-all ${hasPin ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'text-[#A9C0E0] hover:bg-[#A9C0E0]/20 dark:hover:bg-[#1E2D4A]'}`} title={hasPin ? "PIN Activado" : "Configurar PIN"}>{hasPin ? <Lock size={18} /> : <Unlock size={18} />}</button>
                <button onClick={onOpenGroupModal} className={`p-2.5 rounded-xl transition-all ${groupId ? 'bg-[#0E2F76] text-white dark:bg-[#1E2D4A] dark:text-[#F4FEFF] shadow-sm' : 'text-[#A9C0E0] hover:bg-[#A9C0E0]/20 dark:hover:bg-[#1E2D4A]'}`} title={groupId ? `Grupo: ${groupId}` : "Crear/Unirse a Grupo"}><Users size={18} /></button>
                <button onClick={() => signOut(auth)} className="p-2.5 text-[#A9C0E0] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all" title="Cerrar Sesión"><LogOut size={18} /></button>
            </div>
        </div>
        {groupId && <div className="mb-5 p-3 bg-[#0E2F76]/10 dark:bg-[#1E2D4A]/50 border border-[#0E2F76]/20 dark:border-[#1E2D4A] rounded-2xl flex items-center justify-center gap-2 text-xs font-extrabold text-[#0E2F76] dark:text-[#A9C0E0]"><Users size={15} /> Modo Grupo: {groupId}</div>}
        <div className="text-center mb-7"><h2 className="text-2xl font-extrabold mb-1 text-[#0E2F76] dark:text-[#F4FEFF]">Configurar Mes</h2><p className="text-xs sm:text-sm text-[#0E2F76]/70 dark:text-[#A9C0E0]">Selecciona fecha e ingresa tu sueldo</p></div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-extrabold uppercase tracking-wider text-[#0E2F76] dark:text-[#A9C0E0] mb-1.5">Año</label><select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full p-3.5 rounded-2xl bg-[#F4FEFF] dark:bg-[#080D1A] border border-[#A9C0E0]/40 dark:border-[#1E2D4A] text-[#0E2F76] dark:text-[#F4FEFF] font-bold focus:ring-2 focus:ring-[#0E2F76] outline-none">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            <div><label className="block text-xs font-extrabold uppercase tracking-wider text-[#0E2F76] dark:text-[#A9C0E0] mb-1.5">Mes</label><select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full p-3.5 rounded-2xl bg-[#F4FEFF] dark:bg-[#080D1A] border border-[#A9C0E0]/40 dark:border-[#1E2D4A] text-[#0E2F76] dark:text-[#F4FEFF] font-bold focus:ring-2 focus:ring-[#0E2F76] outline-none">{MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0E2F76] dark:text-[#A9C0E0] mb-1.5">Sueldo Mensual</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0E2F76] dark:text-[#A9C0E0] font-extrabold text-lg">$</span>
              <input type={showSalary ? "text" : "password"} value={salary} onChange={handleSalaryChange} className="w-full p-3.5 pl-9 pr-12 rounded-2xl bg-[#F4FEFF] dark:bg-[#080D1A] border border-[#A9C0E0]/40 dark:border-[#1E2D4A] text-[#0E2F76] dark:text-[#F4FEFF] text-xl font-black focus:ring-2 focus:ring-[#0E2F76] outline-none" placeholder="0" required/>
              <button type="button" onClick={toggleShowSalary} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A9C0E0] hover:text-[#0E2F76] dark:hover:text-[#F4FEFF] transition-colors">{showSalary ? <Eye size={20} /> : <EyeOff size={20} />}</button>
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-[#0E2F76] hover:bg-[#133D96] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#0E2F76]/25 transform transition hover:scale-[1.01] active:scale-95">Continuar</button>
        </form>
      </div>
    </div>
  );
};

// --- BUDGET PAGE ---
const BudgetPage = ({ appData, onSave, groupId }: { appData: AppData, onSave: (data: AppData) => void, groupId: string | null }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  
  const monthData = getMonthDataSafe(appData, year, month);
  
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringItems, setRecurringItems] = useState<any[]>([]);
  const [showBalance, setShowBalance] = useState(() => localStorage.getItem('pref_show_balance') !== 'hidden');
  const toggleShowBalance = () => { const newState = !showBalance; setShowBalance(newState); localStorage.setItem('pref_show_balance', newState ? 'visible' : 'hidden'); };
  const [activeChart, setActiveChart] = useState<'none' | 'pie' | 'bar'>('none');
  const [newFieldId, setNewFieldId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (newFieldId && bottomRef.current) { setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 150); } }, [newFieldId, monthData.fields.length]);
  
  useEffect(() => {
    if (!monthData.recurringApplied && monthData.fields.length > 0) {
      const foundRecurring: any[] = [];
      monthData.fields.forEach(field => { field.categories.forEach(cat => { cat.subcategories.forEach(sub => { if (sub.recurringAmount && sub.recurringAmount > 0) { if (!monthData.expenses[sub.id]) foundRecurring.push({ subId: sub.id, name: sub.name, categoryName: cat.name, fieldName: field.name, amount: sub.recurringAmount }); } }); }); });
      if (foundRecurring.length > 0) { setRecurringItems(foundRecurring); setShowRecurringModal(true); } 
      else { const newData = { ...appData, months: { ...appData.months, [monthKey]: { ...monthData, recurringApplied: true } } }; onSave(newData); }
    }
  }, [monthKey]);

  const updateMonth = (updates: Partial<MonthlyData>) => { const newData = { ...appData, months: { ...appData.months, [monthKey]: { ...monthData, ...updates } } }; onSave(newData); };
  
  const handleUpdateExpense = (subId: string, val: number) => { updateMonth({ expenses: { ...monthData.expenses, [subId]: val } }); };
  const handleUpdateExpenseUsd = (subId: string, val: number) => { updateMonth({ expensesUsd: { ...monthData.expensesUsd || {}, [subId]: val } }); };
  const handleTogglePaid = (subId: string, val: boolean) => { updateMonth({ paidStatus: { ...monthData.paidStatus, [subId]: val } }); };
  const handleAddExtra = (fid: string, d: string, a: number) => { updateMonth({ extras: { ...monthData.extras, [fid]: [...(monthData.extras[fid] || []), { id: `e_${Date.now()}`, description: d, amount: a, fieldId: fid }] } }); };
  const handleDeleteExtra = (fid: string, eid: string) => { updateMonth({ extras: { ...monthData.extras, [fid]: (monthData.extras[fid] || []).filter(e => e.id !== eid) } }); };
  
  const handleSaveField = (uF: Field) => { 
      const newFields = monthData.fields.map(f => f.id === uF.id ? uF : f); 
      updateMonth({ fields: newFields });
      setNewFieldId(null); 
  };
  
  const handleDeleteField = (fid: string) => { 
      if (window.confirm("¿Seguro que quieres eliminar este campo de ESTE MES?")) { 
          const newFields = monthData.fields.filter(f => f.id !== fid); 
          updateMonth({ fields: newFields });
      } 
  };
  
  const handleAddNewField = () => { 
      const newId = `f_${Date.now()}`; 
      const newField: Field = { id: newId, name: 'Nuevo Campo', percentage: 0, color: 'gray', icon: 'DollarSign', categories: [{ id: `c_${Date.now()}`, name: 'General', subcategories: [] }], type: 'standard', alertThreshold: 80 }; 
      const newFields = [...monthData.fields, newField]; 
      updateMonth({ fields: newFields });
      setNewFieldId(newId); 
  };

  const calculateSubTotalForField = (field: Field) => {
    return field.categories.reduce((catAcc, cat) => {
      const catSum = cat.subcategories.reduce((subAcc, sub) => {
        const raw = monthData.expenses[sub.id] || 0;
        const isHalf = sub.isHalf === true || (sub.isHalf !== false && cat.isHalf === true);
        return subAcc + (isHalf ? raw * 0.5 : raw);
      }, 0);
      return catAcc + catSum;
    }, 0);
  };

  const totalExpenses = monthData.fields.reduce((acc, field) => {
    const subTotal = calculateSubTotalForField(field);
    const extraTotal = (monthData.extras[field.id] || []).reduce((s, i) => s + i.amount, 0);
    return acc + subTotal + extraTotal;
  }, 0);

  const available = monthData.salary - totalExpenses;
  const totalAllocatedPercentage = monthData.fields.reduce((acc, field) => acc + field.percentage, 0);
  
  const alerts = monthData.fields.map(field => { 
    if (field.type === 'savings') return null; 
    const budget = (monthData.salary * field.percentage) / 100; 
    const subTotal = calculateSubTotalForField(field);
    const extraTotal = (monthData.extras[field.id] || []).reduce((acc, item) => acc + item.amount, 0); 
    const totalSpent = subTotal + extraTotal; 
    const pct = budget > 0 ? (totalSpent / budget) * 100 : 0; 
    if (pct >= (field.alertThreshold || 80)) return { fieldName: field.name, pct, isOver: pct >= 100 }; 
    return null; 
  }).filter(Boolean);
  
  if (activeChart !== 'none') return <BudgetCharts fields={monthData.fields} salary={monthData.salary} expenses={monthData.expenses} extras={monthData.extras} theme={appData.theme} viewMode={activeChart} onBack={() => setActiveChart('none')} />;

  return (
    <div>
      {showRecurringModal && <RecurringModal items={recurringItems} onConfirm={(ids: string[]) => { const newExpenses = { ...monthData.expenses }; recurringItems.forEach(item => { if (ids.includes(item.subId)) newExpenses[item.subId] = item.amount; }); updateMonth({ expenses: newExpenses, recurringApplied: true }); setShowRecurringModal(false); }} onCancel={() => { updateMonth({ recurringApplied: true }); setShowRecurringModal(false); }} />}
      
      {/* Tarjeta Resumen Principal */}
      <div className="bg-gradient-to-br from-[#101B36] to-[#1C2D57] dark:from-[#0A1122] dark:to-[#17233F] rounded-3xl p-4 sm:p-8 text-[#E5E9F0] card-shadow mb-6 relative overflow-hidden border border-black/5 dark:border-white/5">
         <div className="absolute -top-10 -right-10 p-4 opacity-10 pointer-events-none"><DollarSign size={220} strokeWidth={1.75} /></div>
         <div className="relative z-10">
             <div className="flex items-center justify-between mb-5 sm:mb-6">
                 <div className="flex items-center gap-3">
                   <button onClick={() => navigate('/')} className="p-2.5 text-[#8B96A8] hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-95"><ArrowLeft size={20} strokeWidth={1.75} /></button>
                   <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white font-sans">{MONTHS[month - 1]} {year}</h2>
                 </div>
                 <button onClick={toggleShowBalance} className="p-2.5 text-[#8B96A8] hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-95">{showBalance ? <Eye size={20} strokeWidth={1.75} /> : <EyeOff size={20} strokeWidth={1.75} />}</button>
             </div>
             
             <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
               <div className="bg-white/10 dark:bg-black/25 rounded-2xl p-3 sm:p-4 border border-white/10 backdrop-blur-md overflow-hidden">
                 <div className="text-[10px] sm:text-xs text-[#8B96A8] uppercase font-bold tracking-widest mb-1 font-sans">Ingresos</div>
                 <div className="text-base sm:text-xl lg:text-2xl font-mono tabular-nums font-bold tracking-tight text-white truncate">{showBalance ? `$${formatNumberDisplay(monthData.salary)}` : '****'}</div>
               </div>
               <div className="bg-white/10 dark:bg-black/25 rounded-2xl p-3 sm:p-4 border border-white/10 backdrop-blur-md overflow-hidden">
                 <div className="text-[10px] sm:text-xs text-[#8B96A8] uppercase font-bold tracking-widest mb-1 font-sans">Gastos</div>
                 <div className="text-base sm:text-xl lg:text-2xl font-mono tabular-nums font-bold tracking-tight text-white truncate">${formatNumberDisplay(totalExpenses)}</div>
               </div>
             </div>

             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 bg-black/25 p-3.5 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md">
               <div className="text-left w-full sm:w-auto min-w-0">
                 <div className="text-[10px] sm:text-xs text-[#8B96A8] uppercase font-bold tracking-widest mb-1 font-sans">Disponible Global</div>
                 <div className={`text-lg sm:text-2xl lg:text-3xl font-bold font-mono tabular-nums tracking-tight truncate ${available < 0 ? 'text-[#F87171]' : 'text-[#34D399]'}`}>{showBalance ? `$${formatNumberDisplay(available)}` : '****'}</div>
               </div>
               <div className={`text-xs font-bold px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border shrink-0 ${totalAllocatedPercentage > 100 ? 'bg-[#EF4444]/20 text-[#F87171] border-[#EF4444]/30' : 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30'}`}>Asignado: {totalAllocatedPercentage}%</div>
             </div>
         </div>
      </div>

      {alerts.length > 0 && <div className="mb-6 space-y-2">{alerts.map((alert, idx) => <div key={idx} className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold card-shadow border ${alert?.isOver ? 'bg-[#FEF2F2] dark:bg-[#EF4444]/15 text-[#EF4444] dark:text-[#F87171] border-[#EF4444]/30' : 'bg-[#FFFBEB] dark:bg-[#F59E0B]/15 text-[#F59E0B] dark:text-[#FBBF24] border-[#F59E0B]/30'}`}><AlertTriangle size={20} strokeWidth={1.75} /><span>{alert?.fieldName}: {alert?.isOver ? '¡Presupuesto Excedido!' : `Alcanzó el ${alert?.pct.toFixed(0)}%`}</span></div>)}</div>}
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={() => setActiveChart('pie')} className="bg-white dark:bg-[#131B2E] p-4 sm:p-5 rounded-2xl card-shadow card-shadow-hover transition-all border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-2.5 text-[#0F172A] dark:text-[#E5E9F0] group active:scale-98 cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-[#EEF0FF] dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center group-hover:scale-110 transition-transform"><PieIcon size={22} strokeWidth={1.75} /></div>
          <span className="font-bold text-xs sm:text-sm tracking-tight">Distribución de Gastos</span>
        </button>
        <button onClick={() => setActiveChart('bar')} className="bg-white dark:bg-[#131B2E] p-4 sm:p-5 rounded-2xl card-shadow card-shadow-hover transition-all border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-2.5 text-[#0F172A] dark:text-[#E5E9F0] group active:scale-98 cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-[#EEF0FF] dark:bg-[#6366F1]/15 text-[#6366F1] dark:text-[#818CF8] flex items-center justify-center group-hover:scale-110 transition-transform"><BarIcon size={22} strokeWidth={1.75} /></div>
          <span className="font-bold text-xs sm:text-sm tracking-tight">Presupuesto vs Realidad</span>
        </button>
      </div>

      <div className="flex flex-col gap-6 pb-24">
          {monthData.fields.map(field => (<FieldAccordion key={field.id} field={field} salary={monthData.salary} expenses={monthData.expenses} expensesUsd={monthData.expensesUsd || {}} paidStatus={monthData.paidStatus} extras={monthData.extras} defaultEditing={field.id === newFieldId} totalAllocatedPercentage={totalAllocatedPercentage} onUpdateExpense={handleUpdateExpense} onUpdateExpenseUsd={handleUpdateExpenseUsd} onTogglePaid={handleTogglePaid} onAddExtra={handleAddExtra} onDeleteExtra={handleDeleteExtra} onSaveField={handleSaveField} onDeleteField={handleDeleteField} />))}
          <div className="py-4 px-2 flex justify-center z-50 relative"><button onClick={handleAddNewField} className="w-full max-w-3xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#6366F1]/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-95"><Plus size={22} strokeWidth={1.75} /> Crear Nuevo Campo</button></div>
          <div ref={bottomRef} style={{height: '20px'}}></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appData, setAppData] = useState<AppData>(DEFAULT_APP_DATA);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(() => localStorage.getItem('active_group_id'));
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  useEffect(() => { const savedPin = localStorage.getItem('app_pin'); if (savedPin) setIsLocked(true); }, []);
  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); }); return () => unsubscribe(); }, []);

  useEffect(() => {
    if (user) {
      setDataInitialized(false);
      const targetId = groupId || user.uid;
      fetchAppData(targetId).then((data) => {
        if (data.fields && data.fields.length > 0) { setAppData(data); } 
        else { setAppData(prev => ({ ...prev, ...data, fields: INITIAL_FIELDS })); }
        setDataInitialized(true);
      });
    }
  }, [user, groupId]);

  const handleSaveData = async (newData: AppData) => { setAppData(newData); if (user) { const targetId = groupId || user.uid; await saveAppData(targetId, newData); } };
  const handleToggleTheme = async () => { const newTheme = appData.theme === 'light' ? 'dark' : 'light'; const newData = { ...appData, theme: newTheme }; handleSaveData(newData); };
  const handleJoinGroup = (newGroupId: string) => { localStorage.setItem('active_group_id', newGroupId); setGroupId(newGroupId); setShowGroupModal(false); };
  const handleLeaveGroup = () => { localStorage.removeItem('active_group_id'); setGroupId(null); setShowGroupModal(false); };
  const handleUnlock = () => setIsLocked(false);
  const handleSetPin = (pin: string) => { localStorage.setItem('app_pin', pin); setShowPinSetup(false); setIsLocked(false); };
  const handleRemovePin = () => { if(window.confirm("¿Deseas eliminar el bloqueo por PIN?")) { localStorage.removeItem('app_pin'); setShowPinSetup(false); } };

  const [mounted, setMounted] = useState(false);
  const [lluvias, setLluvias] = useState<number[]>([]);
  useEffect(() => { setMounted(true); }, []);
  const triggerRain = () => { const id = Date.now(); setLluvias(prev => [...prev, id]); setTimeout(() => setLluvias(prev => prev.filter(x => x !== id)), 5000); };
  useEffect(() => { if (!document.getElementById('money-rain-style')) { const style = document.createElement('style'); style.id = 'money-rain-style'; style.innerHTML = `@keyframes money-rain { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } } .animate-money-rain { animation: money-rain linear forwards; pointer-events: none; }`; document.head.appendChild(style); } }, []);

  if (isLocked) return <PinLock mode="unlock" storedPin={localStorage.getItem('app_pin') || ''} onSuccess={handleUnlock} />;
  if (authLoading || (user && !dataInitialized)) return (<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white flex-col gap-4"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div><span className="text-gray-400 text-sm">Cargando finanzas...</span></div>);
  if (!user) return <LoginPage onLogin={() => {}} />;

  return (
    <>
        {mounted && createPortal(<>{lluvias.map(id => (<div key={id} className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">{Array.from({ length: 60 }).map((_, i) => (<div key={i} className="absolute text-4xl animate-money-rain" style={{ top: `-${Math.random() * 20}vh`, left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${2 + Math.random() * 3}s`, opacity: 0.8 + Math.random() * 0.2 }}>💵</div>))}</div>))}</>, document.body)}
        {showGroupModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl p-6 shadow-xl border dark:border-gray-700 relative animate-in zoom-in-95 duration-200">
                    <button onClick={() => setShowGroupModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X/></button>
                    <GroupSelector onJoinGroup={handleJoinGroup} user={user} />
                    {groupId && <div className="mt-6 text-center pt-4 border-t dark:border-gray-700"><button onClick={handleLeaveGroup} className="text-red-500 font-bold hover:underline">Salir del Grupo (Volver a Personal)</button></div>}
                </div>
            </div>
        )}
        {showPinSetup && <PinLock mode="setup" onSuccess={handleSetPin} onCancel={() => setShowPinSetup(false)} />}
        <HashRouter>
            <Layout theme={appData.theme} toggleTheme={handleToggleTheme} onMoneyClick={triggerRain}>
                <Routes>
                    <Route path="/" element={<HomePage user={user} appData={appData} onSave={handleSaveData} groupId={groupId} onChangeGroup={() => setShowGroupModal(true)} onOpenGroupModal={() => setShowGroupModal(true)} onSetupPin={() => { if (localStorage.getItem('app_pin')) { handleRemovePin(); } else { setShowPinSetup(true); } }} />} />
                    <Route path="/budget" element={<BudgetPage appData={appData} onSave={handleSaveData} groupId={groupId} />} />
                </Routes>
            </Layout>
        </HashRouter>
    </>
  );
};

export default App;