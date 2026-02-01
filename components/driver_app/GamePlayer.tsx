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
            <div className="flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-md absolute top-0 left-0 right-0 z-10 pt-safe">
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-red-600/20 text-red-500 border border-red-600/30 hover:bg-red-600 hover:text-white transition-all active:scale-95"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                <span className="text-xs font-mono text-gray-500 opacity-50">GAME MODE</span>
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
