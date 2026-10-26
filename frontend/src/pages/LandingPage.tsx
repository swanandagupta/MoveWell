import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ShieldCheck, CheckCircle2, ChevronRight, Stethoscope,
  TrendingUp, Users, Eye, Zap, Volume2, Award, HeartPulse
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-forest-100 border border-forest-200 text-forest-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-ping" />
                <span>MoveWell AI Rehabilitation Management System</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-charcoal-900 leading-[1.15]">
                Intelligent Physical Rehabilitation with <span className="text-forest-700 underline decoration-mint-400 decoration-wavy">Real-Time Computer Vision</span>
              </h1>

              <p className="text-lg text-charcoal-600 max-w-2xl leading-relaxed">
                MoveWell bridges the critical gap between clinic visits and home recovery. Using standard webcams, our computer vision pipeline tracks joint angles, verifies biomechanical form, counts only valid repetitions, and gives instant corrective voice guidance.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/workout/live"
                  className="px-6 py-3.5 bg-forest-800 hover:bg-forest-900 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <Activity className="w-5 h-5 text-mint-300" />
                  <span>Launch Live Camera Workout</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login"
                  className="px-6 py-3.5 bg-white hover:bg-cream-50 text-charcoal-800 font-semibold rounded-xl border border-cream-300 shadow-sm transition-all flex items-center space-x-2"
                >
                  <Stethoscope className="w-5 h-5 text-forest-700" />
                  <span>Physiotherapist Portal</span>
                </Link>
              </div>

              <div className="flex items-center space-x-6 pt-4 text-xs font-medium text-charcoal-500 border-t border-cream-300">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-forest-600" />
                  <span>Zero Hardware Wearables</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-forest-600" />
                  <span>Only Valid Reps Counted</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-forest-600" />
                  <span>Doctor Supervised</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-xl border border-cream-300">
                <div className="flex items-center justify-between pb-4 border-b border-cream-200">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-charcoal-700 ml-2">Live AI Assessment Feed</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                    60 FPS
                  </span>
                </div>

                <div className="mt-4 relative rounded-2xl overflow-hidden bg-charcoal-950 aspect-[4/3] flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=700&q=80"
                    alt="Rehabilitation pose tracking demo"
                    className="w-full h-full object-cover opacity-60"
                  />
                  {/* Visual Skeleton Overlay Elements */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                      <div className="bg-charcoal-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/20 text-white text-xs">
                        <span className="text-mint-400 font-semibold">Tracked Exercise:</span> Bodyweight Squat
                      </div>
                      <div className="bg-forest-600/90 text-white font-bold px-2.5 py-1 rounded-lg text-xs">
                        Knee Angle: 92° (Valid)
                      </div>
                    </div>

                    <div className="bg-charcoal-900/90 backdrop-blur border border-forest-500/50 p-3 rounded-xl text-white">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-mint-300 font-bold">Repetition Quality Status</span>
                        <span className="font-mono text-emerald-400">8 / 10 Reps</span>
                      </div>
                      <p className="text-xs text-charcoal-200">"Excellent depth! Keep chest upright and drive through heels."</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-forest-50 border border-forest-100">
                    <p className="text-[10px] uppercase font-bold text-charcoal-500">Valid Reps</p>
                    <p className="text-lg font-bold text-forest-800">8</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-[10px] uppercase font-bold text-charcoal-500">Invalid</p>
                    <p className="text-lg font-bold text-amber-700">1</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-mint-50 border border-mint-100">
                    <p className="text-[10px] uppercase font-bold text-charcoal-500">Accuracy</p>
                    <p className="text-lg font-bold text-mint-800">88.9%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Methodology Section */}
      <section id="clinical-methodology" className="py-16 bg-white border-y border-cream-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold tracking-wider text-forest-700 bg-forest-100 px-3 py-1 rounded-full">
              End-to-End Clinical Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 mt-3">
              How MoveWell Transforms Home Rehabilitation
            </h2>
            <p className="text-charcoal-600 mt-3 text-sm sm:text-base">
              Moving beyond naive repetition counting to medically structured posture assessment and remote clinician supervision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-300 hover:border-forest-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-charcoal-900">Clinician Prescribes Plan</h3>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Physiotherapist configures tailored exercises, sets, target reps, scheduled days, and specific joint flexion thresholds for the patient.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-300 hover:border-forest-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-charcoal-900">Webcam Pose Detection</h3>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                MediaPipe 33-landmark pose estimation runs smoothly at 60 FPS directly in the browser with zero video recording uploads.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-300 hover:border-forest-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-charcoal-900">FSM Quality Verification</h3>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Joint angle state machines verify starting posture, depth/elevation inflection, and full recovery before crediting valid repetitions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-300 hover:border-forest-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h3 className="text-base font-bold text-charcoal-900">Clinician Review & Reports</h3>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Completed metrics, adherence rates, and weekly progress reports sync back to the clinician dashboard for longitudinal care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Exercises Catalog */}
      <section id="exercises" className="py-16 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-charcoal-900">
              Supported Rehabilitation Exercises
            </h2>
            <p className="text-charcoal-600 text-sm mt-2">
              Every exercise features custom biomechanical threshold checks, common error detection, and safety warnings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Squat */}
            <div className="bg-white rounded-2xl p-5 border border-cream-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 rounded-xl overflow-hidden mb-4 bg-charcoal-100">
                <img
                  src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80"
                  alt="Bodyweight squat"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2 py-0.5 rounded">
                Lower Extremity
              </span>
              <h3 className="text-lg font-bold text-charcoal-900 mt-2">Bodyweight Squat</h3>
              <p className="text-xs text-charcoal-500 mt-1">Tracks Knee Flexion (Hip-Knee-Ankle) & Trunk Plumb Line Angle.</p>
              <div className="mt-3 text-xs text-charcoal-700 space-y-1">
                <p>• <strong>Target Depth:</strong> Knee angle ≤ 100°</p>
                <p>• <strong>Error Detection:</strong> Incomplete depth, torso forward lean</p>
              </div>
            </div>

            {/* Shoulder Abduction */}
            <div className="bg-white rounded-2xl p-5 border border-cream-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 rounded-xl overflow-hidden mb-4 bg-charcoal-100">
                <img
                  src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=400&q=80"
                  alt="Shoulder Abduction"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2 py-0.5 rounded">
                Upper Extremity
              </span>
              <h3 className="text-lg font-bold text-charcoal-900 mt-2">Shoulder Abduction</h3>
              <p className="text-xs text-charcoal-500 mt-1">Tracks Lateral Arm Elevation (Hip-Shoulder-Elbow).</p>
              <div className="mt-3 text-xs text-charcoal-700 space-y-1">
                <p>• <strong>Target Height:</strong> 80° - 95° horizontal</p>
                <p>• <strong>Error Detection:</strong> Insufficient raise, painful over-elevation</p>
              </div>
            </div>

            {/* Bicep Curl */}
            <div className="bg-white rounded-2xl p-5 border border-cream-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 rounded-xl overflow-hidden mb-4 bg-charcoal-100">
                <img
                  src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80"
                  alt="Bicep Curl"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2 py-0.5 rounded">
                Upper Extremity
              </span>
              <h3 className="text-lg font-bold text-charcoal-900 mt-2">Bicep Curl</h3>
              <p className="text-xs text-charcoal-500 mt-1">Tracks Elbow Flexion (Shoulder-Elbow-Wrist).</p>
              <div className="mt-3 text-xs text-charcoal-700 space-y-1">
                <p>• <strong>Peak Flexion:</strong> Elbow angle ≤ 55°</p>
                <p>• <strong>Error Detection:</strong> Incomplete curl, lacking full extension</p>
              </div>
            </div>

            {/* Sit-to-Stand */}
            <div className="bg-white rounded-2xl p-5 border border-cream-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 rounded-xl overflow-hidden mb-4 bg-charcoal-100">
                <img
                  src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80"
                  alt="Sit to stand"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2 py-0.5 rounded">
                Functional Mobility
              </span>
              <h3 className="text-lg font-bold text-charcoal-900 mt-2">Sit-to-Stand Test</h3>
              <p className="text-xs text-charcoal-500 mt-1">Tracks Knee and Hip Extension Chair Transitions.</p>
              <div className="mt-3 text-xs text-charcoal-700 space-y-1">
                <p>• <strong>Full Extension:</strong> Knee & Hip ≥ 165°</p>
                <p>• <strong>Error Detection:</strong> Incomplete stand, uncontrolled seating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* University & Clinical Disclaimer Banner */}
      <section className="py-12 bg-forest-900 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <HeartPulse className="w-10 h-10 text-mint-300 mx-auto" />
          <h3 className="text-2xl font-bold">University Computer Vision & Rehabilitation Project</h3>
          <p className="text-sm text-forest-100 max-w-2xl mx-auto leading-relaxed">
            MoveWell is designed as an intelligent exercise guidance and rehabilitation-support system. It empowers patients and clinicians with objective kinematic metrics while strictly preserving professional medical supervision.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-mint-400 hover:bg-mint-300 text-forest-950 font-bold rounded-xl transition-colors text-sm shadow-md"
            >
              Explore Live Prototype
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
