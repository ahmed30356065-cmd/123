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
        // High quality "Bubble Pop"
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.5, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(g); g.connect(this.masterGain);
        osc.start(t); osc.stop(t + 0.2);
    }

    public playPourSound(durationMs: number) {
        this.resume();
        const t = this.ctx.currentTime;
        const duration = durationMs / 1000;

        // "Liquid Stream" - White Noise via Bandpass
        const bufSize = this.ctx.sampleRate * duration;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t); // Muffled liquid sound
        filter.Q.value = 1;

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.4, t + 0.1);
        g.gain.linearRampToValueAtTime(0, t + duration);

        noise.connect(filter); filter.connect(g); g.connect(this.masterGain);
        noise.start(t);

        // "Glugging" - Randomized sine bubbles
        const glugs = Math.floor(duration * 15);
        for (let i = 0; i < glugs; i++) {
            const gt = t + Math.random() * (duration - 0.1);
            const osc = this.ctx.createOscillator();
            osc.frequency.setValueAtTime(400 + Math.random() * 300, gt);
            osc.frequency.exponentialRampToValueAtTime(800, gt + 0.05);

            const gg = this.ctx.createGain();
            gg.gain.setValueAtTime(0, gt);
            gg.gain.linearRampToValueAtTime(0.3, gt + 0.01);
            gg.gain.exponentialRampToValueAtTime(0.01, gt + 0.08);

            osc.connect(gg); gg.connect(this.masterGain);
            osc.start(gt); osc.stop(gt + 0.1);
        }
    }

    public playTubeComplete() {
        this.resume();
        const t = this.ctx.currentTime;
        // "Glass Ding"
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.4, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

        osc.connect(g); g.connect(this.masterGain);
        osc.start(t); osc.stop(t + 1.5);
    }

    public playWinSound() {
        this.resume();
        const t = this.ctx.currentTime;
        // Celebration Chord (Cmaj7 Arpeggio)
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
        notes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = f;

            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, t + i * 0.08);
            g.gain.linearRampToValueAtTime(0.2, t + i * 0.08 + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 1.5);

            osc.connect(g); g.connect(this.masterGain);
            osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 2.0);
        });
    }
}
