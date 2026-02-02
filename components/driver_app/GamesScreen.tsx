import React from 'react';
import { AppConfig, Game } from '../../types';
import { ChevronRightIcon, GamepadIcon, PlayIcon, StarIcon } from '../icons';
import { downloadFileFromFirestore } from '../../services/firebase';

interface GamesScreenProps {
    driver: any;
    appConfig?: AppConfig;
    onBack?: () => void;
    onPlayGame: (url: string) => void;
}

// Simple global cache for Firestore URLs to avoid re-fetching
const imageCache: Record<string, string> = {};

const GameImage: React.FC<{ src: string; alt?: string; className?: string }> = ({ src, alt, className }) => {
    const [imgUrl, setImgUrl] = React.useState<string>(src && !src.startsWith('FIRESTORE_FILE:') ? src : (imageCache[src] || ''));
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        let isMounted = true;
        if (src && src.startsWith('FIRESTORE_FILE:') && !imageCache[src]) {
            const fileId = src.replace('FIRESTORE_FILE:', '');
            if (fileId) {
                downloadFileFromFirestore(fileId)
                    .then(url => {
                        if (isMounted && url) {
                            imageCache[src] = url; // Cache it
                            setImgUrl(url);
                        }
                    })
                    .catch(() => { if (isMounted) setError(true); });
            }
        } else if (src && !imgUrl) {
            setImgUrl(src);
        } else if (!src) {
            setError(true);
        }
        return () => { isMounted = false; };
    }, [src, imgUrl]);

    if (error || !imgUrl) {
        return (
            <div className={`${className} bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center`}>
                <GamepadIcon className="w-8 h-8 text-gray-700" />
            </div>
        );
    }

    // Ensure image is loaded properly
    return <img src={imgUrl} alt={alt} className={className} onError={() => setError(true)} loading="eager" />;
};

const GamesScreen: React.FC<GamesScreenProps> = ({ appConfig, onBack, onPlayGame }) => {
    // Redirect if games are disabled
    React.useEffect(() => {
        if (appConfig?.isGamesEnabled === false && onBack) {
            onBack();
        }
    }, [appConfig?.isGamesEnabled, onBack]);

    const games = appConfig?.games?.filter(g => g.isActive) || [];

    return (
        <div className="flex flex-col h-full bg-[#111] text-white animate-fade-in-up pb-24">
            {/* Premium Header */}
            <div className="relative z-50 overflow-hidden shadow-md border-b border-white/5 sticky top-0">
                <div className="relative z-10 flex items-center justify-between py-2 px-3">
                    <button
                        onClick={onBack}
                        className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 flex items-center justify-center cursor-pointer"
                        aria-label="Back"
                        style={{ minWidth: '32px', minHeight: '32px' }}
                    >
                        <ChevronRightIcon className="w-5 h-5 text-gray-100 rotate-180" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-black tracking-tight text-white drop-shadow-sm">
                            منطقة الألعاب
                            <span className="text-red-500 ml-1">.</span>
                        </h1>
                    </div>
                    <div className="w-8"></div> {/* Spacer */}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                {games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-slideUp">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-800 to-black border border-white/5 flex items-center justify-center mb-6 shadow-2xl shadow-black/50">
                            <GamepadIcon className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-200">لا توجد ألعاب متاحة</h3>
                        <p className="text-xs text-gray-500 mt-2 max-w-[200px]">
                            نقوم بإضافة ألعاب جديدة دورياً. يرجى التحقق لاحقاً.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 pb-safe">
                        {games.map((game, idx) => (
                            <button
                                key={game.id}
                                onClick={() => onPlayGame(game.url)}
                                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/5 shadow-lg active:scale-[0.98] transition-all duration-300 animate-fade-in-up hardware-accelerated"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* Image Layer - Full Height */}
                                <div className="absolute inset-0 z-0">
                                    <GameImage
                                        src={game.image}
                                        alt={game.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-100"
                                    />
                                </div>

                                {/* Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamesScreen;
