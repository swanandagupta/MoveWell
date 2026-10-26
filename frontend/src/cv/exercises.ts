import { calculateAngle, calculateTorsoVerticalAngle, checkLandmarksVisibility, Landmark } from './geometry';

export const NOSE = 0;
export const LEFT_SHOULDER = 11;
export const RIGHT_SHOULDER = 12;
export const LEFT_ELBOW = 13;
export const RIGHT_ELBOW = 14;
export const LEFT_WRIST = 15;
export const RIGHT_WRIST = 16;
export const LEFT_HIP = 23;
export const RIGHT_HIP = 24;
export const LEFT_KNEE = 25;
export const RIGHT_KNEE = 26;
export const LEFT_ANKLE = 27;
export const RIGHT_ANKLE = 28;

export type ExerciseState =
  | 'READY'
  | 'STANDING'
  | 'DESCENDING'
  | 'BOTTOM'
  | 'ASCENDING'
  | 'IN_PROGRESS'
  | 'PEAK'
  | 'RETURNING'
  | 'COMPLETED';

export interface ExerciseStats {
  exerciseCode: string;
  exerciseName: string;
  validReps: number;
  invalidAttempts: number;
  accuracyPct: number;
  state: ExerciseState;
  feedback: string;
  feedbackType: 'info' | 'success' | 'warning' | 'correction';
  formStatus: 'GOOD' | 'CORRECTION_NEEDED' | 'STANDBY';

  // Measurements (null if person/landmarks not present)
  currentAngle: number | null;
  detectedJointName: string;
  leftKneeAngle: number | null;
  rightKneeAngle: number | null;
  hipAngle: number | null;
  torsoAngle: number | null;

  // Tracking flags
  personDetected: boolean;
  fullBodyVisible: boolean;
  missingLandmarks: number[];
  activeSide: 'left' | 'right' | 'both';

  // Rep event triggers
  isRepCompleted?: boolean;
  lastRepValid?: boolean;
  newLogEntry?: { type: 'valid' | 'flaw' | 'info'; text: string; time: string };
  formBreakdown: Record<string, number>;
}

export abstract class BaseExerciseEvaluator {
  exerciseCode: string;
  name: string;
  validReps: number = 0;
  invalidAttempts: number = 0;
  state: ExerciseState = 'READY';
  feedback: string = 'Step into camera view';
  feedbackType: 'info' | 'success' | 'warning' | 'correction' = 'info';
  formStatus: 'GOOD' | 'CORRECTION_NEEDED' | 'STANDBY' = 'STANDBY';

  currentAngle: number | null = null;
  leftKneeAngle: number | null = null;
  rightKneeAngle: number | null = null;
  hipAngle: number | null = null;
  torsoAngle: number | null = null;

  personDetected: boolean = false;
  fullBodyVisible: boolean = false;
  missingLandmarks: number[] = [];
  activeSide: 'left' | 'right' | 'both' = 'both';
  detectedJointName: string = 'Joint';

  formBreakdown: Record<string, number> = {};
  repIssues: string[] = [];
  lastRepValid?: boolean;

  constructor(code: string, name: string, jointName: string) {
    this.exerciseCode = code;
    this.name = name;
    this.detectedJointName = jointName;
  }

  reset() {
    this.validReps = 0;
    this.invalidAttempts = 0;
    this.state = 'READY';
    this.feedback = 'Stand in position facing camera';
    this.feedbackType = 'info';
    this.formStatus = 'STANDBY';
    this.currentAngle = null;
    this.leftKneeAngle = null;
    this.rightKneeAngle = null;
    this.hipAngle = null;
    this.torsoAngle = null;
    this.personDetected = false;
    this.fullBodyVisible = false;
    this.missingLandmarks = [];
    this.formBreakdown = {};
    this.repIssues = [];
    this.lastRepValid = undefined;
  }

  abstract processFrame(landmarks: Record<number, Landmark> | null | undefined): ExerciseStats;

  getStats(
    isRepCompleted: boolean = false,
    newLogEntry?: { type: 'valid' | 'flaw' | 'info'; text: string; time: string }
  ): ExerciseStats {
    const total = this.validReps + this.invalidAttempts;
    const accuracy = total > 0 ? (this.validReps / total) * 100 : 0;
    return {
      exerciseCode: this.exerciseCode,
      exerciseName: this.name,
      validReps: this.validReps,
      invalidAttempts: this.invalidAttempts,
      accuracyPct: Math.round(accuracy * 10) / 10,
      state: this.state,
      feedback: this.feedback,
      feedbackType: this.feedbackType,
      formStatus: this.formStatus,
      currentAngle: this.currentAngle !== null ? Math.round(this.currentAngle) : null,
      detectedJointName: this.detectedJointName,
      leftKneeAngle: this.leftKneeAngle !== null ? Math.round(this.leftKneeAngle) : null,
      rightKneeAngle: this.rightKneeAngle !== null ? Math.round(this.rightKneeAngle) : null,
      hipAngle: this.hipAngle !== null ? Math.round(this.hipAngle) : null,
      torsoAngle: this.torsoAngle !== null ? Math.round(this.torsoAngle) : null,
      personDetected: this.personDetected,
      fullBodyVisible: this.fullBodyVisible,
      missingLandmarks: this.missingLandmarks,
      activeSide: this.activeSide,
      isRepCompleted,
      lastRepValid: this.lastRepValid,
      newLogEntry,
      formBreakdown: { ...this.formBreakdown }
    };
  }
}

/**
 * 1. Bodyweight Squat Evaluator
 * State sequence:
 * READY -> STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> STANDING -> (VALID REP +1)
 */
export class SquatEvaluator extends BaseExerciseEvaluator {
  private minKneeAngleAchieved: number = 180;
  private attemptCount: number = 0;

  constructor() {
    super('squat', 'Bodyweight Squat', 'Knee');
  }

  processFrame(landmarks: Record<number, Landmark> | null | undefined): ExerciseStats {
    if (!landmarks || Object.keys(landmarks).length === 0) {
      this.personDetected = false;
      this.fullBodyVisible = false;
      this.currentAngle = null;
      this.leftKneeAngle = null;
      this.rightKneeAngle = null;
      this.hipAngle = null;
      this.torsoAngle = null;
      this.feedback = 'No person detected. Step into camera view.';
      this.feedbackType = 'warning';
      this.formStatus = 'STANDBY';
      return this.getStats();
    }

    this.personDetected = true;

    // Check visibility of critical squat landmarks
    const required = [LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE];
    const { allVisible, missing } = checkLandmarksVisibility(landmarks, required, 0.45);
    this.missingLandmarks = missing;

    if (!allVisible) {
      this.fullBodyVisible = false;
      this.currentAngle = null;
      this.feedback = 'Full body not visible. Step farther back so hips, knees and ankles show.';
      this.feedbackType = 'warning';
      this.formStatus = 'STANDBY';
      return this.getStats();
    }

    this.fullBodyVisible = true;

    // Compute Left and Right angles
    const leftKnee = calculateAngle(landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]);
    const rightKnee = calculateAngle(landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]);
    const leftHip = calculateAngle(landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP], landmarks[LEFT_KNEE]);
    const torso = calculateTorsoVerticalAngle(landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP]);

    this.leftKneeAngle = leftKnee;
    this.rightKneeAngle = rightKnee;
    this.hipAngle = leftHip;
    this.torsoAngle = torso;

    // Active knee angle (use average or more prominent side)
    const kneeAngle = (leftKnee + rightKnee) / 2.0;
    this.currentAngle = kneeAngle;

    let repFinished = false;
    let newLog: { type: 'valid' | 'flaw' | 'info'; text: string; time: string } | undefined = undefined;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Squat Finite-State Machine
    if (this.state === 'READY' || this.state === 'STANDING') {
      if (kneeAngle >= 155) {
        this.state = 'STANDING';
        this.feedback = 'Standing upright. Ready — begin descent.';
        this.feedbackType = 'info';
        this.formStatus = 'GOOD';
      } else if (kneeAngle < 140) {
        this.state = 'DESCENDING';
        this.attemptCount += 1;
        this.minKneeAngleAchieved = kneeAngle;
        this.repIssues = [];
        this.feedback = 'Squatting down. Keep chest proud and push hips back.';
        this.feedbackType = 'info';
        this.formStatus = 'GOOD';
      }
    } else if (this.state === 'DESCENDING') {
      if (kneeAngle < this.minKneeAngleAchieved) {
        this.minKneeAngleAchieved = kneeAngle;
      }

      // Check excessive forward lean during descent
      if (torso > 45 && !this.repIssues.includes('excessive_torso_lean')) {
        this.repIssues.push('excessive_torso_lean');
        this.feedback = 'Keep your chest upright — avoid leaning forward.';
        this.feedbackType = 'correction';
        this.formStatus = 'CORRECTION_NEEDED';
      }

      // Check if parallel/proper depth reached
      if (kneeAngle <= 100) {
        this.state = 'BOTTOM';
        this.feedback = 'Great depth! Hold steady, then drive through heels to rise.';
        this.feedbackType = 'success';
        this.formStatus = 'GOOD';
      } else if (kneeAngle > this.minKneeAngleAchieved + 15 && kneeAngle > 125) {
        // Reversed upward prematurely without reaching 100° depth!
        this.state = 'ASCENDING';
        if (!this.repIssues.includes('incomplete_depth')) {
          this.repIssues.push('incomplete_depth');
          this.feedback = 'Go a little lower for full depth.';
          this.feedbackType = 'correction';
          this.formStatus = 'CORRECTION_NEEDED';
        }
      }
    } else if (this.state === 'BOTTOM') {
      if (kneeAngle < this.minKneeAngleAchieved) {
        this.minKneeAngleAchieved = kneeAngle;
      }
      if (kneeAngle > 115) {
        this.state = 'ASCENDING';
        this.feedback = 'Drive upward to full standing position.';
        this.feedbackType = 'info';
      }
    } else if (this.state === 'ASCENDING') {
      if (kneeAngle >= 155) {
        // Returned to top standing position!
        repFinished = true;
        const reachedDepth = this.minKneeAngleAchieved <= 102;
        const noSevereTorsoLean = !this.repIssues.includes('excessive_torso_lean');

        if (reachedDepth && noSevereTorsoLean) {
          this.validReps += 1;
          this.lastRepValid = true;
          this.feedback = `Rep ${this.validReps} counted! Excellent squat form.`;
          this.feedbackType = 'success';
          this.formStatus = 'GOOD';
          newLog = {
            type: 'valid',
            text: `✓ Good squat depth (Rep ${this.validReps})`,
            time: nowTime
          };
        } else {
          this.invalidAttempts += 1;
          this.lastRepValid = false;
          const reason = !reachedDepth ? 'Insufficient depth' : 'Excessive forward lean';
          this.feedback = `Rep attempt not counted: ${reason}.`;
          this.feedbackType = 'correction';
          this.formStatus = 'CORRECTION_NEEDED';
          newLog = {
            type: 'flaw',
            text: `⚠ ${reason} — Rep attempt ${this.attemptCount}`,
            time: nowTime
          };
        }

        // Record breakdown flaws
        for (const issue of this.repIssues) {
          this.formBreakdown[issue] = (this.formBreakdown[issue] || 0) + 1;
        }

        this.state = 'STANDING';
        this.minKneeAngleAchieved = 180;
        this.repIssues = [];
      }
    }

    return this.getStats(repFinished, newLog);
  }
}

/**
 * 2. Standing Shoulder Abduction Evaluator
 */
export class ShoulderAbductionEvaluator extends BaseExerciseEvaluator {
  private maxShoulderAngleAchieved: number = 0;
  private attemptCount: number = 0;

  constructor() {
    super('shoulder_abduction', 'Standing Shoulder Abduction', 'Shoulder');
  }

  processFrame(landmarks: Record<number, Landmark> | null | undefined): ExerciseStats {
    if (!landmarks || Object.keys(landmarks).length === 0) {
      this.personDetected = false;
      this.fullBodyVisible = false;
      this.currentAngle = null;
      this.feedback = 'No person detected. Step into camera view.';
      this.feedbackType = 'warning';
      this.formStatus = 'STANDBY';
      return this.getStats();
    }

    this.personDetected = true;
    const required = [LEFT_HIP, RIGHT_HIP, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW];
    const { allVisible, missing } = checkLandmarksVisibility(landmarks, required, 0.4);
    this.missingLandmarks = missing;

    if (!allVisible) {
      this.fullBodyVisible = false;
      this.currentAngle = null;
      this.feedback = 'Torso and arms must be visible. Step back slightly.';
      this.feedbackType = 'warning';
      this.formStatus = 'STANDBY';
      return this.getStats();
    }

    this.fullBodyVisible = true;

    const leftAngle = calculateAngle(landmarks[LEFT_HIP], landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW]);
    const rightAngle = calculateAngle(landmarks[RIGHT_HIP], landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW]);

    // Track whichever arm is actively elevated
    const side = leftAngle > rightAngle ? 'left' : 'right';
    this.activeSide = side;
    const shoulderAngle = side === 'left' ? leftAngle : rightAngle;
    this.currentAngle = shoulderAngle;

    let repFinished = false;
    let newLog: { type: 'valid' | 'flaw' | 'info'; text: string; time: string } | undefined = undefined;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (this.state === 'READY' || this.state === 'STANDING') {
      if (shoulderAngle < 35) {
        this.state = 'STANDING';
        this.feedback = 'Arms at sides. Raise arm laterally to 90°.';
        this.feedbackType = 'info';
        this.formStatus = 'GOOD';
      } else if (shoulderAngle > 45) {
        this.state = 'IN_PROGRESS';
        this.attemptCount += 1;
        this.maxShoulderAngleAchieved = shoulderAngle;
        this.repIssues = [];
        this.feedback = 'Raising arm: Lift to shoulder level.';
        this.feedbackType = 'info';
        this.formStatus = 'GOOD';
      }
    } else if (this.state === 'IN_PROGRESS') {
      if (shoulderAngle > this.maxShoulderAngleAchieved) {
        this.maxShoulderAngleAchieved = shoulderAngle;
      }

      if (shoulderAngle >= 80 && shoulderAngle <= 100) {
        this.state = 'PEAK';
        this.feedback = 'Good elevation! Hold momentarily, then lower smoothly.';
        this.feedbackType = 'success';
        this.formStatus = 'GOOD';
      } else if (shoulderAngle > 115 && !this.repIssues.includes('over_elevation')) {
        this.repIssues.push('over_elevation');
        this.feedback = 'Do not raise past shoulder level.';
        this.feedbackType = 'warning';
        this.formStatus = 'CORRECTION_NEEDED';
      } else if (shoulderAngle < this.maxShoulderAngleAchieved - 15) {
        // Turned down early before reaching 78°
        this.state = 'RETURNING';
        if (!this.repIssues.includes('insufficient_height')) {
          this.repIssues.push('insufficient_height');
          this.feedback = 'Raise arm higher to shoulder level.';
          this.feedbackType = 'correction';
          this.formStatus = 'CORRECTION_NEEDED';
        }
      }
    } else if (this.state === 'PEAK') {
      if (shoulderAngle > this.maxShoulderAngleAchieved) {
        this.maxShoulderAngleAchieved = shoulderAngle;
      }
      if (shoulderAngle < 65) {
        this.state = 'RETURNING';
        this.feedback = 'Lower arm under control back to side.';
        this.feedbackType = 'info';
      }
    } else if (this.state === 'RETURNING') {
      if (shoulderAngle <= 35) {
        repFinished = true;
        const reachedHeight = this.maxShoulderAngleAchieved >= 78;
        const notOverElevated = !this.repIssues.includes('over_elevation');

        if (reachedHeight && notOverElevated) {
          this.validReps += 1;
          this.lastRepValid = true;
          this.feedback = `Rep ${this.validReps} counted! Smooth lateral raise.`;
          this.feedbackType = 'success';
          this.formStatus = 'GOOD';
          newLog = {
            type: 'valid',
            text: `✓ Good shoulder elevation (Rep ${this.validReps})`,
            time: nowTime
          };
        } else {
          this.invalidAttempts += 1;
          this.lastRepValid = false;
          const reason = !reachedHeight ? 'Insufficient height' : 'Raised past shoulder level';
          this.feedback = `Rep attempt not counted: ${reason}.`;
          this.feedbackType = 'correction';
          this.formStatus = 'CORRECTION_NEEDED';
          newLog = {
            type: 'flaw',
            text: `⚠ ${reason} — Rep attempt ${this.attemptCount}`,
            time: nowTime
          };
        }

        for (const issue of this.repIssues) {
          this.formBreakdown[issue] = (this.formBreakdown[issue] || 0) + 1;
        }

        this.state = 'STANDING';
        this.maxShoulderAngleAchieved = 0;
        this.repIssues = [];
      }
    }

    return this.getStats(repFinished, newLog);
  }
}

/**
 * 3. Bicep Curl Evaluator
 */
export class BicepCurlEvaluator extends BaseExerciseEvaluator {
  private minElbowAngleAchieved: number = 180;
  private attemptCount: number = 0;

  constructor() {
    super('bicep_curl', 'Bicep Curl', 'Elbow');
  }

  processFrame(landmarks: Record<number, Landmark> | null | undefined): ExerciseStats {
    if (!landmarks || Object.keys(landmarks).length === 0) {
      this.personDetected = false;
      this.fullBodyVisible = false;
      this.currentAngle = null;
      this.feedback = 'No person detected. Step into camera view.';
      this.feedbackType = 'warning';
      this.formStatus = 'STANDBY';
      return this.getStats();
    }

    this.personDetected = true;
    const required = [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW, LEFT_WRIST, RIGHT_WRIST];
    const { allVisible, missing } = checkLandmarksVisibility(landmarks, required, 0.4);
    this.missingLandmarks = missing;

    if (!allVisible) {
      this.fullBodyVisible = false;
      this.currentAngle = null;
      this.feedback = 'Shoulders, elbows and wrists must be in frame.';
      this.feedbackType = 'warning';
      this.formStatus = 'STANDBY';
      return this.getStats();
    }

    this.fullBodyVisible = true;

    const leftElbow = calculateAngle(landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST]);
    const rightElbow = calculateAngle(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST]);

    const side = leftElbow < rightElbow ? 'left' : 'right';
    this.activeSide = side;
    const elbowAngle = side === 'left' ? leftElbow : rightElbow;
    this.currentAngle = elbowAngle;

    let repFinished = false;
    let newLog: { type: 'valid' | 'flaw' | 'info'; text: string; time: string } | undefined = undefined;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (this.state === 'READY' || this.state === 'STANDING') {
      if (elbowAngle > 145) {
        this.state = 'STANDING';
        this.feedback = 'Arm extended. Curl weight toward shoulder.';
        this.feedbackType = 'info';
        this.formStatus = 'GOOD';
      } else if (elbowAngle < 130) {
        this.state = 'IN_PROGRESS';
        this.attemptCount += 1;
        this.minElbowAngleAchieved = elbowAngle;
        this.repIssues = [];
        this.feedback = 'Curling upward: Pin elbow to side.';
        this.feedbackType = 'info';
        this.formStatus = 'GOOD';
      }
    } else if (this.state === 'IN_PROGRESS') {
      if (elbowAngle < this.minElbowAngleAchieved) {
        this.minElbowAngleAchieved = elbowAngle;
      }

      if (elbowAngle <= 55) {
        this.state = 'PEAK';
        this.feedback = 'Full contraction! Now lower slowly in control.';
        this.feedbackType = 'success';
        this.formStatus = 'GOOD';
      } else if (elbowAngle > this.minElbowAngleAchieved + 15) {
        this.state = 'RETURNING';
        if (!this.repIssues.includes('incomplete_curl')) {
          this.repIssues.push('incomplete_curl');
          this.feedback = 'Bend elbow further to complete curl.';
          this.feedbackType = 'correction';
          this.formStatus = 'CORRECTION_NEEDED';
        }
      }
    } else if (this.state === 'PEAK') {
      if (elbowAngle < this.minElbowAngleAchieved) {
        this.minElbowAngleAchieved = elbowAngle;
      }
      if (elbowAngle > 80) {
        this.state = 'RETURNING';
        this.feedback = 'Extend arm all the way down.';
        this.feedbackType = 'info';
      }
    } else if (this.state === 'RETURNING') {
      if (elbowAngle >= 145) {
        repFinished = true;
        const reachedFullCurl = this.minElbowAngleAchieved <= 62;

        if (reachedFullCurl) {
          this.validReps += 1;
          this.lastRepValid = true;
          this.feedback = `Rep ${this.validReps} counted! Full bicep range of motion.`;
          this.feedbackType = 'success';
          this.formStatus = 'GOOD';
          newLog = {
            type: 'valid',
            text: `✓ Good bicep curl (Rep ${this.validReps})`,
            time: nowTime
          };
        } else {
          this.invalidAttempts += 1;
          this.lastRepValid = false;
          this.feedback = 'Rep not counted: Curl all the way up.';
          this.feedbackType = 'correction';
          this.formStatus = 'CORRECTION_NEEDED';
          newLog = {
            type: 'flaw',
            text: `⚠ Incomplete curl — Rep attempt ${this.attemptCount}`,
            time: nowTime
          };
        }

        for (const issue of this.repIssues) {
          this.formBreakdown[issue] = (this.formBreakdown[issue] || 0) + 1;
        }

        this.state = 'STANDING';
        this.minElbowAngleAchieved = 180;
        this.repIssues = [];
      }
    }

    return this.getStats(repFinished, newLog);
  }
}

/**
 * 4. Sit-to-Stand Evaluator
 */
export class SitToStandEvaluator extends BaseExerciseEvaluator {
  private maxKneeExtensionAchieved: number = 0;
  private attemptCount: number = 0;

  constructor() {
    super('sit_to_stand', 'Sit-to-Stand Test', 'Knee');
  }

  processFrame(landmarks: Record<number, Landmark> | null | undefined): ExerciseStats {
    if (!landmarks || Object.keys(landmarks).length === 0) {
      this.personDetected = false;
      this.fullBodyVisible = false;
      this.currentAngle = null;
      this.feedback = 'No person detected. Step into camera view.';
      this.feedbackType = 'warning';
      this.formStatus = 'STANDBY';
      return this.getStats();
    }

    this.personDetected = true;
    const required = [LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE];
    const { allVisible, missing } = checkLandmarksVisibility(landmarks, required, 0.4);
    this.missingLandmarks = missing;

    if (!allVisible) {
      this.fullBodyVisible = false;
      this.currentAngle = null;
      this.feedback = 'Position chair in camera view with hips and knees visible.';
      this.feedbackType = 'warning';
      this.formStatus = 'STANDBY';
      return this.getStats();
    }

    this.fullBodyVisible = true;

    const leftKnee = calculateAngle(landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]);
    const rightKnee = calculateAngle(landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]);
    const kneeAngle = (leftKnee + rightKnee) / 2.0;
    this.currentAngle = kneeAngle;

    let repFinished = false;
    let newLog: { type: 'valid' | 'flaw' | 'info'; text: string; time: string } | undefined = undefined;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (this.state === 'READY' || this.state === 'STANDING') {
      if (kneeAngle <= 110) {
        this.state = 'STANDING'; // Seated ready
        this.feedback = 'Seated ready. Stand up fully to upright posture.';
        this.feedbackType = 'info';
        this.formStatus = 'GOOD';
      } else if (kneeAngle > 120) {
        this.state = 'IN_PROGRESS';
        this.attemptCount += 1;
        this.maxKneeExtensionAchieved = kneeAngle;
        this.repIssues = [];
        this.feedback = 'Rising up: Stand to full height.';
        this.feedbackType = 'info';
        this.formStatus = 'GOOD';
      }
    } else if (this.state === 'IN_PROGRESS') {
      if (kneeAngle > this.maxKneeExtensionAchieved) {
        this.maxKneeExtensionAchieved = kneeAngle;
      }

      if (kneeAngle >= 165) {
        this.state = 'PEAK';
        this.feedback = 'Fully upright! Lower back onto chair in control.';
        this.feedbackType = 'success';
        this.formStatus = 'GOOD';
      } else if (kneeAngle < this.maxKneeExtensionAchieved - 15) {
        this.state = 'RETURNING';
        if (!this.repIssues.includes('incomplete_stand')) {
          this.repIssues.push('incomplete_stand');
          this.feedback = 'Stand up completely to full height.';
          this.feedbackType = 'correction';
          this.formStatus = 'CORRECTION_NEEDED';
        }
      }
    } else if (this.state === 'PEAK') {
      if (kneeAngle > this.maxKneeExtensionAchieved) {
        this.maxKneeExtensionAchieved = kneeAngle;
      }
      if (kneeAngle < 135) {
        this.state = 'RETURNING';
        this.feedback = 'Lower yourself slowly onto chair.';
        this.feedbackType = 'info';
      }
    } else if (this.state === 'RETURNING') {
      if (kneeAngle <= 105) {
        repFinished = true;
        const reachedFullStand = this.maxKneeExtensionAchieved >= 160;

        if (reachedFullStand) {
          this.validReps += 1;
          this.lastRepValid = true;
          this.feedback = `Rep ${this.validReps} counted! Solid sit-to-stand.`;
          this.feedbackType = 'success';
          this.formStatus = 'GOOD';
          newLog = {
            type: 'valid',
            text: `✓ Good chair stand (Rep ${this.validReps})`,
            time: nowTime
          };
        } else {
          this.invalidAttempts += 1;
          this.lastRepValid = false;
          this.feedback = 'Rep not counted: Stand all the way upright.';
          this.feedbackType = 'correction';
          this.formStatus = 'CORRECTION_NEEDED';
          newLog = {
            type: 'flaw',
            text: `⚠ Incomplete stand — Rep attempt ${this.attemptCount}`,
            time: nowTime
          };
        }

        for (const issue of this.repIssues) {
          this.formBreakdown[issue] = (this.formBreakdown[issue] || 0) + 1;
        }

        this.state = 'STANDING';
        this.maxKneeExtensionAchieved = 0;
        this.repIssues = [];
      }
    }

    return this.getStats(repFinished, newLog);
  }
}

export function getExerciseEvaluator(code: string): BaseExerciseEvaluator {
  switch (code.toLowerCase()) {
    case 'squat':
      return new SquatEvaluator();
    case 'shoulder_abduction':
      return new ShoulderAbductionEvaluator();
    case 'bicep_curl':
      return new BicepCurlEvaluator();
    case 'sit_to_stand':
      return new SitToStandEvaluator();
    default:
      return new SquatEvaluator();
  }
}
