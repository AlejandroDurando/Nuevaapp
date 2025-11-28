import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Field } from '../types';
import { ArrowLeft } from 'lucide-react';

interface BudgetChartsProps {
  fields: Field[];
  salary: number;
  expenses: Record<string, number>;
  extras: Record<string, { amount: number; fieldId: string }[]>;
  theme: 'light' | 'dark';
  viewMode: 'pie' | 'bar';
  onBack: () => void;
}

const COLORS = {
  blue: '#3b82f6',
  purple: '#a855f7',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
  orange: '#f97316',
  gray: '#6b7280'
};

const BudgetCharts: React.FC<BudgetChartsProps> = ({ fields, salary, expenses, extras, theme, viewMode, onBack }) => {
  
  // Prepare Data
  const data = fields.map(field => {
    const budget = (salary * field.percentage) / 100;
    
    const subTotal = Object.keys(expenses).reduce((acc, key) => {
      const isForThisField = field.categories.some(c => c.subcategories.some(s => s.id === key));
      return isForThisField ? acc + (expenses[key] || 0) : acc;
    }, 0);

    const extraTotal = (extras[field.id] || []).reduce((acc, item) => acc + item.amount, 0);
    const spent = subTotal + extraTotal;

    return {
      name: field.name,
      budget: budget,
      spent: spent,
      color: COLORS[field.color as keyof typeof COLORS] || '#8884d8'
    };
  }).filter(d => d.budget > 0 || d.spent > 0);

  const textColor = theme === 'dark' ? '#E0E0E0' : '#374151';
  const tooltipStyle = { 
    backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF', 
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    color: textColor
  };

  const formatMoney = (val: number) => val.toLocaleString('es-AR');

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border dark:border-gray-700 p-4 min-h-[50vh]">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack} 
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold dark:text-white">
          {viewMode === 'pie' ? 'Distribución de Gastos' : 'Presupuesto vs Realidad'}
        </h2>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="spent"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => `$${formatMoney(val)}`} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </PieChart>
          ) : (
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: textColor, fontSize: 12 }} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={tooltipStyle} formatter={(val: number) => `$${formatMoney(val)}`} />
              <Bar dataKey="budget" name="Presupuesto" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
              <Bar dataKey="spent" name="Gastado" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={15} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetCharts;