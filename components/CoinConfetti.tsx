// Efecto de lluvia de monedas 🪙 para la página de pago exitoso.
// Solo renderiza en el cliente, sin dependencias externas.
import { useMemo } from 'react';

interface Coin {
  id: number;
  left: number;   // % horizontal
  delay: number;  // segundos de delay
  duration: number;
  size: number;   // px de font-size
  sway: number;   // px de desplazamiento horizontal en el arco
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function CoinConfetti({ count = 45 }: { count?: number }) {
  const coins = useMemo<Coin[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: rand(0, 100),
        delay: rand(0, 3.5),
        duration: rand(2.8, 5.5),
        size: rand(14, 26),
        sway: rand(-45, 45),
      })),
    [count],
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9998 }}
      aria-hidden="true"
    >
      {coins.map((coin) => (
        <span
          key={coin.id}
          className="absolute animate-coin-fall"
          style={
            {
              left: `${coin.left}%`,
              top: '-80px',
              fontSize: `${coin.size}px`,
              animationDelay: `${coin.delay}s`,
              animationDuration: `${coin.duration}s`,
              '--sway': `${coin.sway}px`,
            } as React.CSSProperties
          }
        >
          🪙
        </span>
      ))}
    </div>
  );
}
