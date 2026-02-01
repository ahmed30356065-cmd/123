import React from 'react';
import { AppConfig, Game, AppTheme } from '../../types';
import { ChevronRightIcon, GamepadIcon, PlayIcon } from '../icons';

interface GamesScreenProps {
    driver: any;
    appConfig?: AppConfig;
    onBack?: () => void;
    onPlayGame: (url: string) => void;
}

import { downloadFileFromFirestore } from '../../services/firebase';

const GameImage: React.FC<{ src: string; alt?: string; className?: string }> = ({ src, alt, className }) => {
    const [imgUrl, setImgUrl] = React.useState(src);

    React.useEffect(() => {
        let isMounted = true;
        if (src && src.startsWith('FIRESTORE_FILE:')) {
            const fileId = src.replace('FIRESTORE_FILE:', '');
            // Only try to download if we have a valid ID
            if (fileId) {
                downloadFileFromFirestore(fileId)
                    .then(url => {
                        if (isMounted && url) setImgUrl(url);
                    })
                    .catch(err => {
                        console.error("Failed to load game image:", err);
                    });
            }
        } else {
            setImgUrl(src);
        }
        return () => { isMounted = false; };
    }, [src]);

    return <img src={imgUrl} alt={alt} className={className} />;
};

const GamesScreen: React.FC<GamesScreenProps> = ({ appConfig, onBack, onPlayGame }) => {
    const games = appConfig?.games?.filter(g => g.isActive) || [];

    return (
        <div className="flex flex-col min-h-screen pb-24 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-safe">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full bg-white/5 text-white border border-white/10 active:scale-95 transition-all"
                >
                    <ChevronRightIcon className="w-5 h-5 rotate-180" />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black text-white">مركز الألعاب</h1>
                    <p className="text-xs text-gray-400">استمتع بوقتك أثناء الانتظار</p>
                </div>
                <div className="w-9"></div> {/* Spacer */}
            </div>

            <div className="px-4 py-2">
                {games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <GamepadIcon className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-300">لا توجد ألعاب حالياً</h3>
                        <p className="text-sm text-gray-500 mt-2">سيتم إضافة ألعاب جديدة قريباً</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {games.map((game) => (
                            <button
                                key={game.id}
                                onClick={() => onPlayGame(game.url)}
                                className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-[#252525] hover:scale-[1.02] transition-all duration-300 active:scale-95 text-right w-full"
                            >
                                <GameImage
                                    src={game.image}
                                    alt={game.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-50"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-start gap-1">
                                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center mb-1 shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform">
                                        <PlayIcon className="w-4 h-4 text-white ml-0.5" />
                                    </div>
                                    <h3 className="font-bold text-white text-base leading-tight drop-shadow-md">{game.name}</h3>
                                    <span className="text-[10px] text-gray-300 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">العب الآن</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamesScreen;
