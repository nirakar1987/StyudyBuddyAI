import React, { useState, useEffect } from 'react';
import { AppContextType, AppState, QuestionType } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { generateAnswerExplanation } from '../services/geminiService';
import { buildActivityMessage, getWhatsAppShareUrl, copyToClipboard } from '../services/parentNotificationService';
import { LightBulbIcon } from './icons/LightBulbIcon';

interface QuizResultsViewProps {
    context: AppContextType;
}

const QuizResultsView: React.FC<QuizResultsViewProps> = ({ context }) => {
    const { generatedQuiz, userAnswers, quizScore, quizResults, setAppState, regenerateQuiz, lastUploadedFiles, lastModuleCompleted, studentProfile } = context;
    const questions = generatedQuiz?.questions || [];
    const [parentEmail, setParentEmail] = useState('');
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const { playCompleteSound } = useSoundEffects();
    const [soundPlayed, setSoundPlayed] = useState(false);
    const [explanations, setExplanations] = useState<Record<number, string | null>>({});
    const [loadingExplanation, setLoadingExplanation] = useState<number | null>(null);
    const [shareToast, setShareToast] = useState<string | null>(null);

    const parentShareMessage = studentProfile && quizScore && generatedQuiz
        ? buildActivityMessage('quiz_complete', {
            studentName: studentProfile.name,
            subject: studentProfile.subject,
            grade: studentProfile.grade,
            score: quizScore.score,
            total: quizScore.total,
            topics: generatedQuiz.topics,
        })
        : '';

    useEffect(() => {
        if (lastModuleCompleted && !soundPlayed) {
            playCompleteSound();
            setSoundPlayed(true);
        }
    }, [lastModuleCompleted, soundPlayed, playCompleteSound]);

    if (!quizScore) {
        return <p>Loading results...</p>;
    }

    const handleSendEmail = () => {
        if (!/^\S+@\S+\.\S+$/.test(parentEmail)) {
            alert('Please enter a valid email address.');
            return;
        }
        setEmailStatus('sending');

        // Simulate API call for sending email
        setTimeout(() => {
            console.log(`Simulating sending quiz results to: ${parentEmail}`);
            // In a real application, a backend service would handle the email sending.
            setEmailStatus('sent');
            setTimeout(() => setEmailStatus('idle'), 4000); // Reset after a few seconds
        }, 2000);
    };

    const isCorrect = (index: number) => {
        return quizResults?.[index] ?? false;
    };

    const handleViewExplanation = async (index: number) => {
        if (explanations[index]) return; // Don't fetch if already loaded
        setLoadingExplanation(index);
        try {
            const explanation = await generateAnswerExplanation(questions[index], userAnswers[index]);
            setExplanations(prev => ({ ...prev, [index]: explanation }));
        } catch (error) {
            console.error("Failed to get explanation:", error);
            setExplanations(prev => ({ ...prev, [index]: "Sorry, I couldn't generate an explanation right now." }));
        } finally {
            setLoadingExplanation(null);
        }
    };

    const questionList = questions.map((q, index) => {
        const isAnswerCorrect = isCorrect(index);
        const questionOptions = q.questionType === QuestionType.TRUE_FALSE ? ['True', 'False'] : q.options;

        return (
            <div key={index} className={`rounded-lg p-4 border ${isAnswerCorrect ? 'border-green-500/50 bg-green-900/20 correct-answer' : 'border-red-500/50 bg-red-900/20 incorrect-answer'} animate-fade-in print-question`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex justify-between items-start">
                    <p className="text-slate-200 font-semibold pr-4">{index + 1}. {q.questionText}</p>
                    {isAnswerCorrect ? (
                        <CheckIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    ) : (
                        <XMarkIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
                    )}
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 text-sm">
                    {questionOptions ? (
                        <div className="space-y-2">
                            {questionOptions.map(option => {
                                const isThisTheCorrectAnswer = option === q.correctAnswer;
                                const isThisTheUserAnswer = option === userAnswers[index];

                                let styles = "p-2 rounded-md flex justify-between items-center transition-colors ";

                                if (isThisTheCorrectAnswer) {
                                    styles += "bg-green-500/30";
                                } else if (isThisTheUserAnswer && !isAnswerCorrect) {
                                    styles += "bg-red-500/30";
                                } else {
                                    styles += "bg-slate-800/40";
                                }

                                return (
                                    <div key={option} className={styles}>
                                        <span>{option}</span>
                                        {isThisTheUserAnswer && <span className="text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded-full">Your Answer</span>}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className={`flex items-start gap-2 ${isAnswerCorrect ? 'text-green-300' : 'text-red-300'}`}>
                                <span className="font-semibold flex-shrink-0">Your Answer:</span>
                                <span className="break-words">{userAnswers[index] || <i className="text-slate-400">Not Answered</i>}</span>
                            </p>
                            {!isAnswerCorrect && (
                                <p className="flex items-start gap-2 text-cyan-300 mt-1">
                                    <span className="font-semibold flex-shrink-0">Correct Answer:</span>
                                    <span className="break-words">{q.correctAnswer}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 no-print">
                    {explanations[index] ? (
                        <div className="text-slate-300 prose prose-sm prose-invert prose-p:my-1 animate-fade-in">
                            {explanations[index]?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    ) : (
                        <button onClick={() => handleViewExplanation(index)} disabled={loadingExplanation === index} className="flex items-center gap-2 px-3 py-1 text-sm bg-amber-600/80 hover:bg-amber-600 rounded-md disabled:bg-slate-600 text-white font-semibold transition-colors">
                            <LightBulbIcon className="w-4 h-4" />
                            {loadingExplanation === index ? 'Thinking...' : 'View Explanation'}
                        </button>
                    )}
                </div>
            </div>
        );
    });

    const percentage = Math.round((quizScore.score / quizScore.total) * 100);
    let feedbackMessage = '';
    if (percentage === 100) feedbackMessage = "Perfect Score! Amazing job!";
    else if (percentage >= 80) feedbackMessage = "Excellent work! You've mastered this topic.";
    else if (percentage >= 60) feedbackMessage = "Good job! A little more practice will make perfect.";
    else feedbackMessage = "Keep practicing! Every attempt is a step forward.";

    return (
        <div className="animate-fade-in h-full flex flex-col">
            <div id="printable-area">
                <div className="text-center mb-6">
                    <h2 className="text-4xl font-bold text-cyan-300 mb-2">Quiz Results</h2>
                    <p className="text-lg text-slate-300">{feedbackMessage}</p>
                    <div className="mt-4 inline-flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg">
                        <div className="text-3xl font-bold text-white">{quizScore.score} / {quizScore.total}</div>
                        <div className="w-px h-10 bg-slate-700"></div>
                        <div className="text-3xl font-bold text-cyan-400">{percentage}%</div>
                    </div>
                </div>

                {lastModuleCompleted && (
                    <div className="mb-4 p-4 bg-amber-500/20 border border-amber-500 rounded-lg text-center animate-pulse-glow">
                        <TrophyIcon className="w-8 h-8 mx-auto text-amber-300 mb-2" />
                        <h3 className="text-xl font-bold text-amber-200">Module Completed!</h3>
                        <p className="text-amber-300">You've mastered all topics for the "{lastModuleCompleted}" module. Great job!</p>
                    </div>
                )}

                <div className="flex-grow overflow-y-auto pr-2 space-y-4 print-container">
                    {questionList}
                </div>
            </div>

            <div className="my-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700 no-print">
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">Share & Save Results</h3>
                <div className="flex flex-col gap-4">
                    {/* WhatsApp & Telegram – first and prominent */}
                    <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-500/40">
                        <label className="block text-sm font-bold text-emerald-300 mb-2">📱 Send to parent (WhatsApp or Telegram)</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    if (parentShareMessage) window.open(getWhatsAppShareUrl(parentShareMessage, studentProfile?.parent_phone), '_blank');
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                            >
                                <span>📲</span> Share to WhatsApp
                            </button>
                            <button
                                onClick={async () => {
                                    if (parentShareMessage && (await copyToClipboard(parentShareMessage))) {
                                        setShareToast('Copied! Paste in Telegram to send to parent.');
                                        setTimeout(() => setShareToast(null), 3000);
                                    }
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                            >
                                <span>✈️</span> Copy for Telegram
                            </button>
                        </div>
                        {shareToast && <p className="text-sm text-green-400 mt-2">{shareToast}</p>}
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Send results to parent's email</label>
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
                        <label className="block text-sm font-medium text-slate-300 mb-1">Save results for offline review</label>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Download Results as PDF
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            <div className="no-print">
                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => {
                            if (context.quizSource?.type === 'book') {
                                setAppState(AppState.BOOK_QUIZ);
                            } else {
                                setAppState(AppState.UPLOAD);
                            }
                        }}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold"
                    >
                        {context.quizSource?.type === 'book' ? 'Back to Chapters' : 'New Quiz'}
                    </button>
                    {(lastUploadedFiles.length > 0 || context.quizSource?.type === 'book') && (
                        <button onClick={regenerateQuiz} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold">
                            Try Again
                        </button>
                    )}
                    <button
                        onClick={() => setAppState(AppState.DASHBOARD)}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizResultsView;