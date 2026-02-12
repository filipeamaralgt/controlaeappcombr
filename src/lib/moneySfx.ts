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

    // Coin-drop melody: a few quick high-pitched dings
    ding(1200, 0, 0.15, 0.25);
    ding(1500, 0.08, 0.15, 0.2);
    ding(1800, 0.16, 0.2, 0.18);
    ding(2400, 0.28, 0.3, 0.15);

    // Close context after sound finishes
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Silently ignore if AudioContext is unavailable
  }
}
