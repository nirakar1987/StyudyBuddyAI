import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppContextType, QuestionType, AppState, GeneratedQuiz } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { ArrowsPointingOutIcon } from './icons/ArrowsPointingOutIcon';
import { ArrowsPointingInIcon } from './icons/ArrowsPointingInIcon';
import { ClockIcon } from './icons/ClockIcon';

interface QuizViewProps {
    context: AppContextType;
}

// Helper to create a unique ID for the current quiz based on its content
const getQuizId = (quiz: GeneratedQuiz | null): string | null => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return null;
    }
    const quizIdentifierString = quiz.questions.map(q => q.questionText).join('|');
    let hash = 5381;
    for (let i = 0; i < quizIdentifierString.length; i++) {
        const char = quizIdentifierString.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
    }
    return String(hash);
};

const getQuestionTypeBadgeColor = (type: QuestionType) => {
    switch (type) {
        case QuestionType.MCQ: return 'bg-blue-500 text-blue-100';
        case QuestionType.SHORT_ANSWER: return 'bg-green-500 text-green-100';
        case QuestionType.TRUE_FALSE: return 'bg-purple-500 text-purple-100';
        case QuestionType.FILL_IN_THE_BLANK: return 'bg-yellow-500 text-yellow-100';
        default: return 'bg-gray-500 text-gray-100';
    }
};

const QuizView: React.FC<QuizViewProps> = ({ context }) => {
    const { generatedQuiz, userAnswers, setUserAnswers, handleSubmitQuiz, setAppState, quizCustomization, quizScore, isSubmitting, submissionError, user } = context;
    const questions = generatedQuiz?.questions || [];
    const { playSubmitSound } = useSoundEffects();

    const totalTime = quizCustomization.duration * 60;
    const [timeLeft, setTimeLeft] = useState(totalTime);
    const [parentEmail, setParentEmail] = useState('');
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [expandedTextareas, setExpandedTextareas] = useState<Record<number, boolean>>({});
    const [isResumed, setIsResumed] = useState(false);

    const quizId = useMemo(() => getQuizId(generatedQuiz), [generatedQuiz]);
    const storageKey = useMemo(() => user && quizId ? `quizProgress_${user.id}_${quizId}` : null, [user, quizId]);

    const stableSubmitQuiz = useCallback(handleSubmitQuiz, [handleSubmitQuiz]);

    // Load progress when the component mounts or the quiz changes
    useEffect(() => {
        if (storageKey) {
            const savedDataRaw = localStorage.getItem(storageKey);
            if (savedDataRaw) {
                try {
                    const savedData = JSON.parse(savedDataRaw);
                    if (savedData.userAnswers) {
                        setUserAnswers(savedData.userAnswers);
                    }
                    if (typeof savedData.timeLeft === 'number' && savedData.timeLeft > 0) {
                        setTimeLeft(Math.min(savedData.timeLeft, totalTime));
                    }
                    setIsResumed(true);
                    // Hide the resume message after a few seconds
                    setTimeout(() => setIsResumed(false), 5000);
                } catch (e) {
                    console.error('Error parsing saved quiz data:', e);
                    localStorage.removeItem(storageKey);
                }
            }
        }
        // This should run only when the quiz identity (storageKey) changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, totalTime]);

    // Save progress periodically and on unmount
    useEffect(() => {
        const saveProgress = () => {
            if (storageKey) {
                try {
                    const dataToSave = { userAnswers, timeLeft, quiz: generatedQuiz };
                    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
                } catch (e) {
                    console.error("Failed to save quiz progress to localStorage", e);
                }
            }
        }

        const saveInterval = setInterval(saveProgress, 5000); // Save every 5 seconds

        return () => {
            clearInterval(saveInterval);
            saveProgress(); // Save one last time on unmount
        };
    }, [storageKey, userAnswers, timeLeft, generatedQuiz]);


    useEffect(() => {
        if (timeLeft <= 0) {
            stableSubmitQuiz();
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, stableSubmitQuiz]);

    const handleSendEmail = () => {
        if (!/^\S+@\S+\.\S+$/.test(parentEmail)) {
            alert('Please enter a valid email address.');
            return;
        }
        setEmailStatus('sending');

        // Simulate API call for sending email
        setTimeout(() => {
            console.log(`Simulating sending quiz to: ${parentEmail}`);
            // In a real application, a backend service would handle the email sending.
            setEmailStatus('sent');
            setTimeout(() => setEmailStatus('idle'), 4000); // Reset after a few seconds
        }, 2000);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: answer,
        }));
    };

    const toggleTextareaExpansion = (index: number) => {
        setExpandedTextareas(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleQuizSubmit = () => {
        playSubmitSound();
        handleSubmitQuiz();
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <SparklesIcon className="w-12 h-12 text-cyan-400 animate-pulse" />
                <p className="mt-4 text-slate-300">StudyBuddy AI is generating your new quiz...</p>
            </div>
        )
    }

    const timePercentage = (timeLeft / totalTime) * 100;
    const isTimeLow = timeLeft < 60;

    return (
        <div className="animate-fade-in h-full flex flex-col">
            {isResumed && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-center text-green-300 animate-fade-in no-print flex items-center justify-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    <p>Welcome back! Your previous quiz progress has been restored.</p>
                </div>
            )}
            <div className="mb-4 pb-4 border-b border-slate-700">
                <div className="flex justify-between items-center ">
                    <div>
                        <h2 className="text-3xl font-bold text-cyan-300">Practice Quiz</h2>
                        <p className="text-slate-400 no-print">Answer the questions before the timer runs out!</p>
                    </div>
                    <div className="text-center no-print">
                        <div className="text-sm text-slate-400">Time Left</div>
                        <div className={`text-2xl font-bold ${isTimeLow ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2 no-print">
                    <div
                        className={`h-2.5 rounded-full ${isTimeLow ? 'bg-red-500' : 'bg-cyan-500'} transition-all duration-1000 linear`}
                        style={{ width: `${timePercentage}%` }}>
                    </div>
                </div>
            </div>

            <div className="my-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 no-print">
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">Share & Save for Offline Use</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Send quiz to parent's email</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="parent@example.com"
                                value={parentEmail}
                                onChange={(e) => setParentEmail(e.target.value)}
                                className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                                disabled={emailStatus !== 'idle'}
                            />
                            <button
                                onClick={handleSendEmail}
                                disabled={emailStatus !== 'idle' || !parentEmail}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold text-sm transition-colors active:scale-95 disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                <EnvelopeIcon className="w-5 h-5" />
                                {emailStatus === 'idle' && 'Send'}
                                {emailStatus === 'sending' && 'Sending...'}
                                {emailStatus === 'sent' && 'Sent!'}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Save questions for offline study</label>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Download Quiz as PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-2 text-center no-print">
                <p className="text-slate-400">Want a different challenge?</p>
                <button
                    onClick={() => setAppState(AppState.ORAL_QUIZ)}
                    className="mt-1 flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold"
                >
                    <MicrophoneIcon className="w-5 h-5" /> Switch to Oral Quiz
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-6 mt-4 print-container">
                {questions.map((q, index) => (
                    <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 print-question">
                        <div className="flex justify-between items-start mb-3">
                            <p className="text-slate-200 font-semibold pr-4">{index + 1}. {q.questionText}</p>
                            <div className="flex gap-2 items-center flex-shrink-0">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getQuestionTypeBadgeColor(q.questionType)}`}>
                                    {q.questionType}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${q.difficulty === 'Easy' ? 'bg-green-600' : q.difficulty === 'Medium' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                                    {q.difficulty}
                                </span>
                            </div>
                        </div>

                        <div>
                            {q.questionType === QuestionType.MCQ && q.options && (
                                <div className="space-y-2 pl-2">
                                    {q.options.map((option, i) => (
                                        <label key={i} className="flex items-center p-2 rounded-md hover:bg-slate-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`question-${index}`}
                                                value={option}
                                                checked={userAnswers[index] === option}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 no-print"
                                            />
                                            <span className="ml-3 text-slate-300 mcq-option-label">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.questionType === QuestionType.TRUE_FALSE && (
                                <div className="space-y-2 pl-2">
                                    {['True', 'False'].map((option, i) => (
                                        <label key={i} className="flex items-center p-2 rounded-md hover:bg-slate-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`question-${index}`}
                                                value={option}
                                                checked={userAnswers[index] === option}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 no-print"
                                            />
                                            <span className="ml-3 text-slate-300 mcq-option-label">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {(q.questionType === QuestionType.SHORT_ANSWER || q.questionType === QuestionType.FILL_IN_THE_BLANK) && (
                                <div className="relative mt-2">
                                    <div className="textarea-wrapper">
                                        <textarea
                                            value={userAnswers[index] || ''}
                                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                                            placeholder="Type your answer here..."
                                            className={`w-full bg-slate-700 border border-slate-600 rounded-lg p-2 pr-10 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 resize-y ${expandedTextareas[index] ? 'h-48' : 'h-24'}`}
                                            rows={expandedTextareas[index] ? 8 : 3}
                                        />
                                        <button
                                            onClick={() => toggleTextareaExpansion(index)}
                                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white transition-colors rounded-md hover:bg-slate-600"
                                            title={expandedTextareas[index] ? 'Minimize' : 'Maximize'}
                                        >
                                            {expandedTextareas[index] ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="short-answer-lines">
                                        <div className="short-answer-space"></div>
                                        <div className="short-answer-space"></div>
                                        <div className="short-answer-space"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end items-center gap-4 no-print">
                {submissionError && <p className="text-sm text-right text-[var(--color-danger)] mr-auto">{submissionError}</p>}

                {submissionError ? (
                    <button
                        onClick={handleQuizSubmit}
                        className="flex items-center justify-center gap-3 px-8 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold text-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Retrying...
                            </>
                        ) : (
                            'Retry Submission'
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleQuizSubmit}
                        className="flex items-center justify-center gap-3 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition-all active:scale-95"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Grading...
                            </>
                        ) : (
                            quizScore ? 'Submitted' : 'Submit Answers'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizView;