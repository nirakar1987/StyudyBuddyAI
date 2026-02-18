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
    const { setAppState, setAvatarState, studentProfile, learningModules, setGeneratedQuiz, setLastUploadedFiles, setQuizSource, addLearningModule } = context;
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [selectedFilterSubject, setSelectedFilterSubject] = useState<string>(studentProfile?.subject || 'Science');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        setIsGenerating(true);
        setSelectedChapter(`Analyzing Syllabus...`);
        setAvatarState(AvatarState.THINKING);

        try {
            // New Logic: Extract chapters instead of treating file as one blob
            const chapters = await extractChaptersFromFile(file, studentProfile);

            // Add each extracted chapter as a learning module
            chapters.forEach((chapter, index) => {
                const newModule: any = {
                    id: `upload-${Date.now()}-${index}`,
                    title: chapter.title,
                    subject: selectedFilterSubject,
                    description: chapter.description,
                    requiredTopics: chapter.keyPoints || [],
                    file: file, // All modules share the original file reference
                    focusContext: chapter.title // IMPORTANT: This tells the quiz generator to focus on this chapter
                };
                addLearningModule(newModule);
            });

        } catch (error) {
            console.error("Failed to process uploaded file:", error);
            alert("Failed to read the syllabus file. Please try again.");
        } finally {
            setIsGenerating(false);
            setSelectedChapter(null);
            setAvatarState(AvatarState.IDLE);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
            <div className="flex justify-between items-center mb-6">
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
                        <p className="text-slate-400 text-sm">Our AI is reading through "<span className="text-indigo-400 font-bold">{selectedChapter}</span>" to create the perfect challenge for you...</p>
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
                                    className="group relative bg-slate-800/80 hover:bg-slate-700/80 rounded-3xl border border-white/10 hover:border-indigo-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col h-full"
                                    onClick={() => handleStartQuiz(module)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                            <span className="text-xs font-black text-indigo-400 group-hover:text-white">#{index + 1}</span>
                                        </div>
                                        <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-slate-500 group-hover:text-indigo-300 transition-colors">
                                            {module.subject}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors">
                                        {module.title}
                                    </h3>

                                    <p className="text-slate-400 text-xs mb-6 flex-grow">
                                        {module.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            10 Questions
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:translate-x-1 transition-all">
                                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-slate-400 group-hover:border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-indigo-500/20 pointer-events-none transition-all"></div>
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
