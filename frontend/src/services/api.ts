import {
  User, Exercise, ExercisePlan, WorkoutSession,
  Appointment, Recommendation, WeeklyReport, PatientDetail
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('movewell_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(data: any): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async demoLogin(role: 'patient' | 'physiotherapist'): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/demo-login?role=${role}`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Exercises
  async getExercises(): Promise<Exercise[]> {
    const res = await fetch(`${API_BASE_URL}/exercises`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getExercise(code: string): Promise<Exercise> {
    const res = await fetch(`${API_BASE_URL}/exercises/${code}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Plans
  async getAssignedPlans(): Promise<ExercisePlan[]> {
    const res = await fetch(`${API_BASE_URL}/plans/assigned`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getPlanById(id: number): Promise<ExercisePlan> {
    const res = await fetch(`${API_BASE_URL}/plans/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createPlan(data: any): Promise<ExercisePlan> {
    const res = await fetch(`${API_BASE_URL}/plans`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Sessions
  async saveSession(data: any): Promise<WorkoutSession> {
    const res = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getUserSessions(): Promise<WorkoutSession[]> {
    const res = await fetch(`${API_BASE_URL}/sessions`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getPatientSessions(patientId: number): Promise<WorkoutSession[]> {
    const res = await fetch(`${API_BASE_URL}/sessions/patient/${patientId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async reviewSession(sessionId: number, notes: string): Promise<WorkoutSession> {
    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ clinician_review_notes: notes })
    });
    return handleResponse(res);
  },

  // Clinician Management
  async getClinicianPatients(): Promise<PatientDetail[]> {
    const res = await fetch(`${API_BASE_URL}/clinicians/patients`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getWeeklyReport(patientId: number): Promise<WeeklyReport> {
    const res = await fetch(`${API_BASE_URL}/clinicians/patients/${patientId}/weekly-report`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async addRecommendation(patientId: number, text: string, category: string): Promise<Recommendation> {
    const res = await fetch(`${API_BASE_URL}/clinicians/recommendations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        patient_id: patientId,
        recommendation_text: text,
        category
      })
    });
    return handleResponse(res);
  },

  async getPatientRecommendations(patientId: number): Promise<Recommendation[]> {
    const res = await fetch(`${API_BASE_URL}/clinicians/recommendations/patient/${patientId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    const res = await fetch(`${API_BASE_URL}/appointments`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createAppointment(data: any): Promise<Appointment> {
    const res = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAppointment(id: number, data: any): Promise<Appointment> {
    const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};
