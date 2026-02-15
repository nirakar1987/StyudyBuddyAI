import React, { useState, useEffect } from 'react';
import { AppState, AppContextType } from '../types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { getSubjectChapters, analyzeAndGenerateQuestions } from '../services/geminiService';
import { CalendarIcon } from './icons/CalendarIcon';

interface ChapterQAViewProps {
    context: AppContextType;
}

const ChapterQAView: React.FC<ChapterQAViewProps> = ({ context }) => {
    const { setAppState, studentProfile, setGeneratedQuiz } = context;
    const [chapters, setChapters] = useState<string[]>([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(true);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBoard, setSelectedBoard] = useState<'CBSE' | 'ICSE'>('CBSE');
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const loadChapters = async () => {
            if (!studentProfile) return;
            setIsLoadingChapters(true);
            try {
                const fetchedChapters = await getSubjectChapters(studentProfile, selectedBoard);
                setChapters(fetchedChapters);
            } catch (err) {
                console.error("Failed to load chapters", err);
                setError("Could not load chapters. Please try again.");
            } finally {
                setIsLoadingChapters(false);
            }
        };
        loadChapters();
    }, [studentProfile, selectedBoard]);

    const handleChapterClick = (chapter: string) => {
        setSelectedChapter(chapter);
        setShowModal(true);
    };

    const handleQuickTest = async () => {
        if (!studentProfile || !selectedChapter) return;
        setShowModal(false);
        setIsGeneratingQuiz(true);
        setError(null);

        try {
            const quiz = await analyzeAndGenerateQuestions(
                [],
                studentProfile,
                {
                    numQuestions: 10,
                    difficulty: 'Medium',
                    numOptions: 4,
                    questionType: 'Multiple Choice'
                },
                `${selectedBoard} - ${selectedChapter}`
            );

            setGeneratedQuiz(quiz);
            setAppState(AppState.QUIZ);

        } catch (err: any) {
            setError(err.message || "Failed to generate quiz.");
            setIsGeneratingQuiz(false);
        }
    };

    const handleDayWisePractice = async () => {
        if (!studentProfile || !selectedChapter) return;
        setShowModal(false);
        setIsGeneratingQuiz(true);
        setError(null);

        try {
            // Generate a smaller daily quiz (5 questions)
            const quiz = await analyzeAndGenerateQuestions(
                [],
                studentProfile,
                {
                    numQuestions: 5,
                    difficulty: 'Easy',
                    numOptions: 4,
                    questionType: 'Multiple Choice'
                },
                `${selectedBoard} - ${selectedChapter} - Daily Practice`
            );

            setGeneratedQuiz(quiz);
            setAppState(AppState.QUIZ);

        } catch (err: any) {
            setError(err.message || "Failed to generate daily practice.");
            setIsGeneratingQuiz(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in pb-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-amber-500 flex items-center gap-2">
                    <DocumentTextIcon className="w-8 h-8" /> Study Chapters
                </h2>
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Back
                </button>
            </div>

            {/* Board Selection */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setSelectedBoard('CBSE')}
                    className={`px-6 py-2 rounded-lg font-bold border-2 transition-all shadow-md active:scale-95 ${selectedBoard === 'CBSE' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-transparent border-slate-600 text-slate-400 hover:border-amber-500 hover:text-amber-400'}`}
                >
                    CBSE Board
                </button>
                <button
                    onClick={() => setSelectedBoard('ICSE')}
                    className={`px-6 py-2 rounded-lg font-bold border-2 transition-all shadow-md active:scale-95 ${selectedBoard === 'ICSE' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-transparent border-slate-600 text-slate-400 hover:border-amber-500 hover:text-amber-400'}`}
                >
                    ICSE Board
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {isGeneratingQuiz && (
                <div className="flex flex-col items-center justify-center flex-grow text-center animate-pulse">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h3 className="text-2xl font-bold text-white mb-2">Generating Quiz...</h3>
                    <p className="text-slate-400">Preparing questions for you...</p>
                </div>
            )}

            {!isGeneratingQuiz && (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-slate-400 font-medium flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${selectedBoard === 'CBSE' ? 'bg-orange-500' : 'bg-purple-500'}`}></span>
                            {selectedBoard} Syllabus - Class {studentProfile?.grade}
                        </p>
                    </div>

                    {isLoadingChapters ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-20">
                            {chapters.length > 0 ? chapters.map((chapter, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleChapterClick(chapter)}
                                    className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-purple-900 hover:to-pink-900 border-2 border-slate-700 hover:border-transparent p-6 rounded-xl text-left transition-all group flex flex-col justify-between h-32 active:scale-95 shadow-lg hover:shadow-2xl animate-slide-bounce animate-glow-strong"
                                    style={{
                                        animationDelay: `${index * 0.1}s`,
                                        animationFillMode: 'backwards'
                                    }}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-700/50 px-2 py-1 rounded group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-pink-500 group-hover:text-white transition-all">
                                            Chapter {index + 1}
                                        </span>
                                        <SparklesIcon className="w-6 h-6 text-slate-600 group-hover:text-yellow-400 transition-colors animate-wiggle" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:via-pink-400 group-hover:to-purple-400 line-clamp-2 leading-tight transition-all animate-neon-pulse">
                                        {chapter.replace(/^(Chapter \d+|Unit [IVX]+):\s*/i, '')}
                                    </h3>
                                    <div className="w-full h-1 bg-slate-700 mt-2 rounded-full overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 w-0 group-hover:w-full transition-all duration-700 ease-out"></div>
                                    </div>
                                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{
                                        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)'
                                    }}></div>
                                </button>
                            )) : (
                                <p className="col-span-3 text-center text-slate-500">No chapters found.</p>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modal for Practice Options */}
            {showModal && selectedChapter && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-700 shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-2">{selectedChapter.replace(/^(Chapter \d+|Unit [IVX]+):\s*/i, '')}</h3>
                        <p className="text-slate-400 mb-6">Choose your practice mode:</p>

                        <div className="space-y-4">
                            <button
                                onClick={handleQuickTest}
                                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white p-4 rounded-xl font-bold flex items-center justify-between transition-all active:scale-95 shadow-lg"
                            >
                                <div className="text-left">
                                    <div className="font-bold text-lg">Quick Test</div>
                                    <div className="text-sm opacity-90">10 questions • Medium difficulty</div>
                                </div>
                                <SparklesIcon className="w-6 h-6" />
                            </button>

                            <button
                                onClick={handleDayWisePractice}
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white p-4 rounded-xl font-bold flex items-center justify-between transition-all active:scale-95 shadow-lg"
                            >
                                <div className="text-left">
                                    <div className="font-bold text-lg">Daily Practice</div>
                                    <div className="text-sm opacity-90">5 questions • Easy warm-up</div>
                                </div>
                                <CalendarIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full mt-6 text-slate-400 hover:text-white font-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChapterQAView;
