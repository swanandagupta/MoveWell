from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "patient"  # "patient" or "physiotherapist"
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    # Extra fields for patients during registration
    condition: Optional[str] = "General Rehabilitation"
    age: Optional[int] = None
    gender: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime
    patient_profile: Optional["PatientProfileOut"] = None

    model_config = ConfigDict(from_attributes=True)

# Patient Profile Schemas
class PatientProfileBase(BaseModel):
    condition: Optional[str] = "General Rehabilitation"
    age: Optional[int] = None
    gender: Optional[str] = None
    emergency_contact: Optional[str] = None
    clinical_notes: Optional[str] = None
    rehab_stage: Optional[str] = "Phase 1 - Mobility & Baseline"
    clinician_id: Optional[int] = None

class PatientProfileCreate(PatientProfileBase):
    pass

class PatientProfileOut(PatientProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

class PatientDetailOut(UserOut):
    patient_profile: Optional[PatientProfileOut] = None
    active_plan: Optional[Any] = None
    completed_sessions_count: int = 0
    adherence_rate_pct: float = 0.0
    latest_accuracy_pct: float = 0.0

# Exercise Schemas
class ExerciseBase(BaseModel):
    code: str
    name: str
    category: str = "Rehabilitation"
    description: str
    target_muscle_groups: str
    instructions: List[str]
    safety_precautions: List[str]
    target_joint: str
    primary_angle_min: float
    primary_angle_max: float
    reference_rep_duration_sec: float = 3.0

class ExerciseOut(ExerciseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Exercise Plan Item Schemas
class ExercisePlanItemBase(BaseModel):
    exercise_id: int
    target_reps: int = 10
    target_sets: int = 3
    frequency_per_week: int = 3
    scheduled_days: str = "Mon,Wed,Fri"
    notes: Optional[str] = None
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None

class ExercisePlanItemCreate(ExercisePlanItemBase):
    pass

class ExercisePlanItemOut(ExercisePlanItemBase):
    id: int
    plan_id: int
    exercise: Optional[ExerciseOut] = None

    model_config = ConfigDict(from_attributes=True)

# Exercise Plan Schemas
class ExercisePlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    patient_id: int
    status: str = "active"

class ExercisePlanCreate(ExercisePlanBase):
    items: List[ExercisePlanItemCreate]

class ExercisePlanOut(ExercisePlanBase):
    id: int
    clinician_id: int
    created_at: datetime
    updated_at: datetime
    items: List[ExercisePlanItemOut] = []

    model_config = ConfigDict(from_attributes=True)

# Feedback & Session Results
class FeedbackEventCreate(BaseModel):
    timestamp_offset_sec: float = 0.0
    rep_number: Optional[int] = None
    feedback_text: str
    feedback_type: str = "correction"

class FeedbackEventOut(FeedbackEventCreate):
    id: int
    session_result_id: int

    model_config = ConfigDict(from_attributes=True)

class ExerciseSessionResultCreate(BaseModel):
    exercise_id: int
    valid_reps: int = 0
    invalid_attempts: int = 0
    accuracy_pct: float = 0.0
    duration_seconds: int = 0
    peak_angle: Optional[float] = None
    form_breakdown: Dict[str, int] = {}
    feedback_events: List[FeedbackEventCreate] = []

class ExerciseSessionResultOut(BaseModel):
    id: int
    session_id: int
    exercise_id: int
    valid_reps: int
    invalid_attempts: int
    accuracy_pct: float
    duration_seconds: int
    peak_angle: Optional[float] = None
    form_breakdown: Dict[str, Any] = {}
    exercise: Optional[ExerciseOut] = None
    feedback_events: List[FeedbackEventOut] = []

    model_config = ConfigDict(from_attributes=True)

# Workout Session Schemas
class WorkoutSessionCreate(BaseModel):
    plan_id: Optional[int] = None
    started_at: datetime
    completed_at: datetime
    duration_seconds: int
    total_valid_reps: int
    total_invalid_attempts: int
    overall_accuracy_pct: float
    status: str = "completed"
    results: List[ExerciseSessionResultCreate] = []

class WorkoutSessionReview(BaseModel):
    clinician_review_notes: str

class WorkoutSessionOut(BaseModel):
    id: int
    patient_id: int
    plan_id: Optional[int] = None
    started_at: datetime
    completed_at: datetime
    duration_seconds: int
    total_valid_reps: int
    total_invalid_attempts: int
    overall_accuracy_pct: float
    status: str
    clinician_reviewed: bool
    clinician_review_notes: Optional[str] = None
    results: List[ExerciseSessionResultOut] = []

    model_config = ConfigDict(from_attributes=True)

# Appointment Schemas
class AppointmentCreate(BaseModel):
    patient_id: int
    scheduled_time: datetime
    duration_minutes: int = 30
    reason: str = "Rehabilitation Check-in"
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    notes: Optional[str] = None
    meeting_link: Optional[str] = None

class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    clinician_id: int
    scheduled_time: datetime
    duration_minutes: int
    status: str
    meeting_link: Optional[str] = None
    reason: str
    notes: Optional[str] = None
    created_at: datetime
    patient: Optional[UserOut] = None
    clinician: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)

# Recommendation Schemas
class RecommendationCreate(BaseModel):
    patient_id: int
    recommendation_text: str
    category: str = "form_adjustment"

class RecommendationOut(BaseModel):
    id: int
    patient_id: int
    clinician_id: int
    created_at: datetime
    recommendation_text: str
    category: str

    model_config = ConfigDict(from_attributes=True)

# Weekly Report Schemas
class WeeklyReportOut(BaseModel):
    patient_id: int
    patient_name: str
    condition: str
    week_start: datetime
    week_end: datetime
    total_sessions_completed: int
    target_sessions: int
    adherence_pct: float
    total_valid_reps: int
    total_invalid_attempts: int
    average_accuracy_pct: float
    exercise_summaries: List[Dict[str, Any]]
    common_form_flaws: List[Dict[str, Any]]
    clinician_summary: str
    recommendation: str

# Rebuild Token forward ref
Token.model_rebuild()
