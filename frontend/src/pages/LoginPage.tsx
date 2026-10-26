import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Stethoscope, User, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: 'patient' | 'physiotherapist') => {
    setError(null);
    setIsSubmitting(true);
    try {
      await demoLogin(role);
      if (role === 'physiotherapist') {
        navigate('/clinician/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-cream-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-cream-300 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white flex items-center justify-center mx-auto shadow-sm">
            <Activity className="w-7 h-7 text-mint-300" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-charcoal-900 tracking-tight">
            Sign In to MoveWell
          </h2>
          <p className="mt-1 text-xs text-charcoal-500">
            AI-Assisted Physical Rehabilitation Management
          </p>
        </div>

        {/* Quick Demo Access Buttons */}
        <div className="p-4 bg-forest-50 border border-forest-200 rounded-2xl space-y-2">
          <p className="text-[11px] font-bold text-forest-900 uppercase tracking-wider text-center">
            🚀 Quick Demonstration Accounts
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoLogin('patient')}
              disabled={isSubmitting}
              className="py-2.5 px-3 bg-white hover:bg-forest-100 text-forest-900 border border-forest-300 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5 text-forest-700" />
              <span>Demo Patient</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('physiotherapist')}
              disabled={isSubmitting}
              className="py-2.5 px-3 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-mint-300" />
              <span>Demo Clinician</span>
            </button>
          </div>
          <p className="text-[10px] text-forest-700 text-center italic">
            Single-click pre-seeded clinical data for evaluation
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.patient@movewell.health"
                className="w-full pl-9 pr-3 py-2 text-sm border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-charcoal-900 hover:bg-charcoal-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-charcoal-500 pt-2">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-forest-700 hover:underline">
            Register as Patient or Clinician
          </Link>
        </div>
      </div>
    </div>
  );
};
