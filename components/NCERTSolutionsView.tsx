import React, { useState, useEffect } from 'react';
import { AppState, AppContextType } from '../types';
import { getNCERTChapters, getNCERTExerciseAnswers, NCERTChapter, NCERTAnswer } from '../services/geminiService';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface NCERTSolutionsViewProps {
    context: AppContextType;
}

const SUBJECTS: Record<string, string[]> = {
    '6': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '7': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '8': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '9': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '10': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'],
    '11': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Accountancy', 'Economics', 'Business Studies'],
    '12': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Accountancy', 'Economics', 'Business Studies'],
};

const SUBJECT_EMOJIS: Record<string, string> = {
    'Mathematics': '📐', 'Science': '🔬', 'Social Science': '🌍', 'English': '📖', 'Hindi': '🕉️',
    'Physics': '⚛️', 'Chemistry': '🧪', 'Biology': '🧬', 'Accountancy': '📊', 'Economics': '💹', 'Business Studies': '💼',
};

const NCERTSolutionsView: React.FC<NCERTSolutionsViewProps> = ({ context }) => {
    const { setAppState, studentProfile } = context;

    const [selectedClass, setSelectedClass] = useState<string>(String(studentProfile?.grade || '8'));
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [chapters, setChapters] = useState<NCERTChapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<NCERTChapter | null>(null);
    const [answers, setAnswers] = useState<NCERTAnswer[]>([]);
    const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({});
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'select' | 'chapters' | 'answers'>('select');

    // Auto-set subject from profile
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
        setSelectedChapter(chapter);
        setIsLoadingAnswers(true);
        setError(null);
        setExpandedAnswers({});
        try {
            const result = await getNCERTExerciseAnswers(Number(selectedClass), selectedSubject, chapter.title);
            setAnswers(result);
            setStep('answers');
        } catch (err: any) {
            setError(err.message || 'Failed to load answers');
        } finally {
            setIsLoadingAnswers(false);
        }
    };

    const toggleAnswer = (index: number) => {
        setExpandedAnswers(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const expandAll = () => {
        const all: Record<number, boolean> = {};
        answers.forEach((_, i) => { all[i] = true; });
        setExpandedAnswers(all);
    };

    const collapseAll = () => setExpandedAnswers({});

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <span className="text-3xl">📋</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">NCERT Solutions</h2>
                        <p className="text-slate-400 text-sm font-medium">Chapter-wise textbook answers with explanations</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (step === 'answers') { setStep('chapters'); setAnswers([]); setSelectedChapter(null); }
                        else if (step === 'chapters') { setStep('select'); setChapters([]); }
                        else setAppState(AppState.DASHBOARD);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-xs uppercase tracking-widest border border-white/5"
                >
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" /> {step === 'select' ? 'Dashboard' : 'Back'}
                </button>
            </div>

            {/* Breadcrumb */}
            {step !== 'select' && (
                <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
                    <span className="text-slate-500 cursor-pointer hover:text-white transition-colors" onClick={() => { setStep('select'); setChapters([]); setAnswers([]); }}>Class {selectedClass}</span>
                    <span className="text-slate-600">›</span>
                    <span className={`${step === 'chapters' ? 'text-emerald-400 font-bold' : 'text-slate-500 cursor-pointer hover:text-white transition-colors'}`}
                        onClick={() => { if (step === 'answers') { setStep('chapters'); setAnswers([]); } }}>
                        {SUBJECT_EMOJIS[selectedSubject] || '📚'} {selectedSubject}
                    </span>
                    {step === 'answers' && selectedChapter && (
                        <>
                            <span className="text-slate-600">›</span>
                            <span className="text-emerald-400 font-bold">Ch. {selectedChapter.chapterNumber}: {selectedChapter.title}</span>
                        </>
                    )}
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    <p className="font-bold mb-1">❌ Error</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Step 1: Select Class & Subject */}
            {step === 'select' && !isLoadingChapters && (
                <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="w-full max-w-lg space-y-6">
                        {/* Class Picker */}
                        <div>
                            <label className="block text-sm font-black text-slate-300 uppercase tracking-widest mb-3">📚 Select Class</label>
                            <div className="grid grid-cols-7 gap-2">
                                {['6', '7', '8', '9', '10', '11', '12'].map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => { setSelectedClass(cls); setSelectedSubject(''); }}
                                        className={`py-3 rounded-xl font-black text-lg transition-all ${selectedClass === cls
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                                            }`}
                                    >
                                        {cls}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subject Picker */}
                        <div>
                            <label className="block text-sm font-black text-slate-300 uppercase tracking-widest mb-3">🏷️ Select Subject</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(SUBJECTS[selectedClass] || []).map(subject => (
                                    <button
                                        key={subject}
                                        onClick={() => setSelectedSubject(subject)}
                                        className={`flex items-center gap-2 p-3 rounded-xl font-bold text-sm transition-all ${selectedSubject === subject
                                            ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                                            }`}
                                    >
                                        <span className="text-xl">{SUBJECT_EMOJIS[subject] || '📚'}</span>
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Go Button */}
                        <button
                            onClick={handleLoadChapters}
                            disabled={!selectedSubject}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl text-white font-black text-lg uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            📖 Show Chapters
                        </button>
                    </div>
                </div>
            )}

            {/* Loading Chapters */}
            {isLoadingChapters && (
                <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <SparklesIcon className="w-8 h-8 text-emerald-400 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-white font-bold">Loading Class {selectedClass} {selectedSubject} chapters...</p>
                </div>
            )}

            {/* Step 2: Chapter List */}
            {step === 'chapters' && !isLoadingChapters && !isLoadingAnswers && (
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {chapters.map((chapter, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectChapter(chapter)}
                                className="group text-left bg-slate-800/50 hover:bg-slate-700/50 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                                        {chapter.chapterNumber}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="text-white font-bold text-sm group-hover:text-emerald-300 transition-colors truncate">{chapter.title}</h4>
                                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{chapter.description}</p>
                                    </div>
                                    <span className="text-slate-600 group-hover:text-emerald-400 transition-colors text-xs font-bold flex-shrink-0">
                                        View →
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading Answers */}
            {isLoadingAnswers && (
                <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-bold">Generating NCERT Solutions...</p>
                        <p className="text-slate-400 text-sm mt-1">Ch. {selectedChapter?.chapterNumber}: {selectedChapter?.title}</p>
                    </div>
                </div>
            )}

            {/* Step 3: Answers */}
            {step === 'answers' && !isLoadingAnswers && (
                <div className="flex-grow overflow-y-auto pr-2 space-y-4 pb-10 custom-scrollbar">
                    {/* Controls */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-slate-400 text-sm">
                            <span className="text-emerald-400 font-bold">{answers.length}</span> questions with detailed answers
                        </p>
                        <div className="flex gap-2">
                            <button onClick={expandAll} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors">
                                Expand All
                            </button>
                            <button onClick={collapseAll} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs font-bold transition-colors">
                                Collapse All
                            </button>
                        </div>
                    </div>

                    {/* Answer Cards */}
                    {answers.map((ans, index) => (
                        <div key={index} className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden transition-all">
                            {/* Question Header (Always Visible) */}
                            <button
                                onClick={() => toggleAnswer(index)}
                                className="w-full text-left p-5 flex items-start gap-4 hover:bg-slate-700/30 transition-colors"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg flex-shrink-0">
                                    Q{ans.questionNumber}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-white font-semibold text-sm leading-relaxed">{ans.question}</p>
                                </div>
                                <div className={`text-slate-500 transition-transform flex-shrink-0 ${expandedAnswers[index] ? 'rotate-180' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </button>

                            {/* Expanded Answer */}
                            {expandedAnswers[index] && (
                                <div className="px-5 pb-5 space-y-3 animate-fade-in border-t border-white/5">
                                    {/* Short Answer */}
                                    <div className="mt-4 p-4 bg-green-900/20 border border-green-500/20 rounded-xl">
                                        <p className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-1">✅ Short Answer (For Exams)</p>
                                        <p className="text-white text-sm font-medium leading-relaxed whitespace-pre-wrap">{ans.shortAnswer}</p>
                                    </div>

                                    {/* Detailed Explanation */}
                                    <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
                                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">📝 Detailed Explanation</p>
                                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{ans.detailedExplanation}</p>
                                    </div>

                                    {/* Tip */}
                                    <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-xl flex items-start gap-2">
                                        <span className="text-lg">💡</span>
                                        <div>
                                            <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Exam Tip</p>
                                            <p className="text-slate-300 text-xs leading-relaxed">{ans.tip}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NCERTSolutionsView;
