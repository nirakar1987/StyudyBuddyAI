import React from 'react';
import { AppContextType, AppState, StudentProfile } from '../types';
import Avatar from './Avatar';

const styles = [
    { id: 'default', name: 'Default', description: 'The original vibrant look.' },
    { id: 'sepia', name: 'Sepia', description: 'A warm, classic tone.' },
    { id: 'grayscale', name: 'Grayscale', description: 'A sleek black and white style.' },
    { id: 'vintage', name: 'Vintage', description: 'A soft, retro-film look.' },
    { id: 'dreamy', name: 'Dreamy', description: 'Saturated and fantastical colors.' },
    { id: 'nebula', name: 'Nebula', description: 'A cosmic, otherworldly palette.' },
];

const AvatarCustomizationView: React.FC<{ context: AppContextType }> = ({ context }) => {
    const { studentProfile, setStudentProfile, setAppState } = context;
    const currentStyle = studentProfile?.avatar_style || 'default';

    const handleSelectStyle = (styleId: string) => {
        if (studentProfile) {
            const updatedProfile: StudentProfile = { ...studentProfile, avatar_style: styleId };
            setStudentProfile(updatedProfile);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-4">Customize Your AI Tutor</h2>
            <p className="text-[var(--color-text-muted)] mb-6">Choose an appearance that you like best!</p>

            <div className="flex flex-col md:flex-row gap-8 flex-grow">
                {/* Preview */}
                <div className="md:w-1/3 flex flex-col items-center">
                    <h3 className="text-xl font-semibold mb-4 text-[var(--color-text-secondary)]">Preview</h3>
                    {/* FIX: The Avatar component expects studentProfile and onProfileChange props.
                        The incorrect avatar_style prop was removed and the correct props from the context are now passed. */}
                    <Avatar
                        avatarState={context.avatarState}
                        studentProfile={studentProfile}
                        onProfileChange={setStudentProfile}
                    />
                </div>

                {/* Options */}
                <div className="md:w-2/3 flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {styles.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => handleSelectStyle(style.id)}
                                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${currentStyle === style.id
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-105'
                                        : 'border-[var(--color-border)] bg-[var(--color-surface-light)] hover:border-[var(--color-primary-hover)] hover:bg-[var(--color-primary)]/5'
                                    }`}
                            >
                                <h4 className="font-bold text-lg text-[var(--color-text-primary)]">{style.name}</h4>
                                <p className="text-sm text-[var(--color-text-secondary)]">{style.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="px-6 py-2 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] rounded-lg font-semibold"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default AvatarCustomizationView;