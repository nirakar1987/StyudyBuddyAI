import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppContextType, AvatarState } from '../types';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { CheckIcon } from './icons/CheckIcon';

interface OralQuizViewProps {
    context: AppContextType;
}

const OralQuizView: React.FC<OralQuizViewProps> = ({ context }) => {
    const { generatedQuiz, setUserAnswers, handleSubmitQuiz, setAvatarState, setScore } = context;
    const questions = generatedQuiz?.questions || [];
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isAnswering, setIsAnswering] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    
    const { isListening, transcript, startListening, stopListening, error } = useSpeechRecognition();
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        const setVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const femaleUSEnglish = voices.find(v => 
                    v.lang === 'en-US' && 
                    (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'))
                );
                const femaleEnglish = voices.find(v => 
                    v.lang.startsWith('en-') && 
                    v.name.includes('Female')
                );
                
                setSelectedVoice(femaleUSEnglish || femaleEnglish || voices.find(v => v.lang.startsWith('en-')) || voices[0]);
            }
        };

        setVoice();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = setVoice;
        }
        
        return () => {
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = null;
            }
        };
    }, []);

    const speak = useCallback((text: string, onEnd: () => void) => {
        if ('speechSynthesis' in window && window.speechSynthesis) {
            setAvatarState(AvatarState.SPEAKING);
            const utterance = new SpeechSynthesisUtterance(text);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            utterance.onend = () => {
                setAvatarState(AvatarState.IDLE);
                onEnd();
            };
            utterance.onerror = () => {
                console.error("Speech synthesis error");
                setAvatarState(AvatarState.IDLE);
                onEnd(); // Proceed even if speech fails
            };
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("Speech synthesis not supported.");
            onEnd(); // fallback for unsupported browsers
        }
    }, [setAvatarState, selectedVoice]);

    useEffect(() => {
        if (questions.length > 0 && currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            const textToSpeak = question.questionText + (question.options ? ` The options are: ${question.options.join(', ')}` : '');
            
            speak(textToSpeak, () => {
                setIsAnswering(true);
                startListening();
                setAvatarState(AvatarState.LISTENING);
            });
        }
        
        return () => {
            if (utteranceRef.current && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [currentQuestionIndex, questions, speak, startListening, setAvatarState]);


    const handleNextQuestion = useCallback(async () => {
        stopListening();
        setUserAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: transcript.trim(),
        }));
        await setScore(prev => prev + 5); // Small score for attempting
        setIsAnswering(false);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [stopListening, setUserAnswers, currentQuestionIndex, transcript, questions.length, setScore]);


    if (questions.length === 0) {
        return <p className="text-center text-slate-400">No quiz loaded for an oral session.</p>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center">
            <p className="text-sm text-cyan-400 font-semibold">QUESTION {currentQuestionIndex + 1} OF {questions.length}</p>
            <h2 className="text-3xl font-bold mt-2 mb-6">{currentQuestion.questionText}</h2>
            
            {currentQuestion.options && (
                <div className="grid grid-cols-2 gap-3 mb-8 w-full max-w-md">
                    {currentQuestion.options.map(option => (
                        <div key={option} className="bg-slate-700 p-3 rounded-lg text-slate-300">{option}</div>
                    ))}
                </div>
            )}
            
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                <div className={`absolute inset-0 rounded-full transition-colors ${isListening ? 'bg-red-500/30 animate-pulse' : 'bg-cyan-500/20'}`}></div>
                <div className={`relative w-32 h-32 flex items-center justify-center rounded-full transition-colors ${isListening ? 'bg-red-500' : 'bg-cyan-500'}`}>
                    <MicrophoneIcon className="w-16 h-16 text-white"/>
                </div>
            </div>

            <p className="text-slate-300 h-10">{isListening ? "Listening for your answer..." : "Getting ready..."}</p>
            <p className="text-lg font-semibold text-white h-8 mb-6 min-h-[2rem]"><i>{transcript}</i></p>

            {isAnswering && (
                 isLastQuestion ? (
                    <button 
                        onClick={() => { handleNextQuestion(); setTimeout(handleSubmitQuiz, 200); }} 
                        className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-xl transition-transform active:scale-95"
                    >
                       <CheckIcon className="w-6 h-6"/> Finish & See Results
                    </button>
                 ) : (
                    <button 
                        onClick={handleNextQuestion} 
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-xl transition-transform active:scale-95"
                    >
                        Next Question <ChevronRightIcon className="w-6 h-6"/>
                    </button>
                 )
            )}
            {error && <p className="text-xs text-red-400 mt-2">Mic Error: {error}</p>}
        </div>
    );
};

export default OralQuizView;