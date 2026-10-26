import time
from typing import Dict, Any, List, Optional, Tuple
from app.cv.geometry import calculate_angle_2d, calculate_torso_vertical_angle, check_landmarks_visibility

# MediaPipe landmark indices
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28

class ExerciseState:
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    PEAK = "PEAK"
    RETURNING = "RETURNING"
    COMPLETED = "COMPLETED"

class BaseExerciseEvaluator:
    def __init__(self, exercise_code: str, name: str):
        self.exercise_code = exercise_code
        self.name = name
        self.valid_reps = 0
        self.invalid_attempts = 0
        self.state = ExerciseState.READY
        self.peak_angle_achieved = 0.0
        self.rep_issues = []
        self.all_issues_counter: Dict[str, int] = {}
        self.last_rep_valid: Optional[bool] = None
        self.feedback_message = "Get into starting position"
        self.feedback_type = "info"  # info, success, warning, correction
        self.current_angle = 0.0
        self.current_secondary_angle = 0.0
        self.last_transition_time = time.time()
        self.required_landmarks: List[int] = []

    def reset(self):
        self.valid_reps = 0
        self.invalid_attempts = 0
        self.state = ExerciseState.READY
        self.peak_angle_achieved = 0.0
        self.rep_issues = []
        self.all_issues_counter = {}
        self.last_rep_valid = None
        self.feedback_message = "Ready to start"
        self.feedback_type = "info"
        self.current_angle = 0.0

    def process_frame(self, landmarks: Dict[int, Dict[str, float]]) -> Dict[str, Any]:
        raise NotImplementedError

    def get_stats(self) -> Dict[str, Any]:
        total = self.valid_reps + self.invalid_attempts
        acc = (self.valid_reps / total * 100.0) if total > 0 else 0.0
        return {
            "exercise_code": self.exercise_code,
            "valid_reps": self.valid_reps,
            "invalid_attempts": self.invalid_attempts,
            "accuracy_pct": round(acc, 1),
            "state": self.state,
            "feedback": self.feedback_message,
            "feedback_type": self.feedback_type,
            "current_angle": round(self.current_angle, 1),
            "form_breakdown": self.all_issues_counter
        }


class SquatEvaluator(BaseExerciseEvaluator):
    """
    Bodyweight Squat
    - Primary joint: Knee angle (Hip - Knee - Ankle).
    - Secondary: Torso angle (Shoulder - Hip vs Vertical).
    - Thresholds:
      * Standing ready: Knee > 160 deg
      * Descending: Knee < 140 deg
      * Valid Depth: Knee <= 100 deg (ideally 90 deg)
      * Returning: Knee > 120 deg
      * Completed: Knee > 160 deg
    - Common Errors:
      * Incomplete depth: turning back before <= 100 deg.
      * Excessive torso lean: torso angle > 45 deg from vertical.
    """
    def __init__(self):
        super().__init__("squat", "Bodyweight Squat")
        self.required_landmarks = [
            LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_SHOULDER,
            RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_SHOULDER
        ]
        self.min_knee_angle = 180.0

    def process_frame(self, landmarks: Dict[int, Dict[str, float]]) -> Dict[str, Any]:
        visible, missing = check_landmarks_visibility(landmarks, [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_SHOULDER])
        # If left side isn't fully visible, check right side
        side = "left"
        if not visible:
            r_vis, r_missing = check_landmarks_visibility(landmarks, [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_SHOULDER])
            if r_vis:
                visible = True
                side = "right"
            else:
                self.feedback_message = "Step back so your full body, hips and knees are visible"
                self.feedback_type = "warning"
                return self.get_stats()

        if side == "left":
            hip = (landmarks[LEFT_HIP]["x"], landmarks[LEFT_HIP]["y"])
            knee = (landmarks[LEFT_KNEE]["x"], landmarks[LEFT_KNEE]["y"])
            ankle = (landmarks[LEFT_ANKLE]["x"], landmarks[LEFT_ANKLE]["y"])
            shoulder = (landmarks[LEFT_SHOULDER]["x"], landmarks[LEFT_SHOULDER]["y"])
        else:
            hip = (landmarks[RIGHT_HIP]["x"], landmarks[RIGHT_HIP]["y"])
            knee = (landmarks[RIGHT_KNEE]["x"], landmarks[RIGHT_KNEE]["y"])
            ankle = (landmarks[RIGHT_ANKLE]["x"], landmarks[RIGHT_ANKLE]["y"])
            shoulder = (landmarks[RIGHT_SHOULDER]["x"], landmarks[RIGHT_SHOULDER]["y"])

        knee_angle = calculate_angle_2d(hip, knee, ankle)
        torso_angle = calculate_torso_vertical_angle(shoulder, hip)
        self.current_angle = knee_angle
        self.current_secondary_angle = torso_angle

        # Finite State Machine
        if self.state == ExerciseState.READY:
            if knee_angle > 155:
                self.feedback_message = "Stand tall, then begin descent"
                self.feedback_type = "info"
            elif knee_angle < 140:
                self.state = ExerciseState.IN_PROGRESS
                self.min_knee_angle = knee_angle
                self.rep_issues = []
                self.feedback_message = "Squat down with chest proud"
                self.feedback_type = "info"

        elif self.state == ExerciseState.IN_PROGRESS:
            if knee_angle < self.min_knee_angle:
                self.min_knee_angle = knee_angle

            # Check torso posture during descent
            if torso_angle > 45 and "excessive_torso_lean" not in self.rep_issues:
                self.rep_issues.append("excessive_torso_lean")
                self.feedback_message = "Keep your chest up and upper body upright"
                self.feedback_type = "correction"

            # Check if bottom depth reached
            if knee_angle <= 100:
                self.state = ExerciseState.PEAK
                self.feedback_message = "Great depth! Now push through your heels to stand"
                self.feedback_type = "success"
            elif knee_angle > 145:  # turned back prematurely before achieving depth
                # Premature ascent
                self.state = ExerciseState.RETURNING
                if "incomplete_depth" not in self.rep_issues:
                    self.rep_issues.append("incomplete_depth")
                    self.feedback_message = "Incomplete depth: Squat lower next time"
                    self.feedback_type = "warning"

        elif self.state == ExerciseState.PEAK:
            if knee_angle < self.min_knee_angle:
                self.min_knee_angle = knee_angle
            if knee_angle > 115:
                self.state = ExerciseState.RETURNING
                self.feedback_message = "Drive upward to standing position"
                self.feedback_type = "info"

        elif self.state == ExerciseState.RETURNING:
            if knee_angle >= 160:
                # Finished rep! Evaluate validity
                is_valid = ("incomplete_depth" not in self.rep_issues) and (self.min_knee_angle <= 105)
                if is_valid:
                    self.valid_reps += 1
                    self.last_rep_valid = True
                    self.feedback_message = "Excellent squat! Rep counted."
                    self.feedback_type = "success"
                else:
                    self.invalid_attempts += 1
                    self.last_rep_valid = False
                    reason = "Squat lower for full depth" if "incomplete_depth" in self.rep_issues else "Check form"
                    self.feedback_message = f"Rep not counted: {reason}"
                    self.feedback_type = "correction"

                # Track breakdown
                for issue in self.rep_issues:
                    self.all_issues_counter[issue] = self.all_issues_counter.get(issue, 0) + 1

                self.state = ExerciseState.READY
                self.min_knee_angle = 180.0
                self.rep_issues = []

        return self.get_stats()


class ShoulderAbductionEvaluator(BaseExerciseEvaluator):
    """
    Standing Shoulder Abduction (Lateral Arm Raise)
    - Primary joint: Shoulder angle (Hip - Shoulder - Elbow).
    - Thresholds:
      * Arm at side: Shoulder angle < 30 deg
      * Raising: Shoulder angle > 45 deg
      * Peak target: Shoulder angle between 80 and 100 deg (horizontal plane)
      * Lowering: Shoulder angle < 65 deg
      * Completed: Shoulder angle < 30 deg
    - Common Errors:
      * Insufficient raise (< 75 deg).
      * Over-elevation (> 120 deg when restricted for impingement).
      * Torso leaning sideways to compensate.
    """
    def __init__(self):
        super().__init__("shoulder_abduction", "Standing Shoulder Abduction")
        self.max_shoulder_angle = 0.0

    def process_frame(self, landmarks: Dict[int, Dict[str, float]]) -> Dict[str, Any]:
        # Determine which side is active or visible
        left_vis, _ = check_landmarks_visibility(landmarks, [LEFT_HIP, LEFT_SHOULDER, LEFT_ELBOW])
        right_vis, _ = check_landmarks_visibility(landmarks, [RIGHT_HIP, RIGHT_SHOULDER, RIGHT_ELBOW])

        if not left_vis and not right_vis:
            self.feedback_message = "Adjust camera: Keep torso, shoulder and arms visible"
            self.feedback_type = "warning"
            return self.get_stats()

        # Compute both or active
        angles = {}
        if left_vis:
            lh = (landmarks[LEFT_HIP]["x"], landmarks[LEFT_HIP]["y"])
            ls = (landmarks[LEFT_SHOULDER]["x"], landmarks[LEFT_SHOULDER]["y"])
            le = (landmarks[LEFT_ELBOW]["x"], landmarks[LEFT_ELBOW]["y"])
            angles["left"] = calculate_angle_2d(lh, ls, le)
        if right_vis:
            rh = (landmarks[RIGHT_HIP]["x"], landmarks[RIGHT_HIP]["y"])
            rs = (landmarks[RIGHT_SHOULDER]["x"], landmarks[RIGHT_SHOULDER]["y"])
            re = (landmarks[RIGHT_ELBOW]["x"], landmarks[RIGHT_ELBOW]["y"])
            angles["right"] = calculate_angle_2d(rh, rs, re)

        # Pick whichever arm is actively moving
        side = "left" if (angles.get("left", 0) > angles.get("right", 0)) else "right"
        shoulder_angle = angles[side]
        self.current_angle = shoulder_angle

        if self.state == ExerciseState.READY:
            if shoulder_angle < 35:
                self.feedback_message = "Arms by your side. Raise slowly to shoulder level."
                self.feedback_type = "info"
            elif shoulder_angle > 45:
                self.state = ExerciseState.IN_PROGRESS
                self.max_shoulder_angle = shoulder_angle
                self.rep_issues = []
                self.feedback_message = "Raising arm: lift up to horizontal (90°)"
                self.feedback_type = "info"

        elif self.state == ExerciseState.IN_PROGRESS:
            if shoulder_angle > self.max_shoulder_angle:
                self.max_shoulder_angle = shoulder_angle

            if shoulder_angle >= 80:
                self.state = ExerciseState.PEAK
                self.feedback_message = "Good elevation! Hold momentarily and lower smoothly"
                self.feedback_type = "success"
            elif shoulder_angle < self.max_shoulder_angle - 15:  # started lowering before reaching target
                self.state = ExerciseState.RETURNING
                if "insufficient_height" not in self.rep_issues:
                    self.rep_issues.append("insufficient_height")
                    self.feedback_message = "Raise your arm a little higher, up to shoulder height"
                    self.feedback_type = "correction"

        elif self.state == ExerciseState.PEAK:
            if shoulder_angle > self.max_shoulder_angle:
                self.max_shoulder_angle = shoulder_angle
            if shoulder_angle > 115 and "over_elevation" not in self.rep_issues:
                self.rep_issues.append("over_elevation")
                self.feedback_message = "Do not raise past shoulder level"
                self.feedback_type = "warning"
            if shoulder_angle < 70:
                self.state = ExerciseState.RETURNING
                self.feedback_message = "Lower arm in control"
                self.feedback_type = "info"

        elif self.state == ExerciseState.RETURNING:
            if shoulder_angle <= 32:
                is_valid = ("insufficient_height" not in self.rep_issues) and (self.max_shoulder_angle >= 78)
                if is_valid:
                    self.valid_reps += 1
                    self.last_rep_valid = True
                    self.feedback_message = "Rep counted! Smooth controlled raise."
                    self.feedback_type = "success"
                else:
                    self.invalid_attempts += 1
                    self.last_rep_valid = False
                    self.feedback_message = "Rep not counted: Raise higher to shoulder height"
                    self.feedback_type = "correction"

                for issue in self.rep_issues:
                    self.all_issues_counter[issue] = self.all_issues_counter.get(issue, 0) + 1

                self.state = ExerciseState.READY
                self.max_shoulder_angle = 0.0
                self.rep_issues = []

        return self.get_stats()


class BicepCurlEvaluator(BaseExerciseEvaluator):
    """
    Bicep Curl
    - Primary joint: Elbow flexion (Shoulder - Elbow - Wrist).
    - Thresholds:
      * Fully extended starting arm: Elbow angle > 150 deg
      * Curling/Flexing: Elbow angle < 130 deg
      * Full contraction peak: Elbow angle <= 55 deg
      * Extending: Elbow angle > 80 deg
      * Returned: Elbow angle > 150 deg
    - Common Errors:
      * Incomplete flexion: failing to curl all the way up (elbow > 65 deg).
      * Incomplete extension: beginning next rep without extending arm.
    """
    def __init__(self):
        super().__init__("bicep_curl", "Bicep Curl")
        self.min_elbow_angle = 180.0

    def process_frame(self, landmarks: Dict[int, Dict[str, float]]) -> Dict[str, Any]:
        left_vis, _ = check_landmarks_visibility(landmarks, [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST])
        right_vis, _ = check_landmarks_visibility(landmarks, [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST])

        if not left_vis and not right_vis:
            self.feedback_message = "Ensure shoulder, elbow and wrist are in clear view"
            self.feedback_type = "warning"
            return self.get_stats()

        angles = {}
        if left_vis:
            ls = (landmarks[LEFT_SHOULDER]["x"], landmarks[LEFT_SHOULDER]["y"])
            le = (landmarks[LEFT_ELBOW]["x"], landmarks[LEFT_ELBOW]["y"])
            lw = (landmarks[LEFT_WRIST]["x"], landmarks[LEFT_WRIST]["y"])
            angles["left"] = calculate_angle_2d(ls, le, lw)
        if right_vis:
            rs = (landmarks[RIGHT_SHOULDER]["x"], landmarks[RIGHT_SHOULDER]["y"])
            re = (landmarks[RIGHT_ELBOW]["x"], landmarks[RIGHT_ELBOW]["y"])
            rw = (landmarks[RIGHT_WRIST]["x"], landmarks[RIGHT_WRIST]["y"])
            angles["right"] = calculate_angle_2d(rs, re, rw)

        # Pick whichever arm is flexing (lower angle means more flexed)
        side = "left" if (angles.get("left", 180) < angles.get("right", 180)) else "right"
        elbow_angle = angles[side]
        self.current_angle = elbow_angle

        if self.state == ExerciseState.READY:
            if elbow_angle > 145:
                self.feedback_message = "Arm extended. Curl weight toward shoulder."
                self.feedback_type = "info"
            elif elbow_angle < 130:
                self.state = ExerciseState.IN_PROGRESS
                self.min_elbow_angle = elbow_angle
                self.rep_issues = []
                self.feedback_message = "Keep elbow still and squeeze bicep"
                self.feedback_type = "info"

        elif self.state == ExerciseState.IN_PROGRESS:
            if elbow_angle < self.min_elbow_angle:
                self.min_elbow_angle = elbow_angle

            if elbow_angle <= 55:
                self.state = ExerciseState.PEAK
                self.feedback_message = "Full squeeze! Now lower under control"
                self.feedback_type = "success"
            elif elbow_angle > self.min_elbow_angle + 15:  # dropped arm before reaching top
                self.state = ExerciseState.RETURNING
                if "incomplete_curl" not in self.rep_issues:
                    self.rep_issues.append("incomplete_curl")
                    self.feedback_message = "Bend your elbow further to complete the curl"
                    self.feedback_type = "correction"

        elif self.state == ExerciseState.PEAK:
            if elbow_angle < self.min_elbow_angle:
                self.min_elbow_angle = elbow_angle
            if elbow_angle > 80:
                self.state = ExerciseState.RETURNING
                self.feedback_message = "Extend all the way down"
                self.feedback_type = "info"

        elif self.state == ExerciseState.RETURNING:
            if elbow_angle >= 145:
                is_valid = ("incomplete_curl" not in self.rep_issues) and (self.min_elbow_angle <= 65)
                if is_valid:
                    self.valid_reps += 1
                    self.last_rep_valid = True
                    self.feedback_message = "Rep counted! Full range of motion."
                    self.feedback_type = "success"
                else:
                    self.invalid_attempts += 1
                    self.last_rep_valid = False
                    self.feedback_message = "Rep not counted: Curl all the way up"
                    self.feedback_type = "correction"

                for issue in self.rep_issues:
                    self.all_issues_counter[issue] = self.all_issues_counter.get(issue, 0) + 1

                self.state = ExerciseState.READY
                self.min_elbow_angle = 180.0
                self.rep_issues = []

        return self.get_stats()


class SitToStandEvaluator(BaseExerciseEvaluator):
    """
    Sit-to-Stand (Functional Mobility / 30-Second Chair Stand)
    - Primary joint: Knee & Hip angle.
    - Thresholds:
      * Seated: Knee angle ~ 85-105 deg, Hip angle ~ 80-105 deg
      * Rising: Knee angle increasing > 120 deg
      * Standing full extension: Knee angle > 165 deg and Hip angle > 165 deg
      * Returning: Knee angle decreasing < 140 deg
      * Seated complete: Knee angle <= 105 deg
    - Common Errors:
      * Incomplete stand (< 160 deg extension).
      * Flumping back down without control.
    """
    def __init__(self):
        super().__init__("sit_to_stand", "Sit-to-Stand Test")
        self.max_extension_knee = 0.0

    def process_frame(self, landmarks: Dict[int, Dict[str, float]]) -> Dict[str, Any]:
        visible, _ = check_landmarks_visibility(landmarks, [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_SHOULDER])
        side = "left"
        if not visible:
            r_vis, _ = check_landmarks_visibility(landmarks, [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_SHOULDER])
            if r_vis:
                visible = True
                side = "right"
            else:
                self.feedback_message = "Position camera side-on showing chair, hips, knees and feet"
                self.feedback_type = "warning"
                return self.get_stats()

        if side == "left":
            hip = (landmarks[LEFT_HIP]["x"], landmarks[LEFT_HIP]["y"])
            knee = (landmarks[LEFT_KNEE]["x"], landmarks[LEFT_KNEE]["y"])
            ankle = (landmarks[LEFT_ANKLE]["x"], landmarks[LEFT_ANKLE]["y"])
            shoulder = (landmarks[LEFT_SHOULDER]["x"], landmarks[LEFT_SHOULDER]["y"])
        else:
            hip = (landmarks[RIGHT_HIP]["x"], landmarks[RIGHT_HIP]["y"])
            knee = (landmarks[RIGHT_KNEE]["x"], landmarks[RIGHT_KNEE]["y"])
            ankle = (landmarks[RIGHT_ANKLE]["x"], landmarks[RIGHT_ANKLE]["y"])
            shoulder = (landmarks[RIGHT_SHOULDER]["x"], landmarks[RIGHT_SHOULDER]["y"])

        knee_angle = calculate_angle_2d(hip, knee, ankle)
        hip_angle = calculate_angle_2d(shoulder, hip, knee)
        self.current_angle = knee_angle
        self.current_secondary_angle = hip_angle

        if self.state == ExerciseState.READY:
            if knee_angle <= 110:
                self.feedback_message = "Seated ready. Stand up fully to upright posture."
                self.feedback_type = "info"
            elif knee_angle > 120:
                self.state = ExerciseState.IN_PROGRESS
                self.max_extension_knee = knee_angle
                self.rep_issues = []
                self.feedback_message = "Rising up: Stand to full height"
                self.feedback_type = "info"

        elif self.state == ExerciseState.IN_PROGRESS:
            if knee_angle > self.max_extension_knee:
                self.max_extension_knee = knee_angle

            if knee_angle >= 165 and hip_angle >= 160:
                self.state = ExerciseState.PEAK
                self.feedback_message = "Fully upright! Now lower yourself carefully"
                self.feedback_type = "success"
            elif knee_angle < self.max_extension_knee - 15:  # sat back before full extension
                self.state = ExerciseState.RETURNING
                if "incomplete_stand" not in self.rep_issues:
                    self.rep_issues.append("incomplete_stand")
                    self.feedback_message = "Stand up completely to full height"
                    self.feedback_type = "correction"

        elif self.state == ExerciseState.PEAK:
            if knee_angle > self.max_extension_knee:
                self.max_extension_knee = knee_angle
            if knee_angle < 135:
                self.state = ExerciseState.RETURNING
                self.feedback_message = "Lower back onto chair in control"
                self.feedback_type = "info"

        elif self.state == ExerciseState.RETURNING:
            if knee_angle <= 105:
                is_valid = ("incomplete_stand" not in self.rep_issues) and (self.max_extension_knee >= 160)
                if is_valid:
                    self.valid_reps += 1
                    self.last_rep_valid = True
                    self.feedback_message = "Rep counted! Controlled sit-to-stand."
                    self.feedback_type = "success"
                else:
                    self.invalid_attempts += 1
                    self.last_rep_valid = False
                    self.feedback_message = "Rep not counted: Stand all the way upright"
                    self.feedback_type = "correction"

                for issue in self.rep_issues:
                    self.all_issues_counter[issue] = self.all_issues_counter.get(issue, 0) + 1

                self.state = ExerciseState.READY
                self.max_extension_knee = 0.0
                self.rep_issues = []

        return self.get_stats()


def get_exercise_evaluator(code: str) -> BaseExerciseEvaluator:
    registry = {
        "squat": SquatEvaluator,
        "shoulder_abduction": ShoulderAbductionEvaluator,
        "bicep_curl": BicepCurlEvaluator,
        "sit_to_stand": SitToStandEvaluator
    }
    evaluator_cls = registry.get(code.lower())
    if not evaluator_cls:
        raise ValueError(f"Unknown exercise code: {code}")
    return evaluator_cls()
