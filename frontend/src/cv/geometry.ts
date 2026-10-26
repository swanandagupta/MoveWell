export interface Point2D {
  x: number;
  y: number;
}

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * Calculates the interior angle in degrees at vertex B formed by line segments BA and BC.
 * Reusable function calculateAngle(A, B, C) where B is the joint.
 */
export function calculateAngle(
  a: Point2D | Landmark | null | undefined,
  b: Point2D | Landmark | null | undefined,
  c: Point2D | Landmark | null | undefined
): number {
  if (!a || !b || !c) return 0;

  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const magBA = Math.sqrt(baX * baX + baY * baY);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY);

  if (magBA === 0 || magBC === 0) return 0;

  const dot = baX * bcX + baY * bcY;
  const cosine = Math.max(-1.0, Math.min(1.0, dot / (magBA * magBC)));
  return (Math.acos(cosine) * 180.0) / Math.PI;
}

export const calculateAngle2D = calculateAngle;

/**
 * Calculates the deviation angle (degrees) of the torso line from the vertical plumb line.
 * 0° is perfectly upright vertical.
 */
export function calculateTorsoVerticalAngle(
  shoulder: Point2D | Landmark | null | undefined,
  hip: Point2D | Landmark | null | undefined
): number {
  if (!shoulder || !hip) return 0;

  const dx = shoulder.x - hip.x;
  const dy = hip.y - shoulder.y; // In screen space, y increases downwards

  if (dy === 0 && dx === 0) return 0;
  return (Math.atan2(Math.abs(dx), Math.max(0.0001, dy)) * 180.0) / Math.PI;
}

/**
 * Checks visibility for required landmarks.
 */
export function checkLandmarksVisibility(
  landmarks: Record<number, Landmark>,
  requiredIndices: number[],
  minVisibility: number = 0.5
): { allVisible: boolean; missing: number[] } {
  const missing: number[] = [];
  for (const idx of requiredIndices) {
    const lm = landmarks[idx];
    if (!lm || (lm.visibility !== undefined && lm.visibility < minVisibility)) {
      missing.push(idx);
    }
  }
  return { allVisible: missing.length === 0, missing };
}

/**
 * Exponential Moving Average (EMA) smoothing for coordinates.
 */
export function smoothLandmarks(
  current: Record<number, Landmark>,
  previous: Record<number, Landmark> | null,
  alpha: number = 0.65
): Record<number, Landmark> {
  if (!previous) return current;

  const smoothed: Record<number, Landmark> = {};
  for (const key of Object.keys(current)) {
    const idx = Number(key);
    const curr = current[idx];
    const prev = previous[idx];
    if (prev && curr) {
      smoothed[idx] = {
        x: alpha * curr.x + (1 - alpha) * prev.x,
        y: alpha * curr.y + (1 - alpha) * prev.y,
        z: curr.z !== undefined && prev.z !== undefined ? alpha * curr.z + (1 - alpha) * prev.z : curr.z,
        visibility: curr.visibility
      };
    } else {
      smoothed[idx] = curr;
    }
  }
  return smoothed;
}
