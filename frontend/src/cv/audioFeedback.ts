class AudioFeedbackManager {
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private speechRate: number = 1.05;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private audioContext: AudioContext | null = null;

  constructor() {
    const savedMute = localStorage.getItem('movewell_tts_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
    const savedVol = localStorage.getItem('movewell_tts_volume');
    if (savedVol !== null) {
      this.volume = parseFloat(savedVol);
    }
  }

  private initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('movewell_tts_muted', String(muted));
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('movewell_tts_volume', String(this.volume));
  }

  getVolume(): number {
    return this.volume;
  }

  /**
   * Play a pleasant synthesized sound chime
   */
  playChime(type: 'success' | 'correction' | 'info') {
    if (this.isMuted) return;
    try {
      this.initAudioContext();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;

      if (type === 'success') {
        // High harmonic ascending chime (C5 -> G5)
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'correction') {
        // Soft double blip
        osc.frequency.setValueAtTime(329.63, now); // E4
        gain.gain.setValueAtTime(this.volume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Speak feedback using Web Speech API with debounce and deduplication
   */
  speak(text: string, force: boolean = false) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    // Prevent repeating identical feedback within 3.5 seconds
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < 3500) {
      return;
    }

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    try {
      window.speechSynthesis.cancel(); // Stop ongoing speech to avoid queue buildup
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.volume;
      utterance.rate = this.speechRate;
      utterance.pitch = 1.0;

      // Select gentle natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google')));
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  }
}

export const audioFeedback = new AudioFeedbackManager();
