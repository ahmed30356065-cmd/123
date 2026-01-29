import Phaser from 'phaser';
import { AudioSynth } from '../AudioSynth';

const COLORS = [
    0xE53935, 0x1E88E5, 0x43A047, 0xFDD835, 0x8E24AA, 0xFB8C00,
    0x00ACC1, 0x6D4C41, 0xD81B60, 0x546E7A, 0xC0CA33, 0x3949AB
];

const CONFIG = {
    TUBE_WIDTH: 74,
    TUBE_HEIGHT: 240,        // Reduced height nicely
    LIQUID_HEIGHT: 50,       // Adjusted for 4 segments (4 * 50 = 200 < 240)
    MAX_CAPACITY: 4,
    TUBE_GAP: 30,
    POUR_SPEED: 260,
    CORNER_RADIUS: 24,
    // LAYOUT SAFE ZONES
    TOP_PADDING: 180,        // Increased to avoid UI overlap
    BOTTOM_PADDING: 220      // Increased to avoid control buttons overlap
};

export default class WaterSortScene extends Phaser.Scene {
    private tubes: Phaser.GameObjects.Container[] = [];
    private tubeData: number[][] = [];
    private completedTubes: boolean[] = [];
    private tubeOriginalPositions: { x: number, y: number }[] = [];
    private selectedTubeIndex: number = -1;
    private isPouring: boolean = false;
    private history: { source: number, target: number, color: number, count: number }[] = [];
    private splashEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private audio!: AudioSynth;
    private level: number = 1;
    private tubeCount: number = 6;
    private initialTubeCount: number = 6;
    private onLevelUp?: (level: number) => void;
    private winContainer!: Phaser.GameObjects.Container;
    private hasWon: boolean = false;

    constructor() { super({ key: 'WaterSortScene' }); }

    create() {
        this.audio = new AudioSynth();
        this.onLevelUp = this.registry.get('onLevelUp');
        this.createTextures();
        this.createEmitters();
        this.setupEvents();

        const savedState = localStorage.getItem('waterSortState_v2');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.level = state.level;
                this.tubeData = state.tubeData;
                this.completedTubes = state.completedTubes || new Array(this.tubeData.length).fill(false);
                this.tubeCount = this.tubeData.length;
                this.initialTubeCount = Math.max(6, this.tubeCount);
                this.history = [];
                if (this.onLevelUp) this.onLevelUp(this.level);
                this.drawTubes();
            } catch (e) { this.startLevel(1); }
        } else {
            const savedLevel = localStorage.getItem('waterSortMaxLevel');
            this.startLevel(savedLevel ? parseInt(savedLevel) : 1);
        }
    }

    private setupEvents() {
        window.addEventListener('water-sort-action', (e: any) => {
            const action = e.detail;
            if (action === 'undo') this.undoMove();
            if (action === 'addTube') this.addExtraTube();
            if (action === 'restart') this.restartLevel();
        });
        this.input.on('pointerdown', (p: any, objs: any[]) => {
            if (this.hasWon) return;
            if (objs.length === 0 && this.selectedTubeIndex !== -1 && !this.isPouring) this.deselectSource();
        });
    }

    private createTextures() {
        if (!this.textures.exists('particle')) {
            const g = this.make.graphics(); g.fillStyle(0xffffff); g.fillCircle(4, 4, 4);
            g.generateTexture('particle', 8, 8);
        }
        if (!this.textures.exists('confetti')) {
            const g = this.make.graphics(); g.fillStyle(0xffffff); g.fillRect(0, 0, 8, 4);
            g.generateTexture('confetti', 8, 4);
        }

        if (!this.textures.exists('tube_3d')) {
            const scale = 4; // High res
            const w = CONFIG.TUBE_WIDTH * scale;
            const h = CONFIG.TUBE_HEIGHT * scale;
            const r = CONFIG.CORNER_RADIUS * scale;

            const canvas = this.textures.createCanvas('tube_3d', w, h);
            const ctx = canvas!.getContext();

            // Glass Body
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, 'rgba(60,60,70,0.3)');
            grad.addColorStop(0.2, 'rgba(120,120,130,0.1)');
            grad.addColorStop(0.5, 'rgba(60,60,70,0.05)');
            grad.addColorStop(0.8, 'rgba(80,80,90,0.2)');
            grad.addColorStop(1, 'rgba(40,40,50,0.4)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, r);
            ctx.fill();

            // Glossy Highlight
            const hGrad = ctx.createLinearGradient(0, 0, w, 0);
            hGrad.addColorStop(0, 'rgba(255,255,255,0.05)');
            hGrad.addColorStop(0.1, 'rgba(255,255,255,0.4)');
            hGrad.addColorStop(0.25, 'rgba(255,255,255,0.05)');
            hGrad.addColorStop(0.8, 'rgba(255,255,255,0)');
            hGrad.addColorStop(0.9, 'rgba(255,255,255,0.2)');

            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, r);
            ctx.fill();

            // Rim & Border
            const rimGrad = ctx.createLinearGradient(0, 0, w, 0);
            rimGrad.addColorStop(0, '#888');
            rimGrad.addColorStop(0.5, '#eee');
            rimGrad.addColorStop(1, '#888');

            ctx.lineWidth = 2 * scale;
            ctx.strokeStyle = rimGrad;
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, [r, r, r, r]);
            ctx.stroke();

            // Inner subtle border
            ctx.lineWidth = 0.5 * scale;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.stroke();

            canvas!.refresh();
        }
    }

    private createEmitters() {
        this.splashEmitter = this.add.particles(0, 0, 'particle', {
            lifespan: 400, speed: { min: 20, max: 80 }, scale: { start: 0.4, end: 0 },
            alpha: { start: 0.8, end: 0 }, gravityY: 500, emitting: false
        });
    }

    public startLevel(lvl: number) {
        this.level = lvl;
        this.hasWon = false;
        localStorage.setItem('waterSortMaxLevel', lvl.toString());
        if (this.onLevelUp) this.onLevelUp(lvl);

        const colorCount = Math.min(3 + Math.floor((lvl - 1) / 2), 12);
        this.tubeCount = colorCount + 2;
        this.initialTubeCount = this.tubeCount;

        this.history = []; this.selectedTubeIndex = -1; this.isPouring = false;
        this.completedTubes = new Array(this.tubeCount).fill(false);
        this.generateLevel(colorCount);
        this.drawTubes();
        this.saveState();
        if (this.winContainer) { this.winContainer.destroy(); }
    }

    private restartLevel() {
        if (this.isPouring) return;
        this.audio.playPop();
        this.hasWon = false;
        if (this.winContainer) this.winContainer.destroy();
        this.startLevel(this.level);
    }

    private saveState() {
        localStorage.setItem('waterSortState_v2', JSON.stringify({
            level: this.level, tubeData: this.tubeData, completedTubes: this.completedTubes
        }));
    }

    private generateLevel(colorCount: number) {
        const finalState: number[][] = [];
        for (let i = 0; i < colorCount; i++) finalState.push(Array(4).fill(i));
        for (let i = 0; i < 2; i++) finalState.push([]);

        const moves = 150 + this.level * 15;
        for (let m = 0; m < moves; m++) {
            const s = Phaser.Math.Between(0, this.tubeCount - 1);
            if (finalState[s].length === 0) continue;
            const t = Phaser.Math.Between(0, this.tubeCount - 1);
            if (s === t) continue;
            if (finalState[t].length < 4) {
                const v = finalState[s].pop();
                if (v !== undefined) finalState[t].push(v);
            }
        }
        this.tubeData = finalState;
    }

    // SAFE ZONE LAYOUT - REDESIGNED
    private drawTubes() {
        this.tubes.forEach(t => t.destroy());
        this.tubes = [];
        this.tubeOriginalPositions = [];

        // 1. Define Available Space
        const availW = this.scale.width - 40; // 20px padding each side
        const availH = this.scale.height - (CONFIG.TOP_PADDING + CONFIG.BOTTOM_PADDING);

        // 2. Determine Grid Configuration
        // Prefer 4 columns maximum to keep tubes readable on mobile
        let cols = 4;

        // If few tubes, center them nicely
        if (this.tubeCount <= 4) cols = this.tubeCount;
        else cols = Math.ceil(this.tubeCount / 2);
        if (cols > 4) cols = 4;

        const rows = Math.ceil(this.tubeCount / cols);

        // 3. Calculate Scale
        const rawRowH = CONFIG.TUBE_HEIGHT + 40; // Reduced vertical gap
        const rawGridW = cols * CONFIG.TUBE_WIDTH + (cols - 1) * CONFIG.TUBE_GAP;
        const rawGridH = rows * rawRowH;

        let scaleW = availW / rawGridW;
        let scaleH = availH / rawGridH;

        // Take the smaller scale to fit
        let scale = Math.min(scaleW, scaleH);

        // Clamp scale to keep visuals high quality
        if (scale > 1.0) scale = 1.0;
        if (scale < 0.65) scale = 0.65; // Never go too small

        // 4. Calculate Positioning
        const finalRowH = rawRowH * scale;
        const totalContentH = rows * finalRowH;

        // Center vertically, or scroll if too big (but we clamp scale to avoid overflow optimally)
        let startY = CONFIG.TOP_PADDING + (availH - totalContentH) / 2;
        if (totalContentH > availH) startY = CONFIG.TOP_PADDING; // Top align if huge

        // 5. Build Grid
        for (let i = 0; i < this.tubeCount; i++) {
            const r = Math.floor(i / cols);
            const c = i % cols;

            // Center rows 
            let itemsInRow = cols;
            if (r === rows - 1) {
                const remainder = this.tubeCount % cols;
                if (remainder !== 0) itemsInRow = remainder;
            }

            const rowWidth = itemsInRow * CONFIG.TUBE_WIDTH + (itemsInRow - 1) * CONFIG.TUBE_GAP;
            const rowWidthScaled = rowWidth * scale;
            const rowStartX = (this.scale.width - rowWidthScaled) / 2 + (CONFIG.TUBE_WIDTH * scale) / 2;

            const x = rowStartX + c * (CONFIG.TUBE_WIDTH + CONFIG.TUBE_GAP) * scale;
            const y = startY + r * finalRowH;

            const container = this.add.container(x, y);
            container.setScale(scale);

            const bg = this.add.image(0, 0, 'tube_3d');
            bg.setScale(0.25); // Texture was supersampled 4x
            container.add(bg);

            // Hit area slightly larger for easier tapping
            const hit = new Phaser.Geom.Rectangle(-50, -180, 100, 360);
            container.setInteractive(hit, Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', (e: any) => { e.event.stopPropagation(); this.handleTubeClick(i); });

            this.tubes.push(container);
            this.tubeOriginalPositions.push({ x, y });
            this.updateTubeVisuals(i);
        }
    }

    private updateTubeVisuals(idx: number) {
        const cont = this.tubes[idx];
        cont.getAll('name', 'liquid').forEach(o => o.destroy());
        cont.getAll('name', 'cap').forEach(o => o.destroy());

        let yPos = CONFIG.TUBE_HEIGHT / 2 - 10;
        const data = this.tubeData[idx];

        for (let i = 0; i < data.length; i++) {
            const color = COLORS[data[i]];
            const g = this.add.graphics();
            g.name = 'liquid';
            const h = CONFIG.LIQUID_HEIGHT;
            const w = CONFIG.TUBE_WIDTH - 12; // Fit inside glass
            const lx = -w / 2;
            const ly = yPos - h;

            g.fillStyle(color, 0.95);

            // If bottom piece, round bottom corners
            if (i === 0) g.fillRoundedRect(lx, ly, w, h, { tl: 0, tr: 0, bl: 18, br: 18 });
            else g.fillRect(lx, ly, w, h);

            // Subtle depth side shading
            g.fillStyle(0x000000, 0.1);
            g.fillRect(lx, ly, 6, h);
            g.fillRect(lx + w - 6, ly, 6, h);

            // Meniscus Surface
            const surf = this.add.graphics();
            surf.name = 'liquid';
            const c = Phaser.Display.Color.IntegerToColor(color);
            c.brighten(15);
            surf.fillStyle(c.color, 1);
            surf.fillEllipse(0, ly, w, 10);

            cont.add(g);
            cont.add(surf);
            yPos -= h;
        }

        if (this.completedTubes[idx]) {
            const cap = this.add.graphics();
            cap.name = 'cap';
            cap.fillStyle(0xFFD700);
            cap.fillRoundedRect(-CONFIG.TUBE_WIDTH / 2 - 2, -CONFIG.TUBE_HEIGHT / 2 - 12, CONFIG.TUBE_WIDTH + 4, 24, 6);
            cap.fillStyle(0xffffff, 0.4);
            cap.fillRect(-10, -CONFIG.TUBE_HEIGHT / 2 - 12, 20, 24);
            cont.add(cap);
        }
    }

    private handleTubeClick(idx: number) {
        if (this.isPouring || this.completedTubes[idx]) return;
        this.audio.playPop();

        this.checkWin();
        if (this.hasWon) return;

        if (this.selectedTubeIndex === -1) {
            if (this.tubeData[idx].length > 0) this.selectTube(idx);
        } else {
            if (this.selectedTubeIndex === idx) this.deselectSource();
            else this.attemptPour(this.selectedTubeIndex, idx);
        }
    }

    private selectTube(idx: number) {
        this.selectedTubeIndex = idx;
        const t = this.tubes[idx];
        this.tweens.add({ targets: t, y: t.y - 30, duration: 150, ease: 'Back.out' });
    }

    private deselectSource() {
        if (this.selectedTubeIndex !== -1) {
            const t = this.tubes[this.selectedTubeIndex];
            const origPos = this.tubeOriginalPositions[this.selectedTubeIndex];
            this.tweens.add({ targets: t, x: origPos.x, y: origPos.y, duration: 150, ease: 'Power2' });
            this.selectedTubeIndex = -1;
        }
    }

    private attemptPour(srcIdx: number, tgtIdx: number) {
        const src = this.tubeData[srcIdx];
        const tgt = this.tubeData[tgtIdx];
        if (tgt.length >= CONFIG.MAX_CAPACITY) { this.deselectSource(); return; }
        const color = src[src.length - 1];
        if (tgt.length > 0 && tgt[tgt.length - 1] !== color) { this.shakeTube(tgtIdx); this.deselectSource(); return; }

        let amount = 0;
        for (let i = src.length - 1; i >= 0; i--) { if (src[i] === color) amount++; else break; }
        // Can only move as much as space allows
        const availableSpace = CONFIG.MAX_CAPACITY - tgt.length;
        const actual = Math.min(amount, availableSpace);

        this.animatePour(srcIdx, tgtIdx, actual, color);
    }

    private shakeTube(idx: number) {
        this.tweens.add({ targets: this.tubes[idx], x: '+=5', yoyo: true, duration: 50, repeat: 3 });
    }

    private animatePour(srcIdx: number, tgtIdx: number, count: number, color: number) {
        this.isPouring = true;
        const srcTube = this.tubes[srcIdx];
        const tgtTube = this.tubes[tgtIdx];
        const isRight = tgtTube.x > srcTube.x;
        const angle = isRight ? 55 : -55;

        // Position source tube near successful target
        const pourX = tgtTube.x + (isRight ? -60 : 60) * srcTube.scale;
        const pourY = tgtTube.y - (CONFIG.TUBE_HEIGHT / 2 + 60) * srcTube.scale;
        const origPos = this.tubeOriginalPositions[srcIdx];

        this.tweens.add({
            targets: srcTube, x: pourX, y: pourY, angle: angle,
            duration: 350, ease: 'Power2',
            onComplete: () => {
                this.audio.playPourSound(CONFIG.POUR_SPEED);
                const g = this.add.graphics();

                const rad = Phaser.Math.DegToRad(angle);
                const halfW = (CONFIG.TUBE_WIDTH / 2) * srcTube.scale;
                // Pour from lip
                const halfH = (CONFIG.TUBE_HEIGHT / 2) * srcTube.scale;

                // Adjust spout position
                let lx = isRight ? halfW : -halfW;
                let ly = -halfH;

                const cos = Math.cos(rad); const sin = Math.sin(rad);
                const rx = lx * cos - ly * sin; const ry = lx * sin + ly * cos;
                const startP = { x: srcTube.x + rx, y: srcTube.y + ry };

                const tgtContentH = this.tubeData[tgtIdx].length * CONFIG.LIQUID_HEIGHT;
                const endP = { x: tgtTube.x, y: tgtTube.y + (CONFIG.TUBE_HEIGHT / 2 - tgtContentH - 20) * srcTube.scale };

                // Bezier flow
                const control = { x: (startP.x + endP.x) / 2, y: startP.y };
                const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(startP.x, startP.y), new Phaser.Math.Vector2(control.x, control.y), new Phaser.Math.Vector2(endP.x, endP.y));

                this.splashEmitter.setPosition(endP.x, endP.y);
                this.splashEmitter.setParticleTint(COLORS[color]);
                this.splashEmitter.start();

                // Logic Update
                for (let k = 0; k < count; k++) { this.tubeData[srcIdx].pop(); this.tubeData[tgtIdx].push(color); }
                this.history.push({ source: srcIdx, target: tgtIdx, color, count });
                this.saveState();

                this.tweens.addCounter({
                    from: 0, to: 100, duration: CONFIG.POUR_SPEED,
                    onUpdate: (tw) => {
                        g.clear();
                        g.lineStyle(4 * srcTube.scale, COLORS[color]);
                        curve.draw(g, 10);
                    },
                    onComplete: () => {
                        g.destroy();
                        this.splashEmitter.stop();
                        this.updateTubeVisuals(srcIdx);
                        this.updateTubeVisuals(tgtIdx);

                        if (this.tubeData[tgtIdx].length === CONFIG.MAX_CAPACITY && this.tubeData[tgtIdx].every(x => x === color)) {
                            if (!this.completedTubes[tgtIdx]) {
                                this.completedTubes[tgtIdx] = true;
                                this.audio.playTubeComplete();
                                this.updateTubeVisuals(tgtIdx);
                                const ex = this.add.particles(tgtTube.x, tgtTube.y, 'particle', { speed: 100, duration: 400, emitting: false, tint: COLORS[color] });
                                ex.explode(30);
                            }
                        }

                        this.tweens.add({
                            targets: srcTube, x: origPos.x, y: origPos.y, angle: 0, duration: 250,
                            onComplete: () => {
                                this.isPouring = false; this.selectedTubeIndex = -1;
                                this.saveState(); this.checkWin();
                            }
                        });
                    }
                });
            }
        });
    }

    private undoMove() {
        if (this.isPouring || this.history.length === 0) return;
        this.audio.playPop();
        const m = this.history.pop()!;
        this.completedTubes[m.target] = false;
        for (let k = 0; k < m.count; k++) { this.tubeData[m.target].pop(); this.tubeData[m.source].push(m.color); }
        this.deselectSource();
        this.updateTubeVisuals(m.source);
        this.updateTubeVisuals(m.target);
        this.saveState();
    }

    private addExtraTube() {
        if (this.isPouring || this.hasWon) return;
        if (this.tubeCount >= this.initialTubeCount + 2) return;

        this.audio.playPop();
        this.tubeData.push([]);
        this.completedTubes.push(false);
        this.tubeCount++;
        this.drawTubes();
        this.saveState();
        this.checkWin();
    }

    private checkWin() {
        if (this.hasWon) return;

        let fullTubes = 0;
        for (const t of this.tubeData) {
            if (t.length === 0) continue;
            if (t.length === CONFIG.MAX_CAPACITY && t.every(x => x === t[0])) {
                fullTubes++;
            } else {
                return;
            }
        }

        this.hasWon = true;
        this.audio.playWinSound();
        this.showWinModal();
        window.dispatchEvent(new CustomEvent('water-sort-level-complete', { detail: this.level }));
        this.time.delayedCall(3000, () => this.startLevel(this.level + 1));
    }

    private showWinModal() {
        // Dark overlay
        const rect = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.85);
        rect.setInteractive();

        const txt = this.add.text(this.scale.width / 2, this.scale.height / 2, "LEVEL COMPLETED!", {
            fontFamily: 'Arial', fontSize: '42px', color: '#FFD700', fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 4, color: '#000', blur: 10, fill: true }
        }).setOrigin(0.5).setScale(0);

        this.winContainer = this.add.container(0, 0, [rect, txt]);
        this.winContainer.setDepth(100);

        this.tweens.add({
            targets: txt, scale: 1, duration: 600, ease: 'Back.out',
            onComplete: () => this.playConfetti()
        });
    }

    private playConfetti() {
        const w = this.scale.width;
        const e = this.add.particles(w / 2, 0, 'confetti', {
            speed: { min: 300, max: 800 }, angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 }, gravityY: 250, lifespan: 4000, quantity: 60,
            emitting: false, tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]
        });
        e.explode(200, w / 2, this.scale.height / 2);
    }
}
