import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="patient")  # "patient" or "physiotherapist"
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, foreign_keys="PatientProfile.user_id")
    patients_managed = relationship("PatientProfile", back_populates="clinician", foreign_keys="PatientProfile.clinician_id")
    sessions = relationship("WorkoutSession", back_populates="patient")
    assigned_plans = relationship("ExercisePlan", back_populates="patient", foreign_keys="ExercisePlan.patient_id")
    created_plans = relationship("ExercisePlan", back_populates="clinician", foreign_keys="ExercisePlan.clinician_id")
    appointments_as_patient = relationship("Appointment", back_populates="patient", foreign_keys="Appointment.patient_id")
    appointments_as_clinician = relationship("Appointment", back_populates="clinician", foreign_keys="Appointment.clinician_id")
    recommendations_given = relationship("ClinicianRecommendation", back_populates="clinician", foreign_keys="ClinicianRecommendation.clinician_id")
    recommendations_received = relationship("ClinicianRecommendation", back_populates="patient", foreign_keys="ClinicianRecommendation.patient_id")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    condition = Column(String(255), default="General Rehabilitation")
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    emergency_contact = Column(String(255), nullable=True)
    clinical_notes = Column(Text, nullable=True)
    rehab_stage = Column(String(100), default="Phase 1 - Mobility & Baseline")

    user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])
    clinician = relationship("User", back_populates="patients_managed", foreign_keys=[clinician_id])


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # "squat", "shoulder_abduction", "bicep_curl", "sit_to_stand"
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Rehabilitation")
    description = Column(Text, nullable=False)
    target_muscle_groups = Column(String(255), nullable=False)
    instructions = Column(JSON, nullable=False)  # list of step instructions
    safety_precautions = Column(JSON, nullable=False)  # list of warnings
    target_joint = Column(String(100), nullable=False)
    primary_angle_min = Column(Float, nullable=False)
    primary_angle_max = Column(Float, nullable=False)
    reference_rep_duration_sec = Column(Float, default=3.0)

    plan_items = relationship("ExercisePlanItem", back_populates="exercise")
    session_results = relationship("ExerciseSessionResult", back_populates="exercise")


class ExercisePlan(Base):
    __tablename__ = "exercise_plans"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="active")  # active, completed, paused
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    clinician = relationship("User", back_populates="created_plans", foreign_keys=[clinician_id])
    patient = relationship("User", back_populates="assigned_plans", foreign_keys=[patient_id])
    items = relationship("ExercisePlanItem", back_populates="plan", cascade="all, delete-orphan")
    sessions = relationship("WorkoutSession", back_populates="plan")


class ExercisePlanItem(Base):
    __tablename__ = "exercise_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("exercise_plans.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    target_reps = Column(Integer, default=10)
    target_sets = Column(Integer, default=3)
    frequency_per_week = Column(Integer, default=3)
    scheduled_days = Column(String(100), default="Mon,Wed,Fri")  # Comma separated
    notes = Column(Text, nullable=True)
    threshold_min = Column(Float, nullable=True)
    threshold_max = Column(Float, nullable=True)

    plan = relationship("ExercisePlan", back_populates="items")
    exercise = relationship("Exercise", back_populates="plan_items")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("exercise_plans.id"), nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    duration_seconds = Column(Integer, default=0)
    total_valid_reps = Column(Integer, default=0)
    total_invalid_attempts = Column(Integer, default=0)
    overall_accuracy_pct = Column(Float, default=0.0)
    status = Column(String(50), default="completed")  # completed, interrupted
    clinician_reviewed = Column(Boolean, default=False)
    clinician_review_notes = Column(Text, nullable=True)

    patient = relationship("User", back_populates="sessions", foreign_keys=[patient_id])
    plan = relationship("ExercisePlan", back_populates="sessions", foreign_keys=[plan_id])
    results = relationship("ExerciseSessionResult", back_populates="session", cascade="all, delete-orphan")


class ExerciseSessionResult(Base):
    __tablename__ = "exercise_session_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    valid_reps = Column(Integer, default=0)
    invalid_attempts = Column(Integer, default=0)
    accuracy_pct = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    peak_angle = Column(Float, nullable=True)
    form_breakdown = Column(JSON, default=dict)  # {"incomplete_depth": 2, "excessive_lean": 1}

    session = relationship("WorkoutSession", back_populates="results")
    exercise = relationship("Exercise", back_populates="session_results")
    feedback_events = relationship("FeedbackEvent", back_populates="session_result", cascade="all, delete-orphan")


class FeedbackEvent(Base):
    __tablename__ = "feedback_events"

    id = Column(Integer, primary_key=True, index=True)
    session_result_id = Column(Integer, ForeignKey("exercise_session_results.id"), nullable=False)
    timestamp_offset_sec = Column(Float, default=0.0)
    rep_number = Column(Integer, nullable=True)
    feedback_text = Column(String(255), nullable=False)
    feedback_type = Column(String(50), default="correction")  # correction, warning, praise

    session_result = relationship("ExerciseSessionResult", back_populates="feedback_events")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=30)
    status = Column(String(50), default="scheduled")  # scheduled, completed, cancelled, rescheduled
    meeting_link = Column(String(255), nullable=True)
    reason = Column(String(255), default="Rehabilitation Check-in")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("User", back_populates="appointments_as_patient", foreign_keys=[patient_id])
    clinician = relationship("User", back_populates="appointments_as_clinician", foreign_keys=[clinician_id])


class ClinicianRecommendation(Base):
    __tablename__ = "clinician_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    recommendation_text = Column(Text, nullable=False)
    category = Column(String(50), default="form_adjustment")  # recovery, form_adjustment, frequency, caution

    patient = relationship("User", back_populates="recommendations_received", foreign_keys=[patient_id])
    clinician = relationship("User", back_populates="recommendations_given", foreign_keys=[clinician_id])
