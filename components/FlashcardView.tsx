import React, { useState } from 'react';
import { AppContextType, AppState } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface FlashcardViewProps {
    context: AppContextType;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ context }) => {
    const { flashcards, setAppState } = context;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!flashcards) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <SparklesIcon className="w-12 h-12 text-[var(--color-primary)] animate-pulse" />
                <p className="mt-4 text-[var(--color-text-secondary)]">Generating your flashcards...</p>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-4">No Flashcards Generated</h2>
                <p className="text-[var(--color-text-muted)]">We couldn't find any key terms in the uploaded material. Please try with a different document.</p>
                <button 
                    onClick={() => setAppState(AppState.DASHBOARD)} 
                    className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const currentCard = flashcards[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        // A short delay to allow the card to flip back before changing content
        setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % flashcards.length);
        }, 150);
    };
    
    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
        }, 150);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in items-center">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-2">Flashcard Review</h2>
            <p className="text-[var(--color-text-muted)] mb-6">Click the card to flip it and reveal the definition.</p>

            {/* Flashcard */}
            <div className="w-full max-w-2xl h-72 flex-shrink-0 flashcard-container mb-6">
                <div 
                    className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Flashcard: ${isFlipped ? 'Definition' : 'Term'}. Click to flip.`}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsFlipped(!isFlipped)}
                >
                    <div className="flashcard-face flashcard-front">
                        <p className="text-3xl font-bold text-[var(--color-text-primary)]">{currentCard.term}</p>
                    </div>
                    <div className="flashcard-face flashcard-back">
                        <p className="text-lg">{currentCard.definition}</p>
                    </div>
                </div>
            </div>

            {/* Navigation and Progress */}
            <div className="flex items-center justify-between w-full max-w-2xl">
                <button 
                    onClick={handlePrev}
                    className="p-4 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-full transition-colors active:scale-95"
                    aria-label="Previous card"
                >
                    <ChevronRightIcon className="w-6 h-6 transform rotate-180" />
                </button>
                <p className="text-lg font-semibold text-[var(--color-text-secondary)]">
                    Card {currentIndex + 1} of {flashcards.length}
                </p>
                <button 
                    onClick={handleNext}
                    className="p-4 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-full transition-colors active:scale-95"
                    aria-label="Next card"
                >
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="mt-auto pt-6 w-full flex justify-end">
                <button 
                    onClick={() => setAppState(AppState.DASHBOARD)} 
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default FlashcardView;