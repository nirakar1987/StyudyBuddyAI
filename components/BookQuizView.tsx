import React, { useState, useMemo, useEffect } from 'react';
import { AppState, AppContextType, AvatarState } from '../types';
import { analyzeAndGenerateQuestions, extractChaptersFromFile } from '../services/geminiService';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClockIcon } from './icons/ClockIcon';

interface BookQuizViewProps {
    context: AppContextType;
}

const BookQuizView: React.FC<BookQuizViewProps> = ({ context }) => {
    const { setAppState, setAvatarState, studentProfile, learningModules, setGeneratedQuiz, setLastUploadedFiles, setQuizSource, addLearningModule, removeLearningModule } = context;
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [selectedFilterSubject, setSelectedFilterSubject] = useState<string>(studentProfile?.subject || 'Science');
    const [isAddingChapter, setIsAddingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleManualAddChapter = () => {
        if (!newChapterTitle.trim()) return;

        const newModule: any = {
            id: `manual-${Date.now()}`,
            title: newChapterTitle.trim(),
            subject: selectedFilterSubject,
            description: "Custom Chapter",
            requiredTopics: ["General"],
            grades: studentProfile?.grade ? [Number(studentProfile.grade)] : []
        };

        addLearningModule(newModule);
        setNewChapterTitle('');
        setIsAddingChapter(false);
    };

    // Sync selected subject with profile subject changes
    useEffect(() => {
        if (studentProfile?.subject) {
            setSelectedFilterSubject(studentProfile.subject);
        }
    }, [studentProfile?.subject]);

    const filteredModules = useMemo(() => {
        const allModules = learningModules || [];
        const currentSubject = selectedFilterSubject.toLowerCase().trim();
        const studentGrade = Number(studentProfile?.grade);

        if (!currentSubject) return [];

        return allModules.filter(m => {
            // Include uploaded files/chapters for this subject if matches
            if (m.file && m.subject.toLowerCase() === currentSubject) return true;

            // Filter by Grade if mapped
            if (m.grades && studentGrade) {
                // Ensure strict number comparison
                const grades = m.grades.map(Number);
                if (!grades.includes(studentGrade)) {
                    return false;
                }
            }

            const moduleSub = (m.subject || "").toLowerCase().trim();

            // Normalize math/maths/mathematics
            const isMath = (s: string) => s === 'math' || s === 'maths' || s === 'mathematics';
            if (isMath(currentSubject) && isMath(moduleSub)) return true;

            const isEng = (s: string) => s === 'english' || s.includes('english');
            if (isEng(currentSubject) && isEng(moduleSub)) return true;

            return moduleSub === currentSubject ||
                moduleSub.includes(currentSubject) ||
                currentSubject.includes(moduleSub);
        });
    }, [learningModules, selectedFilterSubject, studentProfile?.grade]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !studentProfile) return;

        const file = files[0];

        // Save the file as a single module immediately (Fast Update)
        const newModule: any = {
            id: `upload-${Date.now()}`,
            title: "Uploaded Syllabus (Processing...)", // More user friendly
            subject: selectedFilterSubject,
            description: "Click 'Detect Chapters' to organize this file.",
            requiredTopics: [],
            file: file
        };

        addLearningModule(newModule);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // New function to handle on-demand analysis
    const handleAnalyzeChapters = async (module: any) => {
        setIsGenerating(true);
        setSelectedChapter(`Analyzing Syllabus...`);
        setAvatarState(AvatarState.THINKING);

        try {
            // New Logic: Extract chapters from the file
            const chapters = await extractChaptersFromFile(module.file, studentProfile);

            // 1. Remove the original "raw" module since we have processed it
            removeLearningModule(module.id);

            // 2. Add each extracted chapter as a NEW distinct learning module
            chapters.forEach((chapter, index) => {
                const newModule: any = {
                    // Unique ID but linked to upload time
                    id: `chapter-${Date.now()}-${index}`,
                    title: chapter.title,
                    subject: selectedFilterSubject,
                    description: chapter.description,
                    requiredTopics: chapter.keyPoints || [],
                    file: module.file, // Each chapter keeps the reference to the original file
                    focusContext: chapter.title // IMPORTANT: This tells the quiz generator to focus on this chapter
                };
                addLearningModule(newModule);
            });

        } catch (error) {
            console.error("Failed to process uploaded file:", error);
            alert("Failed to analyze the syllabus file. Please try again.");
        } finally {
            setIsGenerating(false);
            setSelectedChapter(null);
            setAvatarState(AvatarState.IDLE);
        }
    };

    const handleStartQuiz = async (module: any) => {
        if (!studentProfile) return;

        setIsGenerating(true);
        setSelectedChapter(module.title);
        setAvatarState(AvatarState.THINKING);

        try {
            let quiz;

            if (module.file) {
                // Generate quiz from uploaded file with specific focus
                const systemPrompt = module.focusContext
                    ? `Use the uploaded file. Focus SPECIFICALLY on the chapter/topic: "${module.focusContext}". Generate questions ONLY from this section of the content.`
                    : `Analyze this uploaded content. Subject: ${selectedFilterSubject}. Generate a quiz based strictly on this content.`;

                quiz = await analyzeAndGenerateQuestions(
                    [module.file],
                    studentProfile,
                    {
                        numQuestions: 10,
                        difficulty: 'Medium',
                        numOptions: 4,
                        questionType: 'Multiple Choice'
                    },
                    systemPrompt
                );
                setQuizSource({ type: 'upload', data: module.file.name });
                setLastUploadedFiles([module.file]);
            } else {
                // Generate quiz from text book chapter topic
                quiz = await analyzeAndGenerateQuestions(
                    [], // No files, use topic instead
                    studentProfile,
                    {
                        numQuestions: 10,
                        difficulty: 'Medium',
                        numOptions: 4,
                        questionType: 'Multiple Choice'
                    },
                    `Textbook Chapter: ${module.title}. Subject: ${selectedFilterSubject}. Randomize the position of the correct answer among options.`
                );
                setQuizSource({ type: 'book', data: module.title });
                setLastUploadedFiles([]);
            }

            setGeneratedQuiz(quiz);
            setAppState(AppState.QUIZ);
        } catch (error) {
            console.error("Failed to generate quiz:", error);
            alert("Failed to generate quiz for this chapter. Please try again.");
        } finally {
            setIsGenerating(false);
            setSelectedChapter(null);
            setAvatarState(AvatarState.IDLE);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in p-4 md:p-8">
            {/* Add Chapter Modal */}
            {isAddingChapter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Add New Chapter</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={selectedFilterSubject}
                                    disabled
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-500 font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Chapter Name</label>
                                <input
                                    type="text"
                                    value={newChapterTitle}
                                    onChange={(e) => setNewChapterTitle(e.target.value)}
                                    placeholder="e.g. Force and Motion"
                                    className="w-full bg-slate-900 border border-indigo-500/30 focus:border-indigo-500 rounded-xl px-4 py-3 text-white font-medium text-sm outline-none transition-colors"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setIsAddingChapter(false); setNewChapterTitle(''); }}
                                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleManualAddChapter}
                                    disabled={!newChapterTitle.trim()}
                                    className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    Add Chapter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <BookOpenIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">School Book Quiz</h2>
                        <p className="text-slate-400 text-sm font-medium">Test your knowledge on textbook chapters.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddingChapter(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold text-xs uppercase tracking-widest border border-white/5 transition-all hover:scale-105"
                    >
                        <span className="text-xl leading-none mb-0.5">+</span> Add Chapter
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0011.586 3H8.414a1 1 0 00-.707.293L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Upload / Photo
                    </button>
                    <button
                        onClick={() => setAppState(AppState.DASHBOARD)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-xs uppercase tracking-widest border border-white/5"
                    >
                        <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>



            {isGenerating ? (
                <div className="flex-grow flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <SparklesIcon className="w-10 h-10 text-indigo-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="max-w-xs">
                        <h3 className="text-xl font-bold text-white mb-2">Preparing Your Quiz</h3>
                        <p className="text-slate-400 text-sm">
                            {selectedChapter === 'Analyzing Syllabus...'
                                ? "Reading through your file to identify chapters..."
                                : <>Our AI is reading through "<span className="text-indigo-400 font-bold">{selectedChapter}</span>" to create the perfect challenge for you...</>}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-grow">
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl border border-white/10 p-2 mb-6 inline-flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-indigo-400">
                            Syllabus
                        </span>
                        <span className="text-white font-bold text-sm pr-2">{selectedFilterSubject}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar pb-10" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                        {filteredModules.length > 0 ? (
                            filteredModules.map((module, index) => (
                                <div
                                    key={module.id}
                                    className="group relative bg-slate-800/80 hover:bg-slate-700/80 rounded-3xl border border-white/10 hover:border-indigo-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                            <span className="text-xs font-black text-indigo-400 group-hover:text-white">#{index + 1}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-slate-500 group-hover:text-indigo-300 transition-colors">
                                                {module.subject}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Are you sure you want to delete "${module.title}"?`)) {
                                                        removeLearningModule(module.id);
                                                    }
                                                }}
                                                className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors z-20 relative"
                                                title="Delete Chapter"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <h3
                                        className="text-lg font-black text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors cursor-pointer"
                                        onClick={() => handleStartQuiz(module)}
                                    >
                                        {module.title}
                                    </h3>

                                    <p className="text-slate-400 text-xs mb-6 flex-grow">
                                        {module.description}
                                    </p>

                                    <div className="flex flex-col gap-2 mt-auto relative z-10">
                                        <button
                                            onClick={() => handleStartQuiz(module)}
                                            className="w-full flex items-center justify-between px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 rounded-xl text-indigo-300 hover:text-white transition-all text-xs font-bold uppercase tracking-wider group-hover:shadow-lg group-hover:shadow-indigo-500/20"
                                        >
                                            <span className="flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4" />
                                                Start Quiz
                                            </span>
                                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                                <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-current border-b-[3px] border-b-transparent ml-0.5"></div>
                                            </div>
                                        </button>

                                        {/* Show 'Analyze Chapters' button only for raw uploaded files that haven't been split yet */}
                                        {module.file && !module.focusContext && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAnalyzeChapters(module);
                                                }}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-teal-500 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-bold uppercase tracking-wider border border-white/5 hover:border-teal-400/50"
                                            >
                                                <SparklesIcon className="w-4 h-4" />
                                                Detect Chapters
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <p className="text-slate-500 font-bold italic mb-4">No specific book chapters found for this subject yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
};

export default BookQuizView;
