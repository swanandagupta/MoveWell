import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PatientDetail } from '../types';
import { StatCard } from '../components/StatCard';
import {
  Users, Stethoscope, Activity, PlusCircle, ChevronRight,
  Award, Calendar, CheckCircle2, AlertCircle, FileText, ExternalLink
} from 'lucide-react';

export const ClinicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await api.getClinicianPatients();
        setPatients(data);
      } catch (err) {
        console.error("Failed to load clinician patients", err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  const totalPatients = patients.length;
  const avgCohortAdherence = patients.length > 0
    ? Math.round(patients.reduce((acc, p) => acc + p.adherence_rate_pct, 0) / patients.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Clinician Header Banner */}
      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
              Physiotherapist Clinical Portal
            </span>
            <span className="text-xs text-charcoal-400">Doctor Portal Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-2">
            {user?.full_name || 'Dr. Elena Vance, DPT'}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Department of Orthopedic & Physical Rehabilitation • Remote Monitoring
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/clinician/create-plan"
            className="px-5 py-3 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-2xl shadow-md transition-all flex items-center space-x-2 text-xs sm:text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create & Assign Plan</span>
          </Link>
          <Link
            to="/appointments"
            className="px-4 py-3 bg-cream-100 hover:bg-cream-200 text-charcoal-700 font-semibold rounded-2xl border border-cream-300 transition-all text-xs sm:text-sm"
          >
            Consultations
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Patients"
          value={totalPatients}
          subtitle="Assigned under supervision"
          icon={Users}
          colorScheme="green"
        />
        <StatCard
          title="Cohort Adherence"
          value={`${avgCohortAdherence}%`}
          subtitle="Prescribed vs completed sets"
          icon={Activity}
          trend="+5.1% this week"
          colorScheme="mint"
        />
        <StatCard
          title="Total Supervised Sessions"
          value={patients.reduce((acc, p) => acc + p.completed_sessions_count, 0)}
          subtitle="Kinematically tracked"
          icon={CheckCircle2}
          colorScheme="blue"
        />
        <StatCard
          title="Weekly Reports Ready"
          value={patients.length}
          subtitle="Automated AI generation"
          icon={FileText}
          colorScheme="amber"
        />
      </div>

      {/* Patient Management Table */}
      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900">Registered Patient Roster</h2>
            <p className="text-xs text-charcoal-500">Monitor recovery stages, exercise quality, and adherence metrics</p>
          </div>
          <span className="text-xs font-semibold text-charcoal-500">
            Showing {patients.length} active patients
          </span>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-cream-300 text-charcoal-500 uppercase tracking-wider text-[11px]">
                <th className="pb-3 font-semibold">Patient</th>
                <th className="pb-3 font-semibold">Condition / Diagnosis</th>
                <th className="pb-3 font-semibold">Stage</th>
                <th className="pb-3 font-semibold">Adherence</th>
                <th className="pb-3 font-semibold">Latest Accuracy</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-cream-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={p.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"}
                        alt={p.full_name}
                        className="w-9 h-9 rounded-full object-cover border border-forest-300"
                      />
                      <div>
                        <p className="font-bold text-charcoal-900">{p.full_name}</p>
                        <p className="text-xs text-charcoal-400">{p.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4">
                    <p className="font-medium text-charcoal-800">{p.patient_profile?.condition || 'General Rehab'}</p>
                    <p className="text-xs text-charcoal-500">Age: {p.patient_profile?.age || 30} • {p.patient_profile?.gender || 'N/A'}</p>
                  </td>

                  <td className="py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-forest-50 text-forest-800 border border-forest-200">
                      {p.patient_profile?.rehab_stage || 'Phase 1'}
                    </span>
                  </td>

                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-cream-200 rounded-full h-2">
                        <div
                          className="bg-forest-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, p.adherence_rate_pct)}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-charcoal-800">{p.adherence_rate_pct}%</span>
                    </div>
                  </td>

                  <td className="py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-mint-100 text-mint-900">
                      {p.latest_accuracy_pct}%
                    </span>
                  </td>

                  <td className="py-4 text-right">
                    <Link
                      to={`/clinician/patient/${p.id}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs transition-colors"
                    >
                      <span>Review Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
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
