import React, { useState } from 'react';
import { AppConfig, Game } from '../../types';
import { XIcon, PlusIcon, GamepadIcon, TrashIcon, EditIcon, ExternalLinkIcon, ImageIcon } from '../icons';
import { uploadFile, downloadFileFromFirestore } from '../../services/firebase';

interface GamesManagerProps {
    appConfig?: AppConfig;
    onUpdateAppConfig: (config: AppConfig) => void;
}

const GameImage: React.FC<{ src: string; alt?: string; className?: string }> = ({ src, alt, className }) => {
    const [imgUrl, setImgUrl] = React.useState(src);

    React.useEffect(() => {
        let isMounted = true;
        if (src && src.startsWith('FIRESTORE_FILE:')) {
            const fileId = src.replace('FIRESTORE_FILE:', '');
            downloadFileFromFirestore(fileId)
                .then(url => {
                    if (isMounted) setImgUrl(url);
                })
                .catch(err => {
                    console.error("Failed to load image:", err);
                });
        } else {
            setImgUrl(src);
        }
        return () => { isMounted = false; };
    }, [src]);

    return <img src={imgUrl} alt={alt} className={className} />;
};

const GamesManager: React.FC<GamesManagerProps> = ({ appConfig, onUpdateAppConfig }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const [formData, setFormData] = useState<Partial<Game>>({ isActive: true });

    // Ensure games array exists
    const games = appConfig?.games || [];

    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadFile(file, 'game_images');
            setFormData(prev => ({ ...prev, image: url }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("فشل رفع الصورة. يرجى المحاولة مرة أخرى.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        if (!formData.name || !formData.url || !formData.image) return;

        let updatedGames = [...games];

        if (editingGame) {
            // Edit
            updatedGames = updatedGames.map(g => g.id === editingGame.id ? { ...g, ...formData } as Game : g);
        } else {
            // Add
            const newGame: Game = {
                id: Date.now().toString(),
                name: formData.name,
                url: formData.url,
                image: formData.image,
                isActive: formData.isActive ?? true,
                createdAt: new Date(),
                playCount: 0
            };
            updatedGames.push(newGame);
        }

        onUpdateAppConfig({ ...appConfig, appName: appConfig?.appName || '', appVersion: appConfig?.appVersion || '', games: updatedGames });
        setIsAddModalOpen(false);
        setEditingGame(null);
        setFormData({ isActive: true });
        setUploading(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذه اللعبة؟')) {
            const updatedGames = games.filter(g => g.id !== id);
            onUpdateAppConfig({ ...appConfig, appName: appConfig?.appName || '', appVersion: appConfig?.appVersion || '', games: updatedGames });
        }
    };

    const openEdit = (game: Game) => {
        setEditingGame(game);
        setFormData(game);
        setIsAddModalOpen(true);
    };

    return (
        <div className="flex flex-col h-full text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                    <h2 className="text-2xl font-black">إدارة الألعاب</h2>
                    <p className="text-sm text-gray-500">إضافة وتعديل روابط الألعاب</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Master Switch */}
                    <div className="flex items-center gap-3 bg-[#252525] px-4 py-2 rounded-xl border border-white/5">
                        <span className={`text-xs font-bold ${appConfig?.isGamesEnabled !== false ? 'text-green-400' : 'text-gray-500'}`}>
                            {appConfig?.isGamesEnabled !== false ? 'مفعل' : 'معطل'}
                        </span>
                        <button
                            onClick={() => onUpdateAppConfig({ ...appConfig, appName: appConfig?.appName || '', appVersion: appConfig?.appVersion || '', isGamesEnabled: !(appConfig?.isGamesEnabled ?? true) })}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${appConfig?.isGamesEnabled !== false ? 'bg-green-600' : 'bg-gray-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appConfig?.isGamesEnabled !== false ? 'translate-x-[-24px]' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <button
                        onClick={() => { setEditingGame(null); setFormData({ isActive: true }); setIsAddModalOpen(true); }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors font-bold"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>إضافة لعبة</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6">
                {games.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <GamepadIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>لا توجد ألعاب مضافة</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {games.map(game => (
                            <div key={game.id} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden group hover:border-red-500/50 transition-all">
                                <div className="aspect-video relative">
                                    <GameImage src={game.image} alt={game.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => openEdit(game)} className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(game.id)} className="p-2 bg-red-600 text-white rounded-full hover:scale-110 transition-transform"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                    {!game.isActive && <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">غير نشط</div>}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-1">{game.name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                                        <ExternalLinkIcon className="w-3 h-3" />
                                        <a href={game.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-400">{game.url}</a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#222] border border-gray-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="font-bold">{editingGame ? 'تعديل لعبة' : 'إضافة لعبة جديدة'}</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><XIcon className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">اسم اللعبة</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#111] border border-gray-700 rounded-xl px-3 py-2 text-sm focus:border-red-500 outline-none transition-colors"
                                    placeholder="مثال: Flappy Bird"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">رابط اللعبة (URL)</label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={formData.url || ''}
                                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                                        className="w-full bg-[#111] border border-gray-700 rounded-xl pl-10 pr-3 py-2 text-sm focus:border-red-500 outline-none transition-colors dir-ltr"
                                        placeholder="https://..."
                                        style={{ direction: 'ltr' }}
                                    />
                                    <GamepadIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">صورة الغلاف</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />

                                {formData.image ? (
                                    <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-700 group">
                                        <GameImage src={formData.image} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-3 py-1 bg-white text-black text-xs font-bold rounded-lg"
                                            >
                                                تغيير
                                            </button>
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg"
                                            >
                                                حذف
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-gray-500 hover:bg-white/5 transition-all text-gray-500"
                                    >
                                        {uploading ? (
                                            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <ImageIcon className="w-8 h-8" />
                                                <span className="text-sm font-bold">اضغط لرفع صورة</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-xl border border-gray-800">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive ?? true}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 accent-red-600"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium cursor-pointer select-none">تفعيل اللعبة</label>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-700 flex gap-3">
                            <button onClick={handleSave} disabled={uploading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                                {uploading ? 'جاري الرفع...' : 'حفظ'}
                            </button>
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-xl transition-colors">
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamesManager;
