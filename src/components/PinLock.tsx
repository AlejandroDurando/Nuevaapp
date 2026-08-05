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
    <div className="fixed inset-0 bg-[#080D1A] text-[#F4FEFF] z-[200] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300 font-sans">
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-[#0E2F76] p-4.5 rounded-3xl mb-4 shadow-xl shadow-[#0E2F76]/40 border border-[#A9C0E0]/30">
          {mode === 'setup' ? <Unlock size={32} className="text-[#F4FEFF]" /> : <Lock size={32} className="text-[#F4FEFF]" />}
        </div>
        <h2 className="text-2xl font-black tracking-tight text-[#F4FEFF]">
          {step === 'enter' && 'Ingresa tu PIN'}
          {step === 'create' && 'Crea un PIN de 4 dígitos'}
          {step === 'confirm' && 'Confirma tu PIN'}
        </h2>
        <p className="text-[#A9C0E0] mt-2 h-6 text-sm font-semibold">{error}</p>
      </div>

      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              i < input.length ? 'bg-[#F4FEFF] border-[#F4FEFF] scale-125 shadow-md shadow-[#F4FEFF]/50' : 'border-[#1E2D4A]'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNum(num.toString())}
            className="h-20 rounded-3xl bg-[#0F1A30] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-3xl font-black text-[#F4FEFF] transition-all flex items-center justify-center active:scale-95 shadow-md"
          >
            {num}
          </button>
        ))}
        <div className="flex items-center justify-center">
            {onCancel && (
                <button onClick={onCancel} className="text-xs text-[#A9C0E0] font-extrabold uppercase tracking-wider hover:text-white">Cancelar</button>
            )}
        </div>
        <button
          onClick={() => handleNum('0')}
          className="h-20 rounded-3xl bg-[#0F1A30] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-3xl font-black text-[#F4FEFF] transition-all flex items-center justify-center active:scale-95 shadow-md"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-20 rounded-3xl hover:bg-red-500/20 text-red-400 transition-all flex items-center justify-center active:scale-95"
        >
          <Delete size={28} />
        </button>
      </div>
    </div>
  );
};

export default PinLock;