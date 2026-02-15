
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppContextType, AvatarState, ChatMessage } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SendIcon } from './icons/SendIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { startTimeTravelChat, continueChat } from '../services/geminiService';

interface TimeTravelViewProps {
    context: AppContextType;
}

const HISTORICAL_FIGURES = [
    {
        id: 'einstein',
        name: 'Albert Einstein',
        role: 'Theoretical Physicist',
        personality: 'Wise, curious, likes violin and thought experiments, slightly eccentric but very kind.',
        knowledge: 'General & Special Relativity, Photoelectric effect, Quantum mechanics, Theoretical physics.',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop',
        quote: "Imagination is more important than knowledge.",
        color: 'from-blue-600 to-indigo-700'
    },
    {
        id: 'newton',
        name: 'Isaac Newton',
        role: 'Mathematician & Physicist',
        personality: 'Serious, focused, obsessed with the laws of the universe, slightly defensive but brilliant.',
        knowledge: 'Laws of motion, Universal gravitation, Calculus, Optics.',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2670&auto=format&fit=crop',
        quote: "If I have seen further it is by standing on the shoulders of Giants.",
        color: 'from-emerald-600 to-teal-700'
    },
    {
        id: 'curie',
        name: 'Marie Curie',
        role: 'Chemist & Physicist',
        personality: 'Determined, resilient, scientific pioneer, modest and dedicated to research.',
        knowledge: 'Radioactivity, Polonium, Radium, Nobel Prize winning research.',
        image: 'https://images.unsplash.com/photo-1532187875605-1864745210d4?q=80&w=2670&auto=format&fit=crop',
        quote: "Nothing in life is to be feared, it is only to be understood.",
        color: 'from-rose-600 to-pink-700'
    },
    {
        id: 'da-vinci',
        name: 'Leonardo da Vinci',
        role: 'Polymath of the Renaissance',
        personality: 'Endlessly curious, observant, artistic, inventive, talks in metaphors.',
        knowledge: 'Anatomy, Engineering, Painting, Flight, Renaissance art and science.',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=2745&auto=format&fit=crop',
        quote: "Learning never exhausts the mind.",
        color: 'from-amber-600 to-orange-700'
    },
    {
        id: 'cleopatra',
        name: 'Cleopatra VII',
        role: 'Queen of the Ptolemaic Kingdom',
        personality: 'Commanding, highly intelligent, strategic, multifaceted, fluent in many languages.',
        knowledge: 'Politics, Ancient Egyptian and Greek history, Strategy, Diplomacy.',
        image: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?q=80&w=2670&auto=format&fit=crop',
        quote: "My honor was not yielded, but conquered.",
        color: 'from-purple-600 to-violet-700'
    },
    {
        id: 'ramanujan',
        name: 'Srinivasa Ramanujan',
        role: 'Self-taught Mathematical Genius',
        personality: 'Intuitive, deeply spiritual about numbers, humble, intense focus on infinite series.',
        knowledge: 'Number theory, Infinite series, Continued fractions, Partition functions.',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2670&auto=format&fit=crop', // Placeholder for math theme
        quote: "An equation for me has no meaning unless it expresses a thought of God.",
        color: 'from-orange-600 to-red-700'
    }
];

const TimeTravelView: React.FC<TimeTravelViewProps> = ({ context }) => {
    const { setAppState, setAvatarState, studentProfile } = context;
    const [selectedFigure, setSelectedFigure] = useState<any>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSelectFigure = (figure: any) => {
        setSelectedFigure(figure);
        setMessages([]);
        if (studentProfile) {
            startTimeTravelChat(figure, studentProfile);
            // Initial greeting
            setMessages([{
                role: 'model',
                parts: [{ text: `Greetings, ${studentProfile.name}! I am ${figure.name}. It is a marvel to speak with someone from the future. What mysteries of the universe or history shall we discuss today?` }]
            }]);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading || !selectedFigure) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
        setIsLoading(true);
        setAvatarState(AvatarState.THINKING);

        try {
            const response = await continueChat(userMessage);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: response.text }] }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Forgive me, my thoughts are a bit scattered. Could you repeat that?" }] }]);
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.IDLE);
        }
    };

    if (!selectedFigure) {
        return (
            <div className="flex flex-col h-full animate-fade-in p-2">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4 animate-neon-pulse drop-shadow-xl">
                        🕰️ Time Traveler's Portal
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Who would you like to speak with today? Our temporal link can connect you with some of history's greatest minds.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow overflow-y-auto pb-10">
                    {HISTORICAL_FIGURES.map((figure) => (
                        <div
                            key={figure.id}
                            onClick={() => handleSelectFigure(figure)}
                            className={`group relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden cursor-pointer hover:scale-105 hover:border-white/30 transition-all duration-500 shadow-2xl hover:shadow-${figure.id === 'curie' ? 'pink' : figure.id === 'newton' ? 'emerald' : 'blue'}-500/20`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${figure.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>

                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={figure.image}
                                    alt={figure.name}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <h3 className="text-2xl font-black text-white drop-shadow-lg">{figure.name}</h3>
                                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest">{figure.role}</p>
                                </div>
                            </div>

                            <div className="p-6 relative z-10">
                                <p className="text-slate-300 text-sm italic mb-4">"{figure.quote}"</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] uppercase font-bold text-slate-400 border border-white/5">Master of {figure.knowledge.split(',')[0]}</span>
                                </div>

                                <button className="w-full mt-6 py-3 bg-white/5 group-hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all">
                                    Enter Portal →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="mt-6 flex items-center gap-2 text-slate-500 hover:text-white transition-colors self-center font-bold uppercase tracking-widest text-xs"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in relative bg-slate-900/40 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            {/* Header */}
            <header className={`p-4 bg-gradient-to-r ${selectedFigure.color} flex justify-between items-center shadow-lg relative z-20`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-white/50 overflow-hidden bg-slate-800 shadow-inner">
                        <img src={selectedFigure.image} alt={selectedFigure.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">{selectedFigure.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-white/80 font-bold uppercase tracking-tighter">Temporal Link Active</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setSelectedFigure(null)}
                    className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-all text-white"
                >
                    <ClockIcon className="w-6 h-6" />
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-xl ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-br-none'
                                : 'bg-slate-800/90 backdrop-blur-md border border-white/10 text-slate-100 rounded-bl-none'
                            }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.parts.map(p => 'text' in p ? p.text : '').join('')}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl rounded-bl-none border border-white/10">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-800/50 backdrop-blur-xl border-t border-white/5 relative z-20">
                <div className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/10 focus-within:border-white/30 transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`Ask ${selectedFigure.name.split(' ')[0]} about their world...`}
                        className="flex-grow bg-transparent text-white px-4 py-2 outline-none placeholder:text-slate-600 text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`p-3 rounded-xl transition-all ${input.trim() && !isLoading
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-[10px] text-center text-slate-500 mt-2 uppercase tracking-widest font-bold">
                    Temporal Chat powered by StudyBuddy AI
                </p>
            </div>
        </div>
    );
};

export default TimeTravelView;
