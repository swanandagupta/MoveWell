import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Appointment } from '../types';
import {
  Calendar, Clock, Video, Plus, CheckCircle2, XCircle,
  AlertCircle, ChevronRight, Stethoscope
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState('Rehabilitation Kinematics Check-in');
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const data = await api.getAppointments();
        setAppointments(data);
      } catch (err) {
        console.error("Failed to load appointments", err);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const scheduledIso = datetime ? new Date(datetime).toISOString() : new Date(Date.now() + 86400000 * 2).toISOString();
      const created = await api.createAppointment({
        patient_id: user?.id || 2,
        scheduled_time: scheduledIso,
        duration_minutes: 30,
        reason,
        notes,
        meeting_link: 'https://meet.jit.si/movewell-rehab-consultation'
      });
      setAppointments([...appointments, created]);
      setIsModalOpen(false);
      setReason('');
      setNotes('');
    } catch (err) {
      console.error("Failed to create appointment", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'completed' | 'cancelled') => {
    try {
      const updated = await api.updateAppointment(id, { status });
      setAppointments(appointments.map(a => a.id === id ? updated : a));
    } catch (err) {
      console.error("Failed to update appointment", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-forest-700 bg-forest-100 px-3 py-1 rounded-full">
            Telehealth Rehabilitation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-2">
            Physiotherapy Consultations
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Schedule virtual reviews and kinematic posture adjustments with your doctor.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Consultation</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appointments.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  app.status === 'scheduled'
                    ? 'bg-forest-100 text-forest-800'
                    : app.status === 'completed'
                    ? 'bg-cream-200 text-charcoal-700'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {app.status}
                </span>
                <span className="text-xs text-charcoal-500 font-medium">30 Mins</span>
              </div>

              <h3 className="text-lg font-bold text-charcoal-900 mt-3">{app.reason}</h3>
              {app.notes && <p className="text-xs text-charcoal-500 mt-1">{app.notes}</p>}

              <div className="mt-4 pt-4 border-t border-cream-200 space-y-2 text-xs text-charcoal-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-forest-700" />
                  <span className="font-semibold text-charcoal-900">
                    {new Date(app.scheduled_time).toLocaleString(undefined, {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Stethoscope className="w-4 h-4 text-forest-700" />
                  <span>Dr. Elena Vance, DPT (Senior Physiotherapist)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-cream-200 flex items-center justify-between">
              {app.meeting_link && app.status === 'scheduled' ? (
                <a
                  href={app.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Video Call</span>
                </a>
              ) : (
                <div />
              )}

              {user?.role === 'physiotherapist' && app.status === 'scheduled' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'completed')}
                    className="p-2 text-forest-700 hover:bg-forest-50 rounded-lg text-xs font-semibold"
                    title="Mark Completed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold"
                    title="Cancel"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {appointments.length === 0 && !loading && (
        <div className="p-12 text-center text-charcoal-500 bg-white rounded-3xl border border-cream-300">
          No appointments scheduled yet. Click Schedule Consultation above to book.
        </div>
      )}

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-cream-300 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="text-lg font-bold text-charcoal-900">Schedule Telehealth Check-in</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Reason for Consultation</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Post-op Knee ROM Check"
                  className="w-full p-2.5 border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className="w-full p-2.5 border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Clinical Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mention any pain, stiffness, or specific exercises to review."
                  className="w-full p-2.5 border border-cream-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cream-100 text-charcoal-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-forest-800 text-white font-bold hover:bg-forest-900 transition-colors"
                >
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
