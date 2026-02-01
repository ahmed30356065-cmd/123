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

const GameImage: React.FC<{ src: string; alt?: string; className?: string }> = ({ src, alt, className }) => {
    const [imgUrl, setImgUrl] = React.useState<string>('');
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        let isMounted = true;
        if (src && src.startsWith('FIRESTORE_FILE:')) {
            const fileId = src.replace('FIRESTORE_FILE:', '');
            if (fileId) {
                downloadFileFromFirestore(fileId)
                    .then(url => { if (isMounted && url) setImgUrl(url); })
                    .catch(() => { if (isMounted) setError(true); });
            }
        } else if (src) {
            setImgUrl(src);
        } else {
            setError(true);
        }
        return () => { isMounted = false; };
    }, [src]);

    if (error || !imgUrl) {
        return (
            <div className={`${className} bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center`}>
                <GamepadIcon className="w-8 h-8 text-gray-700" />
            </div>
        );
    }

    return <img src={imgUrl} alt={alt} className={className} onError={() => setError(true)} />;
};

const GamesScreen: React.FC<GamesScreenProps> = ({ appConfig, onBack, onPlayGame }) => {
    const games = appConfig?.games?.filter(g => g.isActive) || [];

    return (
        <div className="flex flex-col min-h-screen bg-[#111] text-white pb-24 animate-fadeIn">
            {/* Premium Header */}
            <div className="relative z-50 overflow-hidden bg-[#1a1a1a] shadow-xl border-b border-white/5 pt-safe sticky top-0">
                <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-transparent" />
                <div className="relative z-10 flex items-center justify-between p-4">
                    <button
                        onClick={onBack}
                        className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 flex items-center justify-center cursor-pointer"
                        aria-label="Back"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                        <ChevronRightIcon className="w-6 h-6 text-gray-100 rotate-180" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl font-black tracking-tight text-white drop-shadow-sm">
                            منطقة الألعاب
                            <span className="text-red-500 ml-1">.</span>
                        </h1>
                    </div>
                    <div className="w-10"></div> {/* Spacer */}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 flex-1">
                {games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-slideUp">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-800 to-black border border-white/5 flex items-center justify-center mb-6 shadow-2xl shadow-black/50">
                            <GamepadIcon className="w-12 h-12 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-200">لا توجد ألعاب متاحة</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-[200px]">
                            نقوم بإضافة ألعاب جديدة دورياً. يرجى التحقق لاحقاً.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {games.map((game, idx) => (
                            <button
                                key={game.id}
                                onClick={() => onPlayGame(game.url)}
                                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#202020] border border-white/5 shadow-lg active:scale-[0.98] transition-all duration-300 animate-slideUp"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* Image Layer */}
                                <div className="absolute inset-0 z-0">
                                    <GameImage
                                        src={game.image}
                                        alt={game.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-60"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                </div>

                                {/* Content Layer */}
                                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-start z-10">
                                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center mb-3 shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform duration-300">
                                        <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                                    </div>
                                    <h3 className="font-bold text-white text-lg leading-tight drop-shadow-md text-right w-full line-clamp-2">
                                        {game.name}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-black bg-white/90 px-2 py-0.5 rounded-full shadow-sm">
                                            العب الآن
                                        </span>
                                        {idx < 2 && (
                                            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                                                <StarIcon className="w-3 h-3" />
                                                جديد
                                            </span>
                                        )}
                                    </div>
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
