import React, { useEffect, useState } from 'react';
import { AppState, AppContextType } from '../types';
import { getQuizHistory } from '../services/databaseService';
import { generatePerformancePrediction } from '../services/geminiService';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SkeletonCard, SkeletonChart } from './SkeletonCard';

interface AnalyticsViewProps {
    context: AppContextType;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ context }) => {
    const { user, studentProfile, setAppState } = context;
    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);
    const [prediction, setPrediction] = useState<{ prediction: string; insights: string[]; recommendedFocus: string } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (user && studentProfile) {
                const quizHistory = await getQuizHistory(user.id);
                setHistory(quizHistory);

                if (quizHistory.length > 0) {
                    const aiAnalysis = await generatePerformancePrediction(studentProfile, quizHistory);
                    setPrediction(aiAnalysis);
                }
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, studentProfile]);

    return (
        <div className="flex flex-col h-full animate-fade-in pb-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-violet-400 flex items-center gap-2">
                    <ChartBarIcon className="w-8 h-8" /> Performance Analytics
                </h2>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonChart />
                    <SkeletonCard className="h-32" />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                    <p className="text-xl text-slate-300">No data available yet.</p>
                    <p className="text-slate-500 mb-6">Take some quizzes to unlock AI predictions!</p>
                    <button onClick={() => setAppState(AppState.UPLOAD)} className="px-6 py-3 bg-violet-600 rounded-lg text-white font-bold">
                        Take a Quiz
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2">
                    {/* Prediction Card */}
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 border border-violet-500/30 p-6 rounded-2xl">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-yellow-400" /> AI Predictor
                        </h3>
                        <p className="text-lg text-white/90 italic">"{prediction?.prediction || "Analyzing..."}"</p>
                    </div>

                    {/* Insights */}
                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-slate-200 mb-4">Key Insights</h3>
                        <ul className="space-y-3">
                            {prediction?.insights.map((insight, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                                    <span className="mt-1 w-2 h-2 rounded-full bg-violet-400 flex-shrink-0"></span>
                                    {insight}
                                </li>
                            )) || <p className="text-slate-500">Generating insights...</p>}
                        </ul>
                    </div>

                    {/* Stats Grid */}
                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-slate-200 mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-700/50 p-4 rounded-xl text-center">
                                <span className="block text-2xl font-black text-white">{history.length}</span>
                                <span className="text-xs text-slate-400 uppercase">Quizzes Taken</span>
                            </div>
                            <div className="bg-slate-700/50 p-4 rounded-xl text-center">
                                <span className="block text-2xl font-black text-green-400">
                                    {Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.total_questions), 0) / history.length * 100)}%
                                </span>
                                <span className="text-xs text-slate-400 uppercase">Avg Score</span>
                            </div>
                            <div className="col-span-2 bg-slate-700/50 p-4 rounded-xl text-center">
                                <span className="block text-sm font-bold text-violet-300">{prediction?.recommendedFocus || "General Review"}</span>
                                <span className="text-xs text-slate-400 uppercase">Recommended Focus</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6 flex justify-start">
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default AnalyticsView;
