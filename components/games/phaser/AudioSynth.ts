export class AudioSynth {
    private ctx: AudioContext;
    private masterGain: GainNode;

    constructor() {
        // @ts-ignore
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtor();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);
    }

    private resume() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    public playPop() {
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1); // Faster drop for "Pop"

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.8, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    public playPourSound(durationMs: number) {
        this.resume();
        const t = this.ctx.currentTime;
        const duration = durationMs / 1000;

        // Layer 1: High Frequency "Splash" (Crispness)
        const bufSize = this.ctx.sampleRate * duration;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

        const noise1 = this.ctx.createBufferSource();
        noise1.buffer = buf;
        const hpf = this.ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 1000;

        const g1 = this.ctx.createGain();
        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(0.3, t + 0.05);
        g1.gain.linearRampToValueAtTime(0, t + duration);

        noise1.connect(hpf); hpf.connect(g1); g1.connect(this.masterGain);
        noise1.start(t);

        // Layer 2: Main Body (Bandpass)
        const noise2 = this.ctx.createBufferSource();
        noise2.buffer = buf;
        const bpf = this.ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(400, t);
        bpf.frequency.linearRampToValueAtTime(800, t + duration); // Pitch rise as it fills

        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.6, t + 0.05);
        g2.gain.linearRampToValueAtTime(0, t + duration);

        noise2.connect(bpf); bpf.connect(g2); g2.connect(this.masterGain);
        noise2.start(t);

        // Layer 3: Discrete Bubbles (The "Glug")
        const glugs = Math.floor(duration * 12);
        for (let i = 0; i < glugs; i++) {
            const time = t + (Math.random() * duration * 0.8);
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            const freq = 300 + Math.random() * 400;
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq + 200, time + 0.05); // Chirp up

            const gg = this.ctx.createGain();
            gg.gain.setValueAtTime(0, time);
            gg.gain.linearRampToValueAtTime(0.4, time + 0.01);
            gg.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

            osc.connect(gg);
            gg.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.1);
        }
    }

    public playTubeComplete() {
        this.resume();
        const t = this.ctx.currentTime;
        // Crystal Chime
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t); // A5
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.4, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 1.2);
    }

    public playWinSound() {
        this.resume();
        const t = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = f;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, t + i * 0.1);
            g.gain.linearRampToValueAtTime(0.3, t + i * 0.1 + 0.1);
            g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 2);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(t + i * 0.1);
            osc.stop(t + i * 0.1 + 2.5);
        });
    }
}
