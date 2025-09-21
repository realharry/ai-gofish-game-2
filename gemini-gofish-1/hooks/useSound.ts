import { useCallback, useRef, useEffect } from 'react';

/**
 * A custom React hook to play sound effects.
 * It pre-loads the audio and provides a simple `play` function.
 * @param soundSrc The source of the audio file (e.g., a URL or a base64 data URI).
 * @param volume The volume to play the sound at (0.0 to 1.0).
 * @returns A function that, when called, plays the sound.
 */
export const useSound = (soundSrc: string, volume: number = 0.3) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pre-load the audio element when the component mounts or the source changes.
  useEffect(() => {
    try {
      const audio = new Audio(soundSrc);
      audio.volume = volume;
      audioRef.current = audio;
    } catch (error) {
      console.error("Failed to create audio element:", error);
    }
  }, [soundSrc, volume]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Rewind to the start to allow for rapid replays
      audioRef.current.play().catch(error => {
        // Autoplay was prevented. This is a common browser policy.
        // We can ignore this error silently as sounds are non-critical enhancements.
        console.warn("Sound play was prevented by browser policy:", error);
      });
    }
  }, []);

  return play;
};
