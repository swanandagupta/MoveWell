import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { audioFeedback } from '../cv/audioFeedback';
import {
  User, Volume2, Bell, Shield, HeartPulse, Sliders, CheckCircle2
} from 'lucide-react';

export const ProfileSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [muted, setMuted] = useState(audioFeedback.getMuted());
  const [volume, setVolume] = useState(audioFeedback.getVolume());
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioFeedback.setVolume(val);
  };

  const handleMuteToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setMuted(next);
    audioFeedback.setMuted(next);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <span className="text-xs uppercase font-bold text-forest-700 bg-forest-100 px-3 py-1 rounded-full">
          Account & Preferences
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-2">
          Profile & System Settings
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
          Manage your patient identity, voice audio guidance, and clinical preferences.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-cream-200">
          <img
            src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"}
            alt={user?.full_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-forest-400"
          />
          <div>
            <h2 className="text-xl font-bold text-charcoal-900">{user?.full_name}</h2>
            <p className="text-xs text-charcoal-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
              Role: {user?.role}
            </span>
          </div>
        </div>

        {savedMsg && (
          <div className="p-3 bg-forest-50 border border-forest-200 rounded-xl text-xs text-forest-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-forest-600" />
            <span>Preferences saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-6">
          {/* Audio Guidance Settings */}
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-forest-700" />
              <span>Voice Feedback & Audio Controls</span>
            </h3>

            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-4 text-xs">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={muted}
                  onChange={handleMuteToggle}
                  className="rounded text-forest-700 accent-forest-700 w-4 h-4"
                />
                <span className="font-semibold text-charcoal-800">Mute all voice announcements during workouts</span>
              </label>

              <div>
                <div className="flex justify-between font-semibold text-charcoal-700 mb-1">
                  <span>Voice Guidance Volume</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  disabled={muted}
                  className="w-full accent-forest-700"
                />
              </div>

              <button
                type="button"
                onClick={() => audioFeedback.speak("MoveWell voice guidance test. Posture verified.", true)}
                className="px-3 py-1.5 rounded-lg bg-forest-100 hover:bg-forest-200 text-forest-900 font-bold"
              >
                Test Voice Synthesis
              </button>
            </div>
          </div>

          {/* Clinical Prototype Notes */}
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-forest-700" />
              <span>System & Clinical Architecture</span>
            </h3>

            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-charcoal-600 space-y-1.5">
              <p>• <strong>Computer Vision Engine:</strong> MediaPipe 33-Landmark Pose Extraction @ 60 FPS</p>
              <p>• <strong>Assessment Strategy:</strong> Biomechanical Kinematic Finite State Machines</p>
              <p>• <strong>Storage & API:</strong> FastAPI + SQLAlchemy + SQLite/PostgreSQL persistent schema</p>
              <p>• <strong>Privacy Protection:</strong> 100% Client-side inference; raw camera frames are never stored</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
