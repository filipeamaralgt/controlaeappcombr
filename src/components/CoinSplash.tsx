import { useState, useEffect } from 'react';

export function CoinSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center overflow-hidden">
      {/* Multiple coins falling */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute text-4xl"
          style={{
            left: `${15 + i * 18}%`,
            animation: `coin-fall ${1.5 + i * 0.2}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${i * 0.15}s`,
            opacity: 0,
          }}
        >
          🪙
        </div>
      ))}
    </div>
  );
}
