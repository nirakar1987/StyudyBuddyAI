import React, { useRef } from 'react';
import { AvatarState, StudentProfile } from '../types';
import { PencilIcon } from './icons/PencilIcon';

interface AvatarProps {
  avatarState: AvatarState;
  studentProfile: StudentProfile | null;
  onProfileChange: (profile: StudentProfile | null) => Promise<void>;
}

const Avatar: React.FC<AvatarProps> = ({ avatarState, studentProfile, onProfileChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stateStyles = {
    [AvatarState.IDLE]: {
      borderColor: 'border-slate-600',
      animation: 'animate-idle-breathe',
      imgFilter: 'grayscale(30%) brightness(0.95)',
      overlayOpacity: 'opacity-50',
    },
    [AvatarState.LISTENING]: {
      borderColor: 'border-green-500',
      animation: 'animate-listening-pulse',
      imgFilter: '',
      overlayOpacity: 'opacity-20',
    },
    [AvatarState.THINKING]: {
      borderColor: 'border-amber-400',
      animation: 'animate-thinking-spin',
      imgFilter: 'brightness(1.1)',
      overlayOpacity: 'opacity-10',
    },
    [AvatarState.SPEAKING]: {
      borderColor: 'border-cyan-400',
      animation: 'animate-speaking-bounce',
      imgFilter: '',
      overlayOpacity: 'opacity-20',
    }
  };

  const visualStyleFilters: Record<string, string> = {
    default: '',
    sepia: 'sepia(1)',
    grayscale: 'grayscale(1)',
    vintage: 'sepia(1) saturate(1.5) contrast(0.75)',
    dreamy: 'saturate(2) hue-rotate(30deg)',
    nebula: 'hue-rotate(200deg) saturate(1.5) contrast(1.25)',
  };

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/') && studentProfile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result as string;
        const updatedProfile = { ...studentProfile, avatar_url: base64Url };
        await onProfileChange(updatedProfile);
      };
      reader.readAsDataURL(file);
    }
  };


  const currentStyle = stateStyles[avatarState] || stateStyles[AvatarState.IDLE];
  const defaultAvatarUrl = "https://api.dicebear.com/9.x/micah/svg?seed=student";
  const avatarImageUrl = studentProfile?.avatar_url || defaultAvatarUrl;

  const baseFilter = visualStyleFilters[studentProfile?.avatar_style || 'default'] || '';
  const stateFilter = currentStyle.imgFilter;
  const combinedFilter = `${baseFilter} ${stateFilter}`.trim();

  return (
    <div className="p-4 bg-[var(--color-surface)] rounded-lg shadow-lg flex flex-col items-center">
      <div
        className={`relative w-48 h-48 rounded-full overflow-hidden border-4 transition-all duration-500 group ${currentStyle.borderColor} ${currentStyle.animation}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <img
          src={avatarImageUrl}
          alt="StudyBuddy AI Tutor"
          className={`w-full h-full object-cover transition-all duration-500`}
          style={combinedFilter ? { filter: combinedFilter } : {}}
        />
        <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${currentStyle.overlayOpacity}`}></div>
        <button
          onClick={handleEditClick}
          className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-label="Change avatar image"
        >
          <PencilIcon className="w-8 h-8" />
          <span className="mt-1 text-sm font-semibold">Edit</span>
        </button>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">StudyBuddy AI</h2>
      <p className="text-[var(--color-text-muted)]">Your Personal AI Tutor</p>
    </div>
  );
};

export default Avatar;