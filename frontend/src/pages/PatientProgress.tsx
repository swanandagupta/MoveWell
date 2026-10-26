import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { WorkoutSession } from '../types';
import { StatCard } from '../components/StatCard';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Activity, Award, Calendar, CheckCircle2, TrendingUp, Clock, Filter } from 'lucide-react';

export const PatientProgress: React.FC = () => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await api.getUserSessions();
        setSessions(data);
      } catch (err) {
        console.error("Failed to load user sessions", err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  // Format data for Recharts
  const chartData = sessions.slice().reverse().map((s, idx) => ({
    name: new Date(s.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    accuracy: s.overall_accuracy_pct,
    validReps: s.total_valid_reps,
    invalidReps: s.total_invalid_attempts,
    duration: Math.round(s.duration_seconds / 60)
  }));

  const totalValid = sessions.reduce((acc, s) => acc + s.total_valid_reps, 0);
  const totalInvalid = sessions.reduce((acc, s) => acc + s.total_invalid_attempts, 0);
  const avgAccuracy = sessions.length > 0
    ? Math.round((sessions.reduce((acc, s) => acc + s.overall_accuracy_pct, 0) / sessions.length) * 10) / 10
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-bold text-forest-700 bg-forest-100 px-3 py-1 rounded-full">
          Rehabilitation Recovery Analytics
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-2">
          Biomechanical Progress & History
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
          Objective kinematic metrics recorded over time across all camera sessions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Valid Repetitions"
          value={totalValid}
          subtitle="Form-verified count"
          icon={CheckCircle2}
          colorScheme="green"
        />
        <StatCard
          title="Average Accuracy"
          value={`${avgAccuracy}%`}
          subtitle="All sessions combined"
          icon={Award}
          trend="+8.5% over 14 days"
          colorScheme="mint"
        />
        <StatCard
          title="Completed Sessions"
          value={sessions.length}
          subtitle="Weekly target: 4"
          icon={Calendar}
          colorScheme="blue"
        />
        <StatCard
          title="Average Duration"
          value={`${sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.duration_seconds, 0) / sessions.length / 60) : 0} mins`}
          subtitle="Per rehabilitation set"
          icon={Clock}
          colorScheme="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Accuracy Over Time */}
        <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-charcoal-900">Form Accuracy Trend</h3>
              <p className="text-xs text-charcoal-500">Percentage of repetitions satisfying clinical rules</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold">
              {avgAccuracy}% Average
            </span>
          </div>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="accGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#627391' }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#627391' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e6ece9', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#15803d" strokeWidth={3} fillOpacity={1} fill="url(#accGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-charcoal-400">
                No session data yet.
              </div>
            )}
          </div>
        </div>

        {/* Repetitions (Valid vs Invalid) Breakdown */}
        <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-charcoal-900">Valid vs. Invalid Repetitions</h3>
              <p className="text-xs text-charcoal-500">Volume and quality comparison per session</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#627391' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#627391' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e6ece9', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="validReps" name="Valid Reps" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="invalidReps" name="Invalid Attempts" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-charcoal-400">
                No session data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Sessions Table */}
      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-charcoal-900 mb-4">Complete Session Records</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-cream-300 text-charcoal-500 uppercase tracking-wider text-[11px]">
                <th className="pb-3 font-semibold">Date & Time</th>
                <th className="pb-3 font-semibold">Duration</th>
                <th className="pb-3 font-semibold">Valid Reps</th>
                <th className="pb-3 font-semibold">Invalid</th>
                <th className="pb-3 font-semibold">Accuracy</th>
                <th className="pb-3 font-semibold">Clinician Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-cream-50 transition-colors">
                  <td className="py-3.5 font-medium text-charcoal-900">
                    {new Date(s.completed_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="py-3.5 text-charcoal-600">{Math.round(s.duration_seconds / 60)} mins</td>
                  <td className="py-3.5 font-bold text-forest-800">{s.total_valid_reps}</td>
                  <td className="py-3.5 font-bold text-amber-700">{s.total_invalid_attempts}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-mint-100 text-mint-800">
                      {s.overall_accuracy_pct}%
                    </span>
                  </td>
                  <td className="py-3.5 text-xs text-charcoal-600">
                    {s.clinician_reviewed ? (
                      <span className="text-forest-700 font-medium">Reviewed by Dr. Vance</span>
                    ) : (
                      <span className="text-charcoal-400">Pending review</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
