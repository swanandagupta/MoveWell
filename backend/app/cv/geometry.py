import math
from typing import Tuple, List, Dict, Any, Optional

def calculate_angle_2d(
    a: Tuple[float, float],
    b: Tuple[float, float],
    c: Tuple[float, float]
) -> float:
    """
    Calculates the interior angle in degrees at vertex B formed by line segments BA and BC.
    Point coordinates: (x, y).
    Uses vector dot product and determinant for numerical precision.
    """
    ba_x = a[0] - b[0]
    ba_y = a[1] - b[1]
    bc_x = c[0] - b[0]
    bc_y = c[1] - b[1]

    mag_ba = math.sqrt(ba_x * ba_x + ba_y * ba_y)
    mag_bc = math.sqrt(bc_x * bc_x + bc_y * bc_y)

    if mag_ba == 0.0 or mag_bc == 0.0:
        return 0.0

    dot_product = ba_x * bc_x + ba_y * bc_y
    cosine_angle = dot_product / (mag_ba * mag_bc)

    # Clamp cosine_angle to valid range [-1.0, 1.0] to prevent math domain error
    cosine_angle = max(-1.0, min(1.0, cosine_angle))
    angle_rad = math.acos(cosine_angle)
    return math.degrees(angle_rad)

def calculate_torso_vertical_angle(
    shoulder: Tuple[float, float],
    hip: Tuple[float, float]
) -> float:
    """
    Calculates the deviation angle (in degrees) of the torso from vertical plumb line.
    0 degrees means perfectly upright torso.
    """
    dx = shoulder[0] - hip[0]
    dy = hip[1] - shoulder[1]  # Y increases downward in image space

    if dy == 0 and dx == 0:
        return 0.0

    angle_rad = math.atan2(abs(dx), max(0.0001, dy))
    return math.degrees(angle_rad)

def check_landmarks_visibility(
    landmarks: Dict[int, Dict[str, float]],
    required_indices: List[int],
    min_visibility: float = 0.5
) -> Tuple[bool, List[int]]:
    """
    Checks if all required landmark indices are present with visibility/confidence >= min_visibility.
    Returns (all_visible, missing_indices).
    """
    missing = []
    for idx in required_indices:
        lm = landmarks.get(idx)
        if not lm or lm.get("visibility", 1.0) < min_visibility:
            missing.append(idx)
    return (len(missing) == 0, missing)

def smooth_landmarks(
    current: Dict[int, Dict[str, float]],
    previous: Optional[Dict[int, Dict[str, float]]],
    alpha: float = 0.65
) -> Dict[int, Dict[str, float]]:
    """
    Applies exponential moving average (EMA) smoothing to landmark coordinates.
    alpha is the weight for the current measurement.
    """
    if not previous:
        return current

    smoothed: Dict[int, Dict[str, float]] = {}
    for idx, lm in current.items():
        if idx in previous:
            prev = previous[idx]
            smoothed[idx] = {
                "x": alpha * lm["x"] + (1 - alpha) * prev["x"],
                "y": alpha * lm["y"] + (1 - alpha) * prev["y"],
                "z": alpha * lm.get("z", 0.0) + (1 - alpha) * prev.get("z", 0.0),
                "visibility": lm.get("visibility", 1.0)
            }
        else:
            smoothed[idx] = lm
    return smoothed
