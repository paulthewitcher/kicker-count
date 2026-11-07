import { memo, useEffect, useRef, useState } from 'react';

// Livello persistente: continua a rilevare le reazioni anche quando la modale viene chiusa.
const ReactionBurst = memo(function ReactionBurst({ emoji, index = 0, count = 0 }) {
  const [particles, setParticles] = useState([]);
  const previousCount = useRef(count);
  const timers = useRef([]);

  useEffect(() => {
    if (count > previousCount.current) {
      const bursts = Math.min(count - previousCount.current, 3);
      const column = index % 5;
      const baseDrift = [160, 80, 0, -80, -160][column];

      for (let burst = 0; burst < bursts; burst += 1) {
        const timer = setTimeout(() => {
          const burstId = `${Date.now()}-${Math.random()}`;
          const newParticles = Array.from({ length: 25 }, (_, particleIndex) => ({
            id: `${burstId}-${particleIndex}`,
            startX: (Math.random() - 0.5) * 160,
            endX: baseDrift + (Math.random() - 0.5) * 260,
            scale: 0.85 + Math.random() * 1.1,
            duration: 4.2 + Math.random() * 1.6,
            delay: Math.random() * 0.5,
            rotation: (Math.random() - 0.5) * 80
          }));

          setParticles(current => [...current, ...newParticles]);

          const cleanupTimer = setTimeout(() => {
            setParticles(current => current.filter(
              particle => !newParticles.some(created => created.id === particle.id)
            ));
          }, 6500);
          timers.current.push(cleanupTimer);
        }, burst * 120);

        timers.current.push(timer);
      }
    }

    previousCount.current = count;
  }, [count, emoji, index]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-[60] h-0 w-0 overflow-visible">
      {particles.map(particle => (
        <span
          key={particle.id}
          className="absolute select-none text-3xl drop-shadow-md animate-instagram-float"
          style={{
            '--start-x': `${particle.startX}px`,
            '--end-x': `${particle.endX}px`,
            transform: `scale(${particle.scale}) rotate(${particle.rotation}deg)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
});

export default ReactionBurst;
