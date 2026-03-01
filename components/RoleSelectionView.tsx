import React from 'react';
import { AppContextType, AppState } from '../types';
import { useSoundEffects } from '../hooks/useSoundEffects';

const RoleSelectionView: React.FC<{ context: AppContextType }> = ({ context }) => {
  const { setAppState } = context;
  const { playHoverSound } = useSoundEffects();

  return (
    <div className="fixed inset-0 min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-4 overflow-hidden z-[100]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      <div className="relative z-10 w-full max-w-lg text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Create your profile</h1>
        <p className="text-slate-400 mb-10">Are you signing up as a student or a parent?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => { playHoverSound(); setAppState(AppState.PROFILE_SETUP); }}
            onMouseEnter={playHoverSound}
            className="p-8 rounded-2xl border-2 border-cyan-500/50 bg-cyan-900/20 hover:bg-cyan-800/30 hover:border-cyan-400 transition-all text-left group"
          >
            <span className="text-5xl block mb-3">📚</span>
            <h2 className="text-xl font-bold text-white mb-1">Student</h2>
            <p className="text-sm text-slate-400">I want to learn, take quizzes, and use StudyBuddy.</p>
          </button>
          <button
            onClick={() => { playHoverSound(); setAppState(AppState.PARENT_PROFILE_SETUP); }}
            onMouseEnter={playHoverSound}
            className="p-8 rounded-2xl border-2 border-emerald-500/50 bg-emerald-900/20 hover:bg-emerald-800/30 hover:border-emerald-400 transition-all text-left group"
          >
            <span className="text-5xl block mb-3">👨‍👩‍👧</span>
            <h2 className="text-xl font-bold text-white mb-1">Parent</h2>
            <p className="text-sm text-slate-400">I want to see my child&apos;s activity and set up WhatsApp/Telegram.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionView;
