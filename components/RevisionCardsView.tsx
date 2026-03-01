import React, { useState, useEffect } from 'react';
import { AppState, AppContextType } from '../types';
import { getNCERTChapters, generateRevisionCards, NCERTChapter, RevisionCard } from '../services/geminiService';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface RevisionCardsViewProps {
    context: AppContextType;
}

const SUBJECTS: Record<string, string[]> = {
    '1': ['Mathematics', 'English', 'Hindi'],
    '2': ['Mathematics', 'English', 'Hindi'],
    '3': ['Mathematics', 'EVS', 'English', 'Hindi'],
    '4': ['Mathematics', 'EVS', 'English', 'Hindi'],
    '5': ['Mathematics', 'EVS', 'English', 'Hindi'],
    '6': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '7': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '8': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '9': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '10': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '11': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English'],
    '12': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English'],
};

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    key_points: { bg: 'from-blue-600 to-indigo-700', border: 'border-blue-500/30', text: 'text-blue-300', glow: 'shadow-blue-500/20' },
    formulas: { bg: 'from-purple-600 to-violet-700', border: 'border-purple-500/30', text: 'text-purple-300', glow: 'shadow-purple-500/20' },
    definitions: { bg: 'from-emerald-600 to-teal-700', border: 'border-emerald-500/30', text: 'text-emerald-300', glow: 'shadow-emerald-500/20' },
    diagram: { bg: 'from-orange-600 to-red-700', border: 'border-orange-500/30', text: 'text-orange-300', glow: 'shadow-orange-500/20' },
    mnemonics: { bg: 'from-pink-600 to-rose-700', border: 'border-pink-500/30', text: 'text-pink-300', glow: 'shadow-pink-500/20' },
    exam_questions: { bg: 'from-yellow-600 to-amber-700', border: 'border-yellow-500/30', text: 'text-yellow-300', glow: 'shadow-yellow-500/20' },
    summary: { bg: 'from-cyan-600 to-blue-700', border: 'border-cyan-500/30', text: 'text-cyan-300', glow: 'shadow-cyan-500/20' },
};

const TYPE_LABELS: Record<string, string> = {
    key_points: '📌 Key Points',
    formulas: '📐 Formulas',
    definitions: '📖 Definitions',
    diagram: '📊 Diagram',
    mnemonics: '🧠 Memory Trick',
    exam_questions: '🎯 Exam Questions',
    summary: '📋 Summary',
};

const RevisionCardsView: React.FC<RevisionCardsViewProps> = ({ context }) => {
    const { setAppState, studentProfile } = context;

    const [selectedClass, setSelectedClass] = useState<string>(String(studentProfile?.grade || '8'));
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [chapters, setChapters] = useState<NCERTChapter[]>([]);
    const [cards, setCards] = useState<RevisionCard[]>([]);
    const [currentCard, setCurrentCard] = useState(0);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [isLoadingCards, setIsLoadingCards] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'select' | 'chapters' | 'cards'>('select');
    const [chapterTitle, setChapterTitle] = useState('');
    const [showTip, setShowTip] = useState(false);

    useEffect(() => {
        if (studentProfile?.subject) {
            const match = SUBJECTS[selectedClass]?.find(s =>
                s.toLowerCase() === studentProfile.subject.toLowerCase() ||
                (s === 'Mathematics' && ['math', 'maths'].includes(studentProfile.subject.toLowerCase()))
            );
            if (match) setSelectedSubject(match);
        }
    }, [selectedClass, studentProfile]);

    const handleLoadChapters = async () => {
        if (!selectedSubject) return;
        setIsLoadingChapters(true);
        setError(null);
        try {
            const result = await getNCERTChapters(Number(selectedClass), selectedSubject);
            setChapters(result);
            setStep('chapters');
        } catch (err: any) {
            setError(err.message || 'Failed to load chapters');
        } finally {
            setIsLoadingChapters(false);
        }
    };

    const handleSelectChapter = async (chapter: NCERTChapter) => {
        setChapterTitle(chapter.title);
        setIsLoadingCards(true);
        setError(null);
        setCurrentCard(0);
        setShowTip(false);
        try {
            const result = await generateRevisionCards(Number(selectedClass), selectedSubject, chapter.title);
            setCards(result);
            setStep('cards');
        } catch (err: any) {
            setError(err.message || 'Failed to generate revision cards');
        } finally {
            setIsLoadingCards(false);
        }
    };

    const nextCard = () => {
        setShowTip(false);
        setCurrentCard(prev => Math.min(prev + 1, cards.length - 1));
    };

    const prevCard = () => {
        setShowTip(false);
        setCurrentCard(prev => Math.max(prev - 1, 0));
    };

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (step !== 'cards') return;
            if (e.key === 'ArrowRight' || e.key === ' ') nextCard();
            if (e.key === 'ArrowLeft') prevCard();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [step, cards.length, currentCard]);

    const card = cards[currentCard];
    const colors = card ? (TYPE_COLORS[card.type] || TYPE_COLORS.key_points) : TYPE_COLORS.key_points;

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <span className="text-2xl">📝</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Quick Revision</h2>
                        <p className="text-slate-400 text-xs font-medium">Swipe through cards before your exam</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (step === 'cards') { setStep('chapters'); setCards([]); }
                        else if (step === 'chapters') { setStep('select'); setChapters([]); }
                        else setAppState(AppState.DASHBOARD);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-xs uppercase tracking-widest border border-white/5"
                >
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" /> {step === 'select' ? 'Dashboard' : 'Back'}
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    ❌ {error}
                </div>
            )}

            {/* Step 1: Select Class & Subject */}
            {step === 'select' && !isLoadingChapters && (
                <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="w-full max-w-lg space-y-5">
                        <div>
                            <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-2">📚 Class</label>
                            <div className="grid grid-cols-6 gap-2">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(cls => (
                                    <button key={cls} onClick={() => { setSelectedClass(cls); setSelectedSubject(''); }}
                                        className={`py-2.5 rounded-xl font-black text-base transition-all ${selectedClass === cls
                                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30 scale-105'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-white/5'}`}
                                    >{cls}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-2">🏷️ Subject</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(SUBJECTS[selectedClass] || []).map(subject => (
                                    <button key={subject} onClick={() => setSelectedSubject(subject)}
                                        className={`p-2.5 rounded-xl font-bold text-sm transition-all ${selectedSubject === subject
                                            ? 'bg-violet-500/20 text-violet-300 border-2 border-violet-500'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-white/5'}`}
                                    >{subject}</button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleLoadChapters} disabled={!selectedSubject}
                            className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 rounded-xl text-white font-black text-base uppercase tracking-wider shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >📝 Choose Chapter</button>
                    </div>
                </div>
            )}

            {/* Loading */}
            {(isLoadingChapters || isLoadingCards) && (
                <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <SparklesIcon className="w-8 h-8 text-violet-400 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-white font-bold">{isLoadingCards ? 'Creating revision cards...' : 'Loading chapters...'}</p>
                </div>
            )}

            {/* Step 2: Chapter List */}
            {step === 'chapters' && !isLoadingChapters && !isLoadingCards && (
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {chapters.map((chapter, index) => (
                            <button key={index} onClick={() => handleSelectChapter(chapter)}
                                className="group text-left bg-slate-800/50 hover:bg-slate-700/50 p-4 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg flex-shrink-0">
                                        {chapter.chapterNumber}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="text-white font-bold text-sm group-hover:text-violet-300 transition-colors truncate">{chapter.title}</h4>
                                        <p className="text-slate-500 text-xs mt-0.5 truncate">{chapter.description}</p>
                                    </div>
                                    <span className="text-slate-600 group-hover:text-violet-400 text-xs font-bold flex-shrink-0">→</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Revision Cards */}
            {step === 'cards' && !isLoadingCards && card && (
                <div className="flex-grow flex flex-col">
                    {/* Chapter info + progress */}
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-slate-400 text-xs font-bold truncate">{chapterTitle}</p>
                        <p className="text-slate-500 text-xs font-bold flex-shrink-0">{currentCard + 1} / {cards.length}</p>
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-1.5 mb-4 justify-center">
                        {cards.map((_, i) => (
                            <button key={i} onClick={() => { setCurrentCard(i); setShowTip(false); }}
                                className={`h-2 rounded-full transition-all ${i === currentCard
                                    ? 'w-8 bg-violet-500'
                                    : i < currentCard ? 'w-2 bg-violet-500/50' : 'w-2 bg-slate-700'}`}
                            />
                        ))}
                    </div>

                    {/* Card */}
                    <div className={`flex-grow bg-gradient-to-br ${colors.bg} rounded-3xl p-6 md:p-8 shadow-2xl ${colors.glow} border ${colors.border} flex flex-col animate-fade-in overflow-y-auto custom-scrollbar`}
                        key={currentCard}
                    >
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-3xl">{card.emoji}</span>
                                <div>
                                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{TYPE_LABELS[card.type] || card.type}</p>
                                    <h3 className="text-white text-lg font-black leading-tight">{card.title}</h3>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-sm">
                                {card.cardNumber}
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="flex-grow space-y-2.5">
                            {card.content.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                    <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5">
                                        {i + 1}
                                    </div>
                                    <p className="text-white text-sm font-medium leading-relaxed">{item}</p>
                                </div>
                            ))}
                        </div>

                        {/* Exam Tip */}
                        <button
                            onClick={() => setShowTip(!showTip)}
                            className="mt-4 w-full bg-black/20 hover:bg-black/30 rounded-xl p-3 transition-all text-left"
                        >
                            <p className="text-white/70 text-xs font-bold">💡 {showTip ? 'Exam Tip:' : 'Tap to see Exam Tip'}</p>
                            {showTip && (
                                <p className="text-yellow-300 text-sm font-medium mt-1 animate-fade-in">{card.examTip}</p>
                            )}
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-4 gap-3">
                        <button onClick={prevCard} disabled={currentCard === 0}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        >← Previous</button>
                        {currentCard === cards.length - 1 ? (
                            <button onClick={() => { setStep('chapters'); setCards([]); }}
                                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-500/20"
                            >✅ Done! Pick Another</button>
                        ) : (
                            <button onClick={nextCard}
                                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl text-white font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-violet-500/20"
                            >Next →</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevisionCardsView;
