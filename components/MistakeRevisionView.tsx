import React, { useState, useEffect } from 'react';
import { AppState, AppContextType, QuizAttempt, GeneratedQuestion } from '../types';
import { getQuizHistory } from '../services/databaseService';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface MistakeRevisionViewProps {
    context: AppContextType;
}

interface MistakeRecord {
    id: string;
    question: GeneratedQuestion;
    userAnswer: string;
    quizTitle: string;
    date: string;
    subject: string;
    isCorrected: boolean;
}

const MistakeRevisionView: React.FC<MistakeRevisionViewProps> = ({ context }) => {
    const { setAppState, studentProfile } = context;
    const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMistake, setSelectedMistake] = useState<MistakeRecord | null>(null);
    const [revisionAnswer, setRevisionAnswer] = useState('');
    const [revisionResult, setRevisionResult] = useState<{ isCorrect: boolean, feedback: string } | null>(null);

    useEffect(() => {
        const fetchMistakes = async () => {
            if (!studentProfile?.id) return;
            setIsLoading(true);
            try {
                const history = await getQuizHistory(studentProfile.id);
                const extractedMistakes: MistakeRecord[] = [];

                history.forEach((attempt: QuizAttempt) => {
                    attempt.questions.forEach((q, idx) => {
                        const userAns = attempt.user_answers[idx] || '';
                        // Determine if it was wrong. This is a heuristic.
                        // Assuming q.correctAnswer is the key for multiple choice or the text for open-ended.
                        const isWrong = userAns !== q.correctAnswer;

                        if (isWrong) {
                            extractedMistakes.push({
                                id: `${attempt.id}-${idx}`,
                                question: q,
                                userAnswer: userAns,
                                quizTitle: `${attempt.subject} Quiz`,
                                date: new Date(attempt.created_at || '').toLocaleDateString(),
                                subject: attempt.subject,
                                isCorrected: false
                            });
                        }
                    });
                });

                setMistakes(extractedMistakes);
            } catch (error) {
                console.error('Failed to fetch mistakes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMistakes();
    }, [studentProfile?.id]);

    const handleRevisionSubmit = () => {
        if (!selectedMistake) return;

        const isCorrect = revisionAnswer.trim().toLowerCase() === selectedMistake.question.correctAnswer.trim().toLowerCase();
        setRevisionResult({
            isCorrect,
            feedback: isCorrect ? 'Perfect! You mastered this mistake.' : 'Not quite. The correct answer was: ' + selectedMistake.question.correctAnswer
        });

        if (isCorrect) {
            setMistakes(prev => prev.map(m => m.id === selectedMistake.id ? { ...m, isCorrected: true } : m));
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-xs">Analyzing Past Errors...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in text-white overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg shadow-red-500/30">
                        <SparklesIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Mistake Revision Book</h2>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Turn failure into success</p>
                    </div>
                </div>
                <button
                    onClick={() => selectedMistake ? setSelectedMistake(null) : setAppState(AppState.DASHBOARD)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"
                >
                    <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                </button>
            </div>

            {selectedMistake ? (
                <div className="flex-grow flex flex-col items-center justify-center space-y-8 animate-slide-up max-w-2xl mx-auto w-full">
                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/10 w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="text-6xl italic">#{selectedMistake.id.split('-')[1]}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">{selectedMistake.subject} • {selectedMistake.date}</h3>
                        <p className="text-2xl font-bold leading-relaxed mb-8">{selectedMistake.question.questionText}</p>

                        <div className="space-y-4">
                            {selectedMistake.question.options?.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => !revisionResult && setRevisionAnswer(opt)}
                                    className={`w-full p-4 rounded-2xl mt-2 text-left font-bold transition-all border-2 ${revisionAnswer === opt
                                        ? 'bg-indigo-600 border-indigo-400 shadow-lg'
                                        : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                                        } ${revisionResult && opt === selectedMistake.question.correctAnswer ? 'bg-green-600/50 border-green-400' : ''}`}
                                    disabled={!!revisionResult}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm font-black italic">{String.fromCharCode(65 + i)}</div>
                                        <span>{opt}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {!revisionResult ? (
                        <button
                            onClick={handleRevisionSubmit}
                            disabled={!revisionAnswer}
                            className="w-full h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl text-white font-black text-xl uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                        >
                            Confirm Revision
                        </button>
                    ) : (
                        <div className="w-full text-center space-y-6 animate-fade-in">
                            <div className={`p-6 rounded-3xl border-2 ${revisionResult.isCorrect ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                                <h4 className="text-2xl font-black mb-2">{revisionResult.isCorrect ? 'Victory! 🎉' : 'Keep Trying! 💪'}</h4>
                                <p className="font-medium text-lg text-white/90">{revisionResult.feedback}</p>
                            </div>
                            <button
                                onClick={() => { setSelectedMistake(null); setRevisionResult(null); setRevisionAnswer(''); }}
                                className="w-full py-5 bg-white/10 hover:bg-white/20 rounded-2xl font-black transition-all"
                            >
                                Next Mistake
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-grow flex flex-col">
                    {mistakes.filter(m => !m.isCorrected).length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center text-6xl animate-bounce-subtle">🌟</div>
                            <div>
                                <h3 className="text-3xl font-black mb-2">You're Perfect!</h3>
                                <p className="text-slate-400 font-medium">No mistakes found. Take a quiz to test your wisdom!</p>
                            </div>
                            <button
                                onClick={() => setAppState(AppState.DASHBOARD)}
                                className="px-10 py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
                            >
                                Dashboard
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                            {mistakes.filter(m => !m.isCorrected).map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMistake(m)}
                                    className="text-left bg-slate-800/30 border border-white/5 p-6 rounded-3xl hover:bg-slate-800/50 hover:border-red-500/30 transition-all group relative overflow-hidden active:scale-95"
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-20 transform translate-x-2 -translate-y-1">
                                        <XMarkIcon className="w-12 h-12 text-red-500" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/30">{m.subject}</span>
                                        <span className="text-slate-500 text-[10px] font-black">{m.date}</span>
                                    </div>
                                    <p className="font-bold text-lg text-slate-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                                        {m.question.questionText}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        Revise Now →
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MistakeRevisionView;
