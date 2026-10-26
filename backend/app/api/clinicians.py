import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import (
    User, PatientProfile, WorkoutSession, ExerciseSessionResult,
    ExercisePlan, Exercise, ClinicianRecommendation
)
from app.schemas.schemas import (
    PatientDetailOut, WeeklyReportOut, RecommendationCreate, RecommendationOut, UserOut
)
from app.api.deps import get_current_user, require_clinician

router = APIRouter(prefix="/clinicians", tags=["Clinicians"])

@router.get("/patients", response_model=List[PatientDetailOut])
def get_clinician_patients(
    db: Session = Depends(get_db),
    clinician: User = Depends(require_clinician)
):
    patients = db.query(User).filter(User.role == "patient").all()
    results = []
    for p in patients:
        sessions = db.query(WorkoutSession).filter(WorkoutSession.patient_id == p.id).all()
        completed_count = len(sessions)
        avg_acc = (sum(s.overall_accuracy_pct for s in sessions) / completed_count) if completed_count > 0 else 0.0
        latest_acc = sessions[-1].overall_accuracy_pct if completed_count > 0 else 0.0
        
        # Calculate adherence (e.g. sessions completed vs expected 3/week over last 2 weeks = 6)
        expected_sessions = 6
        adherence = min(100.0, round((completed_count / max(1, expected_sessions)) * 100.0, 1))

        active_plan = db.query(ExercisePlan).filter(
            ExercisePlan.patient_id == p.id,
            ExercisePlan.status == "active"
        ).first()

        results.append(PatientDetailOut(
            id=p.id,
            email=p.email,
            full_name=p.full_name,
            role=p.role,
            phone=p.phone,
            avatar_url=p.avatar_url,
            created_at=p.created_at,
            patient_profile=p.patient_profile,
            active_plan=active_plan,
            completed_sessions_count=completed_count,
            adherence_rate_pct=adherence,
            latest_accuracy_pct=round(latest_acc, 1)
        ))
    return results

@router.get("/patients/{patient_id}/weekly-report", response_model=WeeklyReportOut)
def generate_weekly_report(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(User).filter(User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    now = datetime.datetime.utcnow()
    week_start = now - datetime.timedelta(days=7)

    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.patient_id == patient_id,
        WorkoutSession.completed_at >= week_start
    ).all()

    total_valid = sum(s.total_valid_reps for s in sessions)
    total_invalid = sum(s.total_invalid_attempts for s in sessions)
    total_reps = total_valid + total_invalid
    avg_acc = (sum(s.overall_accuracy_pct for s in sessions) / len(sessions)) if sessions else 0.0

    # Aggregate exercise flaws
    flaws_dict = {}
    exercise_stats = {}
    for s in sessions:
        for r in s.results:
            ex_name = r.exercise.name if r.exercise else f"Exercise {r.exercise_id}"
            if ex_name not in exercise_stats:
                exercise_stats[ex_name] = {"valid": 0, "invalid": 0}
            exercise_stats[ex_name]["valid"] += r.valid_reps
            exercise_stats[ex_name]["invalid"] += r.invalid_attempts

            if r.form_breakdown:
                for issue, count in r.form_breakdown.items():
                    flaws_dict[issue] = flaws_dict.get(issue, 0) + count

    common_flaws = [{"issue": k, "occurrences": v} for k, v in flaws_dict.items()]
    common_flaws.sort(key=lambda x: x["occurrences"], reverse=True)

    exercise_summaries = [
        {"name": k, "valid_reps": v["valid"], "invalid_attempts": v["invalid"]}
        for k, v in exercise_stats.items()
    ]

    adherence = min(100.0, round((len(sessions) / 4.0) * 100.0, 1))

    clinician_notes = f"Patient completed {len(sessions)} sessions this week with {round(avg_acc, 1)}% form accuracy. Movement control has shown noticeable consistency."
    recommendation = "Continue prescribed mobility sets. Pay attention to knee alignment and torso posture during squat descent."

    return WeeklyReportOut(
        patient_id=patient.id,
        patient_name=patient.full_name,
        condition=patient.patient_profile.condition if patient.patient_profile else "Rehabilitation",
        week_start=week_start,
        week_end=now,
        total_sessions_completed=len(sessions),
        target_sessions=4,
        adherence_pct=adherence,
        total_valid_reps=total_valid,
        total_invalid_attempts=total_invalid,
        average_accuracy_pct=round(avg_acc, 1),
        exercise_summaries=exercise_summaries,
        common_form_flaws=common_flaws,
        clinician_summary=clinician_notes,
        recommendation=recommendation
    )

@router.post("/recommendations", response_model=RecommendationOut)
def create_recommendation(
    rec_in: RecommendationCreate,
    db: Session = Depends(get_db),
    clinician: User = Depends(require_clinician)
):
    rec = ClinicianRecommendation(
        patient_id=rec_in.patient_id,
        clinician_id=clinician.id,
        recommendation_text=rec_in.recommendation_text,
        category=rec_in.category
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

@router.get("/recommendations/patient/{patient_id}", response_model=List[RecommendationOut])
def get_patient_recommendations(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recs = db.query(ClinicianRecommendation).filter(
        ClinicianRecommendation.patient_id == patient_id
    ).order_by(ClinicianRecommendation.created_at.desc()).all()
    return recs
