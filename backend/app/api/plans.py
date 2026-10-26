from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import ExercisePlan, ExercisePlanItem, Exercise, User
from app.schemas.schemas import ExercisePlanCreate, ExercisePlanOut
from app.api.deps import get_current_user, require_clinician

router = APIRouter(prefix="/plans", tags=["Exercise Plans"])

@router.post("", response_model=ExercisePlanOut)
def create_exercise_plan(
    plan_in: ExercisePlanCreate,
    db: Session = Depends(get_db),
    clinician: User = Depends(require_clinician)
):
    # Verify patient exists
    patient = db.query(User).filter(User.id == plan_in.patient_id, User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Deactivate existing active plans for patient if new active plan is created
    if plan_in.status == "active":
        db.query(ExercisePlan).filter(
            ExercisePlan.patient_id == patient.id,
            ExercisePlan.status == "active"
        ).update({"status": "completed"})

    new_plan = ExercisePlan(
        title=plan_in.title,
        description=plan_in.description,
        clinician_id=clinician.id,
        patient_id=patient.id,
        status=plan_in.status
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    for item in plan_in.items:
        plan_item = ExercisePlanItem(
            plan_id=new_plan.id,
            exercise_id=item.exercise_id,
            target_reps=item.target_reps,
            target_sets=item.target_sets,
            frequency_per_week=item.frequency_per_week,
            scheduled_days=item.scheduled_days,
            notes=item.notes,
            threshold_min=item.threshold_min,
            threshold_max=item.threshold_max
        )
        db.add(plan_item)

    db.commit()
    db.refresh(new_plan)
    return new_plan

@router.get("/assigned", response_model=List[ExercisePlanOut])
def get_patient_assigned_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Patient sees their own plans
    if current_user.role == "patient":
        plans = db.query(ExercisePlan).filter(ExercisePlan.patient_id == current_user.id).order_by(ExercisePlan.created_at.desc()).all()
    else:
        # Clinician sees plans they authored
        plans = db.query(ExercisePlan).filter(ExercisePlan.clinician_id == current_user.id).order_by(ExercisePlan.created_at.desc()).all()
    return plans

@router.get("/patient/{patient_id}", response_model=List[ExercisePlanOut])
def get_plans_for_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    clinician: User = Depends(require_clinician)
):
    plans = db.query(ExercisePlan).filter(ExercisePlan.patient_id == patient_id).order_by(ExercisePlan.created_at.desc()).all()
    return plans

@router.get("/{plan_id}", response_model=ExercisePlanOut)
def get_plan_by_id(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(ExercisePlan).filter(ExercisePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Exercise plan not found")
    # Patient can only view their own plan
    if current_user.role == "patient" and plan.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this plan")
    return plan
