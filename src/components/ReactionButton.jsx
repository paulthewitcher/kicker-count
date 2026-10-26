import React, { useState, useEffect, useRef } from 'react';

export default function ReactionButton({ emoji, count = 0, onClick }) {
  const [animate, setAnimate] = useState(false);
  const [particles, setParticles] = useState([]);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count > prevCountRef.current) {
      const diff = count - prevCountRef.current;
      const bursts = Math.min(diff, 3); 

      for (let j = 0; j < bursts; j++) {
        setTimeout(() => {
          const id = Date.now() + Math.random();
          const newParticles = Array.from({ length: 8 }).map((_, i) => ({
            id: `${id}-${i}`,
            xOffset: (Math.random() - 0.5) * 160,
            scale: 0.9 + Math.random() * 0.9,
            duration: 2.5 + Math.random() * 1.0,
            rotation: (Math.random() - 0.5) * 60
          }));

          setParticles(prev => [...prev, ...newParticles]);

          setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
          }, 3800);
        }, j * 150);
      }
    }
    
    prevCountRef.current = count;
  }, [count, emoji]);

  const handleClick = () => {
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);
    onClick();
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none overflow-visible z-40 w-0 h-0">
        {particles.map(p => (
          <span
            key={p.id}
            className="absolute text-3xl select-none animate-instagram-float drop-shadow-lg"
            style={{
              left: `${p.xOffset}px`,
              '--tw-scale-x': p.scale,
              '--tw-scale-y': p.scale,
              transform: `scale(${p.scale}) rotate(${p.rotation}deg)`,
              animationDuration: `${p.duration}s`
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <button 
        onClick={handleClick}
        className={`flex flex-col items-center gap-1.5 group transition-transform ${animate ? 'scale-125' : 'hover:-translate-y-1'}`}
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
            transform: translateY(0px) scale(0.6) rotate(0deg);
          }
          20% {
            opacity: 1;
            transform: translateY(-120px) scale(1.1) rotate(15deg);
          }
          65% {
            opacity: 0.95;
            transform: translateY(-400px) scale(1.3) rotate(-15deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-680px) scale(1) rotate(20deg);
          }
        }
        .animate-instagram-float {
          animation: instagramFloat ease-out forwards;
        }
      `}</style>
    </div>
  );
}