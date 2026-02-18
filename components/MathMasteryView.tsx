import React, { useState, useRef, useEffect } from 'react';
import { AppContextType } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { getMathStepByStepSolution, evaluateAnswerSemantically } from '../services/geminiService';

interface MathMasteryViewProps {
    context: AppContextType;
}

type MathSection = 'hub' | 'solver' | 'confidence' | 'visual' | 'games' | 'diagnostic' | 'skilltree' | 'advanced';
type VisualTool = 'numberline' | 'fractions' | 'shapes' | 'equations';
type GameType = 'puzzle' | 'memory' | 'speed' | 'pattern';
type AdvancedTopic = 'algebra' | 'trigonometry' | 'calculus' | 'statistics' | 'geometry' | 'wordproblems';

const MathMasteryView: React.FC<MathMasteryViewProps> = ({ context }) => {
    const { studentProfile } = context;
    const [activeSection, setActiveSection] = useState<MathSection>('hub');
    const [mathProblem, setMathProblem] = useState('');
    const [solution, setSolution] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [confidenceLevel, setConfidenceLevel] = useState(1); // 1-5
    const [currentProblem, setCurrentProblem] = useState('');
    const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState<number | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [problemsSolved, setproblemsSolved] = useState(0);
    const [streak, setStreak] = useState(0);

    // Visual tools state
    const [activeVisualTool, setActiveVisualTool] = useState<VisualTool | null>(null);
    const [numberLineValue, setNumberLineValue] = useState(5);
    const [fractionNumerator, setFractionNumerator] = useState(1);
    const [fractionDenominator, setFractionDenominator] = useState(4);

    // Games state
    const [activeGame, setActiveGame] = useState<GameType | null>(null);
    const [gameScore, setGameScore] = useState(0);
    const [puzzleNumbers, setPuzzleNumbers] = useState<number[]>([]);
    const [memoryCards, setMemoryCards] = useState<{ value: number, flipped: boolean, matched: boolean }[]>([]);

    // Diagnostic state
    const [diagnosticStarted, setDiagnosticStarted] = useState(false);
    const [diagnosticQuestion, setDiagnosticQuestion] = useState(0);
    const [diagnosticResults, setDiagnosticResults] = useState<{ topic: string, score: number }[]>([]);

    // Advanced topics state
    const [activeAdvancedTopic, setActiveAdvancedTopic] = useState<AdvancedTopic | null>(null);
    const [advancedAnswers, setAdvancedAnswers] = useState<Record<string, string>>({});
    const [advancedFeedback, setAdvancedFeedback] = useState<Record<string, { correct: boolean; message: string }>>({});
    const [speedMathTime, setSpeedMathTime] = useState(60);
    const [speedMathActive, setSpeedMathActive] = useState(false);
    const [speedMathProblem, setSpeedMathProblem] = useState('');
    const [speedMathAnswer, setSpeedMathAnswer] = useState('');
    const [patternAnswer, setPatternAnswer] = useState('');

    // Helper function to evaluate math expressions safely
    const evaluateExpression = (expr: string): number | null => {
        try {
            // Remove spaces and validate
            const cleaned = expr.replace(/\s/g, '');
            // Only allow numbers, operators, and parentheses
            if (!/^[0-9+\-*/().]+$/.test(cleaned)) return null;
            // Use Function constructor for safe evaluation
            return Function('"use strict"; return (' + cleaned + ')')();
        } catch {
            return null;
        }
    };

    // Solve quadratic equation
    const solveQuadratic = (a: number, b: number, c: number): number[] => {
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return [];
        if (discriminant === 0) return [-b / (2 * a)];
        const sqrt = Math.sqrt(discriminant);
        return [
            (-b + sqrt) / (2 * a),
            (-b - sqrt) / (2 * a)
        ];
    };

    // Generate adaptive math problem based on confidence level
    const generateProblem = () => {
        const problems = {
            1: [{ q: '2 + 3', a: 5 }, { q: '5 - 2', a: 3 }, { q: '4 + 1', a: 5 }, { q: '6 - 3', a: 3 }, { q: '7 + 2', a: 9 }, { q: '9 - 4', a: 5 }],
            2: [{ q: '12 + 8', a: 20 }, { q: '25 - 7', a: 18 }, { q: '15 + 13', a: 28 }, { q: '30 - 12', a: 18 }, { q: '18 + 9', a: 27 }, { q: '22 - 8', a: 14 }],
            3: [{ q: '3 × 4', a: 12 }, { q: '24 ÷ 6', a: 4 }, { q: '7 × 5', a: 35 }, { q: '36 ÷ 9', a: 4 }, { q: '8 × 6', a: 48 }, { q: '45 ÷ 5', a: 9 }],
            4: [{ q: '(5 + 3) × 2', a: 16 }, { q: '48 ÷ (4 + 2)', a: 8 }, { q: '15 - 3 × 2', a: 9 }, { q: '(12 - 4) ÷ 2', a: 4 }, { q: '6 × (3 + 2)', a: 30 }, { q: '(20 - 8) ÷ 3', a: 4 }],
            5: [{ q: '2x + 5 = 13', a: 4 }, { q: '3(x - 2) = 9', a: 5 }, { q: '4x - 7 = 17', a: 6 }, { q: 'x/3 + 4 = 7', a: 9 }, { q: '5x - 3 = 22', a: 5 }, { q: '2(x + 4) = 18', a: 5 }]
        };

        const levelProblems = problems[confidenceLevel as keyof typeof problems];
        const randomProblem = levelProblems[Math.floor(Math.random() * levelProblems.length)];
        setCurrentProblem(randomProblem.q);
        setCurrentCorrectAnswer(randomProblem.a);
        setUserAnswer('');
    };

    const checkAnswer = () => {
        if (!userAnswer.trim()) {
            alert('⚠️ Please enter an answer first!');
            return;
        }

        // Evaluate the current problem and user answer
        const userValue = parseFloat(userAnswer);

        // Simple check against the stored correct answer
        const isCorrect = currentCorrectAnswer !== null && Math.abs(userValue - currentCorrectAnswer) < 0.01;

        if (isCorrect) {
            setproblemsSolved(problemsSolved + 1);
            setConfidenceLevel(Math.min(5, confidenceLevel + 1));
            setStreak(streak + 1);
            alert('🎉 Correct! Great job! You\'re getting better!');
        } else {
            alert(`💪 Not quite! The correct answer is ${currentCorrectAnswer}. Keep practicing!`);
        }
        generateProblem();
    };

    const solveProblem = async () => {
        if (!mathProblem.trim()) {
            alert('⚠️ Please enter a math problem first!');
            return;
        }

        setIsLoading(true);
        setSolution([]);

        try {
            const steps = await getMathStepByStepSolution(mathProblem, context.studentProfile!);
            setSolution(steps);
        } catch (error) {
            console.error("Error solving problem:", error);
            setSolution(["❌ Sorry, I couldn't solve that problem. Please try again with a different one."]);
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize number puzzle game
    const startPuzzleGame = () => {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        setPuzzleNumbers(numbers);
        setGameScore(0);
        setActiveGame('puzzle');
    };

    // Initialize memory game
    const startMemoryGame = () => {
        const values = [1, 2, 3, 4, 5, 6, 7, 8];
        const cards = [...values, ...values].sort(() => Math.random() - 0.5).map((v, i) => ({
            id: i,
            value: v,
            flipped: false,
            matched: false
        }));
        // Use a cast or adjust state type if needed, but for now I'll just adjust the state definition
        setMemoryCards(cards as any);
        setGameScore(0);
        setActiveGame('memory');
    };

    const handleMemoryClick = (index: number) => {
        if (memoryCards[index].flipped || memoryCards[index].matched) return;

        const flippedCards = memoryCards.filter(c => c.flipped && !c.matched);
        if (flippedCards.length === 2) return;

        const newCards = [...memoryCards];
        newCards[index].flipped = true;
        setMemoryCards(newCards);

        if (flippedCards.length === 1) {
            const firstCard = flippedCards[0];
            const secondCard = newCards[index];

            if (firstCard.value === secondCard.value) {
                setTimeout(() => {
                    const matchedCards = newCards.map(c =>
                        c.value === firstCard.value ? { ...c, matched: true, flipped: false } : c
                    );
                    setMemoryCards(matchedCards);
                    setGameScore(prev => prev + 1);
                }, 500);
            } else {
                setTimeout(() => {
                    const resetCards = newCards.map(c =>
                        c.matched ? c : { ...c, flipped: false }
                    );
                    setMemoryCards(resetCards);
                }, 1000);
            }
        }
    };

    const handlePuzzleClick = (index: number) => {
        const emptyIndex = puzzleNumbers.indexOf(9); // 9 is our "empty" slot for a 3x3 puzzle
        const row = Math.floor(index / 3);
        const col = index % 3;
        const emptyRow = Math.floor(emptyIndex / 3);
        const emptyCol = emptyIndex % 3;

        const isAdjacent = Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;
        if (isAdjacent) {
            const newNumbers = [...puzzleNumbers];
            [newNumbers[index], newNumbers[emptyIndex]] = [newNumbers[emptyIndex], newNumbers[index]];
            setPuzzleNumbers(newNumbers);
            setGameScore(prev => prev + 1);

            // Check if solved
            const solved = newNumbers.every((n, i) => n === i + 1);
            if (solved) {
                alert(`🎉 Congratulations! You solved the puzzle in ${gameScore + 1} moves!`);
            }
        }
    };

    const [diagnosticAnswer, setDiagnosticAnswer] = useState('');
    const diagnosticQuestions = [
        { topic: 'Addition', q: '45 + 37', a: '82' },
        { topic: 'Subtraction', q: '120 - 45', a: '75' },
        { topic: 'Multiplication', q: '12 × 8', a: '96' },
        { topic: 'Division', q: '144 ÷ 12', a: '12' },
        { topic: 'Fractions', q: 'What is 1/2 of 50?', a: '25' },
        { topic: 'Algebra', q: 'Solve for x: 2x = 24', a: '12' },
        { topic: 'Geometry', q: 'A square has side 4. Area?', a: '16' },
        { topic: 'Decimals', q: '0.5 + 0.25', a: '0.75' },
        { topic: 'Percentages', q: '10% of 200', a: '20' },
        { topic: 'Logic', q: 'Next in: 2, 4, 8, ...', a: '16' }
    ];

    const startDiagnostic = () => {
        setDiagnosticStarted(true);
        setDiagnosticQuestion(0);
        setDiagnosticResults([]);
        setDiagnosticAnswer('');
    };

    const handleDiagnosticNext = () => {
        const currentQ = diagnosticQuestions[diagnosticQuestion];
        const isCorrect = diagnosticAnswer.trim() === currentQ.a;

        const newResults = [...diagnosticResults, {
            topic: currentQ.topic,
            score: isCorrect ? 100 : 0
        }];

        setDiagnosticResults(newResults);
        setDiagnosticAnswer('');

        if (diagnosticQuestion < diagnosticQuestions.length - 1) {
            setDiagnosticQuestion(diagnosticQuestion + 1);
        }
    };

    // Advanced Topics Answer Checking Functions
    const checkAdvancedAnswer = async (problemId: string, correctAnswer: string | number | number[]) => {
        const userAns = advancedAnswers[problemId]?.trim().toLowerCase();

        if (!userAns) {
            setAdvancedFeedback({
                ...advancedFeedback,
                [problemId]: { correct: false, message: '⚠️ Please enter an answer!' }
            });
            return;
        }

        setIsLoading(true);
        try {
            let isCorrect = false;
            let message = '';

            // Use AI for semantic check if it's not a simple number array
            if (!Array.isArray(correctAnswer)) {
                const { isCorrect: aiCorrect } = await evaluateAnswerSemantically({
                    questionText: `Solve the problem for ${problemId}`,
                    userAnswer: userAns,
                    correctAnswer: correctAnswer.toString()
                });
                isCorrect = aiCorrect;
            } else {
                // For multiple answers (like quadratic equations), use local logic
                const userValues = userAns.split(/[,\s]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
                isCorrect = correctAnswer.every(ans =>
                    userValues.some(uv => Math.abs(uv - ans) < 0.01)
                );
            }

            if (isCorrect) {
                message = '🎉 Correct! Great work!';
                setproblemsSolved(problemsSolved + 1);
                setGameScore(gameScore + 10);
            } else {
                message = `❌ Not quite. The correct answer is: ${Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}`;
            }

            setAdvancedFeedback({
                ...advancedFeedback,
                [problemId]: { correct: isCorrect, message }
            });
        } catch (error) {
            console.error("Error checking advanced answer:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Speed Math Functions
    const startSpeedMath = () => {
        setSpeedMathActive(true);
        setSpeedMathTime(60);
        setGameScore(0);
        generateSpeedMathProblem();

        const timer = setInterval(() => {
            setSpeedMathTime(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setSpeedMathActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const generateSpeedMathProblem = () => {
        const ops = ['+', '-', '×', '÷'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;

        let problem = '';
        if (op === '÷') {
            const result = a * b;
            problem = `${result} ${op} ${a}`;
        } else {
            problem = `${a} ${op} ${b}`;
        }

        setSpeedMathProblem(problem);
        setSpeedMathAnswer('');
    };

    const checkSpeedMath = () => {
        const problem = speedMathProblem.replace('×', '*').replace('÷', '/');
        const correct = evaluateExpression(problem);
        const userAns = parseFloat(speedMathAnswer);

        if (correct !== null && Math.abs(userAns - correct) < 0.01) {
            setGameScore(gameScore + 1);
            generateSpeedMathProblem();
        } else {
            alert(`❌ Incorrect! The answer was ${correct}`);
            generateSpeedMathProblem();
        }
    };

    // Pattern Finder Check
    const checkPattern = () => {
        // Pattern: 2, 4, 6, ?, 10 (answer: 8)
        const correctAnswer = 8;
        const userAns = parseInt(patternAnswer);

        if (userAns === correctAnswer) {
            alert('🎉 Correct! The pattern is adding 2 each time!');
            setGameScore(gameScore + 10);
        } else {
            alert('❌ Not quite. Look at the pattern: 2, 4, 6, ?, 10. Each number increases by 2!');
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto pr-2 pb-8">
            {/* Header */}
            <div className="mb-6 animate-fade-in">
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    🧮 Math Mastery Center
                </h1>
                <p className="text-slate-400 text-lg">
                    Your personal math improvement journey starts here! 🚀
                </p>
            </div>

            {activeSection === 'hub' && (
                <div className="space-y-6">
                    {/* Welcome Card */}
                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-6xl">🎓</div>
                            <div>
                                <h2 className="text-3xl font-black text-white">Welcome, {studentProfile?.name}!</h2>
                                <p className="text-white/80 text-lg">Let's make math fun and easy together!</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-white/10 rounded-xl p-4 text-center">
                                <div className="text-3xl font-black text-green-400">{problemsSolved}</div>
                                <div className="text-sm text-white/70">Problems Solved</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 text-center">
                                <div className="text-3xl font-black text-yellow-400">{confidenceLevel}</div>
                                <div className="text-sm text-white/70">Confidence Level</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 text-center">
                                <div className="text-3xl font-black text-blue-400">{streak}</div>
                                <div className="text-sm text-white/70">Streak Days</div>
                            </div>
                        </div>
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <MathFeatureCard
                            icon="🔍"
                            title="Step-by-Step Solver"
                            description="Break down any problem into easy steps"
                            gradient="from-blue-600 to-cyan-600"
                            onClick={() => setActiveSection('solver')}
                        />
                        <MathFeatureCard
                            icon="💪"
                            title="Confidence Builder"
                            description="Practice at your perfect level"
                            gradient="from-green-600 to-emerald-600"
                            onClick={() => setActiveSection('confidence')}
                        />
                        <MathFeatureCard
                            icon="🎨"
                            title="Visual Learning"
                            description="See math come to life"
                            gradient="from-purple-600 to-pink-600"
                            onClick={() => setActiveSection('visual')}
                        />
                        <MathFeatureCard
                            icon="🎮"
                            title="Math Games"
                            description="Learn while having fun"
                            gradient="from-orange-600 to-red-600"
                            onClick={() => setActiveSection('games')}
                        />
                        <MathFeatureCard
                            icon="📊"
                            title="Diagnostic Test"
                            description="Find your weak areas"
                            gradient="from-yellow-600 to-amber-600"
                            onClick={() => setActiveSection('diagnostic')}
                        />
                        <MathFeatureCard
                            icon="🌳"
                            title="Skill Tree"
                            description="Track your progress"
                            gradient="from-teal-600 to-cyan-600"
                            onClick={() => setActiveSection('skilltree')}
                        />
                        <MathFeatureCard
                            icon="🚀"
                            title="Advanced Topics"
                            description="Algebra, Calculus, Trigonometry & more"
                            gradient="from-indigo-600 to-violet-600"
                            onClick={() => setActiveSection('advanced')}
                        />
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-500/30">
                        <h3 className="text-xl font-black text-yellow-300 mb-3 flex items-center gap-2">
                            <LightBulbIcon className="w-6 h-6" />
                            Daily Math Tip
                        </h3>
                        <p className="text-white/90">
                            🌟 <strong>Remember:</strong> Making mistakes is how we learn! Every wrong answer teaches you something new. Keep trying! 💪
                        </p>
                    </div>
                </div>
            )}

            {activeSection === 'solver' && (
                <div className="space-y-6 animate-fade-in">
                    <button
                        onClick={() => setActiveSection('hub')}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        ← Back to Hub
                    </button>

                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                        <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
                            🔍 Step-by-Step Math Solver
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Enter any math problem and I'll break it down into easy-to-understand steps!
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-white font-bold mb-2">Your Math Problem:</label>
                                <input
                                    type="text"
                                    value={mathProblem}
                                    onChange={(e) => setMathProblem(e.target.value)}
                                    placeholder="e.g., 2x + 5 = 13"
                                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-cyan-500 outline-none text-lg"
                                    onKeyPress={(e) => e.key === 'Enter' && solveProblem()}
                                />
                            </div>

                            <button
                                onClick={solveProblem}
                                disabled={isLoading || !mathProblem.trim()}
                                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-cyan-500/50"
                            >
                                {isLoading ? '🔄 Solving...' : '✨ Solve Step-by-Step'}
                            </button>
                        </div>

                        {isLoading && (
                            <div className="mt-6 flex flex-col items-center">
                                <SparklesIcon className="w-16 h-16 text-cyan-400 animate-pulse" />
                                <p className="text-white/80 mt-4">Breaking down your problem...</p>
                            </div>
                        )}

                        {solution.length > 0 && (
                            <div className="mt-6 space-y-3">
                                <h3 className="text-xl font-bold text-cyan-300 mb-4">📝 Solution Steps:</h3>
                                {solution.map((step, index) => (
                                    <div
                                        key={index}
                                        className="bg-slate-700/50 p-4 rounded-xl border-l-4 border-cyan-500 animate-slide-bounce"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <p className="text-white">{step}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSection === 'confidence' && (
                <div className="space-y-6 animate-fade-in">
                    <button
                        onClick={() => setActiveSection('hub')}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        ← Back to Hub
                    </button>

                    <div className="bg-gradient-to-br from-green-800/30 to-emerald-800/30 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30">
                        <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
                            💪 Confidence Builder
                        </h2>
                        <p className="text-green-200 mb-6">
                            Practice problems that match your skill level. As you improve, the difficulty increases automatically!
                        </p>

                        {/* Confidence Level Display */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-bold">Your Level:</span>
                                <span className="text-2xl font-black text-green-400">Level {confidenceLevel}</span>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                        key={level}
                                        className={`flex-1 h-3 rounded-full transition-all ${level <= confidenceLevel
                                            ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                                            : 'bg-slate-700'
                                            }`}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>Beginner</span>
                                <span>Expert</span>
                            </div>
                        </div>

                        {/* Current Problem */}
                        {!currentProblem ? (
                            <button
                                onClick={generateProblem}
                                className="w-full px-8 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl font-black text-xl transition-all shadow-lg hover:shadow-green-500/50"
                            >
                                🚀 Start Practice
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-2xl p-8 text-center">
                                    <p className="text-slate-400 text-sm mb-2">Solve this problem:</p>
                                    <p className="text-4xl font-black text-white mb-6">{currentProblem}</p>

                                    <input
                                        type="text"
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        placeholder="Your answer..."
                                        className="w-full max-w-md mx-auto px-6 py-4 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-green-500 outline-none text-2xl text-center font-bold"
                                        onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={checkAnswer}
                                        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all"
                                    >
                                        ✓ Check Answer
                                    </button>
                                    <button
                                        onClick={generateProblem}
                                        className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold transition-all"
                                    >
                                        ⏭️ Skip
                                    </button>
                                </div>

                                <div className="bg-blue-600/20 rounded-xl p-4 border border-blue-500/30">
                                    <p className="text-blue-200 text-sm">
                                        💡 <strong>Tip:</strong> Take your time! There's no rush. Think through each step carefully.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSection === 'visual' && (
                <div className="space-y-6 animate-fade-in">
                    <button
                        onClick={() => setActiveSection('hub')}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        ← Back to Hub
                    </button>

                    <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
                        <h2 className="text-3xl font-black text-white mb-4">🎨 Visual Math Playground</h2>
                        <p className="text-purple-200 mb-6">Interactive tools to see math concepts visually!</p>

                        {!activeVisualTool ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => setActiveVisualTool('numberline')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left"
                                >
                                    <div className="text-4xl mb-3">📏</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Number Line</h3>
                                    <p className="text-slate-300 text-sm">Visualize addition and subtraction</p>
                                </button>

                                <button
                                    onClick={() => setActiveVisualTool('fractions')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left"
                                >
                                    <div className="text-4xl mb-3">🍕</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Fraction Pizza</h3>
                                    <p className="text-slate-300 text-sm">Understand fractions with pizza slices</p>
                                </button>

                                <button
                                    onClick={() => setActiveVisualTool('shapes')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left"
                                >
                                    <div className="text-4xl mb-3">📐</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Shape Builder</h3>
                                    <p className="text-slate-300 text-sm">Learn geometry by creating shapes</p>
                                </button>

                                <button
                                    onClick={() => setActiveVisualTool('equations')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left"
                                >
                                    <div className="text-4xl mb-3">⚖️</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Equation Balancer</h3>
                                    <p className="text-slate-300 text-sm">Balance equations like a scale</p>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setActiveVisualTool(null)}
                                    className="text-purple-300 hover:text-purple-200 transition-colors"
                                >
                                    ← Back to Tools
                                </button>

                                {activeVisualTool === 'numberline' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">📏 Number Line</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-white font-bold mb-2 block">Move the marker:</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="10"
                                                    value={numberLineValue}
                                                    onChange={(e) => setNumberLineValue(parseInt(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="relative h-20 bg-slate-700 rounded-xl flex items-center justify-between px-4">
                                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                    <div key={num} className="flex flex-col items-center">
                                                        <div className={`w-1 h-4 ${num === numberLineValue ? 'bg-yellow-400' : 'bg-white/50'}`}></div>
                                                        <span className={`text-sm mt-1 ${num === numberLineValue ? 'text-yellow-400 font-bold text-lg' : 'text-white/70'}`}>
                                                            {num}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-3xl font-black text-yellow-400">Current Value: {numberLineValue}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeVisualTool === 'fractions' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">🍕 Fraction Pizza</h3>
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-white font-bold mb-2 block">Numerator (slices taken):</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={fractionDenominator}
                                                        value={fractionNumerator}
                                                        onChange={(e) => setFractionNumerator(Math.min(parseInt(e.target.value) || 0, fractionDenominator))}
                                                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-white font-bold mb-2 block">Denominator (total slices):</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="12"
                                                        value={fractionDenominator}
                                                        onChange={(e) => setFractionDenominator(Math.max(1, parseInt(e.target.value) || 1))}
                                                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-center">
                                                <div className="relative w-64 h-64 bg-yellow-600 rounded-full overflow-hidden border-8 border-orange-700">
                                                    {Array.from({ length: fractionDenominator }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`absolute w-full h-full ${i < fractionNumerator ? 'bg-red-600' : 'bg-yellow-600'}`}
                                                            style={{
                                                                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((i * 2 * Math.PI) / fractionDenominator - Math.PI / 2)}% ${50 + 50 * Math.sin((i * 2 * Math.PI) / fractionDenominator - Math.PI / 2)}%, ${50 + 50 * Math.cos(((i + 1) * 2 * Math.PI) / fractionDenominator - Math.PI / 2)}% ${50 + 50 * Math.sin(((i + 1) * 2 * Math.PI) / fractionDenominator - Math.PI / 2)}%)`,
                                                                borderLeft: '2px solid #fff'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-4xl font-black text-yellow-400">
                                                    {fractionNumerator}/{fractionDenominator}
                                                </p>
                                                <p className="text-white/70 mt-2">
                                                    = {((fractionNumerator / fractionDenominator) * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeVisualTool === 'shapes' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">📐 Shape Builder</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-slate-700 rounded-xl p-6 text-center">
                                                <div className="w-20 h-20 bg-blue-500 mx-auto mb-3"></div>
                                                <p className="text-white font-bold">Square</p>
                                                <p className="text-sm text-slate-400">4 sides</p>
                                            </div>
                                            <div className="bg-slate-700 rounded-xl p-6 text-center">
                                                <div className="w-20 h-16 bg-green-500 mx-auto mb-3"></div>
                                                <p className="text-white font-bold">Rectangle</p>
                                                <p className="text-sm text-slate-400">4 sides</p>
                                            </div>
                                            <div className="bg-slate-700 rounded-xl p-6 text-center">
                                                <div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-red-500 mx-auto mb-3"></div>
                                                <p className="text-white font-bold">Triangle</p>
                                                <p className="text-sm text-slate-400">3 sides</p>
                                            </div>
                                            <div className="bg-slate-700 rounded-xl p-6 text-center">
                                                <div className="w-20 h-20 bg-purple-500 rounded-full mx-auto mb-3"></div>
                                                <p className="text-white font-bold">Circle</p>
                                                <p className="text-sm text-slate-400">0 sides</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeVisualTool === 'equations' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">⚖️ Equation Balancer</h3>
                                        <div className="space-y-6">
                                            <p className="text-white text-center">Balance the equation by keeping both sides equal!</p>
                                            <div className="flex items-center justify-center gap-8">
                                                <div className="bg-blue-600 rounded-xl p-8 text-center">
                                                    <p className="text-white font-bold mb-2">Left Side</p>
                                                    <p className="text-4xl font-black text-white">5</p>
                                                </div>
                                                <div className="text-6xl text-yellow-400">=</div>
                                                <div className="bg-blue-600 rounded-xl p-8 text-center">
                                                    <p className="text-white font-bold mb-2">Right Side</p>
                                                    <p className="text-4xl font-black text-white">5</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-green-400">✓ Balanced!</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSection === 'games' && (
                <div className="space-y-6 animate-fade-in">
                    <button
                        onClick={() => setActiveSection('hub')}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        ← Back to Hub
                    </button>

                    <div className="bg-gradient-to-br from-orange-800/30 to-red-800/30 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30">
                        <h2 className="text-3xl font-black text-white mb-4">🎮 Math Games</h2>
                        <p className="text-orange-200 mb-6">Learn math through fun and engaging games!</p>

                        {!activeGame ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={startPuzzleGame}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left"
                                >
                                    <div className="text-4xl mb-3">🧩</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Number Puzzle</h3>
                                    <p className="text-slate-300 text-sm">Arrange numbers in order</p>
                                </button>

                                <button
                                    onClick={startMemoryGame}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left"
                                >
                                    <div className="text-4xl mb-3">🃏</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Memory Match</h3>
                                    <p className="text-slate-300 text-sm">Match pairs of numbers</p>
                                </button>

                                <button
                                    onClick={() => setActiveGame('speed')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left"
                                >
                                    <div className="text-4xl mb-3">⚡</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Speed Math</h3>
                                    <p className="text-slate-300 text-sm">Solve as fast as you can</p>
                                </button>

                                <button
                                    onClick={() => setActiveGame('pattern')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left"
                                >
                                    <div className="text-4xl mb-3">🔢</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Pattern Finder</h3>
                                    <p className="text-slate-300 text-sm">Find the missing number</p>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setActiveGame(null)}
                                    className="text-orange-300 hover:text-orange-200 transition-colors"
                                >
                                    ← Back to Games
                                </button>

                                {activeGame === 'puzzle' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">🧩 Number Puzzle</h3>
                                        <p className="text-white/70 mb-4">Arrange the numbers from 1 to 9 in order!</p>
                                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                                            {puzzleNumbers.map((num, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handlePuzzleClick(index)}
                                                    className={`bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-center cursor-pointer hover:scale-105 transition-transform ${num === 9 ? 'opacity-0 cursor-default' : ''}`}
                                                >
                                                    <p className="text-4xl font-black text-white">{num}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 text-center">
                                            <p className="text-white font-bold">Score: {gameScore}</p>
                                        </div>
                                    </div>
                                )}

                                {activeGame === 'memory' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">🃏 Memory Match</h3>
                                        <p className="text-white/70 mb-4">Find matching pairs of numbers!</p>
                                        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                                            {memoryCards.map((card, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleMemoryClick(index)}
                                                    className={`aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all ${card.matched
                                                        ? 'bg-green-600'
                                                        : card.flipped
                                                            ? 'bg-blue-600'
                                                            : 'bg-slate-700 hover:bg-slate-600'
                                                        }`}
                                                >
                                                    <p className="text-4xl font-black text-white">
                                                        {card.flipped || card.matched ? card.value : '?'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 text-center">
                                            <p className="text-white font-bold">Matches: {gameScore}</p>
                                        </div>
                                    </div>
                                )}

                                {activeGame === 'speed' && (
                                    <div className="bg-white/10 rounded-xl p-6 text-center">
                                        <h3 className="text-2xl font-bold text-white mb-4">⚡ Speed Math</h3>
                                        {!speedMathActive ? (
                                            <button
                                                onClick={startSpeedMath}
                                                className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold transition-all"
                                            >
                                                Start Game!
                                            </button>
                                        ) : (
                                            <>
                                                <p className="text-white/70 mb-6">Solve as many problems as you can!</p>
                                                <div className="bg-slate-700 rounded-xl p-8 mb-6">
                                                    <p className="text-5xl font-black text-white mb-4">{speedMathProblem} = ?</p>
                                                    <input
                                                        type="number"
                                                        className="w-32 px-4 py-3 bg-slate-600 text-white rounded-lg text-center text-2xl font-bold"
                                                        placeholder="?"
                                                        value={speedMathAnswer}
                                                        onChange={(e) => {
                                                            setSpeedMathAnswer(e.target.value);
                                                            // Auto check on input change
                                                            const correct = evaluateExpression(speedMathProblem.replace('×', '*').replace('÷', '/'));
                                                            if (parseFloat(e.target.value) === correct) {
                                                                setGameScore(prev => prev + 1);
                                                                setSpeedMathAnswer('');
                                                                generateSpeedMathProblem();
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="flex justify-center gap-8">
                                                    <div>
                                                        <p className="text-slate-400 text-sm">Time Left</p>
                                                        <p className={`text-3xl font-black ${speedMathTime <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                                                            {speedMathTime}s
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 text-sm">Score</p>
                                                        <p className="text-3xl font-black text-green-400">{gameScore}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeGame === 'pattern' && (
                                    <div className="bg-white/10 rounded-xl p-6 text-center">
                                        <h3 className="text-2xl font-bold text-white mb-4">🔢 Pattern Finder</h3>
                                        <p className="text-white/70 mb-6">Find the missing number in the pattern!</p>
                                        <div className="flex justify-center gap-4 mb-6">
                                            {[2, 4, 6, '?', 10].map((num, i) => (
                                                <div key={i} className="bg-slate-700 rounded-xl w-16 h-16 flex items-center justify-center">
                                                    <p className="text-2xl font-black text-white">{num}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <input
                                            type="number"
                                            className="w-32 px-4 py-3 bg-slate-600 text-white rounded-lg text-center text-2xl font-bold mb-4"
                                            placeholder="?"
                                            value={patternAnswer}
                                            onChange={(e) => setPatternAnswer(e.target.value)}
                                        />
                                        <div>
                                            <button
                                                onClick={() => {
                                                    if (patternAnswer === '8') {
                                                        alert('🎉 Correct! You found the pattern (+2)!');
                                                        setGameScore(prev => prev + 10);
                                                        setPatternAnswer('');
                                                    } else {
                                                        alert('❌ Try again! Look for the difference between the numbers.');
                                                    }
                                                }}
                                                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all"
                                            >
                                                Check Answer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSection === 'diagnostic' && (
                <div className="space-y-6 animate-fade-in">
                    <button
                        onClick={() => setActiveSection('hub')}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        ← Back to Hub
                    </button>

                    <div className="bg-gradient-to-br from-yellow-800/30 to-amber-800/30 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/30">
                        <h2 className="text-3xl font-black text-white mb-4">📊 Diagnostic Test</h2>
                        <p className="text-yellow-200 mb-6">Find out which math topics you need to work on!</p>

                        {!diagnosticStarted ? (
                            <div className="text-center space-y-6">
                                <div className="bg-white/10 rounded-xl p-8">
                                    <h3 className="text-2xl font-bold text-white mb-4">What to Expect:</h3>
                                    <ul className="text-left text-white/80 space-y-2 max-w-md mx-auto">
                                        <li>✓ 10 questions covering different topics</li>
                                        <li>✓ Takes about 10 minutes</li>
                                        <li>✓ No time pressure - take your time!</li>
                                        <li>✓ Get personalized recommendations</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={startDiagnostic}
                                    className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-2xl font-black text-xl transition-all shadow-lg"
                                >
                                    🚀 Start Diagnostic Test
                                </button>
                            </div>
                        ) : diagnosticResults.length === 0 ? (
                            <div className="space-y-6">
                                <div className="bg-white/10 rounded-xl p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-white font-bold">Question {diagnosticQuestion + 1} of 10</p>
                                        <p className="text-slate-400 text-sm">Take your time!</p>
                                    </div>
                                    <div className="bg-slate-700 rounded-xl p-8 mb-6">
                                        <p className="text-3xl font-black text-white text-center mb-6">{diagnosticQuestions[diagnosticQuestion].q} = ?</p>
                                        <input
                                            type="number"
                                            className="w-full px-6 py-4 bg-slate-600 text-white rounded-xl text-center text-2xl font-bold"
                                            placeholder="Your answer..."
                                            value={diagnosticAnswer}
                                            onChange={(e) => setDiagnosticAnswer(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleDiagnosticNext}
                                            className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold transition-all"
                                        >
                                            {diagnosticQuestion < 9 ? 'Next Question →' : 'Finish Test ✓'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-green-600/20 rounded-xl p-6 border border-green-500/30">
                                    <h3 className="text-2xl font-bold text-green-300 mb-4">✓ Test Complete!</h3>
                                    <p className="text-white/80">Here are your results:</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {diagnosticResults.map((result, index) => (
                                        <div key={index} className="bg-white/10 rounded-xl p-6">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-lg font-bold text-white">{result.topic}</h4>
                                                <span className={`text-2xl font-black ${result.score >= 80 ? 'text-green-400' : result.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {result.score}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-700 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full ${result.score >= 80 ? 'bg-green-400' : result.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                    style={{ width: `${result.score}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-2">
                                                {result.score >= 80 ? '✓ Great!' : result.score >= 60 ? '⚠ Needs practice' : '❌ Focus here'}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-blue-600/20 rounded-xl p-6 border border-blue-500/30">
                                    <h4 className="text-xl font-bold text-blue-300 mb-3">📚 Recommendations:</h4>
                                    <ul className="text-white/80 space-y-2">
                                        {diagnosticResults
                                            .filter(r => r.score < 80)
                                            .map((r, i) => (
                                                <li key={i}>• Practice more {r.topic} problems in Confidence Builder</li>
                                            ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => {
                                        setDiagnosticStarted(false);
                                        setDiagnosticResults([]);
                                        setDiagnosticQuestion(0);
                                    }}
                                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold transition-all"
                                >
                                    Take Test Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSection === 'skilltree' && (
                <div className="space-y-6 animate-fade-in">
                    <button
                        onClick={() => setActiveSection('hub')}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        ← Back to Hub
                    </button>

                    <div className="bg-gradient-to-br from-teal-800/30 to-cyan-800/30 backdrop-blur-sm rounded-2xl p-8 border border-teal-500/30">
                        <h2 className="text-3xl font-black text-white mb-4">🌳 Math Skill Tree</h2>
                        <p className="text-teal-200 mb-6">Track your progress through different math topics!</p>

                        <div className="space-y-4">
                            {[
                                { name: 'Addition', level: 5, maxLevel: 5, unlocked: true },
                                { name: 'Subtraction', level: 4, maxLevel: 5, unlocked: true },
                                { name: 'Multiplication', level: 3, maxLevel: 5, unlocked: true },
                                { name: 'Division', level: 2, maxLevel: 5, unlocked: true },
                                { name: 'Fractions', level: 1, maxLevel: 5, unlocked: true },
                                { name: 'Decimals', level: 0, maxLevel: 5, unlocked: false },
                                { name: 'Algebra', level: 0, maxLevel: 5, unlocked: false },
                                { name: 'Geometry', level: 0, maxLevel: 5, unlocked: false }
                            ].map((skill, index) => (
                                <div
                                    key={index}
                                    className={`bg-white/10 rounded-xl p-6 ${skill.unlocked ? '' : 'opacity-50'}`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`text-3xl ${skill.unlocked ? '' : 'grayscale'}`}>
                                                {skill.level === skill.maxLevel ? '⭐' : skill.unlocked ? '🔓' : '🔒'}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{skill.name}</h3>
                                                <p className="text-sm text-slate-400">
                                                    Level {skill.level}/{skill.maxLevel}
                                                </p>
                                            </div>
                                        </div>
                                        {skill.level === skill.maxLevel && (
                                            <span className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold text-sm">
                                                MASTERED!
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {Array.from({ length: skill.maxLevel }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`flex-1 h-3 rounded-full ${i < skill.level
                                                    ? 'bg-gradient-to-r from-teal-400 to-cyan-400'
                                                    : 'bg-slate-700'
                                                    }`}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'advanced' && (
                <div className="space-y-6 animate-fade-in">
                    <button
                        onClick={() => setActiveSection('hub')}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        ← Back to Hub
                    </button>

                    <div className="bg-gradient-to-br from-indigo-800/30 to-violet-800/30 backdrop-blur-sm rounded-2xl p-8 border border-indigo-500/30">
                        <h2 className="text-3xl font-black text-white mb-4">🚀 Advanced Math Topics</h2>
                        <p className="text-indigo-200 mb-6">Master higher-level mathematics for advanced students!</p>

                        {!activeAdvancedTopic ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <button
                                    onClick={() => setActiveAdvancedTopic('algebra')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left group"
                                >
                                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📐</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Advanced Algebra</h3>
                                    <p className="text-slate-300 text-sm mb-3">Quadratic equations, polynomials, systems of equations</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-blue-600/50 rounded text-xs text-white">Quadratics</span>
                                        <span className="px-2 py-1 bg-blue-600/50 rounded text-xs text-white">Polynomials</span>
                                        <span className="px-2 py-1 bg-blue-600/50 rounded text-xs text-white">Systems</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveAdvancedTopic('trigonometry')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left group"
                                >
                                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Trigonometry</h3>
                                    <p className="text-slate-300 text-sm mb-3">Sin, cos, tan, unit circle, angles</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-purple-600/50 rounded text-xs text-white">Sin/Cos/Tan</span>
                                        <span className="px-2 py-1 bg-purple-600/50 rounded text-xs text-white">Unit Circle</span>
                                        <span className="px-2 py-1 bg-purple-600/50 rounded text-xs text-white">Angles</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveAdvancedTopic('calculus')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left group"
                                >
                                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">∫</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Calculus</h3>
                                    <p className="text-slate-300 text-sm mb-3">Derivatives, integrals, limits</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-green-600/50 rounded text-xs text-white">Derivatives</span>
                                        <span className="px-2 py-1 bg-green-600/50 rounded text-xs text-white">Integrals</span>
                                        <span className="px-2 py-1 bg-green-600/50 rounded text-xs text-white">Limits</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveAdvancedTopic('statistics')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left group"
                                >
                                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📈</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Statistics & Probability</h3>
                                    <p className="text-slate-300 text-sm mb-3">Mean, median, mode, probability, distributions</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-yellow-600/50 rounded text-xs text-white">Mean/Median</span>
                                        <span className="px-2 py-1 bg-yellow-600/50 rounded text-xs text-white">Probability</span>
                                        <span className="px-2 py-1 bg-yellow-600/50 rounded text-xs text-white">Graphs</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveAdvancedTopic('geometry')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left group"
                                >
                                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🔺</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Advanced Geometry</h3>
                                    <p className="text-slate-300 text-sm mb-3">Pythagorean theorem, area, volume, 3D shapes</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-red-600/50 rounded text-xs text-white">Pythagorean</span>
                                        <span className="px-2 py-1 bg-red-600/50 rounded text-xs text-white">Area/Volume</span>
                                        <span className="px-2 py-1 bg-red-600/50 rounded text-xs text-white">3D Shapes</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveAdvancedTopic('wordproblems')}
                                    className="bg-white/10 rounded-xl p-6 hover:bg-white/20 transition-all text-left group"
                                >
                                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Word Problems</h3>
                                    <p className="text-slate-300 text-sm mb-3">Real-world applications, problem-solving strategies</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-orange-600/50 rounded text-xs text-white">Real-World</span>
                                        <span className="px-2 py-1 bg-orange-600/50 rounded text-xs text-white">Applications</span>
                                        <span className="px-2 py-1 bg-orange-600/50 rounded text-xs text-white">Strategy</span>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <button
                                    onClick={() => setActiveAdvancedTopic(null)}
                                    className="text-indigo-300 hover:text-indigo-200 transition-colors"
                                >
                                    ← Back to Topics
                                </button>

                                {activeAdvancedTopic === 'algebra' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">📐 Advanced Algebra</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-bold text-blue-300 mb-3">Quadratic Equations</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-4">
                                                    <p className="text-white text-lg">Solve: x² + 5x + 6 = 0</p>
                                                    <div className="space-y-2 text-slate-300">
                                                        <p>📝 <strong>Step 1:</strong> Factor the equation</p>
                                                        <p className="ml-6">(x + 2)(x + 3) = 0</p>
                                                        <p>📝 <strong>Step 2:</strong> Set each factor to zero</p>
                                                        <p className="ml-6">x + 2 = 0  or  x + 3 = 0</p>
                                                        <p>📝 <strong>Step 3:</strong> Solve for x</p>
                                                        <p className="ml-6 text-green-400 font-bold">x = -2  or  x = -3</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-blue-300 mb-3">Quadratic Formula</h4>
                                                <div className="bg-slate-700 rounded-xl p-6">
                                                    <p className="text-white text-center text-2xl mb-4">x = (-b ± √(b² - 4ac)) / 2a</p>
                                                    <p className="text-slate-300 text-sm">For equations in the form: ax² + bx + c = 0</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-blue-300 mb-3">Practice Problems</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-slate-700 rounded-xl p-4 space-y-3">
                                                        <p className="text-white mb-2">1. x² - 7x + 12 = 0</p>
                                                        <input
                                                            type="text"
                                                            placeholder="x = ? (e.g., 3, 4)"
                                                            className="w-full px-3 py-2 bg-slate-600 text-white rounded"
                                                            value={advancedAnswers['algebra1'] || ''}
                                                            onChange={(e) => setAdvancedAnswers({ ...advancedAnswers, algebra1: e.target.value })}
                                                        />
                                                        <button
                                                            onClick={() => checkAdvancedAnswer('algebra1', [3, 4])}
                                                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all"
                                                        >
                                                            Check Answer
                                                        </button>
                                                        {advancedFeedback['algebra1'] && (
                                                            <p className={`text-sm ${advancedFeedback['algebra1'].correct ? 'text-green-400' : 'text-red-400'}`}>
                                                                {advancedFeedback['algebra1'].message}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="bg-slate-700 rounded-xl p-4 space-y-3">
                                                        <p className="text-white mb-2">2. 2x² + 5x - 3 = 0</p>
                                                        <input
                                                            type="text"
                                                            placeholder="x = ? (e.g., 0.5, -3)"
                                                            className="w-full px-3 py-2 bg-slate-600 text-white rounded"
                                                            value={advancedAnswers['algebra2'] || ''}
                                                            onChange={(e) => setAdvancedAnswers({ ...advancedAnswers, algebra2: e.target.value })}
                                                        />
                                                        <button
                                                            onClick={() => checkAdvancedAnswer('algebra2', [0.5, -3])}
                                                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all"
                                                        >
                                                            Check Answer
                                                        </button>
                                                        {advancedFeedback['algebra2'] && (
                                                            <p className={`text-sm ${advancedFeedback['algebra2'].correct ? 'text-green-400' : 'text-red-400'}`}>
                                                                {advancedFeedback['algebra2'].message}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeAdvancedTopic === 'trigonometry' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">📊 Trigonometry</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-bold text-purple-300 mb-3">Basic Trig Functions</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-3">
                                                    <p className="text-white"><strong>sin(╬╕)</strong> = Opposite / Hypotenuse</p>
                                                    <p className="text-white"><strong>cos(╬╕)</strong> = Adjacent / Hypotenuse</p>
                                                    <p className="text-white"><strong>tan(╬╕)</strong> = Opposite / Adjacent</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-purple-300 mb-3">Unit Circle (Key Angles)</h4>
                                                <div className="bg-slate-700 rounded-xl p-6">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                                        <div>
                                                            <p className="text-yellow-400 font-bold">0°</p>
                                                            <p className="text-sm text-slate-300">sin = 0</p>
                                                            <p className="text-sm text-slate-300">cos = 1</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-yellow-400 font-bold">90°</p>
                                                            <p className="text-sm text-slate-300">sin = 1</p>
                                                            <p className="text-sm text-slate-300">cos = 0</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-yellow-400 font-bold">180°</p>
                                                            <p className="text-sm text-slate-300">sin = 0</p>
                                                            <p className="text-sm text-slate-300">cos = -1</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-yellow-400 font-bold">270°</p>
                                                            <p className="text-sm text-slate-300">sin = -1</p>
                                                            <p className="text-sm text-slate-300">cos = 0</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-purple-300 mb-3">Practice</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-3">
                                                    <p className="text-white mb-4">In a right triangle, if the opposite side = 3 and hypotenuse = 5:</p>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-white">sin(╬╕) = </span>
                                                            <input
                                                                type="text"
                                                                placeholder="0.6 or 3/5"
                                                                className="px-3 py-2 bg-slate-600 text-white rounded flex-1"
                                                                value={advancedAnswers['trig1'] || ''}
                                                                onChange={(e) => setAdvancedAnswers({ ...advancedAnswers, trig1: e.target.value })}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => checkAdvancedAnswer('trig1', 0.6)}
                                                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all"
                                                        >
                                                            Check Answer
                                                        </button>
                                                        {advancedFeedback['trig1'] && (
                                                            <p className={`text-sm ${advancedFeedback['trig1'].correct ? 'text-green-400' : 'text-red-400'}`}>
                                                                {advancedFeedback['trig1'].message}
                                                            </p>
                                                        )}
                                                        <p className="text-slate-400 text-sm">💡 Hint: 3/5 = 0.6</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeAdvancedTopic === 'calculus' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">∫ Calculus</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-bold text-green-300 mb-3">Derivatives (Rate of Change)</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-4">
                                                    <p className="text-white text-lg">Find the derivative of: f(x) = x²</p>
                                                    <div className="space-y-2 text-slate-300">
                                                        <p>📝 <strong>Power Rule:</strong> d/dx(xⁿ) = n·xⁿ⁻¹</p>
                                                        <p>📝 <strong>Apply:</strong> d/dx(x²) = 2·x²⁻¹</p>
                                                        <p className="text-green-400 font-bold text-xl">f'(x) = 2x</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-green-300 mb-3">Common Derivative Rules</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-2">
                                                    <p className="text-white">d/dx(c) = 0  <span className="text-slate-400">(constant)</span></p>
                                                    <p className="text-white">d/dx(x) = 1</p>
                                                    <p className="text-white">d/dx(xⁿ) = n·xⁿ⁻¹  <span className="text-slate-400">(power rule)</span></p>
                                                    <p className="text-white">d/dx(sin x) = cos x</p>
                                                    <p className="text-white">d/dx(cos x) = -sin x</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-green-300 mb-3">Practice</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-slate-700 rounded-xl p-4 space-y-3">
                                                        <p className="text-white mb-2">1. f(x) = 3x³</p>
                                                        <input
                                                            type="text"
                                                            placeholder="f'(x) = ? (e.g., 9x²)"
                                                            className="w-full px-3 py-2 bg-slate-600 text-white rounded"
                                                            value={advancedAnswers['calc1'] || ''}
                                                            onChange={(e) => setAdvancedAnswers({ ...advancedAnswers, calc1: e.target.value })}
                                                        />
                                                        <button
                                                            onClick={() => checkAdvancedAnswer('calc1', '9x²')}
                                                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-all"
                                                        >
                                                            Check Answer
                                                        </button>
                                                        {advancedFeedback['calc1'] && (
                                                            <p className={`text-sm ${advancedFeedback['calc1'].correct ? 'text-green-400' : 'text-red-400'}`}>
                                                                {advancedFeedback['calc1'].message}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="bg-slate-700 rounded-xl p-4 space-y-3">
                                                        <p className="text-white mb-2">2. f(x) = 5x² + 2x</p>
                                                        <input
                                                            type="text"
                                                            placeholder="f'(x) = ? (e.g., 10x+2)"
                                                            className="w-full px-3 py-2 bg-slate-600 text-white rounded"
                                                            value={advancedAnswers['calc2'] || ''}
                                                            onChange={(e) => setAdvancedAnswers({ ...advancedAnswers, calc2: e.target.value })}
                                                        />
                                                        <button
                                                            onClick={() => checkAdvancedAnswer('calc2', '10x+2')}
                                                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-all"
                                                        >
                                                            Check Answer
                                                        </button>
                                                        {advancedFeedback['calc2'] && (
                                                            <p className={`text-sm ${advancedFeedback['calc2'].correct ? 'text-green-400' : 'text-red-400'}`}>
                                                                {advancedFeedback['calc2'].message}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeAdvancedTopic === 'statistics' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">📈 Statistics & Probability</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-bold text-yellow-300 mb-3">Measures of Central Tendency</h4>
                                                <div className="bg-slate-700 rounded-xl p-6">
                                                    <p className="text-white mb-4">Data set: 2, 4, 4, 6, 8, 10</p>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-yellow-400 font-bold">Mean (Average)</p>
                                                            <p className="text-slate-300">(2+4+4+6+8+10) / 6 = <span className="text-white font-bold">5.67</span></p>
                                                        </div>
                                                        <div>
                                                            <p className="text-yellow-400 font-bold">Median (Middle)</p>
                                                            <p className="text-slate-300">Middle values: 4 and 6, so (4+6)/2 = <span className="text-white font-bold">5</span></p>
                                                        </div>
                                                        <div>
                                                            <p className="text-yellow-400 font-bold">Mode (Most Common)</p>
                                                            <p className="text-slate-300">Most frequent: <span className="text-white font-bold">4</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-yellow-300 mb-3">Probability</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-4">
                                                    <p className="text-white text-center text-xl">P(event) = (Favorable outcomes) / (Total outcomes)</p>
                                                    <div className="border-t border-slate-600 pt-4">
                                                        <p className="text-white mb-2">Example: Rolling a die, what's P(even number)?</p>
                                                        <p className="text-slate-300">Favorable: 2, 4, 6 = 3 outcomes</p>
                                                        <p className="text-slate-300">Total: 6 outcomes</p>
                                                        <p className="text-green-400 font-bold">P(even) = 3/6 = 1/2 = 50%</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-yellow-300 mb-3">Practice</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-3">
                                                    <p className="text-white mb-4">Find the mean of: 5, 10, 15, 20, 25</p>
                                                    <input
                                                        type="number"
                                                        placeholder="Mean = ?"
                                                        className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg text-center text-xl"
                                                        value={advancedAnswers['stats1'] || ''}
                                                        onChange={(e) => setAdvancedAnswers({ ...advancedAnswers, stats1: e.target.value })}
                                                    />
                                                    <button
                                                        onClick={() => checkAdvancedAnswer('stats1', 15)}
                                                        className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold transition-all"
                                                    >
                                                        Check Answer
                                                    </button>
                                                    {advancedFeedback['stats1'] && (
                                                        <p className={`text-sm ${advancedFeedback['stats1'].correct ? 'text-green-400' : 'text-red-400'}`}>
                                                            {advancedFeedback['stats1'].message}
                                                        </p>
                                                    )}
                                                    <p className="text-slate-400 text-sm">💡 Hint: Add all numbers and divide by 5</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeAdvancedTopic === 'geometry' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">🔺 Advanced Geometry</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-bold text-red-300 mb-3">Pythagorean Theorem</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-4">
                                                    <p className="text-white text-center text-2xl mb-4">a² + b² = c²</p>
                                                    <p className="text-slate-300 text-center">For right triangles: legs² + legs² = hypotenuse²</p>
                                                    <div className="border-t border-slate-600 pt-4">
                                                        <p className="text-white mb-2">Example: If a = 3 and b = 4, find c:</p>
                                                        <p className="text-slate-300">3² + 4² = c²</p>
                                                        <p className="text-slate-300">9 + 16 = c²</p>
                                                        <p className="text-slate-300">25 = c²</p>
                                                        <p className="text-green-400 font-bold">c = 5</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-red-300 mb-3">Area Formulas</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-2">
                                                    <p className="text-white">Square: A = s²</p>
                                                    <p className="text-white">Rectangle: A = l × w</p>
                                                    <p className="text-white">Triangle: A = ½ × b × h</p>
                                                    <p className="text-white">Circle: A = πr²</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-red-300 mb-3">Volume Formulas</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-2">
                                                    <p className="text-white">Cube: V = s³</p>
                                                    <p className="text-white">Rectangular Prism: V = l × w × h</p>
                                                    <p className="text-white">Cylinder: V = πr²h</p>
                                                    <p className="text-white">Sphere: V = (4/3)πr³</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeAdvancedTopic === 'wordproblems' && (
                                    <div className="bg-white/10 rounded-xl p-6">
                                        <h3 className="text-2xl font-bold text-white mb-4">📝 Word Problems</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-bold text-orange-300 mb-3">Problem-Solving Strategy</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-3">
                                                    <p className="text-white"><strong>1. Read</strong> - Understand what's being asked</p>
                                                    <p className="text-white"><strong>2. Identify</strong> - What do you know? What do you need?</p>
                                                    <p className="text-white"><strong>3. Plan</strong> - Choose the right operation(s)</p>
                                                    <p className="text-white"><strong>4. Solve</strong> - Do the math</p>
                                                    <p className="text-white"><strong>5. Check</strong> - Does your answer make sense?</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-orange-300 mb-3">Example: Distance Problem</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-4">
                                                    <p className="text-white italic">"A car travels at 60 mph for 2.5 hours. How far does it go?"</p>
                                                    <div className="space-y-2 text-slate-300">
                                                        <p>📝 <strong>Know:</strong> Speed = 60 mph, Time = 2.5 hours</p>
                                                        <p>📝 <strong>Need:</strong> Distance</p>
                                                        <p>📝 <strong>Formula:</strong> Distance = Speed × Time</p>
                                                        <p>📝 <strong>Solve:</strong> D = 60 × 2.5</p>
                                                        <p className="text-green-400 font-bold text-xl">D = 150 miles</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-orange-300 mb-3">Example: Money Problem</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-4">
                                                    <p className="text-white italic">"Sarah has $50. She buys 3 books at $12 each. How much money does she have left?"</p>
                                                    <div className="space-y-2 text-slate-300">
                                                        <p>📝 <strong>Know:</strong> Starting money = $50, Books = 3 × $12</p>
                                                        <p>📝 <strong>Need:</strong> Money left</p>
                                                        <p>📝 <strong>Step 1:</strong> Total spent = 3 × $12 = $36</p>
                                                        <p>📝 <strong>Step 2:</strong> Money left = $50 - $36</p>
                                                        <p className="text-green-400 font-bold text-xl">Answer = $14</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-bold text-orange-300 mb-3">Try It Yourself</h4>
                                                <div className="bg-slate-700 rounded-xl p-6 space-y-3">
                                                    <p className="text-white mb-4 italic">"A rectangle has a length of 12 cm and a width of 5 cm. What is its area?"</p>
                                                    <input
                                                        type="text"
                                                        placeholder="Your answer (e.g., 60)"
                                                        className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg"
                                                        value={advancedAnswers['word1'] || ''}
                                                        onChange={(e) => setAdvancedAnswers({ ...advancedAnswers, word1: e.target.value })}
                                                    />
                                                    <button
                                                        onClick={() => checkAdvancedAnswer('word1', 60)}
                                                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-all"
                                                    >
                                                        Check Answer
                                                    </button>
                                                    {advancedFeedback['word1'] && (
                                                        <p className={`text-sm ${advancedFeedback['word1'].correct ? 'text-green-400' : 'text-red-400'}`}>
                                                            {advancedFeedback['word1'].message}
                                                        </p>
                                                    )}
                                                    <p className="text-slate-400 text-sm">💡 Hint: Area = length × width</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Math Feature Card Component
const MathFeatureCard: React.FC<{
    icon: string;
    title: string;
    description: string;
    gradient: string;
    onClick: () => void;
}> = ({ icon, title, description, gradient, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`group relative bg-gradient-to-br ${gradient} rounded-2xl p-6 text-left transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl border-2 border-white/20`}
        >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
            <h3 className="text-lg font-black text-white mb-2">{title}</h3>
            <p className="text-sm text-white/80">{description}</p>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-all"></div>
        </button>
    );
};

export default MathMasteryView;
