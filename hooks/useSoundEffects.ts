import { useCallback, useRef } from 'react';

// Base64 encoded, royalty-free WAV files for minimal latency
const SOUNDS = {
  CORRECT: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD/AIA/ACAA/wD4APoA/gD+AP8A/AD+APwA/gD8AP4A+gD8APoA/AD4APwA9gD2APQA9ADyAPIA7gDsAOwA6gDqAOcA5gDjAOMA3gDbANYA1QDSANAAzwDMAMgAxQDEAMAAwAC/AL4AvgC8ALsAuwC3ALcAtgC1ALQAtACzALMAsgCxALEAqwCrAKoApgCnAKUAogChAI8AjgCPAN4A5ADrAPMA+gD/AP8A/wD+APwA+ADyAO8A6ADfANMAwwC7AK8AogCOAIgAfwB5AHYAawBlAD8AOwA1ADMANQA2ADgAOgA8AD0APwA/AEAAQQBC',
  INCORRECT: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAMA/AMD/AMC/AMD/AMD/AMD/AMD/AMD/AMD/AMD/AMD/AMD/AMC/AMD/AMC/AMC/AMD/AMD/AMD/AMD/AMD/AMC/AMD/AMD/AMD/AMC/AMD/AMD/AMA/AMD/AMD/AMA/AMC/AMA/AMD/AMA/AMD/AMA/AMD/AMD/AMA/AMD/AMA/AMA/AMA/AMD/AMD/AMC/AMC/AMC/AMC/AMD/AMD/AMA/AMA/AMA/AMD/AMA/AMC/AMC/AMA/AMC/AMA/AMC/AMA/AMC/AMA/',
  SUBMIT: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAADgAP4A/wD/AP8A/AD4APIA7ADiANgA0QDHALEAogB+AHgAaQBCAC4AIgAcABoAGgAbABwAHgAgACMAKgAvADIANwA+AEQASgBSAFkAXwBlAGsAcQBzAHUAdgB1AHMAbwBsAGgAZQBfAFoAVQBQAEsARgBBADsANgAyAC8ALQApACUALgA1ADsARgBPAGAAcwB4AGwAZABWAD4ALgAZABMAEgATABUAFwAcACEAJgAuADYAPwBEAEcARwBEAEAAOQA0ADEALgArACgAJwAmACgAKgAvADIANwA/',
  COMPLETE: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAADgAOgA+gEAAQUBGQEzASIBGgEGAAMADgAwAD0ASABQAFgAXgBjAGgAaQBoAGYAZQBjAGAAXQBXAFIAUgBUAFUAVgBSAFEAUABQAE8ATwBPAE8AUQBRAFIAUgBTAFMBUgBRAFEAUABPAE8ATgBOAE0ATQBOAE4ATwBPAE8AUABRAFEAUQBSAFIAUgBSAFIAUgBTAFMAUwBTAFMAUgBRAFAATwBOAE0ATABLAEoASQBIAEcARgBFAEQAQwBCAEIAQgBCAEIAQgBDAEQARgBIAEoATgBSAFI=',
  HOVER: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAMAAD//v8=/9/7/MP9/7j/tv+4/7j/tP+0/7j/uP+4/7j/uP+4/7j/uP+4/w==',
};


/**
 * A custom hook to play sound effects for UI interactions.
 * It ensures only one sound plays at a time.
 */
export const useSoundEffects = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((soundUrl: string) => {
    // Stop any currently playing sound to prevent overlap
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Create and play the new sound. Users must interact with the page first for this to work.
    audioRef.current = new Audio(soundUrl);
    audioRef.current.play().catch(error => {
      // Autoplay was prevented. This is a common browser security feature.
      // We can ignore this for this app as sounds are triggered by user actions.
      console.log("Sound playback failed (likely requires user interaction first):", error);
    });
  }, []);

  const playCorrectSound = useCallback(() => playSound(SOUNDS.CORRECT), [playSound]);
  const playIncorrectSound = useCallback(() => playSound(SOUNDS.INCORRECT), [playSound]);
  const playSubmitSound = useCallback(() => playSound(SOUNDS.SUBMIT), [playSound]);
  const playCompleteSound = useCallback(() => playSound(SOUNDS.COMPLETE), [playSound]);
  const playHoverSound = useCallback(() => playSound(SOUNDS.HOVER), [playSound]);

  return { playCorrectSound, playIncorrectSound, playSubmitSound, playCompleteSound, playHoverSound };
};