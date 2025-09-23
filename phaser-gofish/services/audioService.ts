
export enum SoundEffect {
    NewGame = 'NewGame',
    CardDeal = 'CardDeal',
    GoFish = 'GoFish',
    BookComplete = 'BookComplete',
    GameOver = 'GameOver',
}

const SOUND_FILES: Record<SoundEffect, string> = {
    [SoundEffect.NewGame]: 'https://cdn.pixabay.com/download/audio/2022/02/09/audio_2fc98a8767.mp3',
    [SoundEffect.CardDeal]: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_33372f4be3.mp3',
    [SoundEffect.GoFish]: 'https://cdn.pixabay.com/download/audio/2023/05/05/audio_4070776d33.mp3',
    [SoundEffect.BookComplete]: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3',
    [SoundEffect.GameOver]: 'https://cdn.pixabay.com/download/audio/2023/03/13/audio_a5518b7a42.mp3',
};


let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let isUnlocked = false;
let isMuted = false;

const audioBuffers: Partial<Record<SoundEffect, AudioBuffer>> = {};

export const AUDIO_STATE_CHANGE_EVENT = 'audiostatechange';

const preloadSounds = async () => {
    if (!audioContext) return;

    const results = await Promise.allSettled(Object.entries(SOUND_FILES).map(async ([key, src]) => {
        const response = await fetch(src);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for sound ${key}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
        audioBuffers[key as SoundEffect] = audioBuffer;
    }));

    const failedSounds = results.filter(result => result.status === 'rejected');
    if (failedSounds.length > 0) {
        failedSounds.forEach(result => {
            if (result.status === 'rejected') {
                console.error("Failed to load sound:", result.reason);
            }
        });
        console.error("One or more sounds failed to load. Muting audio automatically.");
        setMuted(true);
    }
};

export const unlockAudio = () => {
    if (isUnlocked || typeof window === 'undefined') return;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        isUnlocked = true;
        preloadSounds();
    } catch (e) {
        console.error("Could not initialize AudioContext. Muting audio.", e);
        setMuted(true);
    }
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
        console.warn(`Sound ${sound} not loaded yet.`);
    }
};

export const setMuted = (muted: boolean) => {
    if (isMuted === muted) return; // Prevent unnecessary events
    isMuted = muted;
    if (gainNode && audioContext) {
        gainNode.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 1, audioContext.currentTime + 0.2);
    }
    window.dispatchEvent(new CustomEvent(AUDIO_STATE_CHANGE_EVENT, { detail: { isMuted } }));
};