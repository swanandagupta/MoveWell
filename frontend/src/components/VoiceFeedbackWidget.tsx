import React, { useState } from 'react';
import { Volume2, VolumeX, Sliders } from 'lucide-react';
import { audioFeedback } from '../cv/audioFeedback';

export const VoiceFeedbackWidget: React.FC = () => {
  const [muted, setMuted] = useState(audioFeedback.getMuted());
  const [volume, setVolume] = useState(audioFeedback.getVolume());
  const [isOpen, setIsOpen] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioFeedback.setMuted(next);
    if (!next) {
      audioFeedback.speak("Voice guidance enabled", true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioFeedback.setVolume(val);
  };

  const testVoice = () => {
    audioFeedback.speak("Voice guidance is operational. Maintain upright posture.", true);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-1 bg-white/90 backdrop-blur border border-cream-300 rounded-xl p-1 shadow-sm">
        <button
          onClick={toggleMute}
          className={`p-2 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-semibold ${
            muted ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-forest-50 text-forest-800 hover:bg-forest-100'
          }`}
          title={muted ? 'Unmute voice feedback' : 'Mute voice feedback'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{muted ? 'Muted' : 'Voice Active'}</span>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-charcoal-500 hover:text-charcoal-800 hover:bg-cream-100 rounded-lg transition-colors"
          title="Voice feedback settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-cream-300 p-4 z-50 animate-in fade-in zoom-in-95">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-3">Audio Guidance Settings</h4>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-charcoal-600 font-medium mb-1">
                <span>Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                disabled={muted}
                className="w-full accent-forest-700 cursor-pointer"
              />
            </div>

            <button
              onClick={testVoice}
              disabled={muted}
              className="w-full py-2 bg-forest-50 hover:bg-forest-100 text-forest-800 font-semibold rounded-lg transition-colors disabled:opacity-40"
            >
              Test Guidance Speech
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
