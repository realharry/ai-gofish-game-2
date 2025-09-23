export enum SoundEffect {
    NewGame = 'NewGame',
    CardDeal = 'CardDeal',
    GoFish = 'GoFish',
    BookComplete = 'BookComplete',
    GameOver = 'GameOver',
}

const SOUND_FILES: Record<SoundEffect, string> = {
    [SoundEffect.NewGame]: 'https://actions.google.com/sounds/v1/card_games/card_shuffle.ogg',
    [SoundEffect.CardDeal]: 'https://actions.google.com/sounds/v1/card_games/card_dealing_single.ogg',
    [SoundEffect.GoFish]: 'https://actions.google.com/sounds/v1/water/water_splash.ogg',
    [SoundEffect.BookComplete]: 'https://actions.google.com/sounds/v1/achievements/achievement_bell.ogg',
    [SoundEffect.GameOver]: 'https://actions.google.com/sounds/v1/achievements/trumpet_fanfare.ogg',
};


let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let isUnlocked = false;
let isMuted = false;

const audioBuffers: Partial<Record<SoundEffect, AudioBuffer>> = {};

const preloadSounds = async () => {
    if (!audioContext) return;
    
    const promises = Object.entries(SOUND_FILES).map(async ([key, src]) => {
        try {
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
            audioBuffers[key as SoundEffect] = audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound: ${key}`, error);
        }
    });

    await Promise.all(promises);
};

export const unlockAudio = () => {
    if (isUnlocked || typeof window === 'undefined') return;

    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    isUnlocked = true;
    preloadSounds();
};


export const playSound = (sound: SoundEffect) => {
    if (!isUnlocked || isMuted || !audioContext || !gainNode) return;

    const buffer = audioBuffers[sound];
    if (buffer) {
        try {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode);
            source.start(0);
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    } else {
        // This might happen if preloading is slow, it's a soft fail.
        console.warn(`Sound ${sound} not loaded yet.`);
    }
};

export const setMuted = (muted: boolean) => {
    isMuted = muted;
    if (gainNode && audioContext) {
        // Use exponential ramp for a smooth volume transition
        gainNode.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 1, audioContext.currentTime + 0.2);
    }
};