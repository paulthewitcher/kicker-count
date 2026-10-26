import React, { useState, useEffect, useRef, memo } from 'react';

const ReactionButton = memo(function ReactionButton({ emoji, index = 0, count = 0, onClick }) {
  const [animate, setAnimate] = useState(false);
  const [particles, setParticles] = useState([]);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count > prevCountRef.current) {
      const diff = count - prevCountRef.current;
      const bursts = Math.min(diff, 3); 

      const col = index % 4;
      let baseDrift = 0;
      if (col === 0) baseDrift = 110;
      else if (col === 1) baseDrift = 35;
      else if (col === 2) baseDrift = -35;
      else if (col === 3) baseDrift = -110;

      for (let j = 0; j < bursts; j++) {
        setTimeout(() => {
          const id = Date.now() + Math.random();
          // Aumentato significativamente il numero di duplicati (25 particelle ad alta fluidità)
          const newParticles = Array.from({ length: 25 }).map((_, i) => {
            const startX = (Math.random() - 0.5) * 50;
            const endX = baseDrift + (Math.random() - 0.5) * 80;
            return {
              id: `${id}-${i}`,
              startX,
              endX,
              scale: 0.8 + Math.random() * 1.0,
              duration: 2.2 + Math.random() * 1.2,
              delay: Math.random() * 0.4, // Stagger per fluidità
              rotation: (Math.random() - 0.5) * 70
            };
          });

          setParticles(prev => [...prev, ...newParticles]);

          setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
          }, 4000);
        }, j * 120);
      }
    }
    
    prevCountRef.current = count;
  }, [count, emoji, index]);

  const handleClick = () => {
    setAnimate(true);
    setTimeout(() => setAnimate(false), 250);
    onClick();
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none overflow-visible z-40 w-0 h-0">
        {particles.map(p => (
          <span
            key={p.id}
            className="absolute text-3xl select-none animate-instagram-float drop-shadow-md"
            style={{
              '--start-x': `${p.startX}px`,
              '--end-x': `${p.endX}px`,
              '--tw-scale-x': p.scale,
              '--tw-scale-y': p.scale,
              transform: `scale(${p.scale}) rotate(${p.rotation}deg)`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <button 
        onClick={handleClick}
        className={`flex flex-col items-center gap-1.5 group transition-transform active:scale-125 ${animate ? 'scale-125' : 'hover:-translate-y-1'}`}
      >
        <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-xl md:text-2xl shadow-lg group-hover:border-emerald-500 group-hover:bg-slate-700 transition-all">
          {emoji}
        </div>
        {count > 0 && (
          <div className="bg-slate-900/80 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold text-slate-400 border border-slate-800 min-w-[28px] text-center">
            {count}
          </div>
        )}
      </button>

      <style>{`
        @keyframes instagramFloat {
          0% {
            opacity: 1;
            transform: translate(var(--start-x, 0px), 0px) scale(0.5) rotate(0deg);
          }
          20% {
            opacity: 1;
            transform: translate(calc(var(--start-x, 0px) * 0.7 + var(--end-x, 0px) * 0.3), -140px) scale(1.1) rotate(15deg);
          }
          65% {
            opacity: 0.95;
            transform: translate(calc(var(--start-x, 0px) * 0.3 + var(--end-x, 0px) * 0.7), -420px) scale(1.35) rotate(-15deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--end-x, 0px), -700px) scale(0.9) rotate(25deg);
          }
        }
        .animate-instagram-float {
          animation: instagramFloat cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
});

export default ReactionButton;