import { useEffect } from 'react';

const COLORS = [
  'bg-yellow-400',
  'bg-green-400',
  'bg-blue-400',
  'bg-pink-400',
  'bg-purple-400',
  'bg-red-400',
  'bg-orange-400',
];

/** Burst of falling confetti pieces; calls onComplete after the animation. */
export default function Confetti({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: 2 + Math.random() * 92,
    delay: Math.random() * 0.2,
    rotation: Math.random() * 360,
    duration: 1.5 + Math.random() * 0.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translateY(150px) rotate(720deg) scale(0.5); opacity: 0; }
        }
      `}</style>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute w-3 h-3 ${piece.color} rounded-sm shadow-lg`}
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            animation: `confetti ${piece.duration}s ease-out forwards`,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
