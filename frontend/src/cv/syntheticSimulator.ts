import { Landmark } from './geometry';
import {
  LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW,
  LEFT_WRIST, RIGHT_WRIST, LEFT_HIP, RIGHT_HIP,
  LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE
} from './exercises';

export function getBaseSyntheticPose(): Record<number, Landmark> {
  return {
    [LEFT_SHOULDER]: { x: 0.44, y: 0.28, z: 0.0, visibility: 0.99 },
    [RIGHT_SHOULDER]: { x: 0.56, y: 0.28, z: 0.0, visibility: 0.99 },
    [LEFT_ELBOW]: { x: 0.40, y: 0.46, z: 0.0, visibility: 0.99 },
    [RIGHT_ELBOW]: { x: 0.60, y: 0.46, z: 0.0, visibility: 0.99 },
    [LEFT_WRIST]: { x: 0.40, y: 0.64, z: 0.0, visibility: 0.99 },
    [RIGHT_WRIST]: { x: 0.60, y: 0.64, z: 0.0, visibility: 0.99 },
    [LEFT_HIP]: { x: 0.45, y: 0.52, z: 0.0, visibility: 0.99 },
    [RIGHT_HIP]: { x: 0.55, y: 0.52, z: 0.0, visibility: 0.99 },
    [LEFT_KNEE]: { x: 0.45, y: 0.72, z: 0.0, visibility: 0.99 },
    [RIGHT_KNEE]: { x: 0.55, y: 0.72, z: 0.0, visibility: 0.99 },
    [LEFT_ANKLE]: { x: 0.45, y: 0.91, z: 0.0, visibility: 0.99 },
    [RIGHT_ANKLE]: { x: 0.55, y: 0.91, z: 0.0, visibility: 0.99 },
  };
}

export function getSimulatedFrameForExercise(
  exerciseCode: string,
  progress0to1: number,
  simulateError: boolean = false
): Record<number, Landmark> {
  const pose = getBaseSyntheticPose();
  // Harmonic cycle: 0 -> 1 -> 0
  const t = Math.sin(Math.PI * progress0to1);

  if (exerciseCode === 'squat') {
    const depth = simulateError ? 0.48 : 1.0; // Imperfect depth if simulateError
    pose[LEFT_HIP].y = 0.52 + 0.19 * t * depth;
    pose[LEFT_HIP].x = 0.45 - 0.07 * t * depth;
    pose[RIGHT_HIP].y = 0.52 + 0.19 * t * depth;
    pose[RIGHT_HIP].x = 0.55 - 0.07 * t * depth;

    pose[LEFT_KNEE].y = 0.72 + 0.03 * t * depth;
    pose[LEFT_KNEE].x = 0.45 + 0.11 * t * depth;
    pose[RIGHT_KNEE].y = 0.72 + 0.03 * t * depth;
    pose[RIGHT_KNEE].x = 0.55 + 0.11 * t * depth;

    if (simulateError && progress0to1 > 0.4 && progress0to1 < 0.8) {
      // simulate excessive torso lean
      pose[LEFT_SHOULDER].x = 0.44 + 0.22 * t;
      pose[RIGHT_SHOULDER].x = 0.56 + 0.22 * t;
    }
  } else if (exerciseCode === 'shoulder_abduction') {
    const targetDeg = simulateError ? 58 : 90;
    const rad = (Math.PI / 180) * (t * targetDeg);
    const armLen = 0.20;
    const forearmLen = 0.18;

    pose[LEFT_ELBOW].x = pose[LEFT_SHOULDER].x - armLen * Math.sin(rad);
    pose[LEFT_ELBOW].y = pose[LEFT_SHOULDER].y + armLen * Math.cos(rad);

    pose[LEFT_WRIST].x = pose[LEFT_ELBOW].x - forearmLen * Math.sin(rad);
    pose[LEFT_WRIST].y = pose[LEFT_ELBOW].y + forearmLen * Math.cos(rad);
  } else if (exerciseCode === 'bicep_curl') {
    const targetElbowDeg = simulateError ? 95 : 45;
    const currentAngle = 160 - t * (160 - targetElbowDeg);
    const rad = (Math.PI / 180) * (180 - currentAngle);

    pose[LEFT_WRIST].x = pose[LEFT_ELBOW].x - 0.04 * Math.sin(rad);
    pose[LEFT_WRIST].y = pose[LEFT_ELBOW].y - 0.18 * Math.cos(rad);
  } else if (exerciseCode === 'sit_to_stand') {
    const standPct = simulateError ? 0.65 : 1.0;
    // Starts seated (low hips, bent knees)
    const initialKneeFlex = 0.18;
    pose[LEFT_HIP].y = 0.66 - 0.14 * t * standPct;
    pose[RIGHT_HIP].y = 0.66 - 0.14 * t * standPct;
    pose[LEFT_KNEE].x = 0.45 + initialKneeFlex * (1 - t * standPct);
    pose[RIGHT_KNEE].x = 0.55 + initialKneeFlex * (1 - t * standPct);
  }

  return pose;
}
