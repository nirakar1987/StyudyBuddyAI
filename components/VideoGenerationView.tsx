import React, { useState } from 'react';
import { AppContextType, AppState, AvatarState, VideoData } from '../types';
import { findEducationalVideo } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { HandThumbUpIcon } from './icons/HandThumbUpIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';


const VideoGenerationView: React.FC<{ context: AppContextType }> = ({ context }) => {
    const { setAppState, setAvatarState, studentProfile } = context;
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoResults, setVideoResults] = useState<VideoData[] | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a topic to find a video lesson.");
            return;
        }
        if (!studentProfile) {
            setError("Student profile not found.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setVideoResults(null);
        setSelectedVideo(null);
        setAvatarState(AvatarState.THINKING);

        try {
            const results = await findEducationalVideo(prompt, studentProfile);
            if (results && results.length > 0) {
                setVideoResults(results);
            } else {
                setError("Could not find any relevant videos for this topic. Please try being more specific.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to find a video. Please try a different topic.");
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.IDLE);
        }
    };

    const handleSelectVideo = (video: VideoData) => {
        setSelectedVideo(video);
        // Scroll to the top of the component to see the player
        const element = document.getElementById('video-generation-view');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    return (
        <div id="video-generation-view" className="flex flex-col h-full animate-fade-in">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-4">Find a Video Lesson</h2>
            <p className="text-[var(--color-text-muted)] mb-6">
                Describe a topic, and StudyBuddy AI will find the best educational YouTube videos for you!
            </p>

            <div className="flex flex-col flex-grow gap-6 min-h-0">
                {/* Prompt Input */}
                <div>
                    <label htmlFor="video-prompt" className="block text-lg font-semibold text-[var(--color-text-secondary)] mb-2">Lesson Topic:</label>
                    <textarea
                        id="video-prompt"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Explain the water cycle, or how a volcano works."
                        className="w-full bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text-primary)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                        disabled={isLoading}
                    />
                </div>

                {/* Video Display and Results Area */}
                <div className="flex-grow w-full bg-[var(--color-background)] rounded-lg flex flex-col p-4 relative min-h-0">
                    {selectedVideo && (
                        <div className="mb-4 flex-shrink-0 animate-fade-in">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{selectedVideo.title}</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{selectedVideo.description}</p>
                        </div>
                    )}

                    <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                        {isLoading && (
                            <div className="flex flex-col items-center text-center">
                                <SparklesIcon className="w-16 h-16 text-[var(--color-primary)] animate-pulse" />
                                <p className="mt-4 text-[var(--color-text-secondary)] font-semibold">Searching for the best video lessons...</p>
                            </div>
                        )}
                        {!isLoading && selectedVideo && (
                            <div className="flex flex-col w-full h-full">
                                <iframe
                                    className="w-full flex-grow rounded-lg"
                                    src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&origin=${window.location.origin}`}
                                    title={selectedVideo.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                                <div className="mt-2 text-right">
                                    <a
                                        href={`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[var(--color-primary)] hover:underline flex items-center justify-end gap-1"
                                    >
                                        Video not playing? Watch on YouTube
                                        <ChevronRightIcon className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        )}
                        {!isLoading && !selectedVideo && (
                            <div className="text-center text-[var(--color-text-muted)] p-4">
                                {videoResults && videoResults.length > 0 ? (
                                    <>
                                        <HandThumbUpIcon className="w-20 h-20 mx-auto" />
                                        <p className="mt-2 text-lg font-semibold">Great! I found some videos.</p>
                                        <p>Select one from the list below to watch.</p>
                                    </>
                                ) : (
                                    <>
                                        <VideoCameraIcon className="w-24 h-24 mx-auto" />
                                        <p className="mt-2">Your video lesson will appear here</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {videoResults && videoResults.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex-grow overflow-y-auto pr-2">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">Top Results:</h3>
                            <div className="space-y-3">
                                {videoResults.map((video) => (
                                    <button
                                        key={video.youtubeId}
                                        onClick={() => handleSelectVideo(video)}
                                        className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 active:scale-[0.99] flex items-start gap-4 ${selectedVideo?.youtubeId === video.youtubeId
                                            ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)]'
                                            : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] border-[var(--color-border)] hover:border-[var(--color-primary-hover)]'
                                            }`}
                                    >
                                        <img
                                            src={video.thumbnailUrl}
                                            alt={`Thumbnail for ${video.title}`}
                                            className="w-32 h-20 object-cover rounded-md flex-shrink-0 bg-[var(--color-surface-light)]"
                                        />
                                        <div className="flex-grow">
                                            <p className="font-bold text-base text-[var(--color-text-primary)] leading-tight">{video.title}</p>
                                            <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">{video.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && <p className="text-[var(--color-danger)] text-center text-sm mt-4">{error}</p>}

            <div className="mt-6 flex justify-between items-center">
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="px-6 py-2 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-lg font-semibold"
                >
                    Back to Dashboard
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="px-8 py-3 bg-[var(--color-primary-action)] hover:bg-[var(--color-primary-hover)] rounded-lg font-bold text-lg flex items-center gap-2 disabled:bg-[var(--color-surface-lighter)] disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Searching...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-6 h-6" />
                            Find Video
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};




export default VideoGenerationView;