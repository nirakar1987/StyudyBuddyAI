import React, { useState, useEffect, useCallback } from 'react';
import { AppContextType, AvatarState } from '../types';
import { generatePracticeProblem, evaluatePracticeAnswer, generateProblemSolution } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface PracticeViewProps {
    context: AppContextType;
}

const PracticeView: React.FC<PracticeViewProps> = ({ context }) => {
    const {
        studentProfile,
        setAvatarState,
        setScore,
        practiceProblem,
        setPracticeProblem,
        userPracticeAnswer,
        setUserPracticeAnswer,
        problemFeedback,
        setProblemFeedback
    } = context;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [solution, setSolution] = useState<string | null>(null);
    const { playCorrectSound, playIncorrectSound } = useSoundEffects();
    const [specificTopic, setSpecificTopic] = useState(studentProfile?.subject || '');

    const getNextProblem = useCallback(async (overrideTopic?: string) => {
        if (!studentProfile) return;
        setIsLoading(true);
        setError(null);
        setProblemFeedback(null);
        setUserPracticeAnswer('');
        setSolution(null);
        setAvatarState(AvatarState.THINKING);
        try {
            const topicToUse = overrideTopic || specificTopic;
            const problem = await generatePracticeProblem(studentProfile, topicToUse);
            setPracticeProblem(problem);
        } catch (err: any) {
            setError(err.message || "Could not fetch a new problem.");
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.IDLE);
        }
    }, [studentProfile, specificTopic, setAvatarState, setPracticeProblem, setProblemFeedback, setUserPracticeAnswer]);

    useEffect(() => {
        // Fetch the first problem when the component mounts, but only if we haven't already tried and failed.
        if (!practiceProblem && !error) {
            getNextProblem();
        }
    }, [practiceProblem, getNextProblem, error]);

    const handleCheckAnswer = async () => {
        if (!studentProfile || !practiceProblem || !userPracticeAnswer.trim()) return;
        setIsLoading(true);
        setError(null);
        setAvatarState(AvatarState.THINKING);
        try {
            const feedback = await evaluatePracticeAnswer(practiceProblem, userPracticeAnswer, studentProfile);
            setProblemFeedback(feedback);
            if (feedback.isCorrect) {
                playCorrectSound();
                await setScore(prev => prev + 50); // Award points for correct answer
            } else {
                playIncorrectSound();
            }
        } catch (err: any) {
            setError(err.message || "Could not check your answer.");
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.IDLE);
        }
    };

    const handleViewAnswer = async () => {
        if (!studentProfile || !practiceProblem) return;
        setIsLoading(true);
        setError(null);
        setAvatarState(AvatarState.THINKING);
        try {
            const result = await generateProblemSolution(practiceProblem, studentProfile);
            setSolution(result);
        } catch (err: any) {
            setError(err.message || "Could not fetch the solution.");
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.IDLE);
        }
    };


    if (!practiceProblem && isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <SparklesIcon className="w-12 h-12 text-cyan-400 animate-pulse" />
                <p className="mt-4 text-slate-300">StudyBuddy AI is preparing a practice problem for you...</p>
            </div>
        );
    }

    if (error && !practiceProblem) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-400">{error}</p>
                <div className="mt-4 flex flex-col gap-2">
                    <input
                        type="text"
                        placeholder="Try a different topic..."
                        value={specificTopic}
                        onChange={(e) => setSpecificTopic(e.target.value)}
                        className="p-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                    <button onClick={() => getNextProblem()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold">
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    if (!studentProfile || !practiceProblem) {
        return <div className="text-center text-slate-400">Could not load practice session.</div>;
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-cyan-300 flex-shrink-0">Interactive Practice</h2>
                <div className="flex gap-2 max-w-sm w-full">
                    <input
                        type="text"
                        value={specificTopic}
                        onChange={(e) => setSpecificTopic(e.target.value)}
                        placeholder="Enter specific topic (e.g. Algebra)"
                        className="flex-grow bg-slate-800 border-slate-600 text-white rounded-lg px-3 py-1 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                        onKeyDown={(e) => e.key === 'Enter' && getNextProblem()}
                    />
                    <button
                        onClick={() => getNextProblem()}
                        disabled={isLoading}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 whitespace-nowrap"
                    >
                        New Question
                    </button>
                </div>
            </div>

            <p className="text-slate-400 mb-4 border-b border-slate-700 pb-2">Current Topic: <span className="font-semibold text-cyan-400">{practiceProblem.topic}</span></p>

            <div className="flex-grow space-y-6 overflow-y-auto pr-2">
                {/* Question Card */}
                <div className="bg-slate-900/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Question:</h3>
                    <p className="text-white text-xl leading-relaxed">{practiceProblem.question}</p>
                </div>

                {/* Answer Area */}
                <div>
                    <label htmlFor="practice-answer" className="text-lg font-semibold text-slate-300 mb-2 block">Your Answer/Working:</label>
                    <textarea
                        id="practice-answer"
                        rows={6}
                        value={userPracticeAnswer}
                        onChange={e => setUserPracticeAnswer(e.target.value)}
                        placeholder="Show your steps and write your final answer here..."
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-cyan-500 focus:border-cyan-500 text-base"
                        disabled={isLoading || (problemFeedback?.isCorrect ?? false) || !!solution}
                    />
                </div>

                {/* Solution Area */}
                {solution && (
                    <div className="p-4 rounded-lg border bg-blue-900/20 border-blue-500/50 animate-fade-in">
                        <h4 className="font-bold text-lg mb-2 text-blue-300 flex items-center gap-2">
                            <LightBulbIcon className="w-6 h-6" />
                            Here's the Solution:
                        </h4>
                        <div className="text-slate-200 whitespace-pre-wrap prose prose-invert prose-p:my-2 prose-p:text-slate-200">
                            {solution.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                        </div>
                    </div>
                )}


                {/* Feedback Area */}
                {problemFeedback && (
                    <div className={`p-4 rounded-lg border ${problemFeedback.isCorrect ? 'bg-green-900/20 border-green-500/50' : 'bg-amber-900/20 border-amber-500/50'} animate-fade-in`}>
                        <h4 className={`font-bold text-lg mb-1 ${problemFeedback.isCorrect ? 'text-green-300' : 'text-amber-300'}`}>
                            {problemFeedback.isCorrect ? "Correct!" : "Feedback"}
                        </h4>
                        <p className="text-slate-200">{problemFeedback.feedbackText}</p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end items-center gap-4">
                {error && <p className="text-red-400 text-sm mr-auto">{error}</p>}

                {(problemFeedback?.isCorrect || solution) ? (
                    <button onClick={getNextProblem} disabled={isLoading} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-lg flex items-center gap-2">
                        {isLoading ? 'Loading...' : 'Next Problem'} <SparklesIcon className="w-5 h-5" />
                    </button>
                ) : (
                    <>
                        {problemFeedback && !problemFeedback.isCorrect && (
                            <button onClick={() => setProblemFeedback(null)} disabled={isLoading} className="flex items-center gap-2 px-5 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors active:scale-95">
                                <ArrowPathIcon className="w-5 h-5" /> Try Again
                            </button>
                        )}
                        <button onClick={handleViewAnswer} disabled={isLoading} className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold transition-colors active:scale-95">
                            <LightBulbIcon className="w-5 h-5" /> View Answer
                        </button>
                        <button onClick={handleCheckAnswer} disabled={isLoading || !userPracticeAnswer.trim()} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold text-lg flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="w-6 h-6" /> Check My Answer
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PracticeView;