import pytest
from app.cv.geometry import calculate_angle_2d, calculate_torso_vertical_angle, check_landmarks_visibility, smooth_landmarks
from app.cv.exercises import (
    SquatEvaluator, ShoulderAbductionEvaluator, BicepCurlEvaluator, SitToStandEvaluator,
    ExerciseState, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_SHOULDER
)
from app.cv.synthetic_harness import (
    generate_squat_rep, generate_shoulder_abduction_rep, generate_bicep_curl_rep, make_base_pose
)
from app.core.security import verify_password, get_password_hash, create_access_token
import jwt
from app.core.config import settings

def test_joint_angle_calculation():
    # 90-degree right angle at (0, 0)
    a = (0.0, 1.0)
    b = (0.0, 0.0)
    c = (1.0, 0.0)
    angle = calculate_angle_2d(a, b, c)
    assert abs(angle - 90.0) < 0.01

    # 180-degree straight line
    a = (-1.0, 0.0)
    b = (0.0, 0.0)
    c = (1.0, 0.0)
    angle = calculate_angle_2d(a, b, c)
    assert abs(angle - 180.0) < 0.01

    # Zero length vector edge case handled safely
    angle = calculate_angle_2d(b, b, c)
    assert angle == 0.0

def test_torso_vertical_angle():
    # Vertical spine
    shoulder = (0.5, 0.2)
    hip = (0.5, 0.5)
    assert calculate_torso_vertical_angle(shoulder, hip) == 0.0

    # 45-degree pitched forward
    shoulder = (0.8, 0.2)
    hip = (0.5, 0.5)
    angle = calculate_torso_vertical_angle(shoulder, hip)
    assert abs(angle - 45.0) < 0.1

def test_landmark_visibility_and_smoothing():
    base = make_base_pose()
    vis, missing = check_landmarks_visibility(base, [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE])
    assert vis is True
    assert len(missing) == 0

    # Set one landmark visibility low
    base[LEFT_KNEE]["visibility"] = 0.2
    vis, missing = check_landmarks_visibility(base, [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE], min_visibility=0.5)
    assert vis is False
    assert LEFT_KNEE in missing

    # Smoothing
    p1 = {1: {"x": 10.0, "y": 20.0, "visibility": 1.0}}
    p2 = {1: {"x": 20.0, "y": 30.0, "visibility": 1.0}}
    smoothed = smooth_landmarks(p2, p1, alpha=0.5)
    assert smoothed[1]["x"] == 15.0
    assert smoothed[1]["y"] == 25.0

def test_squat_state_machine_valid_rep():
    evaluator = SquatEvaluator()
    frames = generate_squat_rep(num_frames=30, depth_pct=1.0)

    for f in frames:
        evaluator.process_frame(f)

    assert evaluator.valid_reps == 1
    assert evaluator.invalid_attempts == 0
    assert evaluator.state == ExerciseState.READY

def test_squat_incomplete_depth_not_counted():
    evaluator = SquatEvaluator()
    # 50% depth: knee won't reach <= 100 degrees
    frames = generate_squat_rep(num_frames=30, depth_pct=0.4)

    for f in frames:
        evaluator.process_frame(f)

    # Should count as invalid attempt, NOT valid repetition
    assert evaluator.valid_reps == 0
    assert evaluator.invalid_attempts == 1
    assert "incomplete_depth" in evaluator.all_issues_counter

def test_repeated_frames_do_not_duplicate_counts():
    evaluator = SquatEvaluator()
    frames = generate_squat_rep(num_frames=20, depth_pct=1.0)
    for f in frames:
        evaluator.process_frame(f)
    assert evaluator.valid_reps == 1

    # Person holds bottom position for 15 frames
    bottom_frame = frames[10]
    for _ in range(15):
        evaluator.process_frame(bottom_frame)
    # Valid reps should remain 1
    assert evaluator.valid_reps == 1

def test_shoulder_abduction_fsm():
    evaluator = ShoulderAbductionEvaluator()
    # Good rep to 90 degrees
    frames = generate_shoulder_abduction_rep(num_frames=25, max_angle_deg=90.0)
    for f in frames:
        evaluator.process_frame(f)
    assert evaluator.valid_reps == 1
    assert evaluator.invalid_attempts == 0

    # Incomplete rep to only 55 degrees
    shallow_frames = generate_shoulder_abduction_rep(num_frames=25, max_angle_deg=55.0)
    for f in shallow_frames:
        evaluator.process_frame(f)
    assert evaluator.valid_reps == 1
    assert evaluator.invalid_attempts == 1

def test_bicep_curl_fsm():
    evaluator = BicepCurlEvaluator()
    # Good curl
    frames = generate_bicep_curl_rep(num_frames=25, flex_target_deg=45.0)
    for f in frames:
        evaluator.process_frame(f)
    assert evaluator.valid_reps == 1
    assert evaluator.invalid_attempts == 0

def test_security_and_auth():
    raw_pwd = "rehab_secret_2026"
    hashed = get_password_hash(raw_pwd)
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("wrong_pwd", hashed) is False

    token = create_access_token(subject=42)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "42"
