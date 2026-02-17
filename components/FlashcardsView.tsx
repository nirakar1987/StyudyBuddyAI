
import React, { useState, useEffect } from 'react';
import { AppState, AppContextType, AvatarState } from '../types';
import { generateFlashcards, Flashcard } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';

interface FlashcardsViewProps {
    context: AppContextType;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ context }) => {
    const { setAppState, setAvatarState, studentProfile } = context;
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [topic, setTopic] = useState<string>('');

    // Identify weak topics for suggestions
    const weakTopics = Object.entries(studentProfile?.topic_performance || {})
        .filter(([, status]) => status === 'weak')
        .map(([topic]) => topic);

    const handleGenerate = async (selectedTopic: string) => {
        if (!studentProfile) return;
        setIsLoading(true);
        setTopic(selectedTopic);
        setAvatarState(AvatarState.THINKING);

        try {
            const cards = await generateFlashcards(selectedTopic, studentProfile);
            setFlashcards(cards);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (error) {
            console.error("Failed to generate flashcards:", error);
            alert("Could not generate flashcards. Please try again.");
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.IDLE);
        }
    };

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 300);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }, 300);
    };

    return (
        <div className="flex flex-col h-full p-6 animate-fade-in relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-3">
                        <SparklesIcon className="w-8 h-8 text-pink-400" />
                        AI Flashcards
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Master your weak topics with quick revision</p>
                </div>
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all font-bold border border-slate-700"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Back
                </button>
            </div>

            {flashcards.length === 0 ? (
                // Topic Selection View
                <div className="flex-grow flex flex-col items-center justify-center max-w-4xl mx-auto w-full z-10">
                    {isLoading ? (
                        <div className="text-center">
                            <div className="w-20 h-20 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-6"></div>
                            <h3 className="text-2xl font-bold text-white mb-2">Creating Flashcards...</h3>
                            <p className="text-slate-400">AI is maximizing your retention for <span className="text-pink-400">{topic}</span></p>
                        </div>
                    ) : (
                        <div className="w-full">
                            <h3 className="text-xl font-bold text-white mb-6 text-center">What do you want to review today?</h3>

                            {weakTopics.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                        Recommended (Weak Areas)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {weakTopics.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => handleGenerate(t)}
                                                className="p-6 bg-gradient-to-br from-red-500/10 to-pink-500/10 hover:from-red-500/20 hover:to-pink-500/20 border border-red-500/20 hover:border-red-500/50 rounded-2xl text-left transition-all group hover:scale-[1.02]"
                                            >
                                                <div className="font-bold text-lg text-red-200 group-hover:text-white mb-1">{t}</div>
                                                <div className="text-xs text-red-400/70 font-mono">Needs Improvement</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Or choose a custom topic</h4>
                                <div className="flex gap-2 max-w-md mx-auto">
                                    <input
                                        type="text"
                                        placeholder="e.g. Newton's Laws, World War II..."
                                        className="flex-grow bg-slate-800 border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleGenerate((e.target as HTMLInputElement).value);
                                        }}
                                    />
                                    <button
                                        className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                                        onClick={(e) => {
                                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement).value;
                                            if (input) handleGenerate(input);
                                        }}
                                    >
                                        Go
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Flashcards View
                <div className="flex-grow flex flex-col items-center justify-center relative z-10 max-w-3xl mx-auto w-full">
                    <div className="w-full flex justify-between items-center mb-6 px-4">
                        <span className="text-slate-400 font-mono text-sm">
                            Card {currentIndex + 1} / {flashcards.length}
                        </span>
                        <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-bold border border-pink-500/30">
                            {flashcards[currentIndex].category}
                        </span>
                    </div>

                    <div
                        className="w-full aspect-[16/10] perspective-1000 cursor-pointer group"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center p-8 text-center group-hover:border-pink-500/30 transition-colors">
                                <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">
                                    {flashcards[currentIndex].front}
                                </h3>
                                <p className="mt-8 text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">
                                    Tap to flip
                                </p>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col items-center justify-center p-8 text-center">
                                <p className="text-xl md:text-2xl font-medium text-slate-100 leading-relaxed">
                                    {flashcards[currentIndex].back}
                                </p>
                                <div className="mt-8 flex gap-4">
                                    <button
                                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-bold hover:bg-green-500/30 border border-green-500/30 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNext();
                                        }}
                                    >
                                        Got it (Easy)
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 border border-red-500/30 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNext();
                                        }}
                                    >
                                        Review Later (Hard)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={handlePrev}
                            className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50"
                            disabled={currentIndex === 0}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleNext}
                            className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .rotate-y-0 { transform: rotateY(0deg); }
            `}</style>
        </div>
    );
};

export default FlashcardsView;
