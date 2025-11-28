import React, { useState } from 'react';
import { Moon, Sun, HelpCircle, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onMoneyClick?: () => void; // <--- NUEVA PROPIEDAD
}

const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme, onMoneyClick }) => {
  const [showHelp, setShowHelp] = useState(false);

  // Determinar si es modo claro
  const isLight = theme === 'light';

  return (
    <div className={theme}>
      <div 
        style={{ backgroundImage: isLight ? 'none' : undefined, backgroundColor: isLight ? '#f3f4f6' : undefined }}
        className="min-h-screen bg-gray-100 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-300"
      >
        
        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-2xl shadow-2xl border dark:border-gray-700 max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">¿Cómo funciona la app?</h2>
                <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-red-500">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                <section>
                  <h3 className="text-blue-500 font-bold text-lg mb-2">Gastos para Vivir (50%)</h3>
                  <p>
                    "Esta parte de tu sueldo está destinada a cubrir todo lo esencial para tu día a día. Incluye vivienda, comida, transporte, servicios, salud, educación y cualquier gasto necesario para mantener tu calidad de vida."
                  </p>
                </section>
                <section>
                  <h3 className="text-purple-500 font-bold text-lg mb-2">Inversión (25%)</h3>
                  <p>
                    "Este porcentaje se asigna a todo aquello que pueda hacer crecer tu dinero o tus habilidades. Podés usarlo para inversiones tradicionales, oportunidades de negocio o formación profesional."
                  </p>
                </section>
                <section>
                  <h3 className="text-pink-500 font-bold text-lg mb-2">Disfrute (15%)</h3>
                  <p>
                    "Este porcentaje es para vos, para que puedas disfrutar sin culpa. Incluye salidas, viajes, hobbies, ropa, tecnología, o cualquier gusto personal."
                  </p>
                </section>
                <section>
                  <h3 className="text-green-500 font-bold text-lg mb-2">Fondo de Seguridad (10%)</h3>
                  <p>
                    "Este monto está pensado como un colchón para imprevistos. Sirve para emergencias médicas, reparaciones del hogar o gastos urgentes."
                  </p>
                </section>
                <div className="pt-4 text-xs text-gray-500 italic text-center border-t dark:border-gray-800">
                  *Podés editar los porcentajes a tu gusto en la sección "Editar" de cada categoría.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            
            {/* Título y Billete (Ahora juntos en el flujo) */}
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 truncate">
                Finanzas Personales
              </h1>
              {/* EL BILLETE AHORA ESTÁ AQUÍ, NO FLOTANDO */}
              <button 
                onClick={onMoneyClick} 
                className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                title="Lluvia de dinero"
              >
                💵
              </button>
            </div>

            {/* Botones de Ayuda y Tema */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setShowHelp(true)}
                className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <HelpCircle size={20} />
              </button>
              <button 
                onClick={toggleTheme} 
                className="p-2 bg-gray-200 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400 rounded-full transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto p-4 pb-24">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;