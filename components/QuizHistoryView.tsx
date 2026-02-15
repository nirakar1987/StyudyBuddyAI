import React, { useEffect, useState, useMemo } from 'react';
import { AppContextType, AppState, QuizAttempt } from '../types';
import { getQuizHistory, clearQuizHistory } from '../services/databaseService';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import ScoreRing from './ScoreRing';
import { ArrowsUpDownIcon } from './icons/ArrowsUpDownIcon';

interface QuizHistoryViewProps {
  context: AppContextType;
}

const QuizHistoryView: React.FC<QuizHistoryViewProps> = ({ context }) => {
    const { user, setAppState, quizHistory, setQuizHistory, setSelectedQuizAttempt } = context;
    const [isLoading, setIsLoading] = useState(true);
    const [isClearing, setIsClearing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'>('date-desc');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            if (quizHistory === null) {
                try {
                    setIsLoading(true);
                    setError(null);
                    const history = await getQuizHistory(user.id);
                    setQuizHistory(history);
                } catch (err: any) {
                    setError("Failed to load quiz history.");
                    setQuizHistory([]); // Prevent potential infinite loop on error
                } finally {
                    setIsLoading(false);
                }
            } else {
                 setIsLoading(false);
            }
        };
        fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, quizHistory]);
    
    const handleViewDetails = (attempt: QuizAttempt) => {
        setSelectedQuizAttempt(attempt);
        setAppState(AppState.QUIZ_ATTEMPT_DETAILS);
    };

    const handleClearHistory = async () => {
        if (!user || !window.confirm("Are you sure you want to delete your entire quiz history? This action cannot be undone.")) {
            return;
        }
        setIsClearing(true);
        setError(null);
        try {
            // Step 1: Attempt to clear the history. The function now gets the user ID internally.
            await clearQuizHistory();
            
            // Step 2: Re-fetch the history from the database to confirm deletion and update the UI.
            const updatedHistory = await getQuizHistory(user.id);
            setQuizHistory(updatedHistory);
        } catch (err) {
            console.error("Error during history clear:", err);
            setError("Failed to clear quiz history. Please try again.");
        } finally {
            setIsClearing(false);
        }
    };

    const sortedHistory = useMemo(() => {
        if (!quizHistory) return [];
        const sorted = [...quizHistory];
        sorted.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'score-desc':
                    return (b.score / b.total_questions) - (a.score / a.total_questions);
                case 'score-asc':
                    return (a.score / a.total_questions) - (b.score / b.total_questions);
                case 'date-desc':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });
        return sorted;
    }, [quizHistory, sortBy]);


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <SparklesIcon className="w-12 h-12 text-[var(--color-primary)] animate-pulse" />
                    <p className="mt-4 text-[var(--color-text-secondary)]">Loading your quiz history...</p>
                </div>
            );
        }

        if (error && (!sortedHistory || sortedHistory.length === 0)) {
            return <p className="text-center text-[var(--color-danger)]">{error}</p>;
        }

        if (!sortedHistory || sortedHistory.length === 0) {
            return <p className="text-center text-[var(--color-text-muted)]">You haven't completed any quizzes yet.</p>;
        }

        return (
            <div className="space-y-4">
                {sortedHistory.map((attempt) => {
                    const percentage = (attempt.score / attempt.total_questions) * 100;
                    return (
                        <button 
                            key={attempt.id} 
                            onClick={() => handleViewDetails(attempt)}
                            className="w-full bg-[var(--color-surface-light)] p-4 rounded-lg border border-[var(--color-border)] flex items-center text-left hover:bg-[var(--color-surface-lighter)] transition-all duration-200 active:scale-[0.99] group"
                        >
                            <ScoreRing percentage={percentage} />
                            <div className="flex-grow mx-4">
                                <p className="font-bold text-lg text-[var(--color-primary)] group-hover:underline">{attempt.subject} - Grade {attempt.grade}</p>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Taken on: {new Date(attempt.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-2xl text-[var(--color-text-primary)]">{attempt.score} / {attempt.total_questions}</p>
                            </div>
                        </button>
                    )
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border)] pb-4">
                <h2 className="text-3xl font-bold text-[var(--color-primary)]">Quiz History</h2>
                {quizHistory && quizHistory.length > 0 && (
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] block w-full p-2.5 appearance-none pr-8"
                            aria-label="Sort quiz history"
                        >
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="score-desc">Score (High-Low)</option>
                            <option value="score-asc">Score (Low-High)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--color-text-muted)]">
                           <ArrowsUpDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                {renderContent()}
            </div>
             <div className="mt-6 flex justify-between items-center">
                <button
                    onClick={handleClearHistory}
                    disabled={isClearing || !quizHistory || quizHistory.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-800/50 hover:bg-red-700/60 text-red-300 rounded-lg font-semibold transition-colors active:scale-95 disabled:bg-slate-700/50 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    {isClearing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Clearing...</span>
                        </>
                    ) : (
                        <>
                            <TrashIcon className="w-5 h-5" />
                            <span>Clear History</span>
                        </>
                    )}
                </button>
                <div className="flex items-center gap-2">
                    {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
                    <button 
                        onClick={() => setAppState(AppState.DASHBOARD)} 
                        className="px-6 py-2 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-lg font-semibold"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizHistoryView;