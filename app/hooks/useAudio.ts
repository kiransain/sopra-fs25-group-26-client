import { useEffect, useRef } from 'react';

export function useAudio(src: string, volume = 1.0) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio(src);
    audioRef.current.volume = volume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [src, volume]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Rewind
      audioRef.current.play().catch(e => console.log("Audio error:", e));
    }
  };

  return play;
}