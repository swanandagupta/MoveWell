export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'patient' | 'physiotherapist' | 'doctor';
  phone?: string;
  avatar_url?: string;
  created_at: string;
  patient_profile?: PatientProfile;
}

export interface PatientProfile {
  id: number;
  user_id: number;
  condition: string;
  age?: number;
  gender?: string;
  emergency_contact?: string;
  clinical_notes?: string;
  rehab_stage: string;
  clinician_id?: number;
}

export interface Exercise {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string;
  target_muscle_groups: string;
  instructions: string[];
  safety_precautions: string[];
  target_joint: string;
  primary_angle_min: number;
  primary_angle_max: number;
  reference_rep_duration_sec: number;
}

export interface ExercisePlanItem {
  id: number;
  plan_id: number;
  exercise_id: number;
  target_reps: number;
  target_sets: number;
  frequency_per_week: number;
  scheduled_days: string;
  notes?: string;
  threshold_min?: number;
  threshold_max?: number;
  exercise?: Exercise;
}

export interface ExercisePlan {
  id: number;
  title: string;
  description?: string;
  clinician_id: number;
  patient_id: number;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
  items: ExercisePlanItem[];
}

export interface FeedbackEvent {
  id?: number;
  timestamp_offset_sec: number;
  rep_number?: number;
  feedback_text: string;
  feedback_type: 'correction' | 'warning' | 'praise' | 'info';
}

export interface ExerciseSessionResult {
  id?: number;
  session_id?: number;
  exercise_id: number;
  valid_reps: number;
  invalid_attempts: number;
  accuracy_pct: number;
  duration_seconds: number;
  peak_angle?: number;
  form_breakdown: Record<string, number>;
  exercise?: Exercise;
  feedback_events?: FeedbackEvent[];
}

export interface WorkoutSession {
  id: number;
  patient_id: number;
  plan_id?: number;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  total_valid_reps: number;
  total_invalid_attempts: number;
  overall_accuracy_pct: number;
  status: string;
  clinician_reviewed: boolean;
  clinician_review_notes?: string;
  results: ExerciseSessionResult[];
}

export interface Appointment {
  id: number;
  patient_id: number;
  clinician_id: number;
  scheduled_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  meeting_link?: string;
  reason: string;
  notes?: string;
  created_at: string;
  patient?: User;
  clinician?: User;
}

export interface Recommendation {
  id: number;
  patient_id: number;
  clinician_id: number;
  created_at: string;
  recommendation_text: string;
  category: 'recovery' | 'form_adjustment' | 'frequency' | 'caution';
}

export interface WeeklyReport {
  patient_id: number;
  patient_name: string;
  condition: string;
  week_start: string;
  week_end: string;
  total_sessions_completed: number;
  target_sessions: number;
  adherence_pct: number;
  total_valid_reps: number;
  total_invalid_attempts: number;
  average_accuracy_pct: number;
  exercise_summaries: { name: string; valid_reps: number; invalid_attempts: number }[];
  common_form_flaws: { issue: string; occurrences: number }[];
  clinician_summary: string;
  recommendation: string;
}

export interface PatientDetail extends User {
  patient_profile?: PatientProfile;
  active_plan?: ExercisePlan;
  completed_sessions_count: number;
  adherence_rate_pct: number;
  latest_accuracy_pct: number;
}
