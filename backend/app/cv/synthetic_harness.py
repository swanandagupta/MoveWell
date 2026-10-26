import math
from typing import Dict, List, Generator
from app.cv.exercises import (
    LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW,
    LEFT_WRIST, RIGHT_WRIST, LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE
)

def make_base_pose() -> Dict[int, Dict[str, float]]:
    """Base upright human skeleton in normalized coordinates [0, 1]."""
    return {
        LEFT_SHOULDER: {"x": 0.45, "y": 0.25, "z": 0.0, "visibility": 0.99},
        RIGHT_SHOULDER: {"x": 0.55, "y": 0.25, "z": 0.0, "visibility": 0.99},
        LEFT_ELBOW: {"x": 0.42, "y": 0.45, "z": 0.0, "visibility": 0.99},
        RIGHT_ELBOW: {"x": 0.58, "y": 0.45, "z": 0.0, "visibility": 0.99},
        LEFT_WRIST: {"x": 0.42, "y": 0.65, "z": 0.0, "visibility": 0.99},
        RIGHT_WRIST: {"x": 0.58, "y": 0.65, "z": 0.0, "visibility": 0.99},
        LEFT_HIP: {"x": 0.46, "y": 0.50, "z": 0.0, "visibility": 0.99},
        RIGHT_HIP: {"x": 0.54, "y": 0.50, "z": 0.0, "visibility": 0.99},
        LEFT_KNEE: {"x": 0.46, "y": 0.72, "z": 0.0, "visibility": 0.99},
        RIGHT_KNEE: {"x": 0.54, "y": 0.72, "z": 0.0, "visibility": 0.99},
        LEFT_ANKLE: {"x": 0.46, "y": 0.92, "z": 0.0, "visibility": 0.99},
        RIGHT_ANKLE: {"x": 0.54, "y": 0.92, "z": 0.0, "visibility": 0.99},
    }

def generate_squat_rep(num_frames: int = 30, depth_pct: float = 1.0, excessive_lean: bool = False) -> List[Dict[int, Dict[str, float]]]:
    """
    Generates synthetic frames for a squat repetition.
    depth_pct=1.0 reaches full 90-degree depth.
    depth_pct=0.5 produces a shallow/incomplete squat.
    """
    frames = []
    for f in range(num_frames):
        pose = make_base_pose()
        # Sine wave progression 0 -> 1 -> 0
        t = math.sin(math.pi * (f / (num_frames - 1))) * depth_pct

        # Hips drop downward and slightly back
        pose[LEFT_HIP]["y"] = 0.50 + 0.20 * t
        pose[LEFT_HIP]["x"] = 0.46 - 0.08 * t
        pose[RIGHT_HIP]["y"] = 0.50 + 0.20 * t
        pose[RIGHT_HIP]["x"] = 0.54 - 0.08 * t

        # Knees flex forward and lower
        pose[LEFT_KNEE]["y"] = 0.72 + 0.04 * t
        pose[LEFT_KNEE]["x"] = 0.46 + 0.12 * t
        pose[RIGHT_KNEE]["y"] = 0.72 + 0.04 * t
        pose[RIGHT_KNEE]["x"] = 0.54 + 0.12 * t

        if excessive_lean:
            # Torso pitches forward aggressively
            pose[LEFT_SHOULDER]["x"] = 0.45 + 0.25 * t
            pose[RIGHT_SHOULDER]["x"] = 0.55 + 0.25 * t

        frames.append(pose)
    return frames

def generate_shoulder_abduction_rep(num_frames: int = 30, max_angle_deg: float = 90.0) -> List[Dict[int, Dict[str, float]]]:
    """
    Generates synthetic frames for shoulder abduction.
    max_angle_deg: peak angle reached (90 is horizontal).
    """
    frames = []
    arm_len = 0.22
    forearm_len = 0.20

    for f in range(num_frames):
        pose = make_base_pose()
        t = math.sin(math.pi * (f / (num_frames - 1)))
        current_deg = t * max_angle_deg
        rad = math.radians(current_deg)

        # Left arm raises out to the side
        sh_x, sh_y = pose[LEFT_SHOULDER]["x"], pose[LEFT_SHOULDER]["y"]
        pose[LEFT_ELBOW]["x"] = sh_x - arm_len * math.sin(rad)
        pose[LEFT_ELBOW]["y"] = sh_y + arm_len * math.cos(rad)

        pose[LEFT_WRIST]["x"] = pose[LEFT_ELBOW]["x"] - forearm_len * math.sin(rad)
        pose[LEFT_WRIST]["y"] = pose[LEFT_ELBOW]["y"] + forearm_len * math.cos(rad)

        frames.append(pose)
    return frames

def generate_bicep_curl_rep(num_frames: int = 30, flex_target_deg: float = 45.0) -> List[Dict[int, Dict[str, float]]]:
    """
    Generates synthetic frames for a bicep curl.
    flex_target_deg: elbow angle at peak (45 is full curl, 100 is shallow).
    """
    frames = []
    for f in range(num_frames):
        pose = make_base_pose()
        t = math.sin(math.pi * (f / (num_frames - 1)))
        # Elbow angle progresses from 160 down to flex_target_deg and back
        angle_deg = 160.0 - t * (160.0 - flex_target_deg)
        rad = math.radians(180.0 - angle_deg)

        el_x, el_y = pose[LEFT_ELBOW]["x"], pose[LEFT_ELBOW]["y"]
        forearm = 0.20
        pose[LEFT_WRIST]["x"] = el_x - 0.05 * math.sin(rad)
        pose[LEFT_WRIST]["y"] = el_y - forearm * math.cos(rad)

        frames.append(pose)
    return frames
