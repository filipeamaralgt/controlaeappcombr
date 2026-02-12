/**
 * Plays a short synthesized "coin / money" sound effect using Web Audio API.
 * No external files needed.
 */
export function playMoneySfx() {
  try {
    const ctx = new AudioContext();

    // Helper: play a short sine "ding" at a given frequency & start time
    const ding = (freq: number, start: number, dur: number, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    // Cash register "ka-ching!" sound
    // Initial metallic click
    ding(800, 0, 0.06, 0.3);
    ding(1000, 0.03, 0.06, 0.25);
    // Coin cascade
    ding(3200, 0.1, 0.08, 0.2);
    ding(3800, 0.15, 0.08, 0.18);
    ding(4200, 0.19, 0.08, 0.16);
    ding(3600, 0.23, 0.08, 0.15);
    ding(4600, 0.27, 0.1, 0.14);
    // Final bright chime
    ding(5200, 0.35, 0.25, 0.2);
    ding(6400, 0.38, 0.3, 0.15);

    // Close context after sound finishes
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Silently ignore if AudioContext is unavailable
  }
}
