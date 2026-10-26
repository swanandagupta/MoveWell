import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, User, Stethoscope, ArrowRight, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<'patient' | 'physiotherapist'>('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [condition, setCondition] = useState('Post-op ACL Recovery');
  const [age, setAge] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        condition: role === 'patient' ? condition : undefined,
        age: role === 'patient' ? Number(age) : undefined
      });
      navigate(role === 'physiotherapist' ? '/clinician/dashboard' : '/patient/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-cream-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-cream-300 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white flex items-center justify-center mx-auto shadow-sm">
            <Activity className="w-7 h-7 text-mint-300" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-charcoal-900 tracking-tight">
            Create MoveWell Account
          </h2>
          <p className="mt-1 text-xs text-charcoal-500">
            Select your clinical role to proceed
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-cream-100 p-1.5 rounded-2xl border border-cream-300">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              role === 'patient'
                ? 'bg-white text-forest-900 shadow-sm border border-forest-200'
                : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('physiotherapist')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              role === 'physiotherapist'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Physiotherapist</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === 'patient' ? "e.g. Jordan Lee" : "e.g. Dr. Marcus Reed, PT"}
              className="w-full px-3 py-2 text-sm border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@rehab-example.com"
              className="w-full px-3 py-2 text-sm border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-sm border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          {role === 'patient' && (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Condition / Goal</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  <option value="Post-op ACL Recovery">Post-op ACL Recovery</option>
                  <option value="Rotator Cuff Tendinitis">Rotator Cuff Tendinitis</option>
                  <option value="Knee Replacement Mobility">Knee Replacement Mobility</option>
                  <option value="General Kinetic Rehabilitation">General Kinetic Rehabilitation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Age</label>
                <input
                  type="number"
                  min={12}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Creating Profile...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-charcoal-500 pt-1">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-forest-700 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
