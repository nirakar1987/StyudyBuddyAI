import React from 'react';
import { AppContextType } from '../types';
import { TrophyIcon } from './icons/TrophyIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import ThemeSwitcher from './ThemeSwitcher';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface GamificationHeaderProps {
    context: AppContextType;
}

const GamificationHeader: React.FC<GamificationHeaderProps> = ({ context }) => {
    const { score, streak, logout } = context;
    const { playHoverSound } = useSoundEffects();

    return (
        <div className="flex items-center gap-4 bg-[var(--color-surface-light)]/50 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2" title="Your Score">
                <TrophyIcon className="w-6 h-6 text-[var(--color-accent)]" />
                <span className="text-lg font-bold text-[var(--color-text-primary)]">{score}</span>
            </div>
            <div className="w-px h-6 bg-[var(--color-border)]"></div>
            <div className="flex items-center gap-2" title="Learning Streak">
                 <div className="relative">
                    <svg className="w-6 h-6 text-[var(--color-danger)]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
                    <span className="absolute text-white text-[10px] font-bold top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{streak}</span>
                </div>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">{streak}-Day Streak</span>
            </div>
             <div className="w-px h-6 bg-[var(--color-border)]"></div>
             <ThemeSwitcher context={context} />
             <div className="w-px h-6 bg-[var(--color-border)]"></div>
             <button onClick={logout} onMouseEnter={playHoverSound} className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors" title="Logout">
                <ArrowLeftOnRectangleIcon className="w-6 h-6" />
             </button>
        </div>
    );
};

export default GamificationHeader;