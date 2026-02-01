import React, { useState, useEffect } from 'react';
import * as firebaseService from '../../services/firebase';
import { User, Game } from '../../types';
import { TrophyIcon, UserIcon } from '../icons';

interface LeaderboardScreenProps {
    driver: User;
    onBack?: () => void;
}

interface LeaderboardEntry {
    userId: string;
    userName: string;
    userImage?: string;
    score: number;
    gameName: string;
    rank: number;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ driver, onBack }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterGame, setFilterGame] = useState<string>('all');

    useEffect(() => {
        const fetchScores = async () => {
            try {
                // In a real app, this would query a 'scores' collection.
                // For now, we'll simulate it by aggregating scores from all users if accessible,
                // or just showing the current user's high scores across games if backend isn't ready for global.
                // Let's assume we have a 'scores' collection.

                // Ideally: firebaseService.getCollection('scores')
                // But let's verify if we can fetch all users and their scores.
                // Simulating leaderboard from 'users' collection if 'scores' is not separate.

                const users = await firebaseService.getCollection('users') as User[];
                const allScores: LeaderboardEntry[] = [];

                users.forEach(u => {
                    // Check if user has gameScores
                    if (u.gameScores) {
                        Object.entries(u.gameScores).forEach(([gameId, score]) => {
                            allScores.push({
                                userId: u.id,
                                userName: u.name,
                                userImage: u.storeImage,
                                score: Number(score),
                                gameName: gameId === 'bounce' ? 'Bounce' : gameId, // Map IDs to names
                                rank: 0
                            });
                        });
                    }
                });

                // Sort by score descending
                allScores.sort((a, b) => b.score - a.score);

                // Assign ranks
                allScores.forEach((entry, index) => {
                    entry.rank = index + 1;
                });

                setEntries(allScores);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, []);

    const filteredEntries = filterGame === 'all'
        ? entries
        : entries.filter(e => e.gameName.toLowerCase() === filterGame.toLowerCase());

    // Unique games for filter
    const games = Array.from(new Set(entries.map(e => e.gameName)));

    return (
        <div className="fixed inset-0 bg-[#1A1A1A] z-50 flex flex-col animate-slideUp">
            <header className="flex-none flex bg-[#1A1A1A] border-b border-gray-800 h-14 items-center px-4 pt-safe box-content">
                <button onClick={onBack} className="text-white flex items-center p-2">
                    <span className="text-2xl ml-2 rotate-180">&#10140;</span>
                    <span className="font-bold">رجوع</span>
                </button>
                <div className="flex-1 text-center font-bold flex items-center justify-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-500" />
                    <span>لوحة المتصدرين</span>
                </div>
                <div className="w-8"></div> {/* Spacer for center alignment */}
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {/* Filter Chips */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setFilterGame('all')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterGame === 'all' ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}
                    >
                        الكل
                    </button>
                    {games.map(g => (
                        <button
                            key={g}
                            onClick={() => setFilterGame(g)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterGame === g ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredEntries.map((entry, index) => (
                            <div
                                key={`${entry.userId}-${entry.gameName}`}
                                className={`flex items-center p-3 rounded-xl border ${entry.userId === driver.id ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-[#252525] border-white/5'}`}
                            >
                                <div className={`w-8 h-8 flex items-center justify-center font-bold text-lg ${index < 3 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                    {index < 3 ? <TrophyIcon className={`w-6 h-6 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-amber-700'}`} /> : `#${entry.rank}`}
                                </div>

                                <div className="mx-3 relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/40">
                                        {entry.userImage ? (
                                            <img src={entry.userImage} className="w-full h-full object-cover" alt={entry.userName} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <UserIcon className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-sm text-white">{entry.userName} {entry.userId === driver.id && <span className="text-[10px] bg-yellow-500 text-black px-1.5 rounded ml-1">أنت</span>}</h3>
                                    <p className="text-[10px] text-gray-400">{entry.gameName}</p>
                                </div>

                                <div className="text-left">
                                    <span className="block font-bold text-yellow-500 text-lg">{entry.score.toLocaleString()}</span>
                                    <span className="text-[9px] text-gray-500">نقطة</span>
                                </div>
                            </div>
                        ))}

                        {filteredEntries.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p>لا توجد نتائج مسجلة حتى الآن</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardScreen;
