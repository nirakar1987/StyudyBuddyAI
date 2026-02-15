import React, { useState, useEffect } from 'react';
import { AppState, AppContextType, AvatarState } from '../types';
import { generateStudyPlan } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ClockIcon } from './icons/ClockIcon';

interface StudyPlanViewProps {
    context: AppContextType;
}

interface DailyTask {
    day: number;
    focus_topic: string;
    activities: string[];
    priority_question?: string;
    estimated_time_minutes: number;
    completed?: boolean;
}

const StudyPlanView: React.FC<StudyPlanViewProps> = ({ context }) => {
    const { setAppState, setAvatarState, studentProfile, user, learningModules } = context;
    const [goal, setGoal] = useState('');
    const [days, setDays] = useState(7);
    const [isLoading, setIsLoading] = useState(false);
    const [studyPlan, setStudyPlan] = useState<DailyTask[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const relevantModules = learningModules.filter(m =>
        m.subject.toLowerCase() === studentProfile?.subject?.toLowerCase()
    );

    // Load saved plan
    useEffect(() => {
        if (user) {
            const savedPlan = localStorage.getItem(`studyPlan_${user.id}`);
            if (savedPlan) {
                setStudyPlan(JSON.parse(savedPlan));
            }
        }
    }, [user]);

    // Save plan on change
    useEffect(() => {
        if (user && studyPlan) {
            localStorage.setItem(`studyPlan_${user.id}`, JSON.stringify(studyPlan));
        }
    }, [studyPlan, user]);

    const handleGenerate = async (customGoal?: string | React.MouseEvent) => {
        const finalGoal = typeof customGoal === 'string' ? customGoal : goal;
        if (!finalGoal.trim()) {
            setError("Please enter your goal (e.g., 'Final Exams').");
            return;
        }

        if (!studentProfile) return;

        setIsLoading(true);
        setError(null);
        setAvatarState(AvatarState.THINKING);

        try {
            const result = await generateStudyPlan(studentProfile, finalGoal, days, relevantModules);
            setStudyPlan(result.schedule);
        } catch (err: any) {
            setError(err.message || "Failed to generate plan.");
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.IDLE);
        }
    };

    const toggleTaskCompletion = (dayIndex: number) => {
        if (!studyPlan) return;
        const newPlan = [...studyPlan];
        newPlan[dayIndex].completed = !newPlan[dayIndex].completed;
        setStudyPlan(newPlan);

        // Celebrate completion
        if (newPlan[dayIndex].completed) {
            const audio = new Audio('/sounds/success.mp3'); // Assuming sound exists or handled by hook
            // Or use context.setScore to add XP
            context.setScore(prev => prev + 20);
        }
    };

    const clearPlan = () => {
        if (confirm("Are you sure you want to delete your current study plan?")) {
            setStudyPlan(null);
            if (user) localStorage.removeItem(`studyPlan_${user.id}`);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in pb-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[var(--color-primary)] flex items-center gap-2">
                    <CalendarIcon className="w-8 h-8" /> Smart Study Planner
                </h2>
                {studyPlan && (
                    <button onClick={clearPlan} className="text-sm text-red-400 hover:text-red-500 underline">
                        Reset Plan
                    </button>
                )}
            </div>

            {!studyPlan ? (
                <div className="flex flex-col items-center justify-center flex-grow p-6 bg-[var(--color-surface-light)]/50 rounded-2xl border-2 border-dashed border-[var(--color-border)]">
                    <div className="max-w-md w-full space-y-4">
                        <div className="text-center mb-6">
                            <SparklesIcon className="w-16 h-16 text-[var(--color-primary)] mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Planning for Success?</h3>
                            <p className="text-[var(--color-text-secondary)]">Tell me your goal, and I'll build a personalized schedule for you, prioritizing your weak topics.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">My Goal / Upcoming Exam</label>
                            <input
                                type="text"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="e.g., Final Maths Exam, Science Olympiad..."
                                className="w-full p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] focus:border-[var(--color-primary)] mb-3"
                            />

                            {relevantModules.length > 0 && (
                                <>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Pick from Syllabus:</p>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                        {relevantModules.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => handleGenerate(m.title)}
                                                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-400 hover:bg-yellow-500/10 hover:border-yellow-500/50 hover:text-yellow-500 transition-all text-left truncate max-w-[180px]"
                                                title={m.title}
                                            >
                                                {m.title}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">Duration (Days)</label>
                            <select
                                value={days}
                                onChange={(e) => setDays(parseInt(e.target.value))}
                                className="w-full p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                            >
                                <option value={3}>3 Days (Crash Course)</option>
                                <option value={5}>5 Days</option>
                                <option value={7}>7 Days (Recommended)</option>
                                <option value={14}>2 Weeks</option>
                                <option value={30}>1 Month</option>
                            </select>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !goal.trim()}
                            className="w-full py-3 bg-[var(--color-primary-action)] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                    Creating Plan...
                                </>
                            ) : (
                                "Generate Schedule"
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2">
                    {studyPlan.map((task, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-xl border transition-all ${task.completed
                                ? 'bg-green-900/10 border-green-500/30'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-1 bg-[var(--color-surface-light)] rounded text-xs font-bold text-[var(--color-text-secondary)]">Day {task.day}</span>
                                        <h4 className={`text-lg font-bold ${task.completed ? 'text-green-500 line-through' : 'text-[var(--color-text-primary)]'}`}>
                                            {task.focus_topic}
                                        </h4>
                                    </div>
                                    <ul className="space-y-1 ml-1 mb-3">
                                        {task.activities.map((activity, i) => (
                                            <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--color-text-muted)] flex-shrink-0"></span>
                                                {activity}
                                            </li>
                                        ))}
                                    </ul>

                                    {task.priority_question && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-2">
                                            <p className="text-xs font-bold text-indigo-800 uppercase mb-1">💡 Daily Challenge</p>
                                            <p className="text-sm text-indigo-900 italic font-medium">"{task.priority_question}"</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                                        <ClockIcon className="w-4 h-4" />
                                        {task.estimated_time_minutes} mins
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleTaskCompletion(index)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${task.completed
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-[var(--color-text-muted)] text-transparent hover:border-green-500 hover:text-green-500/50'
                                        }`}
                                >
                                    <CheckIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ))}
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

export default StudyPlanView;
