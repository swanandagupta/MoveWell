import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { ExercisePlanDetail } from './pages/ExercisePlanDetail';
import { LiveWorkoutStudio } from './pages/LiveWorkoutStudio';
import { WorkoutSummary } from './pages/WorkoutSummary';
import { PatientProgress } from './pages/PatientProgress';
import { ClinicianDashboard } from './pages/ClinicianDashboard';
import { PlanCreationPage } from './pages/PlanCreationPage';
import { ClinicianPatientDetail } from './pages/ClinicianPatientDetail';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: string }> = ({
  children,
  allowedRole
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-forest-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-charcoal-500 font-semibold">Loading MoveWell...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole && !(allowedRole === 'physiotherapist' && user.role === 'doctor')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Live workout studio is accessible directly or via plan */}
          <Route path="/workout/live" element={<LiveWorkoutStudio />} />
          <Route path="/workout/summary" element={<WorkoutSummary />} />

          {/* Patient routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan/:id"
            element={
              <ProtectedRoute>
                <ExercisePlanDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/progress"
            element={
              <ProtectedRoute>
                <PatientProgress />
              </ProtectedRoute>
            }
          />

          {/* Clinician routes */}
          <Route
            path="/clinician/dashboard"
            element={
              <ProtectedRoute allowedRole="physiotherapist">
                <ClinicianDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinician/create-plan"
            element={
              <ProtectedRoute allowedRole="physiotherapist">
                <PlanCreationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinician/patient/:id"
            element={
              <ProtectedRoute allowedRole="physiotherapist">
                <ClinicianPatientDetail />
              </ProtectedRoute>
            }
          />

          {/* Shared / General authenticated routes */}
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="bg-white border-t border-cream-300 py-6 text-center text-xs text-charcoal-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 MoveWell — Intelligent Rehabilitation Management & Computer Vision Platform</p>
          <p className="text-[11px] text-charcoal-400">
            Biomechanical Exercise Guidance Prototype • Not a diagnostic medical device
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
