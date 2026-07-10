// Efecto de confetti para la página de pago exitoso.
// Usa canvas-confetti para un burst clásico de partículas.
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function CoinConfetti() {
  useEffect(() => {
    // Paleta: colores de marca + dorado + colores clásicos de confetti
    const colors = ['#b45b38', '#d4a373', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'];

    // Burst inicial desde el centro
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.55 },
      colors,
    });

    // Ráfagas desde los lados
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors });
      confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors });
    }, 300);

    // Burst final
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors,
        gravity: 0.8,
      });
    }, 700);
  }, []);

  return null; // canvas-confetti maneja su propio canvas
}
