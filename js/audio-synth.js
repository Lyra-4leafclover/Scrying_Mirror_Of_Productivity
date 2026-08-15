/* ==========================================================================
   WEB AUDIO API LOFI CHILL BEATS & VINYL SYNTHESIZER
   ========================================================================== */

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.masterGain = null;
    this.isMusicPlaying = false;
    this.beatInterval = null;
    this.chordStep = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.enabled = true;
    this.startLofiEngine();
  }

  toggle() {
    if (!this.ctx) {
      this.init();
      return true;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
      this.enabled = true;
      if (this.masterGain) this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      return true;
    } else if (this.enabled) {
      this.enabled = false;
      if (this.masterGain) this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return false;
    } else {
      this.enabled = true;
      if (this.masterGain) this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      return true;
    }
  }

  startLofiEngine() {
    if (!this.ctx || this.isMusicPlaying) return;

    const now = this.ctx.currentTime;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.18, now);
    this.masterGain.connect(this.ctx.destination);

    this.startVinylHiss();
    this.startLofiBeatLoop();
    this.isMusicPlaying = true;
  }

  // Soft Vinyl Record Noise & Crackle Hiss
  startVinylHiss() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.015;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.08;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(0);
  }

  // Lofi E-Piano Chords (Cmaj7 -> Am7 -> Dm7 -> G7)
  playLofiChord(notes) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft Triangle + Sine blend for Rhodes / E-Piano warm lofi tone
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Warm Lofi Lowpass Filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, now);

      // Soft velocity envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06 - idx * 0.008, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.3);
    });
  }

  // Lofi Kick, Snare & Hi-Hat Beat Loop (75 BPM Chill Hop)
  startLofiBeatLoop() {
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [293.66, 349.23, 440.00, 523.25], // Dm7
      [196.00, 246.94, 349.23, 440.00]  // G7
    ];

    let step = 0;
    const bpm = 75;
    const stepTime = (60 / bpm) * 1000 / 2; // 8th notes

    this.beatInterval = setInterval(() => {
      if (!this.enabled || !this.ctx) return;

      const beatInBar = step % 8;

      // Play warm lofi chord every 8 steps (4 beats)
      if (beatInBar === 0) {
        this.playLofiChord(chords[this.chordStep % chords.length]);
        this.chordStep++;
      }

      // Lofi Soft Kick on Beat 1 & Beat 3.5
      if (beatInBar === 0 || beatInBar === 5) {
        this.playLofiKick();
      }

      // Lofi Soft Rimshot / Snare on Beat 2 & Beat 4
      if (beatInBar === 2 || beatInBar === 6) {
        this.playLofiSnare();
      }

      // Soft Hi-Hat on 8th notes
      if (beatInBar % 2 === 1) {
        this.playLofiHiHat();
      }

      step++;
    }, stepTime);
  }

  playLofiKick() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playLofiSnare() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playLofiHiHat() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.04;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  playWaterDrop(pitchModifier = 1.0) {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 * pitchModifier, now);
      osc.frequency.exponentialRampToValueAtTime(320 * pitchModifier, now + 0.16);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  }

  playKeyTick() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 300, now);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }

  playClick() {
    this.playKeyTick();
  }

  // Celestial multi-tone chime for task completion
  playTaskComplete() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.001, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.65);
      });
    } catch (e) {}
  }

  // Resonant Gong / Meditation Bell for Pomodoro session completion
  playPomodoroComplete() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [432, 864, 1296];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 3.1);
      });
    } catch (e) {}
  }

  // Soft Uplifting Focus Start Bell
  playPomodoroStart() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }
}

window.audioSynth = new AudioSynthesizer();
