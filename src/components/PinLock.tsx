import React, { useState, useEffect } from 'react';
import { Delete, Lock, Unlock } from 'lucide-react';

interface PinLockProps {
  mode: 'unlock' | 'setup';
  onSuccess: (pin: string) => void;
  onCancel?: () => void;
  storedPin?: string;
}

const PinLock: React.FC<PinLockProps> = ({ mode, onSuccess, onCancel, storedPin }) => {
  const [input, setInput] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'enter' | 'create' | 'confirm'>(mode === 'unlock' ? 'enter' : 'create');
  const [error, setError] = useState('');

  const handleNum = (num: string) => {
    if (input.length < 4) {
      const newVal = input + num;
      setInput(newVal);
      setError('');
    }
  };

  const handleDelete = () => {
    setInput(input.slice(0, -1));
    setError('');
  };

  // Verificar automáticamente al llegar a 4 dígitos
  useEffect(() => {
    if (input.length === 4) {
      if (step === 'enter') {
        if (input === storedPin) {
          onSuccess(input);
        } else {
          setError('PIN Incorrecto');
          setTimeout(() => setInput(''), 500);
        }
      } else if (step === 'create') {
        setConfirm(input);
        setInput('');
        setStep('confirm');
      } else if (step === 'confirm') {
        if (input === confirm) {
          onSuccess(input);
        } else {
          setError('No coinciden. Intenta de nuevo.');
          setConfirm('');
          setInput('');
          setStep('create');
        }
      }
    }
  }, [input, step, storedPin, confirm, onSuccess]);

  return (
    <div className="fixed inset-0 bg-gray-900 text-white z-[200] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-blue-600 p-4 rounded-full mb-4 shadow-lg shadow-blue-500/50">
          {mode === 'setup' ? <Unlock size={32} /> : <Lock size={32} />}
        </div>
        <h2 className="text-2xl font-bold">
          {step === 'enter' && 'Ingresa tu PIN'}
          {step === 'create' && 'Crea un PIN de 4 dígitos'}
          {step === 'confirm' && 'Confirma tu PIN'}
        </h2>
        <p className="text-gray-400 mt-2 h-6 text-sm">{error}</p>
      </div>

      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              i < input.length ? 'bg-blue-500 border-blue-500 scale-110' : 'border-gray-600'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNum(num.toString())}
            className="h-20 rounded-2xl bg-gray-800 hover:bg-gray-700 text-3xl font-bold transition-colors flex items-center justify-center active:scale-95"
          >
            {num}
          </button>
        ))}
        <div className="flex items-center justify-center">
            {onCancel && (
                <button onClick={onCancel} className="text-sm text-gray-400 font-bold uppercase tracking-wider">Cancelar</button>
            )}
        </div>
        <button
          onClick={() => handleNum('0')}
          className="h-20 rounded-2xl bg-gray-800 hover:bg-gray-700 text-3xl font-bold transition-colors flex items-center justify-center active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-20 rounded-2xl hover:bg-red-900/30 text-red-400 transition-colors flex items-center justify-center active:scale-95"
        >
          <Delete size={28} />
        </button>
      </div>
    </div>
  );
};

export default PinLock;