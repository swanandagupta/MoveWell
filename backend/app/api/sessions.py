from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import WorkoutSession, ExerciseSessionResult, FeedbackEvent, User
from app.schemas.schemas import WorkoutSessionCreate, WorkoutSessionOut, WorkoutSessionReview
from app.api.deps import get_current_user, require_clinician, require_patient

router = APIRouter(prefix="/sessions", tags=["Workout Sessions"])

@router.post("", response_model=WorkoutSessionOut)
def record_workout_session(
    session_in: WorkoutSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Patient records their own session
    session = WorkoutSession(
        patient_id=current_user.id,
        plan_id=session_in.plan_id,
        started_at=session_in.started_at,
        completed_at=session_in.completed_at,
        duration_seconds=session_in.duration_seconds,
        total_valid_reps=session_in.total_valid_reps,
        total_invalid_attempts=session_in.total_invalid_attempts,
        overall_accuracy_pct=session_in.overall_accuracy_pct,
        status=session_in.status
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Add exercise results
    for res in session_in.results:
        ex_result = ExerciseSessionResult(
            session_id=session.id,
            exercise_id=res.exercise_id,
            valid_reps=res.valid_reps,
            invalid_attempts=res.invalid_attempts,
            accuracy_pct=res.accuracy_pct,
            duration_seconds=res.duration_seconds,
            peak_angle=res.peak_angle,
            form_breakdown=res.form_breakdown
        )
        db.add(ex_result)
        db.commit()
        db.refresh(ex_result)

        # Add feedback events
        for fb in res.feedback_events:
            event = FeedbackEvent(
                session_result_id=ex_result.id,
                timestamp_offset_sec=fb.timestamp_offset_sec,
                rep_number=fb.rep_number,
                feedback_text=fb.feedback_text,
                feedback_type=fb.feedback_type
            )
            db.add(event)

    db.commit()
    db.refresh(session)
    return session

@router.get("", response_model=List[WorkoutSessionOut])
def get_user_sessions(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.patient_id == current_user.id
    ).order_by(WorkoutSession.completed_at.desc()).limit(limit).all()
    return sessions

@router.get("/patient/{patient_id}", response_model=List[WorkoutSessionOut])
def get_patient_sessions(
    patient_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    clinician: User = Depends(require_clinician)
):
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.patient_id == patient_id
    ).order_by(WorkoutSession.completed_at.desc()).limit(limit).all()
    return sessions

@router.get("/{session_id}", response_model=WorkoutSessionOut)
def get_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user.role == "patient" and session.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return session

@router.post("/{session_id}/review", response_model=WorkoutSessionOut)
def review_session(
    session_id: int,
    review_in: WorkoutSessionReview,
    db: Session = Depends(get_db),
    clinician: User = Depends(require_clinician)
):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.clinician_reviewed = True
    session.clinician_review_notes = review_in.clinician_review_notes
    db.commit()
    db.refresh(session)
    return session
