import React, { useState, useRef } from 'react';
import { AppState, AppContextType, AvatarState } from '../types';
import { solveHomeworkFromImage, HomeworkSolution } from '../services/geminiService';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface HomeworkScannerViewProps {
    context: AppContextType;
}

const HomeworkScannerView: React.FC<HomeworkScannerViewProps> = ({ context }) => {
    const { setAppState, setAvatarState, studentProfile } = context;
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [solution, setSolution] = useState<HomeworkSolution | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
    const [practiceInput, setPracticeInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !studentProfile) return;
        const file = files[0];

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Analyze
        setIsAnalyzing(true);
        setError(null);
        setSolution(null);
        setShowPracticeAnswer(false);
        setPracticeInput('');
        setAvatarState(AvatarState.THINKING);

        try {
            const result = await solveHomeworkFromImage(file, studentProfile);
            setSolution(result);
        } catch (err: any) {
            setError(err.message || "Failed to analyze the image. Please try again with a clearer photo.");
        } finally {
            setIsAnalyzing(false);
            setAvatarState(AvatarState.IDLE);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const handleReset = () => {
        setSolution(null);
        setImagePreview(null);
        setError(null);
        setShowPracticeAnswer(false);
        setPracticeInput('');
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <span className="text-3xl">📸</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Homework Scanner</h2>
                        <p className="text-slate-400 text-sm font-medium">Snap a photo → Get step-by-step solution</p>
                    </div>
                </div>
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-xs uppercase tracking-widest border border-white/5"
                >
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Back
                </button>
            </div>

            {/* Upload Area (shown when no solution) */}
            {!solution && !isAnalyzing && (
                <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="w-full max-w-lg">
                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="mb-6 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
                                <img src={imagePreview} alt="Homework" className="w-full max-h-64 object-contain bg-slate-900" />
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm">
                                <p className="font-bold mb-1">❌ Analysis Failed</p>
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Upload Options */}
                        <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl border-2 border-dashed border-white/20 hover:border-amber-500/50 transition-all p-10 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                                <span className="text-5xl">📷</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Take a Photo or Upload</h3>
                            <p className="text-slate-400 text-sm mb-6">Take a picture of your homework question and AI will solve it step-by-step!</p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                {/* Camera Button */}
                                <input
                                    type="file"
                                    ref={cameraInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0011.586 3H8.414a1 1 0 00-.707.293L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                    </svg>
                                    📸 Take Photo
                                </button>

                                {/* Upload Button */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*,.pdf"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold text-sm uppercase tracking-wider border border-white/10 transition-all hover:scale-105 active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Upload Image
                                </button>
                            </div>

                            <p className="text-slate-500 text-xs mt-4">Supports: Math equations, Science diagrams, English passages, Hindi questions</p>
                        </div>

                        {/* Tips */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { emoji: '💡', text: 'Make sure the text is clear and well-lit' },
                                { emoji: '🎯', text: 'Focus on one question per photo' },
                                { emoji: '📐', text: 'Works with printed or handwritten text' },
                            ].map((tip, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-xl border border-white/5">
                                    <span className="text-xl">{tip.emoji}</span>
                                    <span className="text-slate-400 text-xs">{tip.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isAnalyzing && (
                <div className="flex-grow flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <SparklesIcon className="w-10 h-10 text-amber-400 animate-pulse" />
                        </div>
                    </div>
                    {imagePreview && (
                        <div className="w-32 h-32 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                            <img src={imagePreview} alt="Analyzing..." className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="max-w-xs">
                        <h3 className="text-xl font-bold text-white mb-2">🔍 Reading your homework...</h3>
                        <p className="text-slate-400 text-sm">AI is analyzing the image and preparing a step-by-step solution for you.</p>
                    </div>
                </div>
            )}

            {/* Solution Display */}
            {solution && (
                <div className="flex-grow overflow-y-auto pr-2 space-y-6 pb-10 custom-scrollbar">
                    {/* Detected Question + Image */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {imagePreview && (
                            <div className="w-full md:w-48 flex-shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                <img src={imagePreview} alt="Question" className="w-full h-48 object-contain bg-slate-900" />
                            </div>
                        )}
                        <div className="flex-grow bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-2xl p-5 border border-amber-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-amber-500/20 rounded-lg text-amber-300 text-[10px] font-black uppercase tracking-widest">Detected Question</span>
                            </div>
                            <p className="text-white font-semibold text-lg leading-relaxed">{solution.detectedQuestion}</p>
                            <div className="flex gap-2 mt-3">
                                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-300">📚 {solution.subject}</span>
                                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-300">🏷️ {solution.topic}</span>
                            </div>
                        </div>
                    </div>

                    {/* Step-by-Step Solution */}
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                        <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2">
                            <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm">📝</span>
                            Step-by-Step Solution
                        </h3>
                        <div className="space-y-4">
                            {solution.steps.map((step, index) => (
                                <div key={index} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                            {step.stepNumber}
                                        </div>
                                        {index < solution.steps.length - 1 && (
                                            <div className="w-0.5 flex-grow bg-gradient-to-b from-indigo-500/50 to-transparent mt-2"></div>
                                        )}
                                    </div>
                                    <div className="flex-grow pb-4">
                                        <h4 className="text-white font-bold text-sm mb-1">{step.title}</h4>
                                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{step.explanation}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Final Answer */}
                    <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-2xl p-5 border border-green-500/30">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div>
                                <p className="text-green-400 text-xs font-black uppercase tracking-widest mb-1">Final Answer</p>
                                <p className="text-white font-bold text-xl">{solution.finalAnswer}</p>
                            </div>
                        </div>
                    </div>

                    {/* Concept Tip */}
                    <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-2xl p-5 border border-cyan-500/20">
                        <div className="flex items-start gap-3">
                            <span className="text-3xl">💡</span>
                            <div>
                                <p className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-1">Quick Concept Tip</p>
                                <p className="text-slate-200 text-sm leading-relaxed">{solution.conceptTip}</p>
                            </div>
                        </div>
                    </div>

                    {/* Practice Question */}
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-yellow-500/20 p-6">
                        <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                            <span className="text-2xl">🎯</span> Now You Try!
                        </h3>
                        <p className="text-slate-200 font-medium mb-4 bg-slate-900/50 p-4 rounded-xl border border-white/5">{solution.practiceQuestion}</p>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={practiceInput}
                                onChange={(e) => setPracticeInput(e.target.value)}
                                placeholder="Type your answer..."
                                className="flex-grow bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white font-medium text-sm outline-none focus:border-yellow-500/50 transition-colors"
                            />
                            <button
                                onClick={() => setShowPracticeAnswer(true)}
                                className="px-5 py-3 bg-yellow-500 hover:bg-yellow-400 rounded-xl text-black font-bold text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/20"
                            >
                                Check
                            </button>
                        </div>

                        {showPracticeAnswer && (
                            <div className="mt-4 p-4 bg-green-900/30 border border-green-500/20 rounded-xl animate-fade-in">
                                <p className="text-green-400 text-xs font-black uppercase tracking-widest mb-1">Answer</p>
                                <p className="text-white font-semibold">{solution.practiceAnswer}</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-center pt-4">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
                        >
                            📸 Scan Another Question
                        </button>
                        <button
                            onClick={() => setAppState(AppState.DASHBOARD)}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold text-sm uppercase tracking-wider border border-white/10 transition-all"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default HomeworkScannerView;
