import datetime
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    User, PatientProfile, Exercise, ExercisePlan, ExercisePlanItem,
    WorkoutSession, ExerciseSessionResult, FeedbackEvent, Appointment, ClinicianRecommendation
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "dr.elena@movewell.health").first():
            print("Database already contains demo seed data.")
            return

        print("Seeding MoveWell database with clinical demo data...")

        # 1. Clinician / Doctor
        clinician = User(
            email="dr.elena@movewell.health",
            hashed_password=get_password_hash("movewell123"),
            full_name="Dr. Elena Vance, DPT",
            role="physiotherapist",
            phone="+1 (555) 234-5678",
            avatar_url="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&h=300&q=80"
        )
        db.add(clinician)
        db.commit()
        db.refresh(clinician)

        # 2. Patients
        p1 = User(
            email="alex.patient@movewell.health",
            hashed_password=get_password_hash("movewell123"),
            full_name="Alex Morgan",
            role="patient",
            phone="+1 (555) 987-6543",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80"
        )
        p2 = User(
            email="sarah.patient@movewell.health",
            hashed_password=get_password_hash("movewell123"),
            full_name="Sarah Chen",
            role="patient",
            phone="+1 (555) 345-6789",
            avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80"
        )
        p3 = User(
            email="david.patient@movewell.health",
            hashed_password=get_password_hash("movewell123"),
            full_name="David Miller",
            role="patient",
            phone="+1 (555) 876-5432",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80"
        )
        db.add_all([p1, p2, p3])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)
        db.refresh(p3)

        # Patient Profiles
        prof1 = PatientProfile(
            user_id=p1.id,
            clinician_id=clinician.id,
            condition="Post-op ACL Reconstruction Recovery",
            age=28,
            gender="Female",
            emergency_contact="Mark Morgan: +1 (555) 111-2222",
            clinical_notes="Week 6 post-surgery. Focus on symmetrical knee flexion up to 90 degrees and gradual quad load. Avoid dynamic knee valgus.",
            rehab_stage="Phase 2 - Strength & Stabilization"
        )
        prof2 = PatientProfile(
            user_id=p2.id,
            clinician_id=clinician.id,
            condition="Rotator Cuff Tendinitis & Supraspinatus Impingement",
            age=45,
            gender="Female",
            emergency_contact="James Chen: +1 (555) 222-3333",
            clinical_notes="Restricted shoulder abduction past 95 degrees to prevent subacromial friction. Focus on controlled eccentric lowering.",
            rehab_stage="Phase 1 - Range of Motion"
        )
        prof3 = PatientProfile(
            user_id=p3.id,
            clinician_id=clinician.id,
            condition="Total Knee Arthroplasty (TKA) Functional Mobility",
            age=64,
            gender="Male",
            emergency_contact="Susan Miller: +1 (555) 333-4444",
            clinical_notes="Chair stand transitions and lower extremity kinetic chain stability. Maintain upright trunk during sit-to-stand.",
            rehab_stage="Phase 3 - Functional Independence"
        )
        db.add_all([prof1, prof2, prof3])
        db.commit()

        # 3. Exercises Catalog
        ex_squat = Exercise(
            code="squat",
            name="Bodyweight Squat",
            category="Lower Extremity Rehabilitation",
            description="Fundamental closed-chain lower limb rehabilitation movement activating quadriceps, gluteus maximus, and hamstrings with core stability.",
            target_muscle_groups="Quadriceps, Glutes, Hamstrings, Core",
            instructions=[
                "Stand with feet shoulder-width apart, toes pointing slightly outward.",
                "Keep chest upright and look straight ahead at the camera.",
                "Initiate movement by sending hips back and bending knees.",
                "Descend until thighs are parallel to ground (knee angle approx 90°-100°).",
                "Drive through heels to return smoothly to upright standing position."
            ],
            safety_precautions=[
                "Do not let knees cave inward (valgus collapse).",
                "Keep chest proud to prevent excessive forward trunk lean.",
                "Do not bounce at the bottom of the movement.",
                "Stop immediately if sharp patellofemoral pain occurs."
            ],
            target_joint="Knee Flexion (Hip-Knee-Ankle)",
            primary_angle_min=85.0,
            primary_angle_max=165.0,
            reference_rep_duration_sec=3.2
        )

        ex_shoulder = Exercise(
            code="shoulder_abduction",
            name="Standing Shoulder Abduction",
            category="Upper Extremity Rehabilitation",
            description="Lateral arm elevation in coronal plane to improve supraspinatus, deltoid activation and scapulohumeral rhythm.",
            target_muscle_groups="Deltoids, Supraspinatus, Trapezius",
            instructions=[
                "Stand tall with arms relaxed at your sides and palms facing inward.",
                "Maintain neutral spine and engage abdominal core.",
                "Raise arm(s) outward to the side smoothly until parallel with shoulder (approx 90°).",
                "Hold momentarily at shoulder level without shrugging neck.",
                "Lower arm slowly back down over 2-3 seconds."
            ],
            safety_precautions=[
                "Avoid elevating arm higher than 95° if diagnosed with impingement.",
                "Do not lean your torso sideways to swing the arm up.",
                "Keep shoulders relaxed away from your ears."
            ],
            target_joint="Shoulder Abduction (Hip-Shoulder-Elbow)",
            primary_angle_min=25.0,
            primary_angle_max=95.0,
            reference_rep_duration_sec=2.8
        )

        ex_curl = Exercise(
            code="bicep_curl",
            name="Bicep Curl",
            category="Upper Limb Strengthening",
            description="Isolated elbow flexion strengthening the biceps brachii, brachialis, and forearm stabilizers.",
            target_muscle_groups="Biceps Brachii, Brachialis, Brachioradialis",
            instructions=[
                "Stand upright with arm extended downwards, palms supinated.",
                "Pin your elbow securely against your ribcage.",
                "Bend elbow to curl wrist upwards towards shoulder.",
                "Squeeze bicep at peak flexion (elbow angle approx 45°-55°).",
                "Lower arm back down to full starting extension in control."
            ],
            safety_precautions=[
                "Do not swing torso backwards for momentum.",
                "Keep elbow stationary; do not flare outwards or forwards.",
                "Perform full extension without locking or hyperextending joint."
            ],
            target_joint="Elbow Flexion (Shoulder-Elbow-Wrist)",
            primary_angle_min=45.0,
            primary_angle_max=155.0,
            reference_rep_duration_sec=2.5
        )

        ex_sit_stand = Exercise(
            code="sit_to_stand",
            name="Sit-to-Stand",
            category="Functional Mobility & Balance",
            description="Standard functional assessment test evaluating lower extremity strength, independence, and postural control during chair transitions.",
            target_muscle_groups="Quadriceps, Hip Extensors, Core, Stabilizers",
            instructions=[
                "Sit upright on a stable chair with feet flat on the floor.",
                "Cross arms gently over chest or keep hands ready for balance.",
                "Lean slightly forward at the hips and rise up to full standing posture.",
                "Pause fully upright with knees and hips completely extended.",
                "Lower yourself carefully back into the seated position under continuous control."
            ],
            safety_precautions=[
                "Ensure chair is stable and will not slide.",
                "Do not plop down hard onto the chair.",
                "Keep knees tracking over toes throughout the rise."
            ],
            target_joint="Knee & Hip Extension",
            primary_angle_min=90.0,
            primary_angle_max=170.0,
            reference_rep_duration_sec=3.0
        )

        db.add_all([ex_squat, ex_shoulder, ex_curl, ex_sit_stand])
        db.commit()
        db.refresh(ex_squat)
        db.refresh(ex_shoulder)
        db.refresh(ex_curl)
        db.refresh(ex_sit_stand)

        # 4. Exercise Plans
        plan1 = ExercisePlan(
            title="ACL Phase 2: Quadriceps & Kinetic Chain Program",
            description="Prescribed by Dr. Elena Vance. 3 sets of bodyweight squats and functional sit-to-stand transitions to restore symmetrical joint kinetics.",
            clinician_id=clinician.id,
            patient_id=p1.id,
            status="active"
        )
        db.add(plan1)
        db.commit()
        db.refresh(plan1)

        item1_1 = ExercisePlanItem(
            plan_id=plan1.id,
            exercise_id=ex_squat.id,
            target_reps=10,
            target_sets=3,
            frequency_per_week=4,
            scheduled_days="Mon,Wed,Fri,Sat",
            notes="Ensure knee bends to at least 90° without leaning chest forward.",
            threshold_min=85.0,
            threshold_max=100.0
        )
        item1_2 = ExercisePlanItem(
            plan_id=plan1.id,
            exercise_id=ex_sit_stand.id,
            target_reps=8,
            target_sets=3,
            frequency_per_week=3,
            scheduled_days="Mon,Wed,Fri",
            notes="Full upright stance at peak.",
            threshold_min=160.0,
            threshold_max=175.0
        )
        db.add_all([item1_1, item1_2])

        # Plan for Sarah
        plan2 = ExercisePlan(
            title="Rotator Cuff & Scapular Range of Motion",
            description="Gradual elevation up to 90 degrees with strict scapular stabilization.",
            clinician_id=clinician.id,
            patient_id=p2.id,
            status="active"
        )
        db.add(plan2)
        db.commit()
        db.refresh(plan2)

        item2_1 = ExercisePlanItem(
            plan_id=plan2.id,
            exercise_id=ex_shoulder.id,
            target_reps=12,
            target_sets=3,
            frequency_per_week=4,
            scheduled_days="Tue,Thu,Sat,Sun",
            notes="Keep within 80-90 degrees. Avoid shrugging shoulder.",
            threshold_min=80.0,
            threshold_max=95.0
        )
        item2_2 = ExercisePlanItem(
            plan_id=plan2.id,
            exercise_id=ex_curl.id,
            target_reps=10,
            target_sets=2,
            frequency_per_week=3,
            scheduled_days="Tue,Thu,Sat",
            notes="Controlled slow eccentric descent.",
            threshold_min=45.0,
            threshold_max=60.0
        )
        db.add_all([item2_1, item2_2])
        db.commit()

        # 5. Historical Workout Sessions for Alex (rich data for charts & weekly reports)
        now = datetime.datetime.utcnow()
        session_dates = [
            now - datetime.timedelta(days=6),
            now - datetime.timedelta(days=4),
            now - datetime.timedelta(days=2),
            now - datetime.timedelta(days=1),
        ]

        metrics = [
            {"valid": 8, "invalid": 3, "acc": 72.7, "dur": 180, "issues": {"incomplete_depth": 2, "excessive_torso_lean": 1}},
            {"valid": 9, "invalid": 2, "acc": 81.8, "dur": 195, "issues": {"incomplete_depth": 2}},
            {"valid": 10, "invalid": 1, "acc": 90.9, "dur": 210, "issues": {"excessive_torso_lean": 1}},
            {"valid": 10, "invalid": 0, "acc": 100.0, "dur": 200, "issues": {}},
        ]

        for dt, m in zip(session_dates, metrics):
            sess = WorkoutSession(
                patient_id=p1.id,
                plan_id=plan1.id,
                started_at=dt,
                completed_at=dt + datetime.timedelta(seconds=m["dur"]),
                duration_seconds=m["dur"],
                total_valid_reps=m["valid"],
                total_invalid_attempts=m["invalid"],
                overall_accuracy_pct=m["acc"],
                status="completed",
                clinician_reviewed=(m["acc"] < 80),
                clinician_review_notes="Form significantly improved as session progressed. Great control on final sets." if m["acc"] >= 80 else "Watch knee depth consistency."
            )
            db.add(sess)
            db.commit()
            db.refresh(sess)

            # Exercise Result
            ex_res = ExerciseSessionResult(
                session_id=sess.id,
                exercise_id=ex_squat.id,
                valid_reps=m["valid"],
                invalid_attempts=m["invalid"],
                accuracy_pct=m["acc"],
                duration_seconds=m["dur"],
                peak_angle=92.5,
                form_breakdown=m["issues"]
            )
            db.add(ex_res)
            db.commit()
            db.refresh(ex_res)

            # Feedback events
            if m["invalid"] > 0:
                fb = FeedbackEvent(
                    session_result_id=ex_res.id,
                    timestamp_offset_sec=42.0,
                    rep_number=3,
                    feedback_text="Incomplete depth: Squat lower to achieve parallel target",
                    feedback_type="correction"
                )
                db.add(fb)
            fb_praise = FeedbackEvent(
                session_result_id=ex_res.id,
                timestamp_offset_sec=95.0,
                rep_number=6,
                feedback_text="Excellent posture! Rep counted.",
                feedback_type="praise"
            )
            db.add(fb_praise)

        # 6. Appointments
        app1 = Appointment(
            patient_id=p1.id,
            clinician_id=clinician.id,
            scheduled_time=now + datetime.timedelta(days=2, hours=3),
            duration_minutes=30,
            status="scheduled",
            meeting_link="https://meet.jit.si/movewell-rehab-alex-morgan",
            reason="Week 6 ACL Recovery Check & Range Progression",
            notes="Review squat biomechanics and progress to dynamic loading."
        )
        app2 = Appointment(
            patient_id=p2.id,
            clinician_id=clinician.id,
            scheduled_time=now + datetime.timedelta(days=3, hours=5),
            duration_minutes=30,
            status="scheduled",
            meeting_link="https://meet.jit.si/movewell-rehab-sarah-chen",
            reason="Shoulder Impingement Range of Motion Follow-up",
            notes="Assess lateral abduction comfort."
        )
        db.add_all([app1, app2])

        # 7. Recommendations
        rec1 = ClinicianRecommendation(
            patient_id=p1.id,
            clinician_id=clinician.id,
            recommendation_text="Ensure you drive upward through both heels equally to prevent favoring the non-operative leg.",
            category="form_adjustment"
        )
        rec2 = ClinicianRecommendation(
            patient_id=p1.id,
            clinician_id=clinician.id,
            recommendation_text="Perform light 5-minute quad stretching and ankle mobilization prior to starting your webcam session.",
            category="recovery"
        )
        db.add_all([rec1, rec2])

        db.commit()
        print("MoveWell seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
