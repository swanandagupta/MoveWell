from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User, PatientProfile
from app.schemas.schemas import UserCreate, UserLogin, UserOut, Token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    # Find default clinician to assign if registering as patient
    default_clinician = db.query(User).filter(User.role == "physiotherapist").first()

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        avatar_url=user_in.avatar_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.role == "patient":
        profile = PatientProfile(
            user_id=user.id,
            clinician_id=default_clinician.id if default_clinician else None,
            condition=user_in.condition or "General Rehabilitation",
            age=user_in.age or 32,
            gender=user_in.gender or "Other",
            rehab_stage="Phase 1 - Mobility & Baseline"
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=user)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=user)

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/demo-login", response_model=Token)
def demo_login(role: str = "patient", db: Session = Depends(get_db)):
    target_role = "physiotherapist" if role in ["clinician", "doctor", "physiotherapist"] else "patient"
    user = db.query(User).filter(User.role == target_role).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No seeded {target_role} found. Please run database seed."
        )
    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=user)
