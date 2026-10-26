import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { PatientDetail, Exercise } from '../types';
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, Shield,
  Activity, Calendar, Target, AlertCircle
} from 'lucide-react';

export const PlanCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientDetail[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Array<{
    exercise_id: number;
    target_reps: number;
    target_sets: number;
    frequency_per_week: number;
    scheduled_days: string;
    notes: string;
  }>>([
    {
      exercise_id: 1,
      target_reps: 10,
      target_sets: 3,
      frequency_per_week: 3,
      scheduled_days: 'Mon,Wed,Fri',
      notes: 'Focus on symmetrical knee flexion and upright posture.'
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [pts, exs] = await Promise.all([
          api.getClinicianPatients(),
          api.getExercises()
        ]);
        setPatients(pts);
        setExercises(exs);
        if (pts.length > 0) setSelectedPatientId(pts[0].id);
      } catch (err) {
        console.error("Failed to load patients or exercises", err);
      }
    }
    loadInitial();
  }, []);

  const handleAddItem = () => {
    const nextExerciseId = exercises.length > 0 ? exercises[0].id : 1;
    setItems([
      ...items,
      {
        exercise_id: nextExerciseId,
        target_reps: 10,
        target_sets: 3,
        frequency_per_week: 3,
        scheduled_days: 'Mon,Wed,Fri',
        notes: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError("Please select a patient to assign this plan to.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await api.createPlan({
        patient_id: Number(selectedPatientId),
        title,
        description,
        status: 'active',
        items
      });
      navigate('/clinician/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create exercise plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          to="/clinician/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-charcoal-600 hover:text-forest-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clinician Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-sm">
        <div className="border-b border-cream-200 pb-4 mb-6">
          <span className="text-xs uppercase font-bold text-forest-700 bg-forest-100 px-3 py-1 rounded-full">
            Clinical Prescription Builder
          </span>
          <h1 className="text-2xl font-extrabold text-charcoal-900 mt-2">
            Create & Assign Rehabilitation Plan
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Specify customized joint angles, sets, repetitions, and scheduled days for patient home recovery.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">
              Select Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-sm border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none bg-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — {p.patient_profile?.condition || 'Rehab'} ({p.email})
                </option>
              ))}
            </select>
          </div>

          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Plan Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Phase 2 ACL Knee Flexion & Stability"
                className="w-full px-3 py-2 text-sm border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Clinical Objective / Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Symmetrical quad strengthening with 90° knee angle target"
                className="w-full px-3 py-2 text-sm border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Prescribed Movements */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                Prescribed Exercises & Thresholds
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs flex items-center space-x-1 transition-colors border border-forest-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Movement</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-cream-300 bg-cream-50 relative space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-cream-200">
                    <span className="text-xs font-bold text-charcoal-800">
                      Exercise #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-charcoal-700 mb-1">Exercise</label>
                      <select
                        value={item.exercise_id}
                        onChange={(e) => handleItemChange(idx, 'exercise_id', Number(e.target.value))}
                        className="w-full p-2 border border-cream-300 rounded-xl bg-white"
                      >
                        {exercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-charcoal-700 mb-1">Target Sets</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={item.target_sets}
                        onChange={(e) => handleItemChange(idx, 'target_sets', Number(e.target.value))}
                        className="w-full p-2 border border-cream-300 rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-charcoal-700 mb-1">Target Reps</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={item.target_reps}
                        onChange={(e) => handleItemChange(idx, 'target_reps', Number(e.target.value))}
                        className="w-full p-2 border border-cream-300 rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-charcoal-700 mb-1">Scheduled Days</label>
                      <input
                        type="text"
                        value={item.scheduled_days}
                        onChange={(e) => handleItemChange(idx, 'scheduled_days', e.target.value)}
                        placeholder="Mon,Wed,Fri"
                        className="w-full p-2 border border-cream-300 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Doctor Clinical Notes for Patient
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                      placeholder="e.g. Ensure full extension upright; do not rush eccentric return."
                      className="w-full p-2 text-xs border border-cream-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-cream-200 flex justify-end space-x-3">
            <Link
              to="/clinician/dashboard"
              className="px-5 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? 'Assigning Plan...' : 'Assign Plan to Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
