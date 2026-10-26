import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ExercisePlan, WorkoutSession, Recommendation, Appointment } from '../types';
import { StatCard } from '../components/StatCard';
import {
  Activity, Play, CheckCircle2, Calendar, Award, Flame,
  TrendingUp, Clock, AlertCircle, ChevronRight, Stethoscope, Video
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<ExercisePlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansData, sessData, appData] = await Promise.all([
          api.getAssignedPlans().catch(() => []),
          api.getUserSessions().catch(() => []),
          api.getAppointments().catch(() => [])
        ]);
        setPlans(plansData);
        setSessions(sessData);
        setAppointments(appData);

        if (user) {
          const recs = await api.getPatientRecommendations(user.id).catch(() => []);
          setRecommendations(recs);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const activePlan = plans.find(p => p.status === 'active') || plans[0];

  // Calculate metrics
  const totalValidReps = sessions.reduce((acc, s) => acc + s.total_valid_reps, 0);
  const avgAccuracy = sessions.length > 0
    ? Math.round((sessions.reduce((acc, s) => acc + s.overall_accuracy_pct, 0) / sessions.length) * 10) / 10
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-forest-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-700/60 border border-forest-600 text-mint-300 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>{user?.patient_profile?.condition || 'Rehabilitation Routine'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name || 'Patient'}
            </h1>
            <p className="text-forest-200 text-sm max-w-xl">
              Stage: <span className="text-white font-medium">{user?.patient_profile?.rehab_stage || 'Phase 1 - Mobility & Range of Motion'}</span>. Your prescribed movement routines are ready.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/workout/live"
              className="px-6 py-3.5 bg-mint-400 hover:bg-mint-300 text-forest-950 font-bold rounded-2xl shadow-md transition-all flex items-center space-x-2 text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Workout Studio</span>
            </Link>
            {activePlan && (
              <Link
                to={`/plan/${activePlan.id}`}
                className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 transition-all text-sm"
              >
                View Plan Guide
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Valid Reps Completed"
          value={totalValidReps}
          subtitle="Form-verified repetitions"
          icon={CheckCircle2}
          colorScheme="green"
        />
        <StatCard
          title="Overall Accuracy"
          value={`${avgAccuracy}%`}
          subtitle="Biomechanic pass rate"
          icon={Award}
          trend={avgAccuracy >= 85 ? "+4.2% improved" : "Active recovery"}
          colorScheme="mint"
        />
        <StatCard
          title="Sessions Completed"
          value={sessions.length}
          subtitle="Weekly target: 4 sessions"
          icon={Calendar}
          colorScheme="blue"
        />
        <StatCard
          title="Adherence Streak"
          value="4 Days"
          subtitle="Consistent rehabilitation"
          icon={Flame}
          colorScheme="amber"
        />
      </div>

      {/* Main Grid: Active Plan & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Assigned Plan Items */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">
                  {activePlan?.title || "Today's Prescribed Exercises"}
                </h2>
                <p className="text-xs text-charcoal-500">
                  Assigned by Dr. Elena Vance • Scheduled Days: Mon, Wed, Fri
                </p>
              </div>
              <Link
                to="/workout/live"
                className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center space-x-1"
              >
                <span>Launch Camera</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activePlan?.items && activePlan.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePlan.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-cream-300 bg-cream-50 hover:border-forest-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-100 px-2 py-0.5 rounded">
                          {item.exercise?.category || 'Rehab'}
                        </span>
                        <span className="text-xs font-semibold text-charcoal-600">
                          {item.target_sets} Sets × {item.target_reps} Reps
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-charcoal-900 mt-2">
                        {item.exercise?.name || `Exercise #${item.exercise_id}`}
                      </h3>
                      <p className="text-xs text-charcoal-500 mt-1 line-clamp-2">
                        {item.exercise?.description || item.notes || "Controlled posture and smooth inflection."}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between text-xs">
                      <span className="text-charcoal-500">Target Joint:</span>
                      <span className="font-semibold text-charcoal-800">{item.exercise?.target_joint || 'Joint Angle'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-charcoal-500 text-sm">
                No active exercises assigned yet. Contact your physiotherapist.
              </div>
            )}
          </div>

          {/* Recent Workout History Table */}
          <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-charcoal-900">Recent Rehabilitation Sessions</h2>
              <Link to="/patient/progress" className="text-xs font-semibold text-forest-700 hover:underline">
                View All Analytics
              </Link>
            </div>

            {sessions.length > 0 ? (
              <div className="divide-y divide-cream-200">
                {sessions.slice(0, 4).map((s) => (
                  <div key={s.id} className="py-3.5 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 font-bold">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-charcoal-900">
                          {new Date(s.completed_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-charcoal-500">Duration: {Math.round(s.duration_seconds / 60)} mins • {s.status}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <span className="font-bold text-forest-800">{s.total_valid_reps}</span>
                        <span className="text-charcoal-400 text-xs"> / {s.total_valid_reps + s.total_invalid_attempts} Reps</span>
                      </div>
                      <div className="hidden sm:block">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-mint-100 text-mint-800">
                          {s.overall_accuracy_pct}% Accuracy
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-charcoal-500 text-xs py-4">No sessions recorded yet. Launch your first workout above!</p>
            )}
          </div>
        </div>

        {/* Right Column: Clinician Recommendations & Appointments */}
        <div className="lg:col-span-4 space-y-6">
          {/* Clinician Advice Card */}
          <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm">
            <div className="flex items-center space-x-2 text-forest-800 font-bold text-sm mb-3">
              <Stethoscope className="w-4 h-4 text-forest-700" />
              <span>Clinician Recommendations</span>
            </div>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-2xl bg-forest-50 border border-forest-100 text-xs">
                    <span className="font-bold text-forest-900 uppercase tracking-wider text-[10px] block mb-1">
                      {rec.category.replace('_', ' ')}
                    </span>
                    <p className="text-charcoal-800 leading-relaxed">{rec.recommendation_text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-charcoal-600">
                "Maintain consistent knee tracking and pause at bottom of squats."
              </div>
            )}
          </div>

          {/* Upcoming Consultations */}
          <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">Upcoming Consultations</h3>
              <Link to="/appointments" className="text-[11px] font-semibold text-forest-700 hover:underline">
                Manage
              </Link>
            </div>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(0, 2).map((app) => (
                  <div key={app.id} className="p-3.5 rounded-2xl border border-cream-300 bg-cream-50 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-charcoal-900">{app.reason}</p>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-forest-100 text-forest-800">
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-charcoal-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(app.scheduled_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    {app.meeting_link && (
                      <a
                        href={app.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-forest-700 font-semibold hover:underline text-xs pt-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Telehealth Call</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-500">No scheduled appointments.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
