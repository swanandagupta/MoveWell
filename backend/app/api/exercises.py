from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Exercise
from app.schemas.schemas import ExerciseOut
from app.cv.exercises import get_exercise_evaluator
from app.cv.synthetic_harness import (
    generate_squat_rep, generate_shoulder_abduction_rep, generate_bicep_curl_rep
)

router = APIRouter(prefix="/exercises", tags=["Exercises"])

@router.get("", response_model=List[ExerciseOut])
def list_exercises(db: Session = Depends(get_db)):
    exercises = db.query(Exercise).all()
    return exercises

@router.get("/{code}", response_model=ExerciseOut)
def get_exercise_by_code(code: str, db: Session = Depends(get_db)):
    ex = db.query(Exercise).filter(Exercise.code == code).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ex

@router.post("/evaluate-synthetic/{code}")
def evaluate_synthetic(
    code: str,
    reps: int = Query(3, ge=1, le=10),
    simulate_errors: bool = Query(False)
):
    """
    Test harness endpoint to verify CV state machine transitions and metrics on synthetic landmark sequences.
    """
    evaluator = get_exercise_evaluator(code)

    if code == "squat":
        frames = []
        for i in range(reps):
            depth = 0.55 if (simulate_errors and i % 2 == 1) else 1.0
            frames.extend(generate_squat_rep(num_frames=25, depth_pct=depth, excessive_lean=(simulate_errors and i == 1)))
    elif code == "shoulder_abduction":
        frames = []
        for i in range(reps):
            angle = 60.0 if (simulate_errors and i % 2 == 1) else 90.0
            frames.extend(generate_shoulder_abduction_rep(num_frames=25, max_angle_deg=angle))
    elif code == "bicep_curl":
        frames = []
        for i in range(reps):
            flex = 95.0 if (simulate_errors and i % 2 == 1) else 45.0
            frames.extend(generate_bicep_curl_rep(num_frames=25, flex_target_deg=flex))
    else:
        # sit_to_stand fallback simulation
        frames = []
        for i in range(reps):
            depth = 0.6 if (simulate_errors and i % 2 == 1) else 1.0
            frames.extend(generate_squat_rep(num_frames=25, depth_pct=depth))

    history = []
    for f in frames:
        stat = evaluator.process_frame(f)
        history.append(stat)

    final_stats = evaluator.get_stats()
    return {
        "exercise": code,
        "total_simulated_reps": reps,
        "valid_reps": final_stats["valid_reps"],
        "invalid_attempts": final_stats["invalid_attempts"],
        "accuracy_pct": final_stats["accuracy_pct"],
        "form_breakdown": final_stats["form_breakdown"],
        "frames_evaluated": len(frames)
    }
