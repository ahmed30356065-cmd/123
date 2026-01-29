import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCwIcon, RotateCcwIcon, PlusSquareIcon, TrophyIcon, XIcon, UserIcon, CrownIcon } from '../icons';
import PhaserGameContainer from './phaser/PhaserGameContainer';
import WaterSortScene from './phaser/scenes/WaterSortScene';
import { useAppData } from '../../hooks/useAppData';
import * as firebaseService from '../../services/firebase';

interface WaterSortGameProps {
    currentUser?: any;
    onExit: () => void;
}

const GoldFrame = () => (
    <div className="absolute inset-0 border-[3px] border-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)] z-10"></div>
);
const SilverFrame = () => (
    <div className="absolute inset-0 border-[3px] border-gray-300 rounded-full shadow-[0_0_15px_rgba(209,213,219,0.5)] z-10"></div>
);
const BronzeFrame = () => (
    <div className="absolute inset-0 border-[3px] border-amber-700 rounded-full shadow-[0_0_15px_rgba(180,83,9,0.5)] z-10"></div>
);

const WaterSortGame: React.FC<WaterSortGameProps> = ({ currentUser, onExit }) => {
    const [level, setLevel] = useState(1);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const { users } = useAppData(() => { });

    useEffect(() => {
        const handleLevelComplete = (e: any) => {
            const completedLevel = e.detail;
            const nextLevel = completedLevel + 1;
            setLevel(nextLevel);
            if (currentUser && currentUser.id) {
                const currentStored = currentUser.waterSortLevel || 1;
                if (nextLevel > currentStored) {
                    firebaseService.updateData('users', currentUser.id, {
                        waterSortLevel: nextLevel
                    });
                }
            }
        };
        window.addEventListener('water-sort-level-complete', handleLevelComplete);
        return () => window.removeEventListener('water-sort-level-complete', handleLevelComplete);
    }, [currentUser]);

    useEffect(() => {
        const local = localStorage.getItem('waterSortMaxLevel');
        if (local) setLevel(parseInt(local));
        else if (currentUser?.waterSortLevel) {
            setLevel(currentUser.waterSortLevel);
            localStorage.setItem('waterSortMaxLevel', currentUser.waterSortLevel.toString());
        }
    }, [currentUser]);

    const leaders = useMemo(() => {
        if (!users || users.length === 0) return [];
        const players = users
            .filter(u => u.waterSortLevel && u.waterSortLevel > 1 && u.status === 'active')
            .map(u => ({
                id: u.id,
                name: u.name || 'Unknown',
                score: u.waterSortLevel || 1,
                image: u.storeImage || null,
                isMe: u.id === currentUser?.id
            }));
        return players.sort((a, b) => b.score - a.score).slice(0, 10);
    }, [users, currentUser]);

    const handleAction = (action: string) => {
        window.dispatchEvent(new CustomEvent('water-sort-action', { detail: action }));
    };

    return (
        <div className="w-full h-[100dvh] relative bg-[#0f1016] overflow-hidden fixed inset-0 flex flex-col font-sans select-none touching-none">

            {/* HEADER */}
            <div className="absolute top-0 left-0 right-0 p-6 z-40 flex justify-between items-start pointer-events-none">
                <button onClick={() => setShowLeaderboard(true)} className="pointer-events-auto bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-500/30 p-2.5 rounded-xl text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] active:scale-95 transition-all group">
                    <TrophyIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>

                <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-1.5 rounded-full transform translate-y-2 pointer-events-auto">
                    <span className="text-white font-black tracking-widest text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        LEVEL <span className="text-blue-400">{level}</span>
                    </span>
                </div>

                <button onClick={onExit} className="pointer-events-auto bg-white/5 backdrop-blur-md border border-white/10 p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors active:scale-95">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 relative z-10 w-full h-full">
                <PhaserGameContainer
                    scene={WaterSortScene}
                    currentUser={currentUser}
                    onLevelUp={setLevel}
                    className="absolute inset-0"
                />
            </div>

            {/* CONTROLS SAFE FLOATING ZONE 
                bottom-40 = 160px. Game padding is 300px.
                Controls sit HAPPILY in the middle of the padding.
            */}
            <div className="absolute bottom-40 left-0 right-0 px-8 flex justify-center gap-10 items-end z-50 pointer-events-auto">
                <button onClick={() => handleAction('restart')} className="group flex flex-col items-center gap-1 active:scale-90 transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-[#23263a] flex items-center justify-center shadow-lg border border-white/5 group-hover:bg-[#2a2d45] hover:border-white/20 transition-all">
                        <RefreshCwIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                </button>

                <button onClick={() => handleAction('addTube')} className="group flex flex-col items-center gap-1 -translate-y-2 active:scale-90 transition-transform">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-800 shadow-[0_8px_25px_rgba(37,99,235,0.4)] flex items-center justify-center border border-white/20">
                        <PlusSquareIcon className="w-6 h-6 text-white" />
                    </div>
                </button>

                <button onClick={() => handleAction('undo')} className="group flex flex-col items-center gap-1 active:scale-90 transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-[#23263a] flex items-center justify-center shadow-lg border border-white/5 group-hover:bg-[#2a2d45] hover:border-white/20 transition-all">
                        <RotateCcwIcon className="w-4 h-4 text-gray-400 -scale-x-100 group-hover:text-white transition-colors" />
                    </div>
                </button>
            </div>

            {showLeaderboard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1e1e2e] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
                        <div className="p-6 text-center bg-gradient-to-b from-yellow-500/10 to-transparent shrink-0">
                            <h2 className="text-2xl font-black text-white flex items-center justify-center gap-3">
                                <CrownIcon className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
                                أبطال اللعبة
                            </h2>
                            <p className="text-gray-400 text-xs mt-1">المتصدرين الحاليين</p>
                        </div>
                        <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                            {leaders.length === 0 ? (
                                <div className="text-center py-10 flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                        <UserIcon className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 text-sm">كن أول من يتصدر القائمة!</p>
                                </div>
                            ) : leaders.map((l, i) => (
                                <div key={l.id} className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${l.isMe ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] transform scale-[1.02]' : 'bg-white/5 border-white/5'}`}>
                                    <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                        {i === 0 && <GoldFrame />}
                                        {i === 1 && <SilverFrame />}
                                        {i === 2 && <BronzeFrame />}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-inner overflow-hidden ${i > 2 ? 'bg-gray-700' : 'bg-gray-900'}`}>
                                            {l.image ? (
                                                <img src={l.image} alt={l.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-5 h-5 opacity-50" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className={`font-bold text-base truncate max-w-[120px] ${l.isMe ? 'text-blue-400' : 'text-white'}`}>
                                            {l.name}
                                        </div>
                                    </div>
                                    <div className="text-right min-w-[60px]">
                                        <div className={`font-black text-xl leading-none ${i === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                            {l.score}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-white/5 shrink-0 bg-[#1e1e2e]">
                            <button onClick={() => setShowLeaderboard(false)} className="w-full py-4 bg-white/5 rounded-xl text-white font-bold hover:bg-white/10 transition-colors active:scale-95">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaterSortGame;
