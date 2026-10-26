import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ExercisePlan } from '../types';
import {
  Activity, ArrowLeft, ShieldAlert, CheckCircle2, Play,
  Target, Info, Stethoscope
} from 'lucide-react';

export const ExercisePlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        if (id) {
          const data = await api.getPlanById(Number(id));
          setPlan(data);
        } else {
          const plans = await api.getAssignedPlans();
          if (plans.length > 0) setPlan(plans[0]);
        }
      } catch (err) {
        console.error("Failed to load plan", err);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-charcoal-500">Loading exercise plan details...</div>;
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
        <p className="text-charcoal-600">Exercise plan not found.</p>
        <Link to="/patient/dashboard" className="text-forest-700 font-semibold underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/patient/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-charcoal-600 hover:text-forest-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Plan Header */}
      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
              Active Rehabilitation Prescription
            </span>
            <span className="text-xs text-charcoal-400">Created {new Date(plan.created_at).toLocaleDateString()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-2">{plan.title}</h1>
          <p className="text-sm text-charcoal-600 mt-1 max-w-2xl">{plan.description}</p>
        </div>

        <Link
          to="/workout/live"
          className="px-6 py-3.5 bg-forest-800 hover:bg-forest-900 text-white font-semibold rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm flex-shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Workout Studio</span>
        </Link>
      </div>

      {/* Exercise Items List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-charcoal-900">Assigned Movements Breakdown</h2>

        <div className="space-y-6">
          {plan.items.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-cream-200">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-forest-100 text-forest-800 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-xl font-bold text-charcoal-900">
                      {item.exercise?.name || `Exercise #${item.exercise_id}`}
                    </h3>
                  </div>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Target Muscles: <span className="text-charcoal-700 font-medium">{item.exercise?.target_muscle_groups}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3 bg-cream-50 px-4 py-2 rounded-2xl border border-cream-200">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Prescription</span>
                    <span className="text-sm font-extrabold text-forest-800">
                      {item.target_sets} Sets × {item.target_reps} Reps
                    </span>
                  </div>
                  <div className="h-6 w-px bg-cream-300" />
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Frequency</span>
                    <span className="text-sm font-semibold text-charcoal-700">
                      {item.scheduled_days}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kinematic Angle & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-charcoal-800 mb-2">
                    <Target className="w-4 h-4 text-forest-700" />
                    <span>Kinematic Target Joint & Range</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-forest-50 border border-forest-100 text-xs text-charcoal-700 space-y-1">
                    <p>• <strong>Primary Joint:</strong> {item.exercise?.target_joint}</p>
                    <p>• <strong>Target Inflection Angle:</strong> {item.exercise?.primary_angle_min}° to {item.exercise?.primary_angle_max}°</p>
                    <p>• <strong>Reference Tempo:</strong> ~{item.exercise?.reference_rep_duration_sec}s per complete repetition</p>
                  </div>

                  {item.notes && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
                      <span className="font-bold text-forest-900 block mb-0.5">Clinician Note:</span>
                      <p className="text-charcoal-600">{item.notes}</p>
                    </div>
                  )}
                </div>

                {/* Safety Precautions */}
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Safety Precautions & Error Prevention</span>
                  </div>
                  <ul className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5 list-disc list-inside">
                    {item.exercise?.safety_precautions?.map((caution, cIdx) => (
                      <li key={cIdx} className="leading-relaxed">{caution}</li>
                    )) || <li>Perform smoothly in a clear space.</li>}
                  </ul>
                </div>
              </div>

              {/* Step by step instructions */}
              <div className="mt-6 pt-5 border-t border-cream-200">
                <h4 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-2">
                  Execution Instructions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-charcoal-600">
                  {item.exercise?.instructions?.map((inst, iIdx) => (
                    <div key={iIdx} className="flex items-start space-x-2">
                      <span className="w-4 h-4 rounded-full bg-cream-200 text-charcoal-700 flex-shrink-0 flex items-center justify-center font-bold text-[10px]">
                        {iIdx + 1}
                      </span>
                      <span>{inst}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
