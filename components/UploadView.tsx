
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AppContextType, AppState, GeneratedQuiz } from '../types';
import { analyzeAndGenerateQuestions } from '../services/geminiService';
import { useToast } from '../context/ToastContext';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CameraOffIcon } from './icons/CameraOffIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ClockIcon } from './icons/ClockIcon';

interface UploadViewProps {
    context: AppContextType;
}

interface UploadedFile {
    id: string;
    file: File;
    preview: string;
    status: 'ready' | 'processing' | 'error';
    errorMessage?: string;
}

const CameraCapture: React.FC<{ onDone: (files: File[]) => void, onExit: () => void }> = ({ onDone, onExit }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedFiles, setCapturedFiles] = useState<File[]>([]);
    const [capturedPreviews, setCapturedPreviews] = useState<string[]>([]);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCameraLoading, setIsCameraLoading] = useState(true);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

    useEffect(() => {
        const getDevices = async () => {
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                tempStream.getTracks().forEach(track => track.stop());

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(device => device.kind === 'videoinput');

                if (videoInputs.length > 0) {
                    setVideoDevices(videoInputs);
                    if (!selectedDeviceId) {
                        const backCamera = videoInputs.find(d => d.label.toLowerCase().includes('back'));
                        setSelectedDeviceId(backCamera?.deviceId || videoInputs[0].deviceId);
                    }
                } else {
                    setCameraError("No camera found on this device.");
                    setIsCameraLoading(false);
                }
            } catch (err: any) {
                console.error("Error enumerating devices:", err);
                setCameraError("Could not access camera. Please grant permission in your browser settings.");
                setIsCameraLoading(false);
            }
        };
        getDevices();
    }, []);

    useEffect(() => {
        if (!selectedDeviceId) return;

        let stream: MediaStream | null = null;
        const currentStream = videoRef.current?.srcObject as MediaStream;
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const startCamera = async () => {
            setIsCameraLoading(true);
            setCameraError(null);
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Camera not supported on this browser.");
                }
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: selectedDeviceId },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err: any) {
                console.error("Error accessing camera: ", err);
                setCameraError("Could not access the camera.");
            } finally {
                setIsCameraLoading(false);
            }
        };

        startCamera();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        }
    }, [selectedDeviceId]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
                canvasRef.current.toBlob(blob => {
                    if (blob) {
                        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
                        setCapturedFiles(prev => [...prev, file]);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setCapturedPreviews(prev => [...prev, reader.result as string]);
                        };
                        reader.readAsDataURL(file);
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };

    const handleRemoveCapturedImage = (indexToRemove: number) => {
        setCapturedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
        setCapturedPreviews(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    const handleDone = () => {
        if (capturedFiles.length > 0) {
            onDone(capturedFiles);
        }
        onExit();
    }

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
            <div className="bg-[var(--color-surface)] rounded-lg shadow-2xl p-4 w-full max-w-7xl h-[95vh] flex flex-col">
                <div className="relative w-full bg-[var(--color-background)] rounded-lg flex items-center justify-center overflow-hidden flex-grow mb-4">
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain ${cameraError || isCameraLoading ? 'hidden' : ''}`} onCanPlay={() => setIsCameraLoading(false)}></video>
                    {isCameraLoading && <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>}
                    {cameraError && (
                        <div className="text-center text-[var(--color-text-muted)] p-4">
                            <CameraOffIcon className="w-16 h-16 mx-auto text-slate-500 mb-2" />
                            <p className="font-semibold text-lg">Camera Error</p>
                        </div>
                    )}
                </div>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="flex-shrink-0 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-grow w-full">
                        {capturedPreviews.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-1">Captured Images ({capturedPreviews.length})</h3>
                                <div className="flex gap-2 p-2 bg-[var(--color-background)]/50 rounded-lg overflow-x-auto h-24">
                                    {capturedPreviews.map((src, i) => (
                                        <div key={i} className="relative aspect-video h-full flex-shrink-0 group">
                                            <img src={src} className="h-full w-auto object-cover rounded" alt={`capture ${i + 1}`} />
                                            <button
                                                onClick={() => handleRemoveCapturedImage(i)}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0 flex gap-4 pt-4 mt-4 border-t border-[var(--color-border)]">
                    <button onClick={onExit} className="px-6 py-3 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] text-[var(--color-text-primary)] rounded-lg font-semibold w-1/4">Cancel</button>
                    <button onClick={handleCapture} disabled={!!cameraError || isCameraLoading} className="px-6 py-3 bg-[var(--color-primary-action)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg font-semibold flex-grow">
                        Capture Photo
                    </button>
                    <button onClick={handleDone} className="px-6 py-3 bg-[var(--color-secondary-action)] hover:bg-violet-600 text-white rounded-lg font-semibold w-1/4">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};


const QUIZ_PROGRESS_MESSAGES = [
    'Preparing images...',
    'Analyzing your materials...',
    'Identifying key concepts...',
    'Generating questions...',
    'Almost done...',
];

const UploadView: React.FC<UploadViewProps> = ({ context }) => {
    const { user, studentProfile, onQuestionsGenerated, quizCustomization, setQuizCustomization, setGeneratedQuiz, setAppState } = context;
    const { addToast } = useToast();
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState(QUIZ_PROGRESS_MESSAGES[0]);
    const [error, setError] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [resumableQuiz, setResumableQuiz] = useState<GeneratedQuiz | null>(null);
    const [topicInput, setTopicInput] = useState('');
    const [selectedQuestionType, setSelectedQuestionType] = useState('Mixed');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            const lastQuizId = localStorage.getItem(`lastQuizPointer_${user.id}`);
            if (lastQuizId) {
                const progressKey = `quizProgress_${user.id}_${lastQuizId}`;
                const savedDataRaw = localStorage.getItem(progressKey);
                if (savedDataRaw) {
                    try {
                        const savedData = JSON.parse(savedDataRaw);
                        if (savedData.quiz && savedData.quiz.questions) {
                            setResumableQuiz(savedData.quiz);
                        }
                    } catch (e) {
                        localStorage.removeItem(`lastQuizPointer_${user.id}`);
                        localStorage.removeItem(progressKey);
                    }
                }
            }
        }
    }, [user]);

    const handleResumeQuiz = () => {
        if (resumableQuiz) {
            setGeneratedQuiz(resumableQuiz);
            setAppState(AppState.QUIZ);
        }
    };

    const questionNumberOptions = [5, 10, 15, 20, 25, 30, 40, 50];
    const difficultyOptions = ['Easy', 'Medium', 'Hard'];
    const durationOptions = [5, 10, 15, 20, 30, 45, 60, 90];
    const questionTypeOptions = ['Mixed', 'Multiple Choice', 'True/False', 'Fill in the Blank', 'Short Answer'];

    const mcqOptionNumbers = useMemo(() => {
        if (!quizCustomization.numQuestions) return [2, 3, 4, 5];
        return Array.from({ length: Math.min(quizCustomization.numQuestions - 1, 4) }, (_, i) => i + 2);
    }, [quizCustomization.numQuestions]);

    const handleNumQuestionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newNumQuestions = parseInt(e.target.value);
        setQuizCustomization(prev => ({
            ...prev,
            numQuestions: newNumQuestions,
            numOptions: prev.numOptions > newNumQuestions ? Math.max(2, newNumQuestions) : prev.numOptions
        }));
    };

    const processAndAddFiles = useCallback(async (filesToAdd: File[]) => {
        const filePromises = filesToAdd.map(file => {
            return new Promise<UploadedFile>((resolve) => {
                const uploadedFile: UploadedFile = {
                    id: `${file.name}-${file.lastModified}-${Math.random()}`,
                    file: file,
                    preview: '',
                    status: 'ready',
                };
                if (!file.type.startsWith('image/')) {
                    uploadedFile.status = 'error';
                    uploadedFile.errorMessage = 'Not an image file';
                    resolve(uploadedFile);
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                    uploadedFile.preview = reader.result as string;
                    resolve(uploadedFile);
                };
                reader.readAsDataURL(file);
            });
        });
        const newUploadedFiles = await Promise.all(filePromises);
        setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            processAndAddFiles(Array.from(event.target.files));
        }
    };

    const handleGenerate = async () => {
        const validFiles = uploadedFiles.filter(f => f.status === 'ready');
        const validFileObjects = validFiles.map(f => f.file);

        if (validFileObjects.length === 0 && !topicInput.trim()) {
            setError("Please upload images OR enter a topic to generate a quiz.");
            return;
        }

        if (!studentProfile) {
            setError("Student profile missing.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setProgressMessage(QUIZ_PROGRESS_MESSAGES[0]);

        const progressInterval = setInterval(() => {
            setProgressMessage((prev) => {
                const idx = QUIZ_PROGRESS_MESSAGES.indexOf(prev);
                return QUIZ_PROGRESS_MESSAGES[(idx + 1) % QUIZ_PROGRESS_MESSAGES.length];
            });
        }, 2500);

        try {
            if (validFileObjects.length > 0) {
                setProgressMessage('Preparing images...');
            }
            const customizationWithTypes = {
                ...quizCustomization,
                questionType: selectedQuestionType
            };
            const quiz = await analyzeAndGenerateQuestions(validFileObjects, studentProfile, customizationWithTypes, topicInput);
            clearInterval(progressInterval);
            onQuestionsGenerated(quiz, validFileObjects);
            addToast('Quiz created successfully!', 'success');
        } catch (err: any) {
            clearInterval(progressInterval);
            setError(err.message);
            addToast(err.message || 'Failed to generate quiz. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {showCamera && <CameraCapture onDone={(f) => processAndAddFiles(f)} onExit={() => setShowCamera(false)} />}
            <div className="flex flex-col h-full animate-fade-in pb-4">
                <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-4">Generate Your Quiz</h2>
                <p className="text-[var(--color-text-muted)] mb-6">
                    Enter a topic OR upload study material, and I'll create a custom quiz for you!
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow overflow-y-auto pr-2">
                    {/* Left Column: Input Sources */}
                    <div className="flex flex-col gap-6">
                        {/* Topic Input */}
                        <div className="bg-[var(--color-surface-light)]/50 p-4 rounded-xl border border-[var(--color-border)]">
                            <label className="block text-lg font-bold text-[var(--color-text-primary)] mb-2">
                                1. Enter a Topic (Optional)
                            </label>
                            <input
                                type="text"
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                placeholder="e.g., Photosynthesis, Newton's Laws, World War II..."
                                className="w-full p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="h-px bg-[var(--color-border)] flex-grow"></div>
                            <span className="text-[var(--color-text-muted)] font-bold text-sm">OR UPLOAD MATERIAL</span>
                            <div className="h-px bg-[var(--color-border)] flex-grow"></div>
                        </div>

                        {/* File Upload */}
                        <div className="flex flex-col flex-grow">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-light)] transition-all flex-grow min-h-[200px]"
                            >
                                <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                <UploadIcon className="w-12 h-12 text-[var(--color-text-muted)] mb-3" />
                                <p className="font-bold text-[var(--color-text-secondary)]">Click to upload images</p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">Notes, Textbook pages, Diagrams</p>
                            </div>
                            <button
                                onClick={() => setShowCamera(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-secondary-action)] hover:bg-violet-600 text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95"
                            >
                                <CameraIcon className="w-5 h-5" /> Use Camera
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Customization & Preview */}
                    <div className="flex flex-col gap-6">
                        {/* Customization Options */}
                        <div className="bg-[var(--color-surface-light)]/50 rounded-xl p-5 border border-[var(--color-border)]">
                            <h3 className="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-[var(--color-primary)]" /> Quiz Settings
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--color-text-muted)] mb-1">Questions</label>
                                    <select value={quizCustomization.numQuestions} onChange={handleNumQuestionsChange} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-2.5 font-medium focus:ring-2 ring-[var(--color-primary)]/20 outline-none">
                                        {questionNumberOptions.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--color-text-muted)] mb-1">Difficulty</label>
                                    <select value={quizCustomization.difficulty} onChange={e => setQuizCustomization(p => ({ ...p, difficulty: e.target.value }))} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-2.5 font-medium focus:ring-2 ring-[var(--color-primary)]/20 outline-none">
                                        {difficultyOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--color-text-muted)] mb-1">Time (min)</label>
                                    <select value={quizCustomization.duration} onChange={e => setQuizCustomization(p => ({ ...p, duration: parseInt(e.target.value) }))} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-2.5 font-medium focus:ring-2 ring-[var(--color-primary)]/20 outline-none">
                                        {durationOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--color-text-muted)] mb-1">Type</label>
                                    <select value={selectedQuestionType} onChange={e => setSelectedQuestionType(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-2.5 font-medium focus:ring-2 ring-[var(--color-primary)]/20 outline-none">
                                        {questionTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Uploaded Files Preview */}
                        {uploadedFiles.length > 0 && (
                            <div className="bg-[var(--color-surface-light)]/50 rounded-xl p-4 flex-grow border border-[var(--color-border)]">
                                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2 text-sm">Selected Files ({uploadedFiles.length})</h3>
                                <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-40 pr-1">
                                    {uploadedFiles.map((item) => (
                                        <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-border)]">
                                            <img src={item.preview} className="w-full h-full object-cover" />
                                            <button onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== item.id))} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XMarkIcon className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resume Quiz Button */}
                        {resumableQuiz && (
                            <button
                                onClick={handleResumeQuiz}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-lg font-bold border border-emerald-500/30 transition-colors"
                            >
                                <ClockIcon className="w-5 h-5" /> Resume Unfinished Quiz
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="p-3 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center text-sm font-medium animate-shake">{error}</div>}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || (uploadedFiles.length === 0 && !topicInput.trim())}
                        className="w-full md:w-auto px-8 py-4 bg-[var(--color-primary-action)] hover:bg-[var(--color-primary-hover)] rounded-xl font-bold text-lg text-white shadow-xl shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin flex-shrink-0" />
                                {progressMessage}
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-6 h-6" />
                                Create My Quiz
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default UploadView;
