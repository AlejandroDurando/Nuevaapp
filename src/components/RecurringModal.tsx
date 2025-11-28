import React, { useState } from 'react';
import { Subcategory } from '../types';
import { Check, X } from 'lucide-react';

interface RecurringItem {
  subId: string;
  name: string;
  categoryName: string;
  fieldName: string;
  amount: number;
}

interface RecurringModalProps {
  items: RecurringItem[];
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

const RecurringModal: React.FC<RecurringModalProps> = ({ items, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<string[]>(items.map(i => i.subId));

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border dark:border-gray-700 flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">Gastos Recurrentes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Se han detectado gastos recurrentes configurados. ¿Deseas aplicarlos a este mes?
          </p>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {items.map(item => (
            <div 
              key={item.subId}
              onClick={() => toggle(item.subId)}
              className={`flex items-center p-3 mb-2 rounded-lg border cursor-pointer transition-all ${
                selected.includes(item.subId) 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                selected.includes(item.subId) ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
              }`}>
                {selected.includes(item.subId) && <Check size={12} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className="font-semibold dark:text-white">{item.name}</div>
                <div className="text-xs text-gray-500">{item.fieldName} • {item.categoryName}</div>
              </div>
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                ${item.amount.toLocaleString('es-AR')}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
          >
            Omitir
          </button>
          <button 
            onClick={() => onConfirm(selected)}
            className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringModal;