import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface PhaserGameProps {
    scene: typeof Phaser.Scene | Phaser.Scene[];
    config?: Phaser.Types.Core.GameConfig;
    onScoreChange?: (score: number) => void;
    onGameOver?: (score: number, success: boolean) => void;
    onLevelUp?: (level: number) => void;
    currentUser?: any;
    className?: string;
}

const PhaserGameContainer: React.FC<PhaserGameProps> = ({
    scene,
    config,
    onScoreChange,
    onGameOver,
    onLevelUp,
    currentUser,
    className
}) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Cleanup existing game instance if any
        if (gameRef.current) {
            gameRef.current.destroy(true);
            gameRef.current = null;
        }

        const defaultConfig: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            backgroundColor: '#00000000', // Transparent
            width: window.innerWidth,
            height: window.innerHeight,
            antialias: true, // SMOOTH EDGES
            roundPixels: false,
            resolution: window.devicePixelRatio || 1, // HIGH RES
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                    gravity: { y: 0 }
                }
            },
            scene: scene,
            // Pass React callbacks via the game registry or data object
            callbacks: {
                preBoot: (game) => {
                    game.registry.set('onScoreChange', onScoreChange);
                    game.registry.set('onGameOver', onGameOver);
                    game.registry.set('onLevelUp', onLevelUp);
                    game.registry.set('currentUser', currentUser);
                }
            }
        };

        const mergedConfig = { ...defaultConfig, ...config };
        gameRef.current = new Phaser.Game(mergedConfig);

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []); // Re-initialize only if dependencies drastically change, but usually we want to keep the game instance

    // Update registry when props change without destroying game
    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.registry.set('onScoreChange', onScoreChange);
            gameRef.current.registry.set('onGameOver', onGameOver);
            gameRef.current.registry.set('onLevelUp', onLevelUp);
            gameRef.current.registry.set('currentUser', currentUser);
        }
    }, [onScoreChange, onGameOver, onLevelUp, currentUser]);

    return (
        <div ref={containerRef} className={`w-full h-full relative ${className || ''}`} style={{ touchAction: 'none' }} />
    );
};

export default PhaserGameContainer;
