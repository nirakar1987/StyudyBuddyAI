import { useCallback, useRef } from 'react';

// Base64 encoded, royalty-free WAV files for minimal latency
const SOUNDS = {
  CORRECT: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD/AIA/ACAA/wD4APoA/gD+AP8A/AD+APwA/gD8AP4A+gD8APoA/AD4APwA9gD2APQA9ADyAPIA7gDsAOwA6gDqAOcA5gDjAOMA3gDbANYA1QDSANAAzwDMAMgAxQDEAMAAwAC/AL4AvgC8ALsAuwC3ALcAtgC1ALQAtACzALMAsgCxALEAqwCrAKoApgCnAKUAogChAI8AjgCPAN4A5ADrAPMA+gD/AP8A/wD+APwA+ADyAO8A6ADfANMAwwC7AK8AogCOAIgAfwB5AHYAawBlAD8AOwA1ADMANQA2ADgAOgA8AD0APwA/AEAAQQBC',
  INCORRECT: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAMA/AMD/AMC/AMD/AMD/AMD/AMD/AMD/AMD/AMD/AMD/AMD/AMC/AMD/AMC/AMC/AMD/AMD/AMD/AMD/AMD/AMC/AMD/AMD/AMD/AMC/AMD/AMD/AMA/AMD/AMD/AMA/AMC/AMA/AMD/AMA/AMD/AMA/AMD/AMD/AMA/AMD/AMA/AMA/AMA/AMD/AMD/AMC/AMC/AMC/AMC/AMD/AMD/AMA/AMA/AMA/AMD/AMA/AMC/AMC/AMA/AMC/AMA/AMC/AMA/AMC/AMA/',
  SUBMIT: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAADgAP4A/wD/AP8A/AD4APIA7ADiANgA0QDHALEAogB+AHgAaQBCAC4AIgAcABoAGgAbABwAHgAgACMAKgAvADIANwA+AEQASgBSAFkAXwBlAGsAcQBzAHUAdgB1AHMAbwBsAGgAZQBfAFoAVQBQAEsARgBBADsANgAyAC8ALQApACUALgA1ADsARgBPAGAAcwB4AGwAZABWAD4ALgAZABMAEgATABUAFwAcACEAJgAuADYAPwBEAEcARwBEAEAAOQA0ADEALgArACgAJwAmACgAKgAvADIANwA/',
  COMPLETE: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAADgAOgA+gEAAQUBGQEzASIBGgEGAAMADgAwAD0ASABQAFgAXgBjAGgAaQBoAGYAZQBjAGAAXQBXAFIAUgBUAFUAVgBSAFEAUABQAE8ATwBPAE8AUQBRAFIAUgBTAFMBUgBRAFEAUABPAE8ATgBOAE0ATQBOAE4ATwBPAE8AUABRAFEAUQBSAFIAUgBSAFIAUgBTAFMAUwBTAFMAUgBRAFAATwBOAE0ATABLAEoASQBIAEcARgBFAEQAQwBCAEIAQgBCAEIAQgBDAEQARgBIAEoATgBSAFI=',
  HOVER: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAADgAP4A/wD/AP8A/AD4APIA7ADiANgA0QDHALEAogB+AHgAaQBCAC4AIgAcABoAGgAbABwAHgAgACMAKgAvADIANwA+AEQASgBSAFkAXwBlAGsAcQBzAHUAdgB1AHMAbwBsAGgAZQBfAFoAVQBQAEsARgBBADsANgAyAC8ALQApACUALgA1ADsARgBPAGAAcwB4AGwAZABWAD4ALgAZABMAEgATABUAFwAcACEAJgAuADYAPwBEAEcARwBEAEAAOQA0ADEALgArACgAJwAmACgAKgAvADIANwA/',
};

// Shared state for audio unlock - browsers block sound until user clicks/taps
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  // Play a silent sound to unlock - must be in direct response to user gesture
  const a = new Audio(SOUNDS.HOVER);
  a.volume = 0.5;
  a.play().catch(() => {});
}

// One-time listener to unlock audio on first user interaction
if (typeof document !== 'undefined') {
  const unlock = () => {
    unlockAudio();
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('click', unlock, { once: true, capture: true });
  document.addEventListener('touchstart', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });
}

/**
 * A custom hook to play sound effects for UI interactions.
 * It ensures only one sound plays at a time.
 * Note: User must click/tap anywhere first to unlock audio (browser policy).
 */
export const useSoundEffects = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastHoverRef = useRef(0);

  const playSound = useCallback((soundUrl: string) => {
    unlockAudio();
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new Audio(soundUrl);
    audioRef.current.volume = 0.6;
    audioRef.current.play().catch(() => {});
  }, []);

  const playHoverSound = useCallback(() => {
    unlockAudio();
    const now = Date.now();
    if (now - lastHoverRef.current < 80) return;
    lastHoverRef.current = now;
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new Audio(SOUNDS.HOVER);
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(() => {});
  }, []);

  const playCorrectSound = useCallback(() => playSound(SOUNDS.CORRECT), [playSound]);
  const playIncorrectSound = useCallback(() => playSound(SOUNDS.INCORRECT), [playSound]);
  const playSubmitSound = useCallback(() => playSound(SOUNDS.SUBMIT), [playSound]);
  const playCompleteSound = useCallback(() => playSound(SOUNDS.COMPLETE), [playSound]);

  return { playCorrectSound, playIncorrectSound, playSubmitSound, playCompleteSound, playHoverSound };
};