import React, { useState, useRef, useEffect } from 'react';
import { AppContextType } from '../types';
import { PaintBrushIcon } from './icons/PaintBrushIcon';
import { CheckIcon } from './icons/CheckIcon';

interface ThemeSwitcherProps {
    context: AppContextType;
}

const themes = [
    { id: 'midnight-bloom', name: 'Midnight Bloom', bg: '#0a0a1a' },
    { id: 'dark', name: 'Dark', bg: '#0f172a' },
    { id: 'light', name: 'Light', bg: '#f1f5f9' },
    { id: 'sunset', name: 'Sunset', bg: '#2d1950' },
    { id: 'cosmic-doodle', name: 'Cosmic Doodle', bg: '#111827' },
    { id: 'sakura-pink', name: 'Sakura Pink', bg: '#fff0f5' },
];

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ context }) => {
    const { theme, setTheme } = context;
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleThemeSelect = async (newTheme: string) => {
        await setTheme(newTheme);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Change Theme"
            >
                <PaintBrushIcon className="w-6 h-6" />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-20 animate-fade-in" style={{ animationDuration: '200ms' }}>
                    <div className="p-2">
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => handleThemeSelect(t.id)}
                                className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-light)] rounded-md transition-colors"
                            >
                                <span className="flex items-center gap-3">
                                    <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.bg }}></span>
                                    {t.name}
                                </span>
                                {theme === t.id && <CheckIcon className="w-4 h-4 text-[var(--color-primary)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeSwitcher;