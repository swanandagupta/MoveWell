from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Appointment, User
from app.schemas.schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("", response_model=AppointmentOut)
def create_appointment(
    app_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clinician_id = current_user.id if current_user.role == "physiotherapist" else (
        current_user.patient_profile.clinician_id if current_user.patient_profile and current_user.patient_profile.clinician_id else 1
    )
    patient_id = app_in.patient_id if current_user.role == "physiotherapist" else current_user.id

    appointment = Appointment(
        patient_id=patient_id,
        clinician_id=clinician_id,
        scheduled_time=app_in.scheduled_time,
        duration_minutes=app_in.duration_minutes,
        reason=app_in.reason,
        meeting_link=app_in.meeting_link or "https://meet.jit.si/movewell-rehab-consultation",
        notes=app_in.notes,
        status="scheduled"
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.get("", response_model=List[AppointmentOut])
def list_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "patient":
        apps = db.query(Appointment).filter(Appointment.patient_id == current_user.id).order_by(Appointment.scheduled_time.asc()).all()
    else:
        apps = db.query(Appointment).filter(Appointment.clinician_id == current_user.id).order_by(Appointment.scheduled_time.asc()).all()
    return apps

@router.patch("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    app_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if app_update.status:
        app.status = app_update.status
    if app_update.scheduled_time:
        app.scheduled_time = app_update.scheduled_time
    if app_update.notes:
        app.notes = app_update.notes
    if app_update.meeting_link:
        app.meeting_link = app_update.meeting_link

    db.commit()
    db.refresh(app)
    return app
