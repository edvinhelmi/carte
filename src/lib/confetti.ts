import confetti from 'canvas-confetti';

export function fireWinConfetti() {
  if (typeof window === 'undefined') return;

  try {
    // Prima raffica
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#10b981', '#38bdf8', '#ef4444', '#eab308'],
    });

    // Seconda raffica ritardata
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#10b981', '#38bdf8'],
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#10b981', '#38bdf8'],
      });
    }, 150);
  } catch (e) {
    console.error('Confetti error:', e);
  }
}
