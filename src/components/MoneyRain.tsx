import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Bill {
  id: number;
  left: number;       // Horizontal position (0-100%)
  duration: number;   // Animation duration (2-4s)
  delay: number;      // Start delay
}

interface RainInstance {
  id: number;         // Timestamp ID for the group
  bills: Bill[];      // Array of ~60 bills
}

const MoneyRain: React.FC = () => {
  const [rains, setRains] = useState<RainInstance[]>([]);

  // Inject CSS styles dynamically
  useEffect(() => {
    const styleId = 'money-rain-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes moneyRain {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-money-rain {
          position: fixed;
          top: -10vh;
          font-size: 2.5rem;
          line-height: 1;
          user-select: none;
          pointer-events: none;
          z-index: 9999;
          animation-name: moneyRain;
          animation-timing-function: ease-in;
          animation-fill-mode: forwards;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const triggerRain = useCallback(() => {
    const newId = Date.now();
    
    // Generate ~60 random bills
    const newBills: Bill[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,             // Random horizontal position 0-100%
      duration: 2 + Math.random() * 2,       // Random duration between 2s and 4s
      delay: Math.random() * 1,              // Random small delay up to 1s
    }));

    const newInstance: RainInstance = {
      id: newId,
      bills: newBills,
    };

    setRains(prev => [...prev, newInstance]);

    // Cleanup this specific rain instance after the maximum duration (4s duration + 1s delay buffer)
    setTimeout(() => {
      setRains(prev => prev.filter(r => r.id !== newId));
    }, 5000);
  }, []);

  return (
    <>
      {/* Trigger Button: Fixed top center */}
      <button
        onClick={triggerRain}
        className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] text-4xl cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none"
        aria-label="Lluvia de dinero"
        title="¡Haz llover!"
      >
        💵
      </button>

      {/* Portal for Rains */}
      {createPortal(
        <>
          {rains.map((rain) => (
            <React.Fragment key={rain.id}>
              {rain.bills.map((bill) => (
                <div
                  key={`${rain.id}-${bill.id}`}
                  className="animate-money-rain"
                  style={{
                    left: `${bill.left}%`,
                    animationDuration: `${bill.duration}s`,
                    animationDelay: `${bill.delay}s`,
                  }}
                >
                  💵
                </div>
              ))}
            </React.Fragment>
          ))}
        </>,
        document.body
      )}
    </>
  );
};

export default MoneyRain;