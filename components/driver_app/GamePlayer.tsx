import React, { useRef, useState, useEffect } from 'react';
import { XIcon } from '../icons';

interface GamePlayerProps {
    url: string;
    onClose: () => void;
}

const GamePlayer: React.FC<GamePlayerProps> = ({ url, onClose }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Handle Android back button
    useEffect(() => {
        const handleBackButton = () => {
            onClose();
        };

        // Push a new state to enable back button handling
        window.history.pushState({ gamePlayer: true }, '');
        window.addEventListener('popstate', handleBackButton);

        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-[#111] flex flex-col animate-fadeIn">
            {/* Header/Controls */}
            <div className="absolute top-0 right-0 left-0 flex items-center justify-between p-3 pt-safe z-[60] pointer-events-none">
                <button
                    onClick={onClose}
                    className="pointer-events-auto p-2 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 hover:bg-red-700 active:scale-90 transition-transform duration-200 border border-white/20 z-50 flex items-center justify-center cursor-pointer"
                    aria-label="Close Game"
                    style={{ minWidth: '36px', minHeight: '36px' }}
                >
                    <XIcon className="w-5 h-5" />
                </button>
                <div className="pointer-events-auto px-4 py-2 rounded-full bg-[#1a1a1a] border border-white/10 shadow-lg">
                    <span className="text-[10px] font-bold text-gray-200 uppercase tracking-widest">Web Player</span>
                </div>
            </div>

            {/* Game Frame */}
            <iframe
                ref={iframeRef}
                src={url}
                className="flex-1 w-full h-full border-none bg-transparent"
                allow="autoplay; fullscreen; vibration; gyroscope; accelerometer; clipboard-write; encrypted-media"
            />
        </div>
    );
};

export default GamePlayer;
