import React, { useState, useEffect } from 'react';
import { Field, Category, Subcategory } from '../types';
import { ICON_MAP, COLORS } from '../constants';
import * as Lucide from 'lucide-react';
import { Pencil, Trash2, Plus, Check, X, MoreVertical, Save, ChevronDown, ChevronUp, AlertTriangle, RefreshCw } from 'lucide-react';

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

const formatNumberDisplay = (val: number | undefined): string => {
  if (val === undefined || val === null || val === 0) return '';
  return val.toLocaleString('es-AR');
};

const parseNumberInput = (val: string): number => {
  const clean = val.replace(/\./g, '').replace(/,/g, '.');
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

  useEffect(() => {
    if (defaultEditing) {
      setIsOpen(true);
      setIsEditing(true);
    }
  }, [defaultEditing]);

  const budget = (salary * field.percentage) / 100;
  const subTotal = Object.keys(expenses).reduce((acc, key) => {
    const isForThisField = field.categories.some(c => c.subcategories.some(s => s.id === key));
    return isForThisField ? acc + (expenses[key] || 0) : acc;
  }, 0);
  const extraTotal = (extras[field.id] || []).reduce((acc, item) => acc + item.amount, 0);
  const totalSpent = subTotal + extraTotal;
  const remaining = budget - totalSpent;
  const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;
  
  // LOGICA DE VALIDACIÓN DE PORCENTAJE
  const otherFieldsTotal = totalAllocatedPercentage - field.percentage;
  const projectedTotal = otherFieldsTotal + editedField.percentage;
  const isOverLimit = projectedTotal > 100;
  const availableSpace = 100 - otherFieldsTotal;

  // Colores y Alertas
  let progressBarColor = 'bg-blue-500';
  let statusColor = 'text-gray-500 dark:text-gray-400';
  let alertIcon = null;

  if (field.type === 'standard') {
    if (percentUsed >= (field.alertThreshold || 80) && percentUsed < 100) {
      progressBarColor = 'bg-yellow-500';
      statusColor = 'text-yellow-600 dark:text-yellow-500';
      alertIcon = <AlertTriangle size={16} className="text-yellow-500" />;
    } else if (percentUsed >= 100) {
      progressBarColor = 'bg-red-500';
      statusColor = 'text-red-600 dark:text-red-400';
      alertIcon = <AlertTriangle size={16} className="text-red-500 animate-pulse" />;
    }
  } else if (field.type === 'savings' && percentUsed >= 100) {
    progressBarColor = 'bg-green-500';
    statusColor = 'text-green-600 dark:text-green-400 font-bold';
  }
  let remainingColor = remaining < 0 ? 'text-red-500' : 'text-green-500';
  const IconComponent = ICON_MAP[field.icon] || Lucide.HelpCircle;

  // Handlers
  const handleSave = () => { 
      if (!isOverLimit) {
          onSaveField(editedField); 
          setIsEditing(false); 
      }
  };
  const handleCancel = () => { setEditedField(JSON.parse(JSON.stringify(field))); setIsEditing(false); };
  
  const handleAddCategory = () => {
    const newCat: Category = { id: `c_${Date.now()}`, name: 'Nueva Categoría', subcategories: [] };
    setEditedField({ ...editedField, categories: [...editedField.categories, newCat] });
  };
  const handleDeleteCategory = (catId: string) => {
    setEditedField({ ...editedField, categories: editedField.categories.filter(c => c.id !== catId) });
  };
  const handleAddSub = (catId: string) => {
    const newSub: Subcategory = { id: `s_${Date.now()}`, name: 'Nuevo Item', recurringAmount: 0 };
    const newCats = editedField.categories.map(c => c.id === catId ? { ...c, subcategories: [...c.subcategories, newSub] } : c);
    setEditedField({ ...editedField, categories: newCats });
  };
  const handleDeleteSub = (catId: string, subId: string) => {
    const newCats = editedField.categories.map(c => c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c);
    setEditedField({ ...editedField, categories: newCats });
  };

  const handleSubExpenseChange = (subId: string, val: string) => onUpdateExpense(subId, parseNumberInput(val));
  const handleSubExpenseUsdChange = (subId: string, val: string) => onUpdateExpenseUsd(subId, parseNumberInput(val));
  const handleExtraAmountChange = (val: string) => setExtraAmount(val === '' ? '' : formatNumberDisplay(parseNumberInput(val)));

  if (isEditing) {
    return (
      <div className={`bg-white dark:bg-dark-card rounded-2xl shadow-xl p-6 border-2 relative mt-4 mb-4 animate-in fade-in zoom-in duration-200 ${isOverLimit ? 'border-red-500' : 'border-blue-500'}`}>
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold dark:text-white flex items-center gap-2"><Pencil size={18} /> Editando Campo</h3>
          <div className="flex gap-2">
            <button onClick={handleCancel} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition">Cancelar</button>
            <button 
                onClick={handleSave} 
                disabled={isOverLimit}
                className={`px-3 py-1.5 text-white rounded-lg text-sm font-bold shadow-md transition flex items-center gap-1 ${isOverLimit ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                <Save size={16}/> Guardar
            </button>
          </div>
        </div>

        {isOverLimit && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-bold flex items-center gap-2">
                <AlertTriangle size={18}/>
                ¡Error! El total supera el 100% ({projectedTotal}%). Máximo disponible: {availableSpace}%
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                    <input type="text" value={editedField.name} onChange={e => setEditedField({...editedField, name: e.target.value})} className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:text-white"/>
                </div>
                
                {/* --- CAMBIO AQUÍ: Input de Porcentaje corregido --- */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Porcentaje %</label>
                    <input 
                        type="number" 
                        // SI ES 0, MOSTRAMOS VACÍO PARA PODER ESCRIBIR CÓMODAMENTE
                        value={editedField.percentage === 0 ? '' : editedField.percentage} 
                        onChange={e => setEditedField({...editedField, percentage: Number(e.target.value)})} 
                        placeholder="0"
                        className={`w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:text-white ${isOverLimit ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                    />
                    <div className="text-xs text-gray-400 mt-1">Disponible: {availableSpace}%</div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => (
                            <button key={c} onClick={() => setEditedField({...editedField, color: c})} className={`w-6 h-6 rounded-full bg-${c}-500 ${editedField.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'}`} />
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icono</label>
                    <div className="flex flex-wrap gap-2 h-20 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        {Object.keys(ICON_MAP).map(key => {
                            const Ico = ICON_MAP[key];
                            return (
                                <button key={key} onClick={() => setEditedField({...editedField, icon: key})} className={`p-1.5 rounded ${editedField.icon === key ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                    <Ico size={18} />
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Estructura</label>
          {editedField.categories.map(cat => (
             <div key={cat.id} className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
               <div className="flex justify-between items-center mb-2">
                  <input value={cat.name} onChange={(e) => { const newCats = editedField.categories.map(c => c.id === cat.id ? {...c, name: e.target.value} : c); setEditedField({...editedField, categories: newCats}); }} className="font-bold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none dark:text-white"/>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
               </div>
               <div className="pl-4 space-y-2">
                  {cat.subcategories.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <input value={sub.name} onChange={(e) => { const newCats = editedField.categories.map(c => { if(c.id === cat.id) { return {...c, subcategories: c.subcategories.map(s => s.id === sub.id ? {...s, name: e.target.value}: s)} } return c; }); setEditedField({...editedField, categories: newCats}); }} className="flex-1 text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 dark:text-gray-300 focus:border-blue-500"/>
                      <button onClick={() => handleDeleteSub(cat.id, sub.id)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                    </div>
                  ))}
                  <button onClick={() => handleAddSub(cat.id)} className="text-xs text-blue-500 hover:text-blue-600 flex items-center mt-2 font-medium"><Plus size={12} className="mr-1"/> Añadir Subcategoría</button>
               </div>
             </div>
          ))}
          <button onClick={handleAddCategory} className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 rounded hover:border-blue-500 hover:text-blue-500 transition-colors">+ Añadir Categoría</button>
        </div>
      </div>
    );
  }

  // Vista Normal
  return (
    <div className={`relative bg-white dark:bg-dark-card rounded-2xl transition-all duration-300 ${percentUsed >= 100 && field.type !== 'savings' ? 'border-l-4 border-l-red-500' : ''} shadow-sm border-b-4 border-b-gray-200 dark:border-b-gray-900 border-t border-r border-l border-gray-100 dark:border-gray-800`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setIsOpen(!isOpen)}>
            <div className={`p-3.5 rounded-xl bg-${field.color}-500/10 text-${field.color}-500 shadow-sm border border-${field.color}-100 dark:border-${field.color}-900/30`}><IconComponent size={26} /></div>
            <div className="flex-1">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">{field.name}{alertIcon}</h3>
              <div className={`text-sm ${statusColor} font-medium`}>{field.percentage}% del sueldo • {formatNumberDisplay(budget)}</div>
            </div>
          </div>
          <div className="relative ml-2 flex items-center gap-2">
               <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg transition-colors">{isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
               <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><MoreVertical size={20} /></button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-20 border border-gray-100 dark:border-gray-700 overflow-hidden ring-1 ring-black/5">
                <button onClick={() => { setIsEditing(true); setMenuOpen(false); setIsOpen(true); }} className="block w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm dark:text-white transition-colors border-b border-gray-100 dark:border-gray-700"><div className="flex items-center gap-2"><Pencil size={16} className="text-blue-500"/> Editar Campo</div></button>
                <button onClick={() => onDeleteField(field.id)} className="block w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500 transition-colors"><div className="flex items-center gap-2"><Trash2 size={16}/> Eliminar</div></button>
              </div>
            )}
          </div>
        </div>
        {field.type === 'standard' && (
          <div className="mt-5">
             <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner"><div className={`h-full ${progressBarColor} transition-all duration-700 ease-out`} style={{ width: `${Math.min(percentUsed, 100)}%` }}></div></div>
             <div className="flex justify-between mt-2 text-xs font-bold tracking-wide uppercase"><span className="text-gray-500 dark:text-gray-400">Gastado: <span className="text-gray-700 dark:text-white">{formatNumberDisplay(totalSpent)}</span></span><span className={`${remainingColor}`}>Restante: {formatNumberDisplay(remaining)}</span></div>
          </div>
        )}
        {field.type === 'savings' && ( <div className="mt-4 flex justify-between text-sm font-semibold p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30"><span className="text-green-600 dark:text-green-400">Acumulado Total</span><span className="text-green-700 dark:text-green-300 font-mono text-lg">{formatNumberDisplay(totalSpent)}</span></div>)}
      </div>

      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
         <div className="p-5 bg-gray-50/80 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl">
            {field.categories.map(cat => (
              <div key={cat.id} className="mb-6 last:mb-0">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">{cat.name}</h4>
                <div className="space-y-3">
                  {cat.subcategories.map(sub => {
                     const isPaid = paidStatus[sub.id] || false;
                     const displayValue = expenses[sub.id] ? formatNumberDisplay(expenses[sub.id]) : '';
                     const displayValueUsd = expensesUsd[sub.id] ? formatNumberDisplay(expensesUsd[sub.id]) : '';
                     const isInvestment = field.id === 'f_investment';
                     return (
                      <div key={sub.id} className="group bg-white dark:bg-dark-card rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-shadow hover:shadow-md">
                        <button onClick={() => onTogglePaid(sub.id, !isPaid)} className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${isPaid ? 'bg-green-500 border-green-500 text-white shadow-green-500/30 shadow-lg scale-105' : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-blue-400'}`}><Check size={16} strokeWidth={3} /></button>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate pr-2">{sub.name}</label>
                            {(sub.recurringAmount || 0) > 0 && ( <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full flex items-center gap-1"><RefreshCw size={8}/> Auto</span>)}
                          </div>
                          <div className="relative mt-1">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pl-2">$</span>
                            <input type="text" value={displayValue} onChange={(e) => handleSubExpenseChange(sub.id, e.target.value)} placeholder="0" className="w-full bg-transparent border-none p-0 pl-6 text-base font-semibold text-gray-900 dark:text-white placeholder-gray-300 focus:ring-0 focus:outline-none"/>
                          </div>
                        </div>
                        {isInvestment && ( <div className="w-24 ml-2 pl-3 border-l border-gray-100 dark:border-gray-700"><div className="flex justify-between items-baseline"><label className="text-[10px] font-bold text-green-600 dark:text-green-400 tracking-wide">USD</label></div><div className="relative mt-1"><span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">US$</span><input type="text" value={displayValueUsd} onChange={(e) => handleSubExpenseUsdChange(sub.id, e.target.value)} placeholder="0" className="w-full bg-transparent border-none p-0 pl-7 text-sm font-mono font-medium text-gray-700 dark:text-gray-300 placeholder-gray-300 focus:outline-none"/></div></div>)}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {field.type !== 'savings' && (
                <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Extras / Otros</h4>
                    <div className="space-y-2 mb-3">{(extras[field.id] || []).map((extra) => (<div key={extra.id} className="flex items-center gap-3 bg-white dark:bg-dark-card p-2 rounded-lg border border-gray-100 dark:border-gray-800"><span className="text-gray-600 dark:text-gray-300 text-sm flex-1 font-medium pl-1">{extra.description}</span><span className="font-mono text-gray-800 dark:text-white font-bold text-sm">{formatNumberDisplay(extra.amount)}</span><button onClick={() => onDeleteExtra(field.id, extra.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors"><X size={16}/></button></div>))}</div>
                    <div className="flex gap-2 bg-white dark:bg-dark-card p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"><input placeholder="Descripción..." value={extraDesc} onChange={e => setExtraDesc(e.target.value)} className="flex-1 bg-transparent px-2 py-1 text-sm dark:text-white focus:outline-none"/><div className="w-px bg-gray-200 dark:bg-gray-700 mx-1"></div><input type="text" placeholder="$ 0" value={extraAmount} onChange={e => handleExtraAmountChange(e.target.value)} className="w-24 bg-transparent px-2 py-1 text-sm dark:text-white font-mono focus:outline-none text-right"/><button onClick={() => { const parsedAmount = parseNumberInput(extraAmount); if(extraDesc && parsedAmount > 0) { onAddExtra(field.id, extraDesc, parsedAmount); setExtraDesc(''); setExtraAmount(''); }}} className="bg-blue-600 text-white rounded-lg px-3 hover:bg-blue-700 transition-colors"><Plus size={18} /></button></div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default FieldAccordion;