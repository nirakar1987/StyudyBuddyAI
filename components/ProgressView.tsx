
import React, { useState } from 'react';
import { AppContextType, AppState, AvatarState } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { ShareIcon } from './icons/ShareIcon';
import { CheckIcon } from './icons/CheckIcon';

interface ProgressViewProps {
    context: AppContextType;
}

const ProgressView: React.FC<ProgressViewProps> = ({ context }) => {
    const { progressReport, avatarState, setAppState, studentProfile, score, streak } = context;
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyReport = () => {
        const text = `Learning Update for ${studentProfile?.name}!\n\nScore: ${score}\nStreak: ${streak} Days\n\nFull Report Summary:\n${progressReport}\n\nShared via StudyBuddy AI.`;
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-black text-[var(--color-primary)]">Learning Report</h2>
                    <p className="text-[var(--color-text-muted)] text-sm">A summary of your recent session with StudyBuddy AI</p>
                </div>
                <button
                    onClick={handleCopyReport}
                    disabled={avatarState === AvatarState.THINKING}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] text-white rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                    {isCopied ? <><CheckIcon className="w-4 h-4 text-green-400" /> Copied!</> : <><ShareIcon className="w-4 h-4" /> Share Summary</>}
                </button>
            </div>

            <div className="flex-grow bg-[var(--color-background)]/50 rounded-2xl p-6 border border-[var(--color-border)] overflow-y-auto mb-6">
                {avatarState === AvatarState.THINKING ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="relative">
                            <SparklesIcon className="w-16 h-16 text-[var(--color-primary)] animate-pulse" />
                            <div className="absolute inset-0 w-full h-full bg-[var(--color-primary)]/20 blur-xl animate-pulse"></div>
                        </div>
                        <p className="mt-6 text-[var(--color-text-secondary)] font-bold text-lg">StudyBuddy AI is writing your report...</p>
                        <p className="text-[var(--color-text-muted)] text-sm mt-2">Analyzing chat transcripts and quiz performance.</p>
                    </div>
                ) : (
                    <div className="prose prose-invert max-w-none">
                        {progressReport.split('\n').map((line, index) => {
                            if (line.startsWith('**') && line.endsWith('**')) {
                                return <h3 key={index} className="text-[var(--color-primary)] mt-6 first:mt-0 font-black">{line.replace(/\*\*/g, '')}</h3>;
                            }
                            if (line.trim() === '---') {
                                return <hr key={index} className="border-[var(--color-border)] my-6" />;
                            }
                            if (line.startsWith('* ')) {
                                return <li key={index} className="text-[var(--color-text-secondary)] ml-4 list-disc">{line.replace('* ', '')}</li>;
                            }
                            return <p key={index} className="text-[var(--color-text-secondary)] leading-relaxed">{line}</p>;
                        })}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4">
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="px-8 py-3 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-xl font-bold transition-all"
                >
                    Back Home
                </button>
            </div>
        </div>
    );
};

export default ProgressView;
