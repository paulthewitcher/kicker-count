import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Overlay globale: il portal evita che transform/overflow dei contenitori della
// schermata partita blocchino o ritaglino gli elementi position: fixed.
// Il contatore Firestore è l'unico trigger sia per i goal sia per i click manuali.
const ReactionBurst = memo(function ReactionBurst({ emoji, index = 0, count = 0 }) {
  const [particles, setParticles] = useState([]);
  const animationValue = count;
  const previousValue = useRef(animationValue);
  const timers = useRef([]);

  useEffect(() => {
    const previous = Number(previousValue.current) || 0;
    const current = Number(animationValue) || 0;

    if (current > previous) {
      const bursts = Math.min(current - previous, 3);
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

          setParticles(currentParticles => [...currentParticles, ...newParticles]);

          const cleanupTimer = setTimeout(() => {
            const particleIds = new Set(newParticles.map(particle => particle.id));
            setParticles(currentParticles => currentParticles.filter(
              particle => !particleIds.has(particle.id)
            ));
          }, 6800);
          timers.current.push(cleanupTimer);
        }, burst * 120);

        timers.current.push(timer);
      }
    }

    previousValue.current = current;
  }, [animationValue, emoji, index]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] overflow-visible"
    >
      <div className="absolute bottom-8 left-1/2 h-0 w-0 overflow-visible">
        {particles.map(particle => (
          <span
            key={particle.id}
            className="absolute left-0 bottom-0 select-none drop-shadow-md animate-instagram-float"
            style={{
              '--start-x': `${particle.startX}px`,
              '--end-x': `${particle.endX}px`,
              '--particle-rotation': `${particle.rotation}deg`,
              fontSize: `${1.75 * particle.scale}rem`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>,
    document.body
  );
});

export default ReactionBurst;
