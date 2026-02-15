import React from 'react';
import { AppContextType, AppState } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface QuizAttemptDetailsViewProps {
  context: AppContextType;
}

const QuizAttemptDetailsView: React.FC<QuizAttemptDetailsViewProps> = ({ context }) => {
    const { selectedQuizAttempt, setAppState, setSelectedQuizAttempt } = context;

    if (!selectedQuizAttempt) {
        return (
            <div className="text-center">
                <p className="text-[var(--color-text-muted)]">No quiz attempt selected.</p>
                <button 
                    onClick={() => setAppState(AppState.QUIZ_HISTORY)} 
                    className="mt-4 px-4 py-2 bg-[var(--color-primary-action)] rounded-lg font-semibold"
                >
                    Back to History
                </button>
            </div>
        );
    }
    
    const { questions, user_answers, score, total_questions, subject, grade, created_at, evaluation_results } = selectedQuizAttempt;

    const isCorrect = (index: number) => {
        // Use the stored evaluation results if available for accuracy
        if (evaluation_results) {
            return evaluation_results[index];
        }
        // Fallback for old data that might not have the evaluation_results field
        const userAnswer = user_answers[index]?.trim().toLowerCase() || "";
        const correctAnswer = questions[index].correctAnswer.trim().toLowerCase();
        return userAnswer === correctAnswer;
    };
    
    const handleBack = () => {
        setSelectedQuizAttempt(null);
        setAppState(AppState.QUIZ_HISTORY);
    }
    
    const percentage = Math.round((score / total_questions) * 100);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="mb-6 border-b border-[var(--color-border)] pb-4">
                <h2 className="text-3xl font-bold text-[var(--color-primary)]">Quiz Review</h2>
                <div className="flex flex-wrap justify-between items-center mt-2 text-[var(--color-text-secondary)] gap-2">
                    <p>{subject} - Grade {grade}</p>
                    <p>Taken on: {new Date(created_at).toLocaleDateString()}</p>
                    <div className="text-right">
                        <p className="font-bold text-xl text-[var(--color-text-primary)]">{score} / {total_questions} ({percentage}%)</p>
                    </div>
                </div>
            </div>
            
            {/* Questions List */}
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                 {questions.map((q, index) => (
                     <div key={index} className={`rounded-lg p-4 border ${isCorrect(index) ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                        <div className="flex justify-between items-start">
                           <p className="text-[var(--color-text-primary)] font-semibold pr-4">{index + 1}. {q.questionText}</p>
                            {isCorrect(index) ? (
                                <CheckIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                            ) : (
                                <XMarkIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
                            )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10 pl-2 text-sm space-y-2">
                            <div className={`flex items-start gap-2 ${isCorrect(index) ? 'text-green-300' : 'text-red-300'}`}>
                                <span className="font-semibold flex-shrink-0">Your Answer:</span> 
                                <span className="break-words">{user_answers[index] || <i className="text-[var(--color-text-muted)]">Not Answered</i>}</span>
                            </div>
                            {!isCorrect(index) && (
                                <div className="flex items-start gap-2 text-[var(--color-primary)]">
                                    <span className="font-semibold flex-shrink-0">Correct Answer:</span>
                                    <span className="break-words">{q.correctAnswer}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
                <button 
                    onClick={handleBack} 
                    className="px-6 py-2 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-lg font-semibold"
                >
                    Back to History
                </button>
            </div>
        </div>
    );
};

export default QuizAttemptDetailsView;