// Subtle synthetic audio click feedback using Web Audio API

let audioCtx: AudioContext | null = null;

export function playKeyClick(type: "number" | "operator" | "equals" | "clear" | "action" = "number") {
  try {
    const isMuted = localStorage.getItem("calculator_sound") === "false";
    if (isMuted) return;

    if (!audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      audioCtx = new AudioCtx();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const now = audioCtx.currentTime;

    if (type === "equals") {
      // Pleasant chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "clear") {
      // Low blip
      osc.type = "triangle";
      osc.frequency.setValueAtTime(260, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "operator") {
      // Crisp mechanical click
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else {
      // Soft gentle tap
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
  } catch {
    // Audio autoplay or permissions prevented sound; fail silently
  }
}
