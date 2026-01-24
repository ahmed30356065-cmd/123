
import React, { useEffect, useState } from 'react';
import { RocketIcon, ChevronRightIcon, ClockIcon } from '../icons';

interface ComingSoonScreenProps {
    onBack: () => void;
    title: string;
    description: string;
}

const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({ onBack, title, description }) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
    }, []);

    return (
        <div className="fixed inset-0 bg-[#1A1A1A] z-50 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Back Button */}
            <button 
                onClick={onBack}
                className="absolute top-safe-offset right-5 p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-colors z-20 backdrop-blur-md border border-white/10"
                style={{ top: 'calc(var(--safe-area-top) + 20px)' }}
            >
                <ChevronRightIcon className="w-6 h-6" />
            </button>

            <div className={`flex flex-col items-center text-center max-w-sm transition-all duration-700 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                
                {/* Icon Container */}
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-gradient-to-tr from-red-500 to-orange-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                    <div className="w-32 h-32 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-full flex items-center justify-center border-4 border-[#333] shadow-2xl relative z-10">
                        <RocketIcon className="w-16 h-16 text-red-500 animate-bounce" />
                    </div>
                    {/* Floating Elements */}
                    <div className="absolute -top-2 -right-4 bg-[#252525] p-2 rounded-xl border border-white/5 shadow-lg animate-bounce delay-100">
                        <ClockIcon className="w-6 h-6 text-blue-400" />
                    </div>
                </div>

                <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    {title}
                </h1>
                
                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                    {description}
                    <br />
                    <span className="text-red-400 text-sm font-bold mt-2 block">نعمل على تجهيزها الآن!</span>
                </p>

                {/* Progress Bar Mockup */}
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-red-600 to-orange-500 w-[75%] rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">Work in progress</p>

            </div>
        </div>
    );
};

export default ComingSoonScreen;
