import React, { useState, useEffect } from 'react';
import { Moon, Sun, HelpCircle, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onMoneyClick?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme, onMoneyClick }) => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={theme}>
      <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#E5E9F0] font-sans transition-colors duration-250">
        
        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-[#131B2E] w-full max-w-lg rounded-3xl card-shadow border border-black/5 dark:border-white/5 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-[#E2E8F0] dark:border-[#22304A] flex justify-between items-center bg-[#F4F7FB] dark:bg-[#0B1120]">
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#E5E9F0]">¿Cómo funciona la app?</h2>
                <button onClick={() => setShowHelp(false)} className="p-1.5 text-[#64748B] dark:text-[#8B96A8] hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-[#22304A] transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-[#64748B] dark:text-[#8B96A8]">
                <section className="bg-[#F4F7FB] dark:bg-[#0B1120] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#22304A]">
                  <h3 className="text-[#6366F1] dark:text-[#818CF8] font-bold text-base mb-1">Gastos para Vivir (50%)</h3>
                  <p className="text-xs sm:text-sm">
                    Destinado a cubrir todo lo esencial para tu día a día: vivienda, comida, transporte, servicios, salud y cualquier gasto necesario.
                  </p>
                </section>
                <section className="bg-[#F4F7FB] dark:bg-[#0B1120] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#22304A]">
                  <h3 className="text-[#10B981] dark:text-[#34D399] font-bold text-base mb-1">Inversión (25%)</h3>
                  <p className="text-xs sm:text-sm">
                    Para hacer crecer tu patrimonio o tus habilidades: inversiones financieras, proyectos o educación profesional.
                  </p>
                </section>
                <section className="bg-[#F4F7FB] dark:bg-[#0B1120] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#22304A]">
                  <h3 className="text-[#F59E0B] dark:text-[#FBBF24] font-bold text-base mb-1">Disfrute (15%)</h3>
                  <p className="text-xs sm:text-sm">
                    Para disfrutar sin culpa: salidas, viajes, pasatiempos, compras o gustos personales.
                  </p>
                </section>
                <section className="bg-[#F4F7FB] dark:bg-[#0B1120] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#22304A]">
                  <h3 className="text-[#64748B] dark:text-[#8B96A8] font-bold text-base mb-1">Fondo de Seguridad (10%)</h3>
                  <p className="text-xs sm:text-sm">
                    Un colchón para emergencias médicas, reparaciones imprevistas u contingencias financieras.
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#F4F7FB]/90 dark:bg-[#0B1120]/90 backdrop-blur-xl border-b border-[#E2E8F0] dark:border-[#22304A] px-4 py-3.5 transition-colors">
          <div className="max-w-4xl md:max-w-6xl xl:max-w-7xl mx-auto flex justify-between items-center">
            
            {/* Título y Billete */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#6366F1] dark:bg-[#818CF8] flex items-center justify-center shadow-md shadow-[#6366F1]/20">
                <span className="text-white dark:text-[#0B1120] text-base font-extrabold font-sans">F</span>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-[#0F172A] dark:text-[#E5E9F0] tracking-tight">
                Finanzas Personales
              </h1>
              <button 
                onClick={onMoneyClick} 
                className="text-2xl hover:scale-125 active:scale-90 transition-transform cursor-pointer ml-0.5"
                title="Lluvia de dinero"
              >
                💵
              </button>
            </div>

            {/* Botones de Ayuda y Tema */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setShowHelp(true)}
                className="p-2 text-[#64748B] dark:text-[#8B96A8] hover:text-[#0F172A] dark:hover:text-[#E5E9F0] hover:bg-[#E2E8F0]/50 dark:hover:bg-[#22304A]/50 rounded-xl transition-all active:scale-95"
                title="Ayuda"
              >
                <HelpCircle size={20} strokeWidth={1.75} />
              </button>
              <button 
                onClick={toggleTheme} 
                className="p-2 bg-white dark:bg-[#131B2E] text-[#0F172A] dark:text-[#E5E9F0] hover:bg-[#F4F7FB] dark:hover:bg-[#0B1120] rounded-xl border border-black/5 dark:border-white/5 card-shadow transition-all active:scale-95"
                title="Cambiar tema"
              >
                {theme === 'dark' ? <Sun size={20} strokeWidth={1.75} className="text-[#FBBF24]" /> : <Moon size={20} strokeWidth={1.75} className="text-[#6366F1]" />}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl md:max-w-6xl xl:max-w-7xl mx-auto p-4 sm:p-6 pb-28">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;