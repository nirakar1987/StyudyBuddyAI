import React from 'react';
import { AppContextType } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

const FeatureIcon: React.FC<{ children: React.ReactNode, color: string }> = ({ children, color }) => (
  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: color + '20', color: color }}>
    {children}
  </div>
);

const LandingPageView: React.FC<{ context: AppContextType }> = ({ context }) => {
  const { startApp } = context;

  return (
    <div className="min-h-screen w-full bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Aurora Background */}
      <div
        className="absolute inset-0 z-0 opacity-40"
        style={{
          background: 'linear-gradient(125deg, var(--color-primary), var(--color-secondary), var(--color-background), var(--color-primary))',
          backgroundSize: '400% 400%',
          animation: 'aurora-bg 20s ease infinite',
        }}
      ></div>

      <main className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        {/* Hero Graphic */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 animate-[bloom-rotate_20s_ease-in-out_infinite]">
          <div className="absolute inset-0 bg-[var(--color-primary)] rounded-full blur-3xl opacity-50"></div>
          <svg viewBox="0 0 200 200" className="absolute inset-0">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {Array.from({ length: 6 }).map((_, i) => (
              <ellipse
                key={i}
                cx="100"
                cy="100"
                rx="80"
                ry="30"
                stroke={`url(#petalGradient${i})`}
                strokeWidth="3"
                fill="none"
                transform={`rotate(${i * 60} 100 100)`}
                filter="url(#glow)"
              />
            ))}
            <defs>
              {Array.from({ length: 6 }).map((_, i) => (
                <linearGradient key={i} id={`petalGradient${i}`} gradientTransform={`rotate(${i * 15})`}>
                  <stop offset="0%" stopColor="var(--color-secondary)" />
                  <stop offset="100%" stopColor="var(--color-primary)" />
                </linearGradient>
              ))}
            </defs>
          </svg>
        </div>

        {/* App Title */}
        <div className="relative mb-2 animate-fade-in hover:scale-105 transition-transform duration-500 cursor-default" style={{ animationDelay: '0ms' }}>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-2xl filter pb-2">
            StudyBuddy AI
          </h1>
          {/* Animated glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-lg blur-2xl opacity-20 animate-pulse"></div>
        </div>

        {/* Text Content */}
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-[var(--color-text-primary)] leading-tight animate-fade-in" style={{ animationDelay: '200ms' }}>
          Learning, Reimagined.
        </h2>
        <p className="mt-4 text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '300ms' }}>
          Step into the future of education with StudyBuddy AI, your personal AI tutor. Interactive, intelligent, and always ready to help you succeed.
        </p>

        <button
          onClick={startApp}
          className="mt-10 px-8 py-4 bg-[var(--color-primary)] text-white font-bold text-xl rounded-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 animate-fade-in"
          style={{
            animationDelay: '500ms',
            boxShadow: '0 0 30px 0 color-mix(in srgb, var(--color-primary) 40%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-primary) 70%, transparent)',
          }}
        >
          Begin Your Journey
        </button>

        {/* Features Section */}
        <div className="mt-16 pt-8 w-full border-t border-[var(--color-border)] animate-fade-in" style={{ animationDelay: '700ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <FeatureIcon color="var(--color-primary)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6-2.292m0 0V21" /></svg>
              </FeatureIcon>
              <h3 className="mt-4 text-xl font-bold">Interactive Lessons</h3>
              <p className="mt-1 text-[var(--color-text-secondary)]">Engage in voice-based conversations that make learning feel natural.</p>
            </div>
            <div className="flex flex-col items-center">
              <FeatureIcon color="var(--color-secondary)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
              </FeatureIcon>
              <h3 className="mt-4 text-xl font-bold">Smart Quizzes</h3>
              <p className="mt-1 text-[var(--color-text-secondary)]">Generate custom quizzes instantly from photos of your study materials.</p>
            </div>
            <div className="flex flex-col items-center">
              <FeatureIcon color="var(--color-accent)">
                <SparklesIcon className="w-6 h-6" />
              </FeatureIcon>
              <h3 className="mt-4 text-xl font-bold">Creative Tools</h3>
              <p className="mt-1 text-[var(--color-text-secondary)]">Bring ideas to life by generating images and diagrams from text prompts.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPageView;