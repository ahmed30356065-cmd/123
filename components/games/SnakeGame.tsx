
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, RefreshCwIcon, PlayIcon, PauseIcon, TrophyIcon } from '../icons';

// Types
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

// Constants
const GRID_SIZE = 20;
const SPEED_INITIAL = 150;
const SPEED_MIN = 80;

const SnakeGame: React.FC = () => {
    // Game State
    const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Position>({ x: 15, y: 5 });
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(true); // Start paused
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [speed, setSpeed] = useState(SPEED_INITIAL);

    // Refs for safe closure access in interval/events
    const directionRef = useRef<Direction>('RIGHT');
    const moveInterval = useRef<any>(null);
    const gameBoardRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);

    // Initialize High Score
    useEffect(() => {
        try {
            const saved = localStorage.getItem('snake_highscore');
            if (saved) setHighScore(parseInt(saved));
        } catch (e) {
            console.error('Failed to load high score:', e);
        }
    }, []);

    // Sound Effects (Web Audio API)
    const playSound = (type: 'eat' | 'die' | 'move') => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'eat') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'die') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.start();
                osc.stop(ctx.currentTime + 0.5);
            }
        } catch (e) {
            // Ignore audio errors gracefully
            console.warn('Audio play failed:', e);
        }
    };

    // Game Logic
    const generateFood = useCallback((): Position => {
        return {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    }, []);

    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]);
        setFood(generateFood());
        setDirection('RIGHT');
        directionRef.current = 'RIGHT';
        setScore(0);
        setSpeed(SPEED_INITIAL);
        setIsGameOver(false);
        setIsPaused(false);
    };

    const handleGameOver = () => {
        setIsGameOver(true);
        setIsPaused(true);
        playSound('die');
        if (score > highScore) {
            setHighScore(score);
            try {
                localStorage.setItem('snake_highscore', score.toString());
            } catch (e) {
                console.error('Failed to save high score:', e);
            }
        }
    };

    const moveSnake = useCallback(() => {
        if (isPaused || isGameOver) return;

        setSnake(prevSnake => {
            const head = { ...prevSnake[0] };

            switch (directionRef.current) {
                case 'UP': head.y -= 1; break;
                case 'DOWN': head.y += 1; break;
                case 'LEFT': head.x -= 1; break;
                case 'RIGHT': head.x += 1; break;
            }

            // Check Wall Collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                handleGameOver();
                return prevSnake;
            }

            // Check Self Collision
            if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
                handleGameOver();
                return prevSnake;
            }

            const newSnake = [head, ...prevSnake];

            // Check Food Collision
            if (head.x === food.x && head.y === food.y) {
                setScore(s => {
                    const newScore = s + 10;
                    if (newScore % 50 === 0) setSpeed(sp => Math.max(SPEED_MIN, sp - 5));
                    return newScore;
                });
                setFood(generateFood());
                playSound('eat');
            } else {
                newSnake.pop(); // Remove tail
            }

            return newSnake;
        });
    }, [food, isGameOver, isPaused, generateFood]);

    // Input Handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGameOver) return;
            const key = e.key;

            const current = directionRef.current;
            if (key === 'ArrowUp' && current !== 'DOWN') directionRef.current = 'UP';
            else if (key === 'ArrowDown' && current !== 'UP') directionRef.current = 'DOWN';
            else if (key === 'ArrowLeft' && current !== 'RIGHT') directionRef.current = 'LEFT';
            else if (key === 'ArrowRight' && current !== 'LEFT') directionRef.current = 'RIGHT';
            else if (key === ' ') setIsPaused(p => !p);

            setDirection(directionRef.current); // Sync state for UI
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameOver]);

    // Touch Handling
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };

        const deltaX = touchEnd.x - touchStartRef.current.x;
        const deltaY = touchEnd.y - touchStartRef.current.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal
            if (Math.abs(deltaX) > 30) {
                if (deltaX > 0 && directionRef.current !== 'LEFT') directionRef.current = 'RIGHT';
                else if (deltaX < 0 && directionRef.current !== 'RIGHT') directionRef.current = 'LEFT';
            }
        } else {
            // Vertical
            if (Math.abs(deltaY) > 30) {
                if (deltaY > 0 && directionRef.current !== 'UP') directionRef.current = 'DOWN';
                else if (deltaY < 0 && directionRef.current !== 'DOWN') directionRef.current = 'UP';
            }
        }
        setDirection(directionRef.current);
        touchStartRef.current = null;
    };

    // Game Loop
    useEffect(() => {
        if (moveInterval.current) clearInterval(moveInterval.current);
        moveInterval.current = setInterval(moveSnake, speed);
        return () => clearInterval(moveInterval.current);
    }, [moveSnake, speed]);

    // Render Grid
    const renderGrid = () => {
        const grid = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                let isSnake = false;
                let isHead = false;
                let isFood = (food.x === x && food.y === y);

                snake.forEach((s, index) => {
                    if (s.x === x && s.y === y) {
                        isSnake = true;
                        if (index === 0) isHead = true;
                    }
                });

                let cellClass = 'w-full h-full border-[0.5px] border-gray-800/30 rounded-[2px] transition-all duration-100 ease-linear';

                if (isHead) cellClass += ' bg-green-400 shadow-[0_0_15px_#4ade80] z-10 scale-105';
                else if (isSnake) cellClass += ' bg-green-600/80 shadow-[0_0_5px_#16a34a]';
                else if (isFood) cellClass += ' bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse rounded-full scale-90';
                else cellClass += ' bg-transparent';

                grid.push(<div key={`${x}-${y}`} className={cellClass}></div>);
            }
        }
        return grid;
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[50vh] h-full w-full bg-[#0a0a0a] text-white">
            {/* Header / Stats */}
            <div className="w-full max-w-sm flex justify-between items-center mb-4 px-2">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] font-bold tracking-widest">SCORE</span>
                    <span className="text-2xl font-black text-white font-mono">{score.toString().padStart(4, '0')}</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-gray-500 text-[10px] font-bold tracking-widest flex items-center gap-1">
                        <TrophyIcon className="w-3 h-3 text-yellow-500" /> HIGH
                    </span>
                    <span className="text-xl font-bold text-yellow-500 font-mono">{highScore.toString().padStart(4, '0')}</span>
                </div>
            </div>

            {/* Game Board */}
            <div
                ref={gameBoardRef}
                className="relative w-full max-w-[350px] aspect-square bg-gray-900 rounded-xl border-2 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)] overflow-hidden touch-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Grid Overlay */}
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
                    {renderGrid()}
                </div>

                {/* Overlays */}
                {isGameOver && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fadeIn">
                        <h2 className="text-3xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">GAME OVER</h2>
                        <p className="text-gray-400 mb-6">Score: {score}</p>
                        <button onClick={resetGame} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            <RefreshCwIcon className="w-5 h-5" /> TRY AGAIN
                        </button>
                    </div>
                )}

                {isPaused && !isGameOver && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                        {score === 0 ? (
                            <button onClick={resetGame} className="flex flex-col items-center gap-2 animate-bounce">
                                <PlayIcon className="w-16 h-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                                <span className="font-bold text-sm tracking-widest">TAP TO START</span>
                            </button>
                        ) : (
                            <button onClick={() => setIsPaused(false)} className="flex flex-col items-center gap-2">
                                <PlayIcon className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                                <span className="font-bold text-sm tracking-widest">RESUME</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Controls Info / Pause Button */}
            <div className="mt-8 flex gap-8 items-center">
                <button
                    onClick={() => setIsPaused(p => !p)}
                    className="p-4 rounded-full bg-gray-800 text-white border border-gray-700 active:bg-gray-700 transition"
                    disabled={isGameOver}
                >
                    {isPaused && score > 0 ? <PlayIcon className="w-6 h-6" /> : <PauseIcon className="w-6 h-6" />}
                </button>

                {/* D-Pad for precision (optional but requested 'professional') */}
                <div className="grid grid-cols-3 gap-1">
                    <div></div>
                    <button className="p-3 bg-gray-800 rounded-lg active:bg-green-600/50 transition border border-gray-700" onClick={() => { if (directionRef.current !== 'DOWN') directionRef.current = 'UP'; setDirection('UP'); }}><ArrowUpIcon className="w-5 h-5" /></button>
                    <div></div>

                    <button className="p-3 bg-gray-800 rounded-lg active:bg-green-600/50 transition border border-gray-700" onClick={() => { if (directionRef.current !== 'RIGHT') directionRef.current = 'LEFT'; setDirection('LEFT'); }}><ArrowLeftIcon className="w-5 h-5" /></button>
                    <div className="w-11 h-11 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800"><div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]"></div></div>
                    <button className="p-3 bg-gray-800 rounded-lg active:bg-green-600/50 transition border border-gray-700" onClick={() => { if (directionRef.current !== 'LEFT') directionRef.current = 'RIGHT'; setDirection('RIGHT'); }}><ArrowRightIcon className="w-5 h-5" /></button>

                    <div></div>
                    <button className="p-3 bg-gray-800 rounded-lg active:bg-green-600/50 transition border border-gray-700" onClick={() => { if (directionRef.current !== 'UP') directionRef.current = 'DOWN'; setDirection('DOWN'); }}><ArrowDownIcon className="w-5 h-5" /></button>
                    <div></div>
                </div>
            </div>

            <p className="mt-4 text-[10px] text-gray-600 font-mono text-center">
                Swipe or use buttons to move • Tap space to pause
            </p>
        </div>
    );
};

export default SnakeGame;
