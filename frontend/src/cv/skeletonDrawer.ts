import { Landmark } from './geometry';

// POSE CONNECTIONS for complete 33-landmark skeleton
export const POSE_CONNECTIONS: [number, number][] = [
  // Head & Face
  [0, 1], [1, 2], [2, 3], [3, 7],      // Left eye/ear
  [0, 4], [4, 5], [5, 6], [6, 8],      // Right eye/ear
  [9, 10],                             // Mouth
  [11, 12],                            // Shoulders line

  // Torso
  [11, 23],                            // Left shoulder to left hip
  [12, 24],                            // Right shoulder to right hip
  [23, 24],                            // Hips line

  // Left Arm
  [11, 13],                            // Left shoulder to left elbow
  [13, 15],                            // Left elbow to left wrist
  [15, 17], [15, 19], [15, 21], [17, 19], // Left hand/fingers

  // Right Arm
  [12, 14],                            // Right shoulder to right elbow
  [14, 16],                            // Right elbow to right wrist
  [16, 18], [16, 20], [16, 22], [18, 20], // Right hand/fingers

  // Left Leg
  [23, 25],                            // Left hip to left knee
  [25, 27],                            // Left knee to left ankle
  [27, 29], [29, 31], [27, 31],        // Left ankle, heel, foot index

  // Right Leg
  [24, 26],                            // Right hip to right knee
  [26, 28],                            // Right knee to right ankle
  [28, 30], [30, 32], [28, 32],        // Right ankle, heel, foot index
];

export interface DrawOptions {
  activeJointIndex?: number;
  activeAngleDeg?: number | null;
  targetAngleMin?: number;
  targetAngleMax?: number;
  isMirrored?: boolean;
  highlightSide?: 'left' | 'right' | 'both';
  statusColor?: string;
  showConfidence?: boolean;
}

export function drawSkeletonOnCanvas(
  ctx: CanvasRenderingContext2D,
  landmarks: Record<number, Landmark>,
  width: number,
  height: number,
  options: DrawOptions = {}
) {
  const {
    activeJointIndex,
    activeAngleDeg,
    isMirrored = true,
    highlightSide = 'both',
    statusColor = '#22c55e',
    showConfidence = false
  } = options;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Helper to map normalized coordinates to canvas pixels
  const getPixel = (lm: Landmark) => {
    let x = lm.x * width;
    if (isMirrored) {
      x = (1.0 - lm.x) * width;
    }
    const y = lm.y * height;
    return { x, y };
  };

  // 1. Draw Connection Lines (Bones)
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const lmStart = landmarks[startIdx];
    const lmEnd = landmarks[endIdx];

    if (!lmStart || !lmEnd) continue;
    const visStart = lmStart.visibility ?? 1.0;
    const visEnd = lmEnd.visibility ?? 1.0;
    if (visStart < 0.4 || visEnd < 0.4) continue;

    const pStart = getPixel(lmStart);
    const pEnd = getPixel(lmEnd);

    // Side discrimination (left body points are odd, right body points are even)
    const isLeft = startIdx % 2 === 1 && endIdx % 2 === 1;
    const isRight = startIdx % 2 === 0 && endIdx % 2 === 0;
    const isHighlighted =
      (highlightSide === 'left' && isLeft) ||
      (highlightSide === 'right' && isRight) ||
      highlightSide === 'both';

    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.lineWidth = isHighlighted ? 4.5 : 2.5;
    ctx.strokeStyle = isHighlighted ? statusColor : 'rgba(255, 255, 255, 0.4)';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // 2. Draw Landmark Dots
  for (const [idxStr, lm] of Object.entries(landmarks)) {
    const idx = Number(idxStr);
    const vis = lm.visibility ?? 1.0;
    if (vis < 0.4) continue;

    const p = getPixel(lm);
    const isActiveJoint = idx === activeJointIndex;

    ctx.beginPath();
    ctx.arc(p.x, p.y, isActiveJoint ? 9 : 4.5, 0, 2 * Math.PI);

    if (isActiveJoint) {
      ctx.fillStyle = statusColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = statusColor;
      ctx.shadowBlur = 14;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(22, 101, 52, 0.9)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
    }

    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Confidence debug dots if requested
    if (showConfidence) {
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`${Math.round(vis * 100)}%`, p.x + 6, p.y - 6);
    }
  }

  // 3. Draw Joint Angle Badge at Active Joint
  if (
    activeJointIndex !== undefined &&
    landmarks[activeJointIndex] &&
    activeAngleDeg !== undefined &&
    activeAngleDeg !== null
  ) {
    const activeLm = landmarks[activeJointIndex];
    const p = getPixel(activeLm);

    const badgeText = `${Math.round(activeAngleDeg)}°`;
    ctx.font = 'bold 16px Inter, sans-serif';
    const textWidth = ctx.measureText(badgeText).width;

    const boxX = p.x + 16;
    const boxY = p.y - 14;
    const padding = 7;

    // Glowing badge background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY - 14, textWidth + padding * 2, 26, 8);
    ctx.fill();

    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Badge text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeText, boxX + padding, boxY + 4);

    // Draw active joint highlight ring
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, 2 * Math.PI);
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}
