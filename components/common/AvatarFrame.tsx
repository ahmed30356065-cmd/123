import React from 'react';

// Frame Definitions
interface BaseFrameConfig {
    name: string;
    type: 'ruby' | 'rose' | 'sapphire' | 'css';
}

interface SvgFrameConfig extends BaseFrameConfig {
    type: 'ruby' | 'rose' | 'sapphire';
    color: string;
}

interface CssFrameConfig extends BaseFrameConfig {
    type: 'css';
    class: string;
}

type FrameConfig = SvgFrameConfig | CssFrameConfig;

export const FRAMES: Record<string, FrameConfig> = {
    'ruby-red': {
        name: 'الياقوت الأحمر',
        color: '#ef4444',
        type: 'ruby'
    },
    'rose-pink': {
        name: 'الوردي الملكي',
        color: '#ec4899',
        type: 'rose'
    },
    'sapphire-blue': {
        name: 'الياقوت الأزرق',
        color: '#3b82f6',
        type: 'sapphire'
    },
    'gold': {
        name: 'الذهبي',
        class: 'p-[2px] bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] shadow-[0_0_8px_rgba(252,246,186,0.4)]',
        type: 'css'
    },
    'neon': {
        name: 'نيون',
        class: 'p-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]',
        type: 'css'
    },
    'royal': {
        name: 'ملكي',
        class: 'p-[2px] bg-gradient-to-bl from-indigo-900 via-purple-500 to-indigo-900 shadow-sm border border-purple-500/30',
        type: 'css'
    },
    'fire': {
        name: 'ناري',
        class: 'p-[2px] bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]',
        type: 'css'
    }
};

interface AvatarFrameProps {
    frameId?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const AvatarFrame: React.FC<AvatarFrameProps> = ({ frameId, children, size = 'md', className = '' }) => {
    // Styling Dimensions based on size
    const dims = {
        sm: { w: 'w-10', h: 'h-10', scale: 1 },
        md: { w: 'w-14', h: 'h-14', scale: 1.2 },
        lg: { w: 'w-24', h: 'h-24', scale: 1.4 },
        xl: { w: 'w-32', h: 'h-32', scale: 1.6 }
    }[size];

    const frameConfig = FRAMES[frameId as keyof typeof FRAMES];

    // Case 1: Complex SVG Frames
    if (frameConfig?.type === 'ruby' || frameConfig?.type === 'rose' || frameConfig?.type === 'sapphire') {
        const color = frameConfig.color;
        // Adjust scale for SVG to encompass avatar
        const svgSizePercent = 160; // 160% of container
        const ringSizePercent = 140;

        return (
            <div className={`relative flex items-center justify-center ${dims.w} ${dims.h} ${className}`}>
                {/* 1. Ruby Red Frame */}
                {frameConfig.type === 'ruby' && (
                    <>
                        <svg className="absolute z-10 animate-pulse-frame" style={{ width: `${svgSizePercent}%`, height: `${svgSizePercent}%`, color: color }} viewBox="0 0 200 200">
                            <path d="M 100,15 L 103,25 L 113,27 L 105,33 L 107,43 L 100,37 L 93,43 L 95,33 L 87,27 L 97,25 Z" fill={color} />
                            <path d="M 25,100 L 28,108 L 36,110 L 30,115 L 31,123 L 25,118 L 19,123 L 20,115 L 14,110 L 22,108 Z" fill={color} style={{ animationDelay: '0.5s' }} />
                            <path d="M 175,100 L 178,108 L 186,110 L 180,115 L 181,123 L 175,118 L 169,123 L 170,115 L 164,110 L 172,108 Z" fill={color} style={{ animationDelay: '1s' }} />
                            <path d="M 100,185 L 103,193 L 111,195 L 105,200 L 106,208 L 100,203 L 94,208 L 95,200 L 89,195 L 97,193 Z" fill={color} style={{ animationDelay: '1.5s' }} />
                        </svg>
                        <div className="absolute border-2 border-red-500/40 rounded-full animate-rotate" style={{ width: `${ringSizePercent}%`, height: `${ringSizePercent}%` }}></div>
                        <div className="absolute inset-0 rounded-full border border-red-500/60 z-20 pointer-events-none"></div>
                    </>
                )}

                {/* 2. Rose Pink Frame */}
                {frameConfig.type === 'rose' && (
                    <>
                        <svg className="absolute z-10 animate-float" style={{ width: `${svgSizePercent - 10}%`, height: `${svgSizePercent - 10}%`, color: color }} viewBox="0 0 200 200">
                            <path d="M 125,30 A 35,35 0 1 1 125,80 A 26,26 0 1 0 125,30 Z" fill={color} filter={`drop-shadow(0 0 5px ${color})`} transform="rotate(-15 125 55)" />
                            <path d="M 150,40 L 153,46 L 159,48 L 154,52 L 155,58 L 150,54 L 145,58 L 146,52 L 141,48 L 147,46 Z" fill="#fce7f3" />
                        </svg>
                        <div className="absolute border-2 border-pink-500/30 rounded-full" style={{ width: `${ringSizePercent}%`, height: `${ringSizePercent}%` }}></div>
                        <div className="absolute inset-0 rounded-full border border-pink-400/50 z-20 pointer-events-none"></div>
                    </>
                )}

                {/* 3. Sapphire Blue Frame */}
                {frameConfig.type === 'sapphire' && (
                    <>
                        <div className="absolute border-[3px] border-blue-500/40 rounded-full animate-rotate" style={{ width: `${ringSizePercent - 10}%`, height: `${ringSizePercent - 10}%` }}></div>
                        <svg className="absolute z-10 animate-swing" style={{ width: '25%', height: '40%', top: '-10%', left: '-5%', color: color }} viewBox="0 0 35 55">
                            <path d="M 17.5,0 L 17.5,8 M 10,8 L 25,8 L 27,15 L 17.5,22 L 8,15 Z" fill="#1e3a8a" stroke="currentColor" strokeWidth="1" />
                            <rect x="12" y="15" width="11" height="12" fill="rgba(59, 130, 246, 0.3)" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="17.5" cy="20" r="3" fill="#bfdbfe" />
                        </svg>
                        <svg className="absolute z-10 animate-swing" style={{ width: '25%', height: '40%', top: '-10%', right: '-5%', color: color, animationDelay: '0.5s' }} viewBox="0 0 35 55">
                            <path d="M 17.5,0 L 17.5,8 M 10,8 L 25,8 L 27,15 L 17.5,22 L 8,15 Z" fill="#1e3a8a" stroke="currentColor" strokeWidth="1" />
                            <rect x="12" y="15" width="11" height="12" fill="rgba(59, 130, 246, 0.3)" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="17.5" cy="20" r="3" fill="#bfdbfe" />
                        </svg>
                        <div className="absolute inset-0 rounded-full border border-blue-500/60 z-20 pointer-events-none"></div>
                    </>
                )}

                <div className={`relative z-0 overflow-hidden rounded-full w-full h-full bg-gray-800 flex items-center justify-center`}>
                    {children}
                </div>
            </div>
        );
    }

    // Case 2: Custom Image Frame
    if (frameId?.startsWith('data:') || frameId?.startsWith('http')) {
        return (
            <div className={`relative ${dims.w} ${dims.h} flex items-center justify-center rounded-full ${className}`}>
                <img src={frameId} className="absolute inset-0 w-full h-full z-10 object-contain scale-[1.6] pointer-events-none" alt="frame" />
                <div className="w-[85%] h-[85%] rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-800 relative z-0">
                    {children}
                </div>
            </div>
        );
    }

    // Case 3: CSS/Tailwind Frames
    const cssClass = frameConfig?.type === 'css' ? frameConfig.class : '';

    // Default fallback
    return (
        <div className={`relative ${dims.w} ${dims.h} flex items-center justify-center rounded-full ${cssClass} ${className}`}>
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden relative z-0">
                {children}
            </div>
        </div>
    );
};

export default AvatarFrame;

