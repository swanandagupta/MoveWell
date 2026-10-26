import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, User, LogOut, Calendar, Award, UserCheck, Shield, ChevronRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-white shadow-sm group-hover:bg-forest-900 transition-colors">
              <Activity className="w-6 h-6 text-mint-300" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-charcoal-900">Move<span className="text-forest-700">Well</span></span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-forest-100 text-forest-800 px-1.5 py-0.5 rounded">AI Rehab</span>
              </div>
              <p className="text-[11px] text-charcoal-500 font-medium">Computer Vision Movement Care</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {user?.role === 'patient' ? (
                  <>
                    <Link to="/patient/dashboard" className="text-sm font-medium text-charcoal-700 hover:text-forest-800 transition-colors">
                      My Schedule
                    </Link>
                    <Link to="/workout/live" className="text-sm font-semibold text-forest-700 hover:text-forest-900 flex items-center space-x-1 bg-forest-50 px-3 py-1.5 rounded-lg border border-forest-200">
                      <Activity className="w-4 h-4 text-forest-600 animate-pulse" />
                      <span>Start Workout</span>
                    </Link>
                    <Link to="/patient/progress" className="text-sm font-medium text-charcoal-700 hover:text-forest-800 transition-colors">
                      Progress Analytics
                    </Link>
                    <Link to="/appointments" className="text-sm font-medium text-charcoal-700 hover:text-forest-800 transition-colors">
                      Appointments
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/clinician/dashboard" className="text-sm font-medium text-charcoal-700 hover:text-forest-800 transition-colors">
                      Patient Roster
                    </Link>
                    <Link to="/clinician/create-plan" className="text-sm font-semibold text-forest-700 hover:text-forest-900 bg-forest-50 px-3 py-1.5 rounded-lg border border-forest-200">
                      + Assign Plan
                    </Link>
                    <Link to="/appointments" className="text-sm font-medium text-charcoal-700 hover:text-forest-800 transition-colors">
                      Consultations
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/" className="text-sm font-medium text-charcoal-700 hover:text-forest-800">
                  Overview
                </Link>
                <a href="#clinical-methodology" className="text-sm font-medium text-charcoal-700 hover:text-forest-800">
                  Methodology
                </a>
                <a href="#exercises" className="text-sm font-medium text-charcoal-700 hover:text-forest-800">
                  Supported Exercises
                </a>
              </>
            )}
          </nav>

          {/* Right Action / Profile */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-2 pl-2 pr-3 py-1 rounded-full bg-cream-100 hover:bg-cream-200 border border-cream-300 transition-colors">
                  <img
                    src={user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"}
                    alt={user.full_name}
                    className="w-7 h-7 rounded-full object-cover border border-forest-300"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-charcoal-900 leading-tight">{user.full_name}</p>
                    <span className="text-[10px] text-forest-700 font-medium capitalize">
                      {user.role === 'physiotherapist' ? 'Clinician' : 'Patient'}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-charcoal-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-charcoal-700 hover:text-forest-800 px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-forest-800 hover:bg-forest-900 px-4 py-2 rounded-lg shadow-sm transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
