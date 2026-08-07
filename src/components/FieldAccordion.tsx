import React, { useState, useEffect } from 'react';
import { Field, Category, Subcategory } from '../types';
import { ICON_MAP, COLORS } from '../constants';
import * as Lucide from 'lucide-react';
import { Pencil, Trash2, Plus, Check, X, MoreVertical, Save, ChevronDown, ChevronUp, AlertTriangle, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';

interface FieldAccordionProps {
  field: Field;
  salary: number;
  expenses: Record<string, number>;
  expensesUsd: Record<string, number>;
  paidStatus: Record<string, boolean>;
  extras: Record<string, { id: string; description: string; amount: number; fieldId: string }[]>;
  defaultEditing?: boolean;
  onUpdateExpense: (subId: string, val: number) => void;
  onUpdateExpenseUsd: (subId: string, val: number) => void;
  onTogglePaid: (subId: string, val: boolean) => void;
  onAddExtra: (fieldId: string, description: string, amount: number) => void;
  onDeleteExtra: (fieldId: string, extraId: string) => void;
  onSaveField: (updatedField: Field) => void;
  onDeleteField: (fieldId: string) => void;
  totalAllocatedPercentage?: number;
}

// --- HELPERS ---
const formatNumberDisplay = (val: number | undefined): string => {
  if (val === undefined || val === null || val === 0) return '';
  return val.toLocaleString('es-AR', { maximumFractionDigits: 2 });
};

const parseNumberInput = (val: string): number => {
  const clean = val.replace(/\./g, '').replace(',', '.');
  return clean === '' ? 0 : parseFloat(clean);
};

const FieldAccordion: React.FC<FieldAccordionProps> = ({
  field, salary, expenses, expensesUsd, paidStatus, extras, defaultEditing = false,
  totalAllocatedPercentage = 0,
  onUpdateExpense, onUpdateExpenseUsd, onTogglePaid, onAddExtra, onDeleteExtra, onSaveField, onDeleteField
}) => {
  const [isOpen, setIsOpen] = useState(defaultEditing);
  const [isEditing, setIsEditing] = useState(defaultEditing);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [editedField, setEditedField] = useState<Field>(JSON.parse(JSON.stringify(field)));
  const [extraDesc, setExtraDesc] = useState('');
  const [extraAmount, setExtraAmount] = useState('');

  const [localInputs, setLocalInputs] = useState<Record<string, string>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  useEffect(() => {
    if (defaultEditing) {
      setIsOpen(true);
      setIsEditing(true);
    }
  }, [defaultEditing]);

  const budget = (salary * field.percentage) / 100;
  
  // Cálculo de subtotal respetando ítems al 50%
  const subTotal = field.categories.reduce((catAcc, cat) => {
    const catSum = cat.subcategories.reduce((subAcc, sub) => {
      const raw = expenses[sub.id] || 0;
      const isHalf = sub.isHalf === true || (sub.isHalf !== false && cat.isHalf === true);
      return subAcc + (isHalf ? raw * 0.5 : raw);
    }, 0);
    return catAcc + catSum;
  }, 0);

  const extraTotal = (extras[field.id] || []).reduce((acc, item) => acc + item.amount, 0);
  const totalSpent = subTotal + extraTotal;
  const remaining = budget - totalSpent;
  const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;
  
  const otherFieldsTotal = totalAllocatedPercentage - field.percentage;
  const projectedTotal = otherFieldsTotal + editedField.percentage;
  const isOverLimit = projectedTotal > 100;
  const availableSpace = 100 - otherFieldsTotal;

  const handleSave = () => { 
      if (!isOverLimit) {
          onSaveField(editedField); 
          setIsEditing(false); 
      }
  };
  const handleCancel = () => { setEditedField(JSON.parse(JSON.stringify(field))); setIsEditing(false); };
  
  const handleMoveCategory = (idx: number, direction: 'up' | 'down') => {
      const newCats = [...editedField.categories];
      if (direction === 'up' && idx > 0) {
          [newCats[idx], newCats[idx - 1]] = [newCats[idx - 1], newCats[idx]];
      } else if (direction === 'down' && idx < newCats.length - 1) {
          [newCats[idx], newCats[idx + 1]] = [newCats[idx + 1], newCats[idx]];
      }
      setEditedField({ ...editedField, categories: newCats });
  };

  const handleMoveSub = (catIdx: number, subIdx: number, direction: 'up' | 'down') => {
      const newCats = [...editedField.categories];
      const subs = [...newCats[catIdx].subcategories];
      if (direction === 'up' && subIdx > 0) {
          [subs[subIdx], subs[subIdx - 1]] = [subs[subIdx - 1], subs[subIdx]];
      } else if (direction === 'down' && subIdx < subs.length - 1) {
          [subs[subIdx], subs[subIdx + 1]] = [subs[subIdx + 1], subs[subIdx]];
      }
      newCats[catIdx].subcategories = subs;
      setEditedField({ ...editedField, categories: newCats });
  };

  const handleAddCategory = () => {
    const newCat: Category = { id: `c_${Date.now()}`, name: 'Nueva Categoría', subcategories: [], isHalf: false };
    setEditedField({ ...editedField, categories: [...editedField.categories, newCat] });
  };
  const handleDeleteCategory = (catId: string) => {
    setEditedField({ ...editedField, categories: editedField.categories.filter(c => c.id !== catId) });
  };
  const handleAddSub = (catId: string, parentIsHalf?: boolean) => {
    const newSub: Subcategory = { id: `s_${Date.now()}`, name: 'Nuevo Item', recurringAmount: 0, isHalf: parentIsHalf || false };
    const newCats = editedField.categories.map(c => c.id === catId ? { ...c, subcategories: [...c.subcategories, newSub] } : c);
    setEditedField({ ...editedField, categories: newCats });
  };
  const handleDeleteSub = (catId: string, subId: string) => {
    const newCats = editedField.categories.map(c => c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c);
    setEditedField({ ...editedField, categories: newCats });
  };

  const handleToggleCategoryHalf = (catId: string) => {
    const newCats = editedField.categories.map(cat => {
      if (cat.id === catId) {
        const nextIsHalf = !cat.isHalf;
        // Al cambiar la categoría a 50%, todas sus subcategorías adoptan la norma
        const updatedSubs = cat.subcategories.map(s => ({ ...s, isHalf: nextIsHalf }));
        return { ...cat, isHalf: nextIsHalf, subcategories: updatedSubs };
      }
      return cat;
    });
    setEditedField({ ...editedField, categories: newCats });
  };

  const handleToggleSubHalf = (catId: string, subId: string) => {
    const newCats = editedField.categories.map(cat => {
      if (cat.id === catId) {
        const updatedSubs = cat.subcategories.map(s => s.id === subId ? { ...s, isHalf: !s.isHalf } : s);
        return { ...cat, subcategories: updatedSubs };
      }
      return cat;
    });
    setEditedField({ ...editedField, categories: newCats });
  };

  const handleInputChange = (id: string, value: string, isUsd: boolean = false) => {
      const clean = value.replace(/[^0-9,]/g, '');
      setLocalInputs(prev => ({ ...prev, [isUsd ? `usd_${id}` : id]: clean }));
      const num = parseNumberInput(clean);
      if (isUsd) onUpdateExpenseUsd(id, num);
      else onUpdateExpense(id, num);
  };

  const handleBlur = (id: string, isUsd: boolean = false) => {
      setLocalInputs(prev => {
          const newState = { ...prev };
          delete newState[isUsd ? `usd_${id}` : id];
          return newState;
      });
  };

  const handleExtraAmountChange = (val: string) => setExtraAmount(val.replace(/[^0-9,]/g, ''));

  if (isEditing) {
    return (
      <div className={`bg-white dark:bg-[#0F1A30] rounded-3xl shadow-2xl p-6 border-2 relative mt-4 mb-4 animate-in fade-in zoom-in duration-200 ${isOverLimit ? 'border-red-500' : 'border-[#0E2F76]'}`}>
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#A9C0E0]/20 dark:border-[#1E2D4A]">
          <h3 className="text-lg font-extrabold text-[#0E2F76] dark:text-[#F4FEFF] flex items-center gap-2"><Pencil size={18} /> Editando Campo</h3>
        </div>

        {isOverLimit && (<div className="mb-5 p-4 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertTriangle size={18}/> ¡Error! El total supera el 100% ({projectedTotal}%). Máximo disponible: {availableSpace}%</div>)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
                <div><label className="block text-xs font-extrabold text-[#0E2F76] dark:text-[#A9C0E0] uppercase tracking-wider mb-1.5">Nombre</label><input type="text" value={editedField.name} onChange={e => setEditedField({...editedField, name: e.target.value})} className="w-full p-3 rounded-2xl bg-[#F4FEFF] dark:bg-[#080D1A] border border-[#A9C0E0]/40 dark:border-[#1E2D4A] text-[#0E2F76] dark:text-[#F4FEFF] font-bold focus:ring-2 focus:ring-[#0E2F76] outline-none"/></div>
                <div><label className="block text-xs font-extrabold text-[#0E2F76] dark:text-[#A9C0E0] uppercase tracking-wider mb-1.5">Porcentaje %</label><input type="number" value={editedField.percentage === 0 ? '' : editedField.percentage} onChange={e => setEditedField({...editedField, percentage: Number(e.target.value)})} placeholder="0" className={`w-full p-3 rounded-2xl bg-[#F4FEFF] dark:bg-[#080D1A] text-[#0E2F76] dark:text-[#F4FEFF] font-bold outline-none ${isOverLimit ? 'border-2 border-red-500' : 'border border-[#A9C0E0]/40 dark:border-[#1E2D4A] focus:ring-2 focus:ring-[#0E2F76]'}`}/><div className="text-xs text-[#A9C0E0] mt-1.5">Disponible para asignar: {availableSpace}%</div></div>
            </div>
            <div className="space-y-4">
                <div><label className="block text-xs font-extrabold text-[#0E2F76] dark:text-[#A9C0E0] uppercase tracking-wider mb-1.5">Color</label><div className="flex flex-wrap gap-2">{COLORS.map(c => (<button key={c} onClick={() => setEditedField({...editedField, color: c})} className={`w-6 h-6 rounded-full bg-${c}-500 ${editedField.color === c ? 'ring-2 ring-offset-2 ring-[#0E2F76] scale-110' : 'opacity-60 hover:opacity-100'}`} />))}</div></div>
                <div><label className="block text-xs font-extrabold text-[#0E2F76] dark:text-[#A9C0E0] uppercase tracking-wider mb-1.5">Icono</label><div className="flex flex-wrap gap-2 h-20 overflow-y-auto p-2 bg-[#F4FEFF] dark:bg-[#080D1A] rounded-2xl border border-[#A9C0E0]/40 dark:border-[#1E2D4A]">{Object.keys(ICON_MAP).map(key => { const Ico = ICON_MAP[key]; return (<button key={key} onClick={() => setEditedField({...editedField, icon: key})} className={`p-2 rounded-xl transition-all ${editedField.icon === key ? 'bg-[#0E2F76] text-white' : 'text-[#A9C0E0] hover:text-[#0E2F76]'}`}><Ico size={18} /></button>)})}</div></div>
            </div>
        </div>

        <div className="space-y-4 border-t border-[#A9C0E0]/20 dark:border-[#1E2D4A] pt-4">
          <label className="block text-xs font-extrabold text-[#0E2F76] dark:text-[#A9C0E0] uppercase tracking-wider">Estructura de Categorías y Subcategorías</label>
          {editedField.categories.map((cat, catIdx) => (
             <div key={cat.id} className="border border-[#A9C0E0]/30 dark:border-[#1E2D4A] p-4 rounded-2xl bg-[#F4FEFF]/60 dark:bg-[#080D1A]/50">
               <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <div className="flex flex-col">
                        {catIdx > 0 && <button onClick={() => handleMoveCategory(catIdx, 'up')} className="p-0.5 text-[#A9C0E0] hover:text-[#0E2F76]"><ArrowUp size={14}/></button>}
                        {catIdx < editedField.categories.length - 1 && <button onClick={() => handleMoveCategory(catIdx, 'down')} className="p-0.5 text-[#A9C0E0] hover:text-[#0E2F76]"><ArrowDown size={14}/></button>}
                      </div>
                      <input value={cat.name} onChange={(e) => { const newCats = editedField.categories.map(c => c.id === cat.id ? {...c, name: e.target.value} : c); setEditedField({...editedField, categories: newCats}); }} className="font-extrabold bg-transparent border-b border-[#A9C0E0]/40 dark:border-[#1E2D4A] focus:outline-none text-[#0E2F76] dark:text-[#F4FEFF] flex-1"/>
                  </div>
                  
                  {/* Selector de Contabilización al 50% para Categoría */}
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => handleToggleCategoryHalf(cat.id)}
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all ${cat.isHalf ? 'bg-purple-600 text-white border-purple-500 shadow-xs' : 'bg-[#A9C0E0]/20 text-[#0E2F76] dark:text-[#A9C0E0] border-[#A9C0E0]/40 dark:border-[#1E2D4A]'}`}
                      title="Si está activo, todas las subcategorías contabilizan solo el 50%"
                    >
                      {cat.isHalf ? 'Categoría al 50%' : 'Categoría al 100%'}
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                  </div>
               </div>

               <div className="pl-4 space-y-2.5">
                  {cat.subcategories.map((sub, subIdx) => {
                    const isSubHalf = sub.isHalf === true || (sub.isHalf !== false && cat.isHalf === true);
                    return (
                      <div key={sub.id} className="flex items-center gap-2">
                        <div className="flex flex-col">
                           {subIdx > 0 && <button onClick={() => handleMoveSub(catIdx, subIdx, 'up')} className="p-0.5 text-[#A9C0E0] hover:text-[#0E2F76]"><ArrowUp size={12}/></button>}
                           {subIdx < cat.subcategories.length - 1 && <button onClick={() => handleMoveSub(catIdx, subIdx, 'down')} className="p-0.5 text-[#A9C0E0] hover:text-[#0E2F76]"><ArrowDown size={12}/></button>}
                        </div>
                        <input value={sub.name} onChange={(e) => { const newCats = editedField.categories.map(c => { if(c.id === cat.id) { return {...c, subcategories: c.subcategories.map(s => s.id === sub.id ? {...s, name: e.target.value}: s)} } return c; }); setEditedField({...editedField, categories: newCats}); }} className="flex-1 text-sm bg-transparent border-b border-[#A9C0E0]/30 dark:border-[#1E2D4A] text-[#0E2F76] dark:text-[#A9C0E0] focus:border-[#0E2F76] outline-none"/>
                        
                        {/* Selector individual 50% por Subcategoría */}
                        <button
                          type="button"
                          onClick={() => handleToggleSubHalf(cat.id, sub.id)}
                          className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border transition-all ${isSubHalf ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400'}`}
                          title="Alternar entre contabilizar 100% o 50%"
                        >
                          {isSubHalf ? '50%' : '100%'}
                        </button>
                        <button onClick={() => handleDeleteSub(cat.id, sub.id)} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                      </div>
                    );
                  })}
                  <button onClick={() => handleAddSub(cat.id, cat.isHalf)} className="text-xs text-[#0E2F76] dark:text-[#A9C0E0] hover:underline flex items-center mt-2 font-bold"><Plus size={12} className="mr-1"/> Añadir Subcategoría</button>
               </div>
             </div>
          ))}
          <button onClick={handleAddCategory} className="w-full py-3 border-2 border-dashed border-[#A9C0E0]/40 dark:border-[#1E2D4A] text-[#0E2F76] dark:text-[#A9C0E0] font-bold rounded-2xl hover:bg-[#0E2F76]/5 transition-colors">+ Añadir Categoría</button>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#A9C0E0]/20 dark:border-[#1E2D4A]">
            <button onClick={handleCancel} className="px-5 py-2.5 bg-[#A9C0E0]/20 dark:bg-[#1E2D4A] rounded-2xl text-sm font-extrabold hover:bg-[#A9C0E0]/30 transition text-[#0E2F76] dark:text-[#F4FEFF]">Cancelar</button>
            <button onClick={handleSave} disabled={isOverLimit} className={`px-6 py-2.5 text-white rounded-2xl text-sm font-extrabold shadow-lg transition flex items-center gap-2 ${isOverLimit ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0E2F76] hover:bg-[#133D96] hover:scale-102'}`}><Save size={18}/> Guardar Cambios</button>
        </div>
      </div>
    );
  }

  const getFieldStyle = () => {
    const name = field.name.toLowerCase();
    if (field.id === 'f_living' || name.includes('vivir') || name.includes('gastos')) {
      return {
        Icon: Lucide.Home,
        colorClass: 'text-[#6366F1] dark:text-[#818CF8]',
        bgClass: 'bg-[#EEF0FF] dark:bg-[#6366F1]/15',
        badgeClass: 'bg-[#EEF0FF] text-[#6366F1] dark:bg-[#6366F1]/15 dark:text-[#818CF8] border border-[#6366F1]/20 dark:border-[#818CF8]/30',
        barClass: 'bg-[#6366F1] dark:bg-[#818CF8]',
      };
    }
    if (field.id === 'f_investment' || name.includes('invers')) {
      return {
        Icon: Lucide.TrendingUp,
        colorClass: 'text-[#10B981] dark:text-[#34D399]',
        bgClass: 'bg-[#ECFDF5] dark:bg-[#10B981]/15',
        badgeClass: 'bg-[#ECFDF5] text-[#10B981] dark:bg-[#10B981]/15 dark:text-[#34D399] border border-[#10B981]/20 dark:border-[#34D399]/30',
        barClass: 'bg-[#10B981] dark:bg-[#34D399]',
      };
    }
    if (field.id === 'f_fun' || name.includes('disfrut') || name.includes('ocio')) {
      return {
        Icon: Lucide.Sparkles,
        colorClass: 'text-[#F59E0B] dark:text-[#FBBF24]',
        bgClass: 'bg-[#FFFBEB] dark:bg-[#F59E0B]/15',
        badgeClass: 'bg-[#FFFBEB] text-[#F59E0B] dark:bg-[#F59E0B]/15 dark:text-[#FBBF24] border border-[#F59E0B]/20 dark:border-[#FBBF24]/30',
        barClass: 'bg-[#F59E0B] dark:bg-[#FBBF24]',
      };
    }
    const IconComp = ICON_MAP[field.icon] || Lucide.Shield;
    return {
      Icon: IconComp,
      colorClass: 'text-[#64748B] dark:text-[#8B96A8]',
      bgClass: 'bg-[#F1F5F9] dark:bg-[#64748B]/15',
      badgeClass: 'bg-[#F1F5F9] text-[#64748B] dark:bg-[#64748B]/15 dark:text-[#8B96A8] border border-[#64748B]/20 dark:border-[#8B96A8]/30',
      barClass: 'bg-[#64748B] dark:bg-[#8B96A8]',
    };
  };

  const fieldStyle = getFieldStyle();
  const FieldIcon = fieldStyle.Icon;

  let progressBarColor = fieldStyle.barClass;
  let statusColor = 'text-[#64748B] dark:text-[#8B96A8]';
  let alertIcon = null;

  if (field.type === 'standard') {
    if (percentUsed >= (field.alertThreshold || 80) && percentUsed < 100) {
      progressBarColor = 'bg-[#F59E0B] dark:bg-[#FBBF24]';
      statusColor = 'text-[#F59E0B] dark:text-[#FBBF24]';
      alertIcon = <AlertTriangle size={16} strokeWidth={1.75} className="text-[#F59E0B] dark:text-[#FBBF24]" />;
    } else if (percentUsed >= 100) {
      progressBarColor = 'bg-[#EF4444] dark:bg-[#F87171]';
      statusColor = 'text-[#EF4444] dark:text-[#F87171]';
      alertIcon = <AlertTriangle size={16} strokeWidth={1.75} className="text-[#EF4444] dark:text-[#F87171] animate-pulse" />;
    }
  } else if (field.type === 'savings' && percentUsed >= 100) {
    progressBarColor = 'bg-[#10B981] dark:bg-[#34D399]';
    statusColor = 'text-[#10B981] dark:text-[#34D399] font-bold';
  }
  let remainingColor = remaining < 0 ? 'text-[#EF4444] dark:text-[#F87171]' : 'text-[#10B981] dark:text-[#34D399]';

  if (isEditing) {
    return (
      <div className={`bg-white dark:bg-[#131B2E] rounded-3xl card-shadow border border-black/5 dark:border-white/5 p-6 relative mt-4 mb-4 animate-in fade-in zoom-in-95 duration-200 ${isOverLimit ? 'border-[#EF4444]' : ''}`}>
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#E2E8F0] dark:border-[#22304A]">
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#E5E9F0] flex items-center gap-2"><Pencil size={18} strokeWidth={1.75} /> Editando Campo</h3>
        </div>

        {isOverLimit && (<div className="mb-5 p-4 bg-[#FEF2F2] dark:bg-[#EF4444]/15 text-[#EF4444] dark:text-[#F87171] border border-[#EF4444]/30 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertTriangle size={18} strokeWidth={1.75}/> ¡Error! El total supera el 100% ({projectedTotal}%). Máximo disponible: {availableSpace}%</div>)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
                <div><label className="block text-xs font-bold text-[#64748B] dark:text-[#8B96A8] uppercase tracking-wider mb-1.5">Nombre</label><input type="text" value={editedField.name} onChange={e => setEditedField({...editedField, name: e.target.value})} className="w-full p-3 rounded-2xl bg-[#F4F7FB] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#22304A] text-[#0F172A] dark:text-[#E5E9F0] font-bold focus:ring-2 focus:ring-[#6366F1] outline-none"/></div>
                <div><label className="block text-xs font-bold text-[#64748B] dark:text-[#8B96A8] uppercase tracking-wider mb-1.5">Porcentaje %</label><input type="number" value={editedField.percentage === 0 ? '' : editedField.percentage} onChange={e => setEditedField({...editedField, percentage: Number(e.target.value)})} placeholder="0" className={`w-full p-3 rounded-2xl bg-[#F4F7FB] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#E5E9F0] font-bold outline-none ${isOverLimit ? 'border-2 border-[#EF4444]' : 'border border-[#E2E8F0] dark:border-[#22304A] focus:ring-2 focus:ring-[#6366F1]'}`}/><div className="text-xs text-[#64748B] dark:text-[#8B96A8] mt-1.5">Disponible para asignar: {availableSpace}%</div></div>
            </div>
            <div className="space-y-4">
                <div><label className="block text-xs font-bold text-[#64748B] dark:text-[#8B96A8] uppercase tracking-wider mb-1.5">Color</label><div className="flex flex-wrap gap-2">{COLORS.map(c => (<button key={c} onClick={() => setEditedField({...editedField, color: c})} className={`w-6 h-6 rounded-full bg-${c}-500 ${editedField.color === c ? 'ring-2 ring-offset-2 ring-[#6366F1] scale-110' : 'opacity-60 hover:opacity-100'}`} />))}</div></div>
                <div><label className="block text-xs font-bold text-[#64748B] dark:text-[#8B96A8] uppercase tracking-wider mb-1.5">Icono</label><div className="flex flex-wrap gap-2 h-20 overflow-y-auto p-2 bg-[#F4F7FB] dark:bg-[#0B1120] rounded-2xl border border-[#E2E8F0] dark:border-[#22304A]">{Object.keys(ICON_MAP).map(key => { const Ico = ICON_MAP[key]; return (<button key={key} onClick={() => setEditedField({...editedField, icon: key})} className={`p-2 rounded-xl transition-all ${editedField.icon === key ? 'bg-[#6366F1] text-white' : 'text-[#64748B] hover:text-[#6366F1]'}`}><Ico size={18} strokeWidth={1.75} /></button>)})}</div></div>
            </div>
        </div>

        <div className="space-y-4 border-t border-[#E2E8F0] dark:border-[#22304A] pt-4">
          <label className="block text-xs font-bold text-[#64748B] dark:text-[#8B96A8] uppercase tracking-wider">Estructura de Categorías y Subcategorías</label>
          {editedField.categories.map((cat, catIdx) => (
             <div key={cat.id} className="border border-[#E2E8F0] dark:border-[#22304A] p-4 rounded-2xl bg-[#F4F7FB]/60 dark:bg-[#0B1120]/50">
               <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <div className="flex flex-col">
                        {catIdx > 0 && <button onClick={() => handleMoveCategory(catIdx, 'up')} className="p-0.5 text-[#64748B] hover:text-[#6366F1]"><ArrowUp size={14} strokeWidth={1.75}/></button>}
                        {catIdx < editedField.categories.length - 1 && <button onClick={() => handleMoveCategory(catIdx, 'down')} className="p-0.5 text-[#64748B] hover:text-[#6366F1]"><ArrowDown size={14} strokeWidth={1.75}/></button>}
                      </div>
                      <input value={cat.name} onChange={(e) => { const newCats = editedField.categories.map(c => c.id === cat.id ? {...c, name: e.target.value} : c); setEditedField({...editedField, categories: newCats}); }} className="font-bold bg-transparent border-b border-[#E2E8F0] dark:border-[#22304A] focus:outline-none text-[#0F172A] dark:text-[#E5E9F0] flex-1"/>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => handleToggleCategoryHalf(cat.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${cat.isHalf ? fieldStyle.badgeClass : 'bg-[#E2E8F0]/40 text-[#64748B] dark:text-[#8B96A8] border-[#E2E8F0] dark:border-[#22304A]'}`}
                    >
                      {cat.isHalf ? 'Categoría al 50%' : 'Categoría al 100%'}
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} strokeWidth={1.75}/></button>
                  </div>
               </div>

               <div className="pl-4 space-y-2.5">
                  {cat.subcategories.map((sub, subIdx) => {
                    const isSubHalf = sub.isHalf === true || (sub.isHalf !== false && cat.isHalf === true);
                    return (
                      <div key={sub.id} className="flex items-center gap-2">
                        <div className="flex flex-col">
                           {subIdx > 0 && <button onClick={() => handleMoveSub(catIdx, subIdx, 'up')} className="p-0.5 text-[#64748B] hover:text-[#6366F1]"><ArrowUp size={12} strokeWidth={1.75}/></button>}
                           {subIdx < cat.subcategories.length - 1 && <button onClick={() => handleMoveSub(catIdx, subIdx, 'down')} className="p-0.5 text-[#64748B] hover:text-[#6366F1]"><ArrowDown size={12} strokeWidth={1.75}/></button>}
                        </div>
                        <input value={sub.name} onChange={(e) => { const newCats = editedField.categories.map(c => { if(c.id === cat.id) { return {...c, subcategories: c.subcategories.map(s => s.id === sub.id ? {...s, name: e.target.value}: s)} } return c; }); setEditedField({...editedField, categories: newCats}); }} className="flex-1 text-sm bg-transparent border-b border-[#E2E8F0] dark:border-[#22304A] text-[#0F172A] dark:text-[#E5E9F0] focus:border-[#6366F1] outline-none"/>
                        
                        <button
                          type="button"
                          onClick={() => handleToggleSubHalf(cat.id, sub.id)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${isSubHalf ? fieldStyle.badgeClass : 'bg-[#E2E8F0]/30 text-[#64748B] border-[#E2E8F0] dark:bg-[#22304A]/30 dark:text-[#8B96A8] dark:border-[#22304A]'}`}
                        >
                          {isSubHalf ? '50%' : '100%'}
                        </button>
                        <button onClick={() => handleDeleteSub(cat.id, sub.id)} className="text-red-400 hover:text-red-600 p-1"><X size={14} strokeWidth={1.75}/></button>
                      </div>
                    );
                  })}
                  <button onClick={() => handleAddSub(cat.id, cat.isHalf)} className="text-xs text-[#6366F1] dark:text-[#818CF8] hover:underline flex items-center mt-2 font-bold"><Plus size={12} strokeWidth={1.75} className="mr-1"/> Añadir Subcategoría</button>
               </div>
             </div>
          ))}
          <button onClick={handleAddCategory} className="w-full py-3 border-2 border-dashed border-[#E2E8F0] dark:border-[#22304A] text-[#6366F1] dark:text-[#818CF8] font-bold rounded-2xl hover:bg-[#6366F1]/5 transition-colors">+ Añadir Categoría</button>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#22304A]">
            <button onClick={handleCancel} className="px-5 py-2.5 bg-[#E2E8F0]/40 dark:bg-[#22304A] rounded-2xl text-sm font-bold hover:bg-[#E2E8F0] transition text-[#0F172A] dark:text-[#E5E9F0]">Cancelar</button>
            <button onClick={handleSave} disabled={isOverLimit} className={`px-6 py-2.5 text-white rounded-2xl text-sm font-bold shadow-lg transition flex items-center gap-2 ${isOverLimit ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#6366F1] hover:bg-[#4F46E5]'}`}><Save size={18} strokeWidth={1.75}/> Guardar Cambios</button>
        </div>
      </div>
    );
  }

  // --- VISTA NORMAL ---
  return (
    <div className={`relative bg-white dark:bg-[#131B2E] rounded-3xl transition-all duration-250 ${percentUsed >= 100 && field.type !== 'savings' ? 'border-l-4 border-l-[#EF4444] dark:border-l-[#F87171]' : ''} card-shadow card-shadow-hover border border-black/5 dark:border-white/5`}>
      <div className="p-5 sm:p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setIsOpen(!isOpen)}>
            <div className={`w-11 h-11 rounded-xl ${fieldStyle.bgClass} flex items-center justify-center shrink-0`}>
              <FieldIcon size={22} strokeWidth={1.75} className={fieldStyle.colorClass} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-[#0F172A] dark:text-[#E5E9F0] flex items-center gap-2">{field.name}{alertIcon}</h3>
              <div className={`text-xs sm:text-sm ${statusColor} font-medium`}>{field.percentage}% del sueldo • <span className="font-mono tabular-nums">${formatNumberDisplay(budget)}</span></div>
            </div>
          </div>
          <div className="relative ml-2 flex items-center gap-1.5">
               <button onClick={() => setIsOpen(!isOpen)} className="text-[#64748B] dark:text-[#8B96A8] hover:bg-[#E2E8F0]/40 dark:hover:bg-[#22304A]/50 p-2 rounded-xl transition-colors">{isOpen ? <ChevronUp size={20} strokeWidth={1.75} /> : <ChevronDown size={20} strokeWidth={1.75} />}</button>
               <button onClick={() => setMenuOpen(!menuOpen)} className="text-[#64748B] dark:text-[#8B96A8] p-2 rounded-xl hover:bg-[#E2E8F0]/40 dark:hover:bg-[#22304A]/50 transition-colors"><MoreVertical size={20} strokeWidth={1.75} /></button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-48 bg-white dark:bg-[#131B2E] rounded-2xl card-shadow z-20 border border-black/5 dark:border-white/5 overflow-hidden">
                <button onClick={() => { setIsEditing(true); setMenuOpen(false); setIsOpen(true); }} className="block w-full text-left px-4 py-3 hover:bg-[#F4F7FB] dark:hover:bg-[#0B1120] text-sm text-[#0F172A] dark:text-[#E5E9F0] font-bold transition-colors border-b border-[#E2E8F0] dark:border-[#22304A]"><div className="flex items-center gap-2.5"><Pencil size={16} strokeWidth={1.75} className="text-[#64748B] dark:text-[#8B96A8]"/> Editar Campo</div></button>
                <button onClick={() => { setMenuOpen(false); onDeleteField(field.id); }} className="block w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm text-[#EF4444] dark:text-[#F87171] font-bold transition-colors"><div className="flex items-center gap-2.5"><Trash2 size={16} strokeWidth={1.75}/> Eliminar</div></button>
              </div>
            )}
          </div>
        </div>
        {field.type === 'standard' && ( <div className="mt-5"><div className="h-2 w-full bg-[#F4F7FB] dark:bg-[#0B1120] rounded-full overflow-hidden border border-[#E2E8F0]/60 dark:border-[#22304A]/60"><div className={`h-full ${progressBarColor} transition-all duration-500 ease-out`} style={{ width: `${Math.min(percentUsed, 100)}%` }}></div></div><div className="flex justify-between mt-2.5 text-xs font-bold tracking-wide uppercase"><span className="text-[#64748B] dark:text-[#8B96A8]">Gastado: <span className="text-[#0F172A] dark:text-[#E5E9F0] font-mono tabular-nums">${formatNumberDisplay(totalSpent)}</span></span><span className={`${remainingColor}`}>Restante: <span className="font-mono tabular-nums">${formatNumberDisplay(remaining)}</span></span></div></div>)}
        {field.type === 'savings' && ( <div className="mt-4 flex justify-between items-center text-sm font-bold p-3.5 bg-[#ECFDF5] dark:bg-[#10B981]/15 rounded-2xl border border-[#10B981]/20 dark:border-[#34D399]/30"><span className="text-[#10B981] dark:text-[#34D399]">Acumulado Total</span><span className="text-[#10B981] dark:text-[#34D399] font-mono tabular-nums font-bold text-lg">${formatNumberDisplay(totalSpent)}</span></div>)}
      </div>

      <div className={`transition-all duration-400 ease-in-out overflow-hidden ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
         <div className="p-5 sm:p-6 bg-[#F4F7FB]/70 dark:bg-[#0B1120]/70 border-t border-[#E2E8F0] dark:border-[#22304A] rounded-b-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {field.categories.map(cat => {
                const isCatCollapsed = collapsedCategories[cat.id] || false;
                
                // Total de la categoría
                const catTotal = cat.subcategories.reduce((acc, sub) => {
                  const raw = expenses[sub.id] || 0;
                  const isHalf = sub.isHalf === true || (sub.isHalf !== false && cat.isHalf === true);
                  return acc + (isHalf ? raw * 0.5 : raw);
                }, 0);

                return (
                  <div key={cat.id} className="bg-white dark:bg-[#131B2E] border border-black/5 dark:border-white/5 rounded-2xl p-3 sm:p-4 card-shadow">
                    
                    {/* Encabezado Desplegable / Contraíble de la Categoría */}
                    <div 
                      onClick={() => toggleCategoryCollapse(cat.id)}
                      className="flex flex-wrap sm:flex-nowrap justify-between items-center cursor-pointer select-none py-1.5 px-1 group gap-2"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                        <button className="text-[#64748B] dark:text-[#8B96A8] p-1 rounded-lg group-hover:bg-[#E2E8F0]/50 transition-all shrink-0">
                          {isCatCollapsed ? <Lucide.ChevronRight size={18} strokeWidth={1.75} /> : <ChevronDown size={18} strokeWidth={1.75} />}
                        </button>
                        <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#E5E9F0] uppercase tracking-wider">{cat.name}</h4>
                        {cat.isHalf && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${fieldStyle.badgeClass}`}>
                            50% Compartido
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto shrink-0 text-right">
                        <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-[#64748B] dark:text-[#8B96A8] whitespace-nowrap">
                          Subtotal: ${formatNumberDisplay(catTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Subcategorías Contraíbles */}
                    {!isCatCollapsed && (
                      <div className="space-y-3 mt-3 pt-3 border-t border-[#E2E8F0]/60 dark:border-[#22304A]/60 animate-in fade-in duration-150">
                        {cat.subcategories.map(sub => {
                           const isPaid = paidStatus[sub.id] || false;
                           const isSubHalf = sub.isHalf === true || (sub.isHalf !== false && cat.isHalf === true);
                           const rawNum = expenses[sub.id] || 0;
                           const effectiveNum = isSubHalf ? rawNum * 0.5 : rawNum;
                           
                           const displayValue = localInputs[sub.id] !== undefined ? localInputs[sub.id] : (rawNum ? formatNumberDisplay(rawNum) : '');
                           const displayValueUsd = localInputs[`usd_${sub.id}`] !== undefined ? localInputs[`usd_${sub.id}`] : (expensesUsd[sub.id] ? formatNumberDisplay(expensesUsd[sub.id]) : '');
                           
                           return (
                            <div key={sub.id} className="group bg-[#F4F7FB]/50 dark:bg-[#0B1120]/50 rounded-2xl p-2.5 sm:p-3.5 border border-[#E2E8F0]/60 dark:border-[#22304A]/60 flex items-center gap-2.5 sm:gap-3.5 transition-all hover:bg-white dark:hover:bg-[#131B2E]">
                              <button onClick={() => onTogglePaid(sub.id, !isPaid)} className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all ${isPaid ? 'bg-[#10B981] border-[#10B981] text-white shadow-md shadow-[#10B981]/20 scale-105' : 'border-[#CBD5E1] dark:border-[#22304A] text-transparent hover:border-[#6366F1]'}`}><Check size={14} strokeWidth={2.5} /></button>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline flex-wrap gap-1">
                                  <div className="flex items-center gap-1.5 truncate pr-1">
                                    <label className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#E5E9F0] truncate">{sub.name}</label>
                                    {isSubHalf && (
                                      <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-md ${fieldStyle.badgeClass}`} title="Importe contabilizado al 50%">
                                        50%
                                      </span>
                                    )}
                                  </div>
                                  {(sub.recurringAmount || 0) > 0 && (
                                    <span className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-[#8B96A8] bg-[#E2E8F0]/50 dark:bg-[#22304A]/50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                      <RefreshCw size={9} strokeWidth={1.75}/> Auto
                                    </span>
                                  )}
                                </div>
                                <div className="relative mt-0.5 flex items-baseline justify-between flex-wrap gap-x-2">
                                  <div className="relative flex-1 min-w-[100px]">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8B96A8] text-xs sm:text-sm font-bold font-mono pl-0.5">$</span>
                                    <input type="text" value={displayValue} onChange={(e) => handleInputChange(sub.id, e.target.value)} onBlur={() => handleBlur(sub.id)} placeholder="0" className="w-full bg-transparent border-none p-0 pl-4 text-xs sm:text-sm font-mono tabular-nums font-bold text-[#0F172A] dark:text-[#E5E9F0] placeholder:text-[#64748B]/40 focus:ring-0 focus:outline-none"/>
                                  </div>
                                  {isSubHalf && rawNum > 0 && (
                                    <span className="text-[10px] sm:text-xs font-mono tabular-nums font-bold text-[#6366F1] dark:text-[#818CF8] whitespace-nowrap">
                                      (cuenta: ${formatNumberDisplay(effectiveNum)})
                                    </span>
                                  )}
                                </div>
                              </div>
                              {field.id === 'f_investment' && ( <div className="w-20 sm:w-24 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-[#E2E8F0] dark:border-[#22304A] shrink-0"><div className="flex justify-between items-baseline"><label className="text-[9px] sm:text-[10px] font-bold text-[#10B981] dark:text-[#34D399] tracking-wide">USD</label></div><div className="relative mt-0.5"><span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8B96A8] text-[10px] sm:text-xs font-bold font-mono">US$</span><input type="text" value={displayValueUsd} onChange={(e) => handleInputChange(sub.id, e.target.value, true)} onBlur={() => handleBlur(sub.id, true)} placeholder="0" className="w-full bg-transparent border-none p-0 pl-6 sm:pl-7 text-xs sm:text-sm font-mono tabular-nums font-bold text-[#0F172A] dark:text-[#E5E9F0] placeholder:text-[#64748B]/40 focus:outline-none"/></div></div>)}
                            </div>
                           );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {field.type !== 'savings' && (
                <div className="mt-6 pt-4 border-t-2 border-dashed border-[#E2E8F0] dark:border-[#22304A]">
                    <h4 className="text-xs font-bold text-[#64748B] dark:text-[#8B96A8] uppercase tracking-widest mb-3">Extras / Otros</h4>
                    <div className="space-y-2 mb-3">{(extras[field.id] || []).map((extra) => (<div key={extra.id} className="flex items-center gap-3 bg-white dark:bg-[#131B2E] p-2.5 rounded-xl border border-black/5 dark:border-white/5 card-shadow"><span className="text-[#0F172A] dark:text-[#E5E9F0] text-sm flex-1 font-bold pl-1 break-all">{extra.description}</span><span className="font-mono tabular-nums text-[#0F172A] dark:text-[#E5E9F0] font-bold text-sm">${formatNumberDisplay(extra.amount)}</span><button onClick={() => onDeleteExtra(field.id, extra.id)} className="text-[#64748B] dark:text-[#8B96A8] hover:text-[#EF4444] p-1 transition-colors"><X size={16} strokeWidth={1.75}/></button></div>))}</div>
                    <div className="flex gap-2 bg-white dark:bg-[#131B2E] p-2 rounded-2xl border border-black/5 dark:border-white/5 card-shadow">
                        <input placeholder="Descripción..." value={extraDesc} onChange={e => setExtraDesc(e.target.value)} className="flex-1 min-w-0 bg-transparent px-3 py-1 text-sm text-[#0F172A] dark:text-[#E5E9F0] font-bold focus:outline-none placeholder:text-[#64748B]/50"/>
                        <div className="w-px bg-[#E2E8F0] dark:bg-[#22304A] my-1"></div>
                        <input type="text" placeholder="$ 0" value={extraAmount} onChange={e => handleExtraAmountChange(e.target.value)} className="w-24 bg-transparent px-2 py-1 text-sm text-[#0F172A] dark:text-[#E5E9F0] font-mono tabular-nums font-bold focus:outline-none text-right placeholder:text-[#64748B]/50"/>
                        <button onClick={() => { const parsedAmount = parseNumberInput(extraAmount); if(extraDesc && parsedAmount > 0) { onAddExtra(field.id, extraDesc, parsedAmount); setExtraDesc(''); setExtraAmount(''); }}} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl px-3.5 py-1.5 transition-colors font-bold flex items-center justify-center"><Plus size={18} strokeWidth={1.75} /></button></div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default FieldAccordion;