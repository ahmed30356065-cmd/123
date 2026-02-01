import React, { useRef, useState } from 'react';
import { XIcon } from '../icons';

interface GamePlayerProps {
    url: string;
    onClose: () => void;
}

const GamePlayer: React.FC<GamePlayerProps> = ({ url, onClose }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fadeIn">
            {/* Header/Controls */}
            <div className="absolute top-0 right-0 w-full flex items-center justify-between p-4 pt-safe z-50 pointer-events-none">
                <button
                    onClick={onClose}
                    className="pointer-events-auto p-3 rounded-full bg-red-600 text-white shadow-xl shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all border border-white/20"
                    aria-label="Close Game"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 pointer-events-auto">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Game Mode</span>
                </div>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Game Frame */}
            <iframe
                ref={iframeRef}
                src={url}
                className="flex-1 w-full h-full border-none bg-black"
                allow="autoplay; fullscreen; vibration; gyroscope; accelerometer"
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
};

export default GamePlayer;
