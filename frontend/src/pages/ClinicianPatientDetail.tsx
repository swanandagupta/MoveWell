import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { WorkoutSession, WeeklyReport, Recommendation, PatientDetail } from '../types';
import {
  ArrowLeft, FileText, CheckCircle2, AlertTriangle, Send,
  Stethoscope, Calendar, Clock, Award, Shield, User
} from 'lucide-react';

export const ClinicianPatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [newRecText, setNewRecText] = useState('');
  const [newRecCategory, setNewRecCategory] = useState<'form_adjustment' | 'recovery' | 'frequency' | 'caution'>('form_adjustment');
  const [submittingRec, setSubmittingRec] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pts, sess, recs] = await Promise.all([
          api.getClinicianPatients(),
          api.getPatientSessions(patientId),
          api.getPatientRecommendations(patientId)
        ]);
        const found = pts.find(p => p.id === patientId);
        if (found) setPatient(found);
        setSessions(sess);
        setRecommendations(recs);
      } catch (err) {
        console.error("Failed to load patient detail", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  const handleGenerateWeeklyReport = async () => {
    setLoadingReport(true);
    try {
      const rep = await api.getWeeklyReport(patientId);
      setWeeklyReport(rep);
    } catch (err) {
      console.error("Failed to generate weekly report", err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleAddRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecText.trim()) return;
    setSubmittingRec(true);
    try {
      const created = await api.addRecommendation(patientId, newRecText, newRecCategory);
      setRecommendations([created, ...recommendations]);
      setNewRecText('');
    } catch (err) {
      console.error("Failed to add recommendation", err);
    } finally {
      setSubmittingRec(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-charcoal-500">Loading patient details...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/clinician/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-charcoal-600 hover:text-forest-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Roster</span>
        </Link>
      </div>

      {/* Patient Profile Header Card */}
      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            src={patient?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"}
            alt={patient?.full_name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-forest-400"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-charcoal-900">{patient?.full_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
                {patient?.patient_profile?.rehab_stage || 'Phase 1'}
              </span>
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              Diagnosis: <strong className="text-charcoal-800">{patient?.patient_profile?.condition}</strong> • Age: {patient?.patient_profile?.age || 30} • {patient?.email}
            </p>
            {patient?.patient_profile?.clinical_notes && (
              <p className="text-xs text-charcoal-600 italic mt-1 max-w-xl">
                "{patient.patient_profile.clinical_notes}"
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleGenerateWeeklyReport}
          disabled={loadingReport}
          className="px-5 py-3 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md flex-shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>{loadingReport ? 'Compiling Report...' : 'Generate Weekly Report'}</span>
        </button>
      </div>

      {/* Weekly Report Modal / Card if Generated */}
      {weeklyReport && (
        <div className="bg-white rounded-3xl border-2 border-forest-600 p-6 sm:p-8 shadow-lg space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-forest-700" />
              <h3 className="text-lg font-bold text-charcoal-900">
                Weekly Clinical Progress Report — {weeklyReport.patient_name}
              </h3>
            </div>
            <span className="text-xs font-semibold text-charcoal-500">
              {new Date(weeklyReport.week_start).toLocaleDateString()} – {new Date(weeklyReport.week_end).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-2xl bg-forest-50 border border-forest-100">
              <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Adherence Rate</span>
              <span className="text-xl font-black text-forest-800">{weeklyReport.adherence_pct}%</span>
              <span className="text-[10px] text-charcoal-400">{weeklyReport.total_sessions_completed} / {weeklyReport.target_sessions} Sessions</span>
            </div>
            <div className="p-3 rounded-2xl bg-mint-50 border border-mint-100">
              <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Form Accuracy</span>
              <span className="text-xl font-black text-mint-800">{weeklyReport.average_accuracy_pct}%</span>
              <span className="text-[10px] text-charcoal-400">Kinematic pass rate</span>
            </div>
            <div className="p-3 rounded-2xl bg-cream-50 border border-cream-200">
              <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Valid Reps</span>
              <span className="text-xl font-black text-forest-800">{weeklyReport.total_valid_reps}</span>
              <span className="text-[10px] text-charcoal-400">{weeklyReport.total_invalid_attempts} uncounted flaws</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Common Flaw</span>
              <span className="text-sm font-bold text-amber-800 block mt-1">
                {weeklyReport.common_form_flaws[0]?.issue ? weeklyReport.common_form_flaws[0].issue.replace(/_/g, ' ') : 'None'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs space-y-2">
            <p><strong>Clinical Summary:</strong> {weeklyReport.clinician_summary}</p>
            <p><strong>Recommendation:</strong> {weeklyReport.recommendation}</p>
          </div>
        </div>
      )}

      {/* Grid: Sessions History & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Supervised Sessions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-charcoal-900 mb-4">
              Kinematic Session Records ({sessions.length})
            </h3>

            {sessions.length > 0 ? (
              <div className="divide-y divide-cream-200">
                {sessions.map((s) => (
                  <div key={s.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <span className="font-bold text-charcoal-900">
                          {new Date(s.completed_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <p className="text-xs text-charcoal-500">
                          Duration: {Math.round(s.duration_seconds / 60)} mins
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className="font-extrabold text-forest-800">{s.total_valid_reps}</span>
                          <span className="text-charcoal-400 text-xs"> / {s.total_valid_reps + s.total_invalid_attempts} Reps</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-mint-100 text-mint-800">
                          {s.overall_accuracy_pct}%
                        </span>
                      </div>
                    </div>

                    {s.clinician_review_notes && (
                      <p className="text-xs text-forest-900 bg-forest-50 p-2 rounded-xl border border-forest-100">
                        Doctor note: {s.clinician_review_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-500 py-4">No completed sessions found for this patient.</p>
            )}
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-charcoal-900">Prescribe Clinical Recommendation</h3>

            <form onSubmit={handleAddRecommendation} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">Category</label>
                <select
                  value={newRecCategory}
                  onChange={(e: any) => setNewRecCategory(e.target.value)}
                  className="w-full p-2 text-xs border border-cream-300 rounded-xl bg-white"
                >
                  <option value="form_adjustment">Form Adjustment</option>
                  <option value="recovery">Recovery Protocol</option>
                  <option value="frequency">Frequency / Sets</option>
                  <option value="caution">Safety Caution</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">Recommendation Text</label>
                <textarea
                  rows={3}
                  required
                  value={newRecText}
                  onChange={(e) => setNewRecText(e.target.value)}
                  placeholder="e.g. Ensure you pause 1 second at the bottom of the squat to stabilize patellar tendon."
                  className="w-full p-2.5 text-xs border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRec}
                className="w-full py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingRec ? 'Sending...' : 'Send to Patient'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-cream-200 space-y-2">
              <h4 className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider">Past Notes</h4>
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3 rounded-xl bg-cream-50 border border-cream-200 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-forest-800">
                    {rec.category.replace('_', ' ')}
                  </span>
                  <p className="text-charcoal-700">{rec.recommendation_text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
