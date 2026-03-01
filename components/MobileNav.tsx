import React from 'react';
import { AppState, StudentProfile } from '../types';
import { useSoundEffects } from '../hooks/useSoundEffects';
// Icons are used inline as SVGs to avoid extra dependencies

// Using the icons from your existing icon set if available, or generic span if not
// Checking App.tsx imports: import { SparklesIcon } from './components/icons/SparklesIcon';
// You have custom icons in components/icons/. I should use those or simpler SVGs.
// I'll check available icons first.

interface MobileNavProps {
    appState: AppState;
    setAppState: (state: AppState) => void;
    studentProfile: StudentProfile | null;
}

const MobileNav: React.FC<MobileNavProps> = ({ appState, setAppState, studentProfile }) => {
    const { playHoverSound } = useSoundEffects();
    if (!studentProfile || appState === AppState.PROFILE_SETUP) return null;

    const navItems = [
        {
            label: 'Home',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            ),
            state: AppState.DASHBOARD
        },
        {
            label: 'Chat',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.159 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
            ),
            state: AppState.GLOBAL_CHAT
        },
        {
            label: 'Parent',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
            ),
            state: AppState.PARENT_NOTIFICATIONS
        },
        {
            label: 'Profile',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            ),
            state: AppState.PROFILE_SETUP
        }
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-[var(--color-surface)]/90 backdrop-blur-md border-t border-white/10 z-50 pb-safe">
            <div className="flex justify-around items-center p-3">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => setAppState(item.state)}
                        onMouseEnter={playHoverSound}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${appState === item.state
                            ? 'text-[var(--color-primary)] bg-white/5'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        {item.icon}
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MobileNav;
