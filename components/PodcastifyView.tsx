
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppContextType } from '../types';
import { generatePodcastScript, PodcastSegment } from '../services/geminiService';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { StopIcon } from './icons/StopIcon';
import { UploadIcon } from './icons/UploadIcon';

interface PodcastifyViewProps {
    context: AppContextType;
}

const PodcastifyView: React.FC<PodcastifyViewProps> = ({ context }) => {
    const { setAppState, lastUploadedFiles, setLastUploadedFiles, studentProfile } = context;
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [podcastData, setPodcastData] = useState<{ title: string; segments: PodcastSegment[] } | null>(null);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const synth = window.speechSynthesis;
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            setLastUploadedFiles(prev => [...prev, ...files]);
        }
    };

    const handleGenerate = async () => {
        if (!studentProfile) return;
        setIsGenerating(true);
        try {
            const result = await generatePodcastScript(lastUploadedFiles, studentProfile);
            setPodcastData(result);
            setCurrentSegmentIndex(-1);
            setProgress(0);
        } catch (error) {
            console.error("Failed to generate podcast:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const stopPlayback = () => {
        synth.cancel();
        setIsPlaying(false);
        setCurrentSegmentIndex(-1);
        setProgress(0);
    };

    const playSegment = (index: number) => {
        if (!podcastData || index >= podcastData.segments.length) {
            setIsPlaying(false);
            setCurrentSegmentIndex(-1);
            return;
        }

        const segment = podcastData.segments[index];
        const utterance = new SpeechSynthesisUtterance(segment.content);

        const voices = synth.getVoices();
        if (segment.speaker === 'Host') {
            utterance.voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Male')) || voices[0];
            utterance.pitch = 1.1;
            utterance.rate = 1.05;
        } else {
            utterance.voice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Female')) || voices[1] || voices[0];
            utterance.pitch = 0.9;
            utterance.rate = 0.95;
        }

        utterance.onstart = () => {
            setCurrentSegmentIndex(index);
            setProgress(((index + 1) / podcastData.segments.length) * 100);
        };

        utterance.onend = () => {
            if (isPlaying) {
                playSegment(index + 1);
            }
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
    };

    const togglePlay = () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            setIsPlaying(true);
            playSegment(0);
        }
    };

    useEffect(() => {
        return () => {
            synth.cancel();
        };
    }, []);

    return (
        <div className="flex flex-col h-full animate-fade-in p-4 md:p-8">
            <div className="text-center mb-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 mb-2 drop-shadow-lg">
                    🎙️ Podcastify AI
                </h2>
                <p className="text-slate-400 font-medium">Turn your study materials into an immersive audio deep-dive.</p>
            </div>

            {!podcastData ? (
                <div className="flex-grow flex flex-col items-center justify-center space-y-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-4 border-white/10 shadow-2xl relative z-10 transition-transform duration-500 cursor-pointer ${isGenerating ? 'animate-pulse scale-110' : 'group-hover:scale-110'}`}
                        >
                            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} accept="application/pdf,image/*,text/plain" className="hidden" />
                            <MicrophoneIcon className={`w-16 h-16 ${isGenerating ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'} transition-colors duration-500`} />
                        </div>
                    </div>

                    <div className="max-w-md w-full text-center space-y-6">
                        {lastUploadedFiles.length > 0 ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 backdrop-blur-md">
                                    <p className="text-slate-300 mb-4">Ready to transform <span className="text-cyan-400 font-bold">{lastUploadedFiles.length} files</span> into a conversation?</p>
                                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                                        {lastUploadedFiles.map((f, i) => (
                                            <span key={i} className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-400 border border-white/5 truncate max-w-[120px]">
                                                {f.name}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs text-cyan-500 hover:text-cyan-400 font-bold uppercase tracking-wider transition-colors"
                                    >
                                        + Add More Files
                                    </button>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-cyan-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Generating Script...
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon className="w-6 h-6" />
                                            Generate Podcast
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setLastUploadedFiles([])}
                                    className="text-xs text-red-500/60 hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
                                >
                                    Clear All Files
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 bg-slate-800/50 rounded-3xl border border-white/5 backdrop-blur-md">
                                <p className="text-slate-400 mb-6">No study materials found for this episode.</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all w-full flex items-center justify-center gap-2"
                                >
                                    <UploadIcon className="w-5 h-5" />
                                    Upload PDF or Notes
                                </button>
                                <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-[0.2em]">Supported: PDF, Images, TXT</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex flex-col space-y-8 animate-slide-in">
                    <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                <span className="text-xs font-black text-white px-2 py-0.5 bg-black/20 rounded-md uppercase tracking-widest">{isPlaying ? 'Live' : 'Stopped'}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-6">
                            <h3 className="text-2xl font-black text-white text-center">{podcastData.title}</h3>

                            <div className="flex items-center justify-center gap-1 h-12 w-full max-w-xs">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 bg-cyan-500/60 rounded-full transition-all duration-300 ${isPlaying ? 'animate-music-bar' : 'h-2'}`}
                                        style={{
                                            animationDelay: `${i * 0.05}s`,
                                            height: isPlaying ? '100%' : '10%'
                                        }}
                                    ></div>
                                ))}
                            </div>

                            <div className="flex items-center justify-center gap-12 py-4">
                                <div className={`flex flex-col items-center gap-3 transition-all duration-500 ${currentSegmentIndex !== -1 && podcastData.segments[currentSegmentIndex].speaker === 'Host' ? 'scale-110 opacity-100' : 'opacity-40 grayscale scale-90'}`}>
                                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                                        <span className="text-3xl">🎙️</span>
                                    </div>
                                    <span className="text-xs font-black text-white uppercase tracking-widest">Alex (Host)</span>
                                </div>
                                <div className={`flex flex-col items-center gap-3 transition-all duration-500 ${currentSegmentIndex !== -1 && podcastData.segments[currentSegmentIndex].speaker === 'Expert' ? 'scale-110 opacity-100' : 'opacity-40 grayscale scale-90'}`}>
                                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                                        <span className="text-3xl">🎓</span>
                                    </div>
                                    <span className="text-xs font-black text-white uppercase tracking-widest">Dr. Sam (Expert)</span>
                                </div>
                            </div>

                            <div className="w-full space-y-2">
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                    <span>Intro</span>
                                    <span>Segment {currentSegmentIndex + 1} of {podcastData.segments.length}</span>
                                    <span>Conclusion</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <button
                                    onClick={togglePlay}
                                    className="w-20 h-20 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
                                >
                                    {isPlaying ? (
                                        <StopIcon className="w-8 h-8" />
                                    ) : (
                                        <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-slate-900 border-b-[12px] border-b-transparent ml-1"></div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 min-h-[120px] flex items-center justify-center italic text-slate-300 text-center text-lg leading-relaxed">
                        {currentSegmentIndex !== -1 ? (
                            <p className="animate-fade-in group">
                                <span className="font-black text-xs uppercase text-cyan-400 not-italic block mb- relative top-0">{podcastData.segments[currentSegmentIndex].speaker}:</span>
                                "{podcastData.segments[currentSegmentIndex].content}"
                            </p>
                        ) : (
                            <p className="text-slate-500">Press play to start the discussion.</p>
                        )}
                    </div>

                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => setPodcastData(null)}
                            className="text-slate-500 hover:text-white font-bold transition-colors text-xs uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5"
                        >
                            Reset & Regenerate
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-auto pt-8 flex justify-center">
                <button
                    onClick={() => { stopPlayback(); setAppState(AppState.DASHBOARD); }}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Back to Dashboard
                </button>
            </div>

            <style>{`
                @keyframes music-bar {
                    0%, 100% { height: 10%; }
                    50% { height: 100%; }
                }
                .animate-music-bar {
                    animation: music-bar 0.8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default PodcastifyView;
