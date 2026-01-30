import Phaser from 'phaser';
import { AudioSynth } from '../AudioSynth';

// 1. IMPROVED PALETTE (No Black, Candy/Vivid Colors)
const COLORS = [
    0xFF1744, // Red
    0x2979FF, // Blue
    0x00E676, // Green
    0xFFEA00, // Yellow
    0xD500F9, // Purple
    0xFF9100, // Orange
    0x00E5FF, // Cyan
    0x8D6E63, // Brown (Light)
    0xF50057, // Pink
    0x76FF03, // Lime
    0x3D5AFE, // Indigo
    0x26C6DA, // Teal
    0xFF3D00, // Deep Orange
    0x651FFF, // Deep Purple
    0x00B0FF, // Light Blue
    0x1DE9B6  // Teal Accent
];


const CONFIG = {
    TUBE_WIDTH: 74,
    TUBE_HEIGHT: 240,
    LIQUID_HEIGHT: 50,
    MAX_CAPACITY: 4,
    TUBE_GAP: 30,
    POUR_SPEED: 260,
    CORNER_RADIUS: 24,
    TOP_PADDING: 180,
    BOTTOM_PADDING: 220
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

        // SPLASH SCREEN - Called AFTER setup to be on top
        this.showSplashScreen();
    }

    private showSplashScreen() {
        // High depth overlay
        const overlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x121212);
        overlay.setDepth(1000); // Ensure it covers everything

        const logoText = this.add.text(this.scale.width / 2, this.scale.height / 2, "WATER SORT", {
            fontFamily: 'Arial Black', fontSize: '48px', color: '#29B6F6',
            stroke: '#FFF', strokeThickness: 4
        }).setOrigin(0.5).setScale(0.5);
        logoText.setDepth(1001);

        this.tweens.add({
            targets: logoText, scale: 1.2, duration: 800, ease: 'Back.out',
            onComplete: () => {
                this.tweens.add({
                    targets: [overlay, logoText], alpha: 0, duration: 500, delay: 200,
                    onComplete: () => { overlay.destroy(); logoText.destroy(); }
                });
            }
        });
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
            const scale = 4;
            const w = CONFIG.TUBE_WIDTH * scale;
            const h = CONFIG.TUBE_HEIGHT * scale;
            const r = CONFIG.CORNER_RADIUS * scale;
            const lw = 3 * scale;
            const pad = 6 * scale;
            const canvas = this.textures.createCanvas('tube_3d', w + pad * 2, h + pad * 2);
            const ctx = canvas!.getContext();

            ctx.translate(pad, pad);

            // 1. CLEAN GLASS BODY (No Black)
            // Lighter, transparent bluish/grey
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, 'rgba(200, 220, 255, 0.4)');
            grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.1)');
            grad.addColorStop(0.5, 'rgba(200, 220, 255, 0.05)');
            grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
            grad.addColorStop(1, 'rgba(200, 220, 255, 0.4)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, [r / 2, r / 2, r, r]);
            ctx.fill();

            // 2. Highlights
            const hGrad = ctx.createLinearGradient(0, 0, w * 0.5, 0);
            hGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
            hGrad.addColorStop(0.2, 'rgba(255,255,255,0.4)');
            hGrad.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.roundRect(0, 0, w * 0.4, h, r);
            ctx.fill();

            // 3. Rim (Clean Silver/White)
            const lipH = 12 * scale;
            const rimGrad = ctx.createLinearGradient(0, 0, w, 0);
            rimGrad.addColorStop(0, '#B0BEC5'); // Light Grey
            rimGrad.addColorStop(0.5, '#FFFFFF'); // White
            rimGrad.addColorStop(1, '#B0BEC5');

            ctx.lineWidth = lw;
            ctx.strokeStyle = rimGrad;

            ctx.beginPath();
            ctx.roundRect(lw / 2, lipH / 2, w - lw, h - lipH / 2 - lw / 2, [0, 0, r, r]);
            ctx.stroke();

            // Top Opening
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // Clearer inner
            ctx.beginPath();
            ctx.ellipse(w / 2, lipH / 2, w / 2 - lw / 2, lipH / 2, 0, 0, Math.PI * 2);
            ctx.fill();
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

        // DIFFICULTY SCALING
        const maxColors = COLORS.length;
        const colorCount = Math.min(3 + (lvl - 1), maxColors); // Guard against OOB
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

    // STABLE 'BOTTOM-HEAVY' 2-ROW LAYOUT
    // Ensures that adding a tube fills the bottom row first, preventing top row shifting.
    private drawTubes() {
        this.tubes.forEach(t => t.destroy());
        this.tubes = [];
        this.tubeOriginalPositions = [];

        // Increase side padding to prevent edge clipping (Important Fix)
        const sidePadding = 48;
        const availW = this.scale.width - sidePadding;
        const topPad = 140;
        const botPad = 220;
        const availH = this.scale.height - (topPad + botPad);

        let row1Count = 0;
        let row2Count = 0;
        const rows = this.tubeCount <= 6 ? 1 : 2;

        if (rows === 1) {
            row1Count = this.tubeCount;
        } else {
            // Split: Floor for top, Ceil for bottom.
            // Ex: 13 -> Top 6, Bot 7.
            // Ex: 14 -> Top 7, Bot 7.
            // Ex: 15 -> Top 7, Bot 8.
            // Stable Top Row!
            row1Count = Math.floor(this.tubeCount / 2);
            row2Count = this.tubeCount - row1Count;
        }

        // Calculate Scale based on widest row (Bottom row usually)
        const maxCols = Math.max(row1Count, row2Count);
        const rawRowH = CONFIG.TUBE_HEIGHT + 35;
        const rawGridW = maxCols * CONFIG.TUBE_WIDTH + (maxCols - 1) * CONFIG.TUBE_GAP;
        const rawGridH = rows * rawRowH;

        let scaleW = availW / rawGridW;
        let scaleH = availH / rawGridH;
        let scale = Math.min(scaleW, scaleH);

        if (scale > 1.0) scale = 1.0;
        // LOWER MIN SCALE to ensure everything fits even at high tube counts
        if (scale < 0.25) scale = 0.25;


        const finalRowH = rawRowH * scale;
        const totalContentH = rows * finalRowH;

        let startY = topPad + (availH - totalContentH) / 2;
        if (totalContentH > availH) startY = topPad;

        // Render Loop
        for (let i = 0; i < this.tubeCount; i++) {
            let r = 0;
            let c = 0;
            let itemsInThisRow = 0;

            if (rows === 1) {
                r = 0; c = i; itemsInThisRow = row1Count;
            } else {
                if (i < row1Count) {
                    r = 0; c = i; itemsInThisRow = row1Count;
                } else {
                    r = 1; c = i - row1Count; itemsInThisRow = row2Count;
                }
            }

            const rowWidth = itemsInThisRow * CONFIG.TUBE_WIDTH + (itemsInThisRow - 1) * CONFIG.TUBE_GAP;
            const rowWidthScaled = rowWidth * scale;
            const rowStartX = (this.scale.width - rowWidthScaled) / 2 + (CONFIG.TUBE_WIDTH * scale) / 2;

            const x = rowStartX + c * (CONFIG.TUBE_WIDTH + CONFIG.TUBE_GAP) * scale;
            const y = startY + r * finalRowH;

            const container = this.add.container(x, y);
            container.setScale(scale);

            const bg = this.add.image(0, 0, 'tube_3d');
            bg.setScale(0.25);
            container.add(bg);

            const hit = new Phaser.Geom.Rectangle(-50, -180, 100, 360);
            container.setInteractive(hit, Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', (e: any) => { e.event.stopPropagation(); this.handleTubeClick(i); });

            this.tubes.push(container);
            this.tubeOriginalPositions.push({ x, y });
            this.updateTubeVisuals(i);
        }
    }

    private updateTubeVisuals(idx: number) {
        if (!this.tubes[idx]) return;
        const cont = this.tubes[idx];

        cont.getAll('name', 'liquid').forEach(o => o.destroy());
        cont.getAll('name', 'cap').forEach(o => o.destroy());

        let yPos = CONFIG.TUBE_HEIGHT / 2 - 10;
        const data = this.tubeData[idx];
        if (!data) return;

        for (let i = 0; i < data.length; i++) {
            const color = COLORS[data[i]];
            const g = this.add.graphics();
            g.name = 'liquid';
            const h = CONFIG.LIQUID_HEIGHT;
            const w = CONFIG.TUBE_WIDTH - 12;
            const lx = -w / 2;
            const ly = yPos - h;

            g.fillStyle(color, 0.95);
            if (i === 0) g.fillRoundedRect(lx, ly, w, h, { tl: 0, tr: 0, bl: 18, br: 18 });
            else g.fillRect(lx, ly, w, h);

            // Highlight
            g.fillStyle(0xFFFFFF, 0.2);
            g.fillRect(lx, ly, 8, h);

            const surf = this.add.graphics();
            surf.name = 'liquid';
            const c = Phaser.Display.Color.IntegerToColor(color);
            c.brighten(30);
            surf.fillStyle(c.color, 1);
            surf.fillEllipse(0, ly, w, 8);

            cont.add(g);
            cont.add(surf);
            yPos -= h;
        }

        if (this.completedTubes[idx]) {
            const cap = this.add.graphics();
            cap.name = 'cap';
            cap.fillStyle(0xFFD700);
            cap.fillRoundedRect(-CONFIG.TUBE_WIDTH / 2 - 2, -CONFIG.TUBE_HEIGHT / 2 - 12, CONFIG.TUBE_WIDTH + 4, 24, 6);
            cap.fillStyle(0xFFFFFF, 0.6);
            cap.fillRoundedRect(-15, -CONFIG.TUBE_HEIGHT / 2 - 12, 10, 24, 2);
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

                let lx = isRight ? halfW : -halfW;
                let ly = -(CONFIG.TUBE_HEIGHT / 2) * srcTube.scale;

                const cos = Math.cos(rad); const sin = Math.sin(rad);
                const rx = lx * cos - ly * sin; const ry = lx * sin + ly * cos;
                const startP = { x: srcTube.x + rx, y: srcTube.y + ry };

                const tgtContentH = this.tubeData[tgtIdx].length * CONFIG.LIQUID_HEIGHT;
                const endP = { x: tgtTube.x, y: tgtTube.y + (CONFIG.TUBE_HEIGHT / 2 - tgtContentH - 20) * srcTube.scale };

                // Curve
                const control = { x: (startP.x + endP.x) / 2, y: startP.y };
                const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(startP.x, startP.y), new Phaser.Math.Vector2(control.x, control.y), new Phaser.Math.Vector2(endP.x, endP.y));

                this.splashEmitter.setPosition(endP.x, endP.y);
                this.splashEmitter.setParticleTint(COLORS[color]);
                this.splashEmitter.start();

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
        if (!this.tubeData[m.target] || !this.tubeData[m.source]) return;
        for (let k = 0; k < m.count; k++) { this.tubeData[m.target].pop(); this.tubeData[m.source].push(m.color); }
        this.deselectSource();
        this.updateTubeVisuals(m.source);
        this.updateTubeVisuals(m.target);
        this.saveState();
    }

    private addExtraTube() {
        if (this.isPouring || this.hasWon) return;
        if (this.tubeCount >= this.initialTubeCount + 2) return;

        this.tubeData.push([]);
        this.completedTubes.push(false);
        this.tubeCount++;

        this.drawTubes(); // Will use new Stable Logic
        this.saveState();
        this.checkWin();

        this.audio.playPop();
        const lastIdx = this.tubeCount - 1;
        if (this.tubes[lastIdx]) {
            const t = this.tubes[lastIdx];
            t.setAlpha(0);
            t.y -= 50;
            this.tweens.add({ targets: t, alpha: 1, y: t.y + 50, duration: 400, ease: 'Back.out' });

            const burst = this.add.particles(t.x, t.y, 'particle', {
                speed: 100, scale: { start: 1, end: 0 }, lifespan: 500, quantity: 20
            });
            burst.explode();
        }
    }

    private checkWin() {
        if (this.hasWon) return;
        let fullTubes = 0;
        for (const t of this.tubeData) {
            if (t.length === 0) continue;
            if (t.length === CONFIG.MAX_CAPACITY && t.every(x => x === t[0])) fullTubes++;
            else return;
        }
        this.hasWon = true;
        this.audio.playWinSound();
        this.showWinModal();
        window.dispatchEvent(new CustomEvent('water-sort-level-complete', { detail: this.level }));
        this.time.delayedCall(4000, () => this.startLevel(this.level + 1));
    }

    private showWinModal() {
        const rect = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.9);
        rect.setInteractive();
        rect.setDepth(2000);

        const txt = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, "AWESOME!", {
            fontFamily: 'Arial Black', fontSize: '64px', color: '#FFD700',
            stroke: '#FFFFFF', strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 10, color: '#E65100', blur: 0, fill: true }
        }).setOrigin(0.5).setScale(0);
        txt.setDepth(2001);

        const sub = this.add.text(this.scale.width / 2, this.scale.height / 2 + 30, `LEVEL ${this.level} COMPLETED`, {
            fontFamily: 'Arial', fontSize: '24px', color: '#FFF'
        }).setOrigin(0.5).setAlpha(0);
        sub.setDepth(2001);

        this.winContainer = this.add.container(0, 0, [rect, txt, sub]);
        this.winContainer.setDepth(2000);

        this.tweens.add({
            targets: txt, scale: 1, duration: 800, ease: 'Elastic.out',
            onComplete: () => {
                this.tweens.add({ targets: sub, alpha: 1, duration: 400 });
                this.playConfetti();
            }
        });
    }

    private playConfetti() {
        const w = this.scale.width;
        const e = this.add.particles(w / 2, 0, 'confetti', {
            speed: { min: 300, max: 800 }, angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 }, gravityY: 250, lifespan: 4000, quantity: 60,
            emitting: false, tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]
        });
        e.setDepth(2002);
        e.explode(200, w / 2, this.scale.height / 2);
    }
}

