
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppContextType, AvatarState, ChatMessage } from '../types';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { startDirectQAChat, continueChat, analyzeHandwrittenWork, generateContentWithSearch } from '../services/geminiService';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SendIcon } from './icons/SendIcon';
import { StopIcon } from './icons/StopIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
import ImageUploadModal from './ImageUploadModal';


interface SolveIssueViewProps {
    context: AppContextType;
}

const SolveIssueView: React.FC<SolveIssueViewProps> = ({ context }) => {
    const { studentProfile, chatHistory, setChatHistory, setScore, avatarState, setAvatarState } = context;
    const { isListening, transcript, startListening, stopListening, error } = useSpeechRecognition();
    const [isLoading, setIsLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const speakingTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
        };
    }, []);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [chatHistory]);
    useEffect(() => { if (transcript) setInputValue(transcript); }, [transcript]);

    useEffect(() => {
        if (isListening) setAvatarState(AvatarState.LISTENING);
        else if (avatarState === AvatarState.LISTENING) setAvatarState(AvatarState.IDLE);
    }, [isListening, avatarState, setAvatarState]);

    const handleAiResponse = useCallback((response: ChatMessage) => {
        if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);

        setChatHistory(prev => [...prev, response]);
        setIsLoading(false);
        setAvatarState(AvatarState.SPEAKING);

        const textContent = response.parts.map(p => 'text' in p ? p.text : '').join(' ');
        const words = textContent.split(/\s+/).length;
        const speakingDuration = Math.max(2000, (words / 150) * 60 * 1000);

        speakingTimerRef.current = window.setTimeout(() => {
            setAvatarState(AvatarState.IDLE);
            speakingTimerRef.current = null;
        }, speakingDuration);
    }, [setChatHistory, setAvatarState]);

    const handleSendMessage = useCallback(async () => {
        const userMessage = inputValue.trim();
        if (!userMessage && !transcript) return;

        const messageToSend = userMessage || transcript;

        const isFirstMessage = chatHistory.length === 0;
        if (isFirstMessage) {
            startDirectQAChat(studentProfile!);
        }

        setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: messageToSend }] }]);
        await setScore(prev => prev + 10);
        setInputValue('');
        setIsLoading(true);
        setAvatarState(AvatarState.THINKING);

        try {
            if (useSearch) {
                const response = await generateContentWithSearch(chatHistory, messageToSend);
                handleAiResponse({ role: 'model', parts: [{ text: response.text }], groundingMetadata: response.candidates?.[0]?.groundingMetadata });
            } else {
                const response = await continueChat(messageToSend);
                handleAiResponse({ role: 'model', parts: [{ text: response.text }] });
            }
        } catch (e: any) {
            handleAiResponse({ role: 'model', parts: [{ text: e.message || 'An error occurred.' }] });
        }

    }, [inputValue, transcript, chatHistory, setChatHistory, setAvatarState, setScore, studentProfile, handleAiResponse, useSearch]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
            setTimeout(handleSendMessage, 200);
        } else {
            startListening();
        }
    };

    const handleImageUpload = async (file: File) => {
        setIsModalOpen(false);
        const isFirstMessage = chatHistory.length === 0;
        if (isFirstMessage) {
            startDirectQAChat(studentProfile!);
        }
        const lastModelMessage = chatHistory.filter(m => m.role === 'model').pop();
        const firstPart = lastModelMessage?.parts[0];
        const lastQuestion = (firstPart && 'text' in firstPart) ? firstPart.text : "the current problem";
        setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: `(Attached an image of my work for: ${lastQuestion})` }] }]);
        setIsLoading(true);
        setAvatarState(AvatarState.THINKING);

        const analysis = await analyzeHandwrittenWork(file, lastQuestion);
        handleAiResponse({ role: 'model', parts: [{ text: analysis }] });
    }

    return (
        <>
            {isModalOpen && <ImageUploadModal onUpload={handleImageUpload} onExit={() => setIsModalOpen(false)} />}
            <div className="flex flex-col h-full max-h-[75vh] animate-fade-in">
                <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-4 border-b border-[var(--color-border)] pb-2">Ask a Question</h2>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {chatHistory.length === 0 && !isLoading && (
                        <div className="text-center text-[var(--color-text-muted)] p-8">
                            <p>Have a question about your homework or any topic? <br />Just ask StudyBuddy AI!</p>
                        </div>
                    )}
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex-shrink-0"></div>}
                            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-[var(--color-secondary-action)] text-white rounded-br-none' : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] rounded-bl-none'}`}>
                                {msg.parts.map((part, i) => {
                                    if ('text' in part) {
                                        if (part.text.startsWith('(Attached an image')) {
                                            return <p key={i} className="italic text-sm opacity-80">{part.text}</p>;
                                        }

                                        // Simple markdown-like parser for "ChatGPT Style" formatting
                                        return (
                                            <div key={i} className="text-sm leading-relaxed space-y-2">
                                                {part.text.split('\n').map((line, lineIdx) => {
                                                    // Handle headings (### Heading)
                                                    if (line.startsWith('### ')) {
                                                        return <h3 key={lineIdx} className="font-bold text-lg mt-2 mb-1">{line.replace('### ', '')}</h3>;
                                                    }
                                                    // Handle bold headings/lines (**Heading**)
                                                    if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                                                        return <strong key={lineIdx} className="block font-bold mt-2 mb-1">{line.replace(/\*\*/g, '')}</strong>;
                                                    }
                                                    // Handle bullet points
                                                    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                                        return (
                                                            <div key={lineIdx} className="flex gap-2 ml-1">
                                                                <span className="font-bold">•</span>
                                                                <span>
                                                                    {line.replace(/^[\-\*]\s+/, '').split(/(\*\*.*?\*\*)/).map((chunk, cIdx) =>
                                                                        chunk.startsWith('**') && chunk.endsWith('**')
                                                                            ? <strong key={cIdx}>{chunk.replace(/\*\*/g, '')}</strong>
                                                                            : chunk
                                                                    )}
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                    // Handle numbered lists
                                                    if (/^\d+\.\s/.test(line.trim())) {
                                                        return (
                                                            <div key={lineIdx} className="flex gap-2 ml-1">
                                                                <span className="font-bold min-w-[1.2em]">{line.match(/^\d+\./)?.[0]}</span>
                                                                <span>
                                                                    {line.replace(/^\d+\.\s+/, '').split(/(\*\*.*?\*\*)/).map((chunk, cIdx) =>
                                                                        chunk.startsWith('**') && chunk.endsWith('**')
                                                                            ? <strong key={cIdx}>{chunk.replace(/\*\*/g, '')}</strong>
                                                                            : chunk
                                                                    )}
                                                                </span>
                                                            </div>
                                                        );
                                                    }

                                                    // Regular text with inline bold support
                                                    return (
                                                        <p key={lineIdx} className="min-h-[1em]">
                                                            {line.split(/(\*\*.*?\*\*)/).map((chunk, cIdx) =>
                                                                chunk.startsWith('**') && chunk.endsWith('**')
                                                                    ? <strong key={cIdx}>{chunk.replace(/\*\*/g, '')}</strong>
                                                                    : chunk
                                                            )}
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                                {msg.groundingMetadata?.groundingChunks?.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-[var(--color-surface-lighter)]">
                                        <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Sources:</p>
                                        <div className="flex flex-col gap-1">
                                            {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                                                <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" key={i} className="text-xs text-[var(--color-primary)] hover:underline truncate">
                                                    {chunk.web.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex-shrink-0"></div>
                            <div className="max-w-xl p-3 rounded-lg bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] rounded-bl-none">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-pulse delay-0"></span>
                                    <span className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                        placeholder={isListening ? "Listening..." : "Type your message or question"}
                        className="flex-grow bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg p-3 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                        disabled={isLoading || isListening}
                    />
                    <button onClick={handleMicClick} disabled={isLoading} className={`p-3 rounded-full transition-colors text-white ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'}`}>
                        {isListening ? <StopIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                    </button>
                    <button onClick={handleSendMessage} disabled={isLoading || isListening} className="p-3 bg-[var(--color-secondary-action)] hover:bg-violet-700 rounded-full disabled:bg-[var(--color-surface-lighter)] text-white">
                        <SendIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="mt-2 flex justify-end items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="search-toggle" className="text-sm text-[var(--color-text-muted)] cursor-pointer">Search Web</label>
                        <button role="switch" aria-checked={useSearch} onClick={() => setUseSearch(!useSearch)} id="search-toggle" className={`${useSearch ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-lighter)]'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}>
                            <span className={`${useSearch ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                        </button>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} title="Upload My Work" disabled={isLoading} className="flex items-center gap-2 px-3 py-1 text-sm bg-amber-600 hover:bg-amber-500 rounded-md disabled:bg-[var(--color-surface-lighter)] text-white">
                        <PaperClipIcon className="w-4 h-4" /> Upload Work
                    </button>
                </div>
                {error && <p className="text-xs text-[var(--color-danger)] mt-1">Mic Error: {error}</p>}
            </div>
        </>
    );
};

export default SolveIssueView;
