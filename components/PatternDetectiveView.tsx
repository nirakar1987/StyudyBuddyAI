
import React, { useState, useEffect } from "react";
import { AppState, AppContextType } from "../types";
import { ArrowLeftOnRectangleIcon } from "./icons/ArrowLeftOnRectangleIcon";
import { LightBulbIcon } from "./icons/LightBulbIcon";
import { generatePatternGame, PatternGame } from "../services/geminiService";

interface PatternDetectiveViewProps {
    context: AppContextType;
}

const PatternDetectiveView: React.FC<PatternDetectiveViewProps> = ({ context }) => {
    const { setAppState, studentProfile, setScore } = context;
    const [gameData, setGameData] = useState<PatternGame | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
    const [topic, setTopic] = useState("Arithmetic Sequence");

    const topics = [
        "Arithmetic Sequence",
        "Geometric Sequence",
        "Square Numbers",
        "Prime Numbers",
        "Fibonacci Sequence",
        "Mixed Patterns"
    ];

    const fetchNewGame = async () => {
        setLoading(true);
        setGameData(null);
        setSelectedOption(null);
        setFeedback(null);
        try {
            const data = await generatePatternGame(studentProfile?.grade || 6, topic);
            setGameData(data);
        } catch (error) {
            console.error("Failed to fetch pattern game:", error);
            alert("Failed to load the mystery. Please try again!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNewGame();
    }, [topic]);

    const handleOptionClick = (option: string) => {
        if (selectedOption || !gameData) return;

        setSelectedOption(option);
        const isCorrect = option === gameData.correctAnswer;

        if (isCorrect) {
            setFeedback({ isCorrect: true, text: "Correct! You cracked the code! +50 Points" });
            setScore((prev) => prev + 50);
        } else {
            setFeedback({ isCorrect: false, text: `Missed it! The answer was ${gameData.correctAnswer}.` });
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
                        <span className="text-4xl">🕵️‍♂️</span> Pattern Detective
                    </h2>
                    <p className="text-slate-400 mt-2">Find the missing number to unlock the safe!</p>
                </div>
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-xs uppercase tracking-widest border border-white/5"
                >
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Exit
                </button>
            </div>

            {/* Topic Selection */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
                {topics.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTopic(t)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-all ${topic === t
                                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
                {loading ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-cyan-400 font-bold tracking-widest uppercase">Generating Mystery...</p>
                    </div>
                ) : gameData ? (
                    <div className="w-full bg-slate-800/50 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">

                        {/* The Sequence Lock Interface */}
                        <div className="flex flex-wrap justify-center items-center gap-4 mb-12">
                            {gameData.sequence.map((num, idx) => {
                                const isMissing = idx === gameData.missingIndex;
                                return (
                                    <div
                                        key={idx}
                                        className={`w-20 h-24 md:w-24 md:h-32 flex items-center justify-center rounded-xl text-3xl md:text-5xl font-black shadow-inner transition-all duration-500
                                        ${isMissing
                                                ? (feedback?.isCorrect
                                                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                                                    : feedback
                                                        ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
                                                        : 'bg-slate-900 border-2 border-cyan-500/50 animate-pulse text-cyan-400')
                                                : 'bg-slate-700 text-white border border-white/5'
                                            }`}
                                    >
                                        {isMissing
                                            ? (feedback ? (feedback.isCorrect ? gameData.correctAnswer : '?') : '?')
                                            : num}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Options Keypad */}
                        {!feedback && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                {gameData.options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleOptionClick(option)}
                                        className="group relative bg-slate-700 hover:bg-cyan-600 p-6 rounded-2xl transition-all hover:scale-105 hover:shadow-cyan-500/30 border border-white/5 flex flex-col items-center"
                                    >
                                        <span className="text-2xl font-bold text-white mb-1">{option}</span>
                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 group-hover:text-cyan-200">Input Code</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Feedback & Explanation */}
                        {feedback && (
                            <div className="animate-fade-in-up text-center">
                                <div className={`inline-block px-8 py-4 rounded-2xl mb-6 ${feedback.isCorrect ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                                    <h3 className={`text-2xl font-black mb-2 ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                        {feedback.isCorrect ? "🔓 ACCESS GRANTED" : "🔒 ACCESS DENIED"}
                                    </h3>
                                    <p className="text-white text-lg">{feedback.text}</p>
                                </div>

                                <div className="bg-blue-600/20 rounded-xl p-6 mb-8 max-w-2xl mx-auto border border-blue-500/30">
                                    <div className="flex items-start gap-4 text-left">
                                        <LightBulbIcon className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-blue-300 font-bold uppercase text-xs tracking-widest mb-1">Logic Explanation</h4>
                                            <p className="text-white/90 leading-relaxed">{gameData.explanation}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={fetchNewGame}
                                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-black text-lg shadow-lg shadow-cyan-500/30 hover:scale-105 transition-all"
                                >
                                    Try Another Mystery →
                                </button>
                            </div>
                        )}

                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default PatternDetectiveView;
