import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import {
  getExerciseEvaluator, BaseExerciseEvaluator, ExerciseStats,
  LEFT_KNEE, RIGHT_KNEE, LEFT_SHOULDER, RIGHT_SHOULDER,
  LEFT_ELBOW, RIGHT_ELBOW
} from '../cv/exercises';
import { smoothLandmarks, Landmark } from '../cv/geometry';
import { drawSkeletonOnCanvas } from '../cv/skeletonDrawer';
import { audioFeedback } from '../cv/audioFeedback';
import { getSimulatedFrameForExercise } from '../cv/syntheticSimulator';
import { VoiceFeedbackWidget } from '../components/VoiceFeedbackWidget';
import {
  Activity, Camera as CameraIcon, AlertTriangle, CheckCircle2,
  Square, ShieldAlert, Sparkles, RefreshCw, Settings,
  Eye, EyeOff, Wrench, ChevronRight, Info, Check, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FlawLogItem {
  id: string;
  type: 'valid' | 'flaw' | 'info';
  text: string;
  time: string;
}

export const LiveWorkoutStudio: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [exerciseCode, setExerciseCode] = useState<string>('squat');
  const [targetReps] = useState<number>(10);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<{ title: string; message: string; code?: string } | null>(null);

  // Calibration & Ready State
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [showDevSimModal, setShowDevSimModal] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulateErrors, setSimulateErrors] = useState<boolean>(false);

  // Timer & Session
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isSessionRunning, setIsSessionRunning] = useState<boolean>(false);

  // Flaws & Events Log
  const [flawLogs, setFlawLogs] = useState<FlawLogItem[]>([]);

  // Evaluator stats
  const [stats, setStats] = useState<ExerciseStats>({
    exerciseCode: 'squat',
    exerciseName: 'Bodyweight Squat',
    validReps: 0,
    invalidAttempts: 0,
    accuracyPct: 0,
    state: 'READY',
    feedback: 'Step into camera view',
    feedbackType: 'info',
    formStatus: 'STANDBY',
    currentAngle: null,
    detectedJointName: 'Knee',
    leftKneeAngle: null,
    rightKneeAngle: null,
    hipAngle: null,
    torsoAngle: null,
    personDetected: false,
    fullBodyVisible: false,
    missingLandmarks: [],
    activeSide: 'both',
    formBreakdown: {}
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const evaluatorRef = useRef<BaseExerciseEvaluator>(getExerciseEvaluator('squat'));
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const prevLandmarksRef = useRef<Record<number, Landmark> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const simIntervalRef = useRef<any>(null);
  const simProgressRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // FPS measurement refs
  const frameCountRef = useRef<number>(0);
  const lastFpsCalcRef = useRef<number>(performance.now());

  // Switch Exercise
  const handleExerciseChange = (code: string) => {
    setExerciseCode(code);
    evaluatorRef.current = getExerciseEvaluator(code);
    evaluatorRef.current.reset();
    prevLandmarksRef.current = null;
    setFlawLogs([]);
    audioFeedback.speak(`Switched to ${evaluatorRef.current.name}. Stand ready.`, true);
  };

  // Timer Effect
  useEffect(() => {
    if (isSessionRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isSessionRunning]);

  // Load MediaPipe Pose Landmarker Model
  const initPoseLandmarker = async (): Promise<PoseLandmarker> => {
    if (poseLandmarkerRef.current) return poseLandmarkerRef.current;

    const vision = await FilesetResolver.forVisionTasks('/wasm');

    let landmarker: PoseLandmarker;
    try {
      // First attempt with GPU delegate
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (gpuErr) {
      console.warn("GPU delegate unavailable, falling back to CPU:", gpuErr);
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/pose_landmarker_lite.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    poseLandmarkerRef.current = landmarker;
    setModelLoaded(true);
    return landmarker;
  };

  // Process landmarks returned from MediaPipe
  const processDetectedLandmarks = useCallback(
    (landmarksList: Array<{ x: number; y: number; z?: number; visibility?: number }>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      if (!landmarksList || landmarksList.length === 0) {
        ctx.clearRect(0, 0, width, height);
        const currentStats = evaluatorRef.current.processFrame(null);
        setStats(currentStats);
        return;
      }

      // Convert to Record<number, Landmark>
      const rawLandmarks: Record<number, Landmark> = {};
      landmarksList.forEach((lm, idx) => {
        rawLandmarks[idx] = {
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility ?? 1.0,
        };
      });

      // Landmark exponential smoothing
      const smoothed = smoothLandmarks(rawLandmarks, prevLandmarksRef.current, 0.65);
      prevLandmarksRef.current = smoothed;

      // Evaluate through current exercise state machine
      const currentStats = evaluatorRef.current.processFrame(smoothed);
      setStats(currentStats);

      // Append real flaws log entry if triggered
      if (currentStats.newLogEntry) {
        const item: FlawLogItem = {
          id: `${Date.now()}-${Math.random()}`,
          ...currentStats.newLogEntry,
        };
        setFlawLogs((prev) => [item, ...prev].slice(0, 20));
      }

      // Audio feedback & chimes
      if (currentStats.isRepCompleted) {
        if (currentStats.lastRepValid) {
          audioFeedback.playChime('success');
          audioFeedback.speak(`Rep ${currentStats.validReps} counted!`);
          if (currentStats.validReps >= targetReps) {
            confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
          }
        } else {
          audioFeedback.playChime('correction');
          audioFeedback.speak(currentStats.feedback);
        }
      } else if (
        currentStats.feedbackType === 'correction' ||
        currentStats.feedbackType === 'warning'
      ) {
        audioFeedback.speak(currentStats.feedback);
      }

      // Determine active joint to highlight
      let activeJointIdx = LEFT_KNEE;
      if (exerciseCode === 'shoulder_abduction') {
        activeJointIdx = currentStats.activeSide === 'right' ? RIGHT_SHOULDER : LEFT_SHOULDER;
      } else if (exerciseCode === 'bicep_curl') {
        activeJointIdx = currentStats.activeSide === 'right' ? RIGHT_ELBOW : LEFT_ELBOW;
      } else if (exerciseCode === 'squat' || exerciseCode === 'sit_to_stand') {
        activeJointIdx = currentStats.activeSide === 'right' ? RIGHT_KNEE : LEFT_KNEE;
      }

      const statusColor =
        currentStats.feedbackType === 'correction'
          ? '#f59e0b'
          : currentStats.feedbackType === 'warning'
          ? '#ef4444'
          : '#22c55e';

      // Draw skeleton overlay directly on canvas
      drawSkeletonOnCanvas(ctx, smoothed, width, height, {
        activeJointIndex: activeJointIdx,
        activeAngleDeg: currentStats.currentAngle,
        isMirrored: true,
        highlightSide: currentStats.activeSide,
        statusColor,
        showConfidence: showDebug,
      });
    },
    [exerciseCode, targetReps, showDebug]
  );

  // Live Frame Processing Loop via requestAnimationFrame
  const runCameraLoop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = poseLandmarkerRef.current;

    if (!video || !landmarker || !cameraActive) {
      return;
    }

    if (video.readyState >= 2) {
      const now = performance.now();
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        // Resize canvas to match video element resolution if needed
        const canvas = canvasRef.current;
        if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
        }

        try {
          const result = landmarker.detectForVideo(video, now);
          if (result && result.landmarks && result.landmarks.length > 0) {
            processDetectedLandmarks(result.landmarks[0]);
          } else {
            // No landmarks detected in frame
            processDetectedLandmarks([]);
          }
        } catch (cvErr) {
          console.warn("Pose detection frame error:", cvErr);
        }

        // Measure FPS
        frameCountRef.current += 1;
        if (now - lastFpsCalcRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsCalcRef.current = now;
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(runCameraLoop);
  }, [cameraActive, processDetectedLandmarks]);

  // Start Frame Processing Loop when camera is active and model loaded
  useEffect(() => {
    if (cameraActive && modelLoaded) {
      animFrameRef.current = requestAnimationFrame(runCameraLoop);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraActive, modelLoaded, runCameraLoop]);

  // Start Webcam
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    setIsSimulating(false);
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    // Secure context check
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setCameraError({
        title: "Insecure Context",
        message: "Camera access requires a secure HTTPS connection or localhost context."
      });
      setCameraLoading(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError({
        title: "Browser Unsupported",
        message: "Your browser does not support webcam capture (navigator.mediaDevices is undefined)."
      });
      setCameraLoading(false);
      return;
    }

    try {
      // 1. Initialize Pose Landmarker
      await initPoseLandmarker();

      // 2. Request webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;

      // Handle stream disconnect
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setCameraActive(false);
          setCameraError({
            title: "Camera Disconnected",
            message: "The webcam video stream was disconnected."
          });
        };
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            // Set canvas size
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth || 1280;
              canvasRef.current.height = videoRef.current.videoHeight || 720;
            }
            setCameraActive(true);
            setIsSessionRunning(true);
            setCameraLoading(false);
            audioFeedback.speak(`Camera active. Starting ${evaluatorRef.current.name} assessment.`);
          } catch (playErr) {
            console.error("Video play error:", playErr);
            setCameraLoading(false);
          }
        };
      }
    } catch (err: any) {
      console.error("Camera startup error:", err);
      setCameraLoading(false);
      setCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError({
          code: 'NotAllowedError',
          title: "Camera Permission Denied",
          message: "Camera access is required for real-time exercise tracking. Please allow camera permissions in your browser address bar and try again."
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError({
          code: 'NotFoundError',
          title: "No Camera Detected",
          message: "No webcam was found on this device. Please connect a camera or verify hardware settings."
        });
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError({
          code: 'NotReadableError',
          title: "Camera Already in Use",
          message: "Your webcam is currently unavailable or being used by another application (Zoom, Teams, or another tab). Close other video apps and retry."
        });
      } else {
        setCameraError({
          title: "Camera Initialization Failed",
          message: err.message || "Failed to initialize webcam."
        });
      }
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setCameraActive(false);
    setFps(0);
  };

  // Auto-start camera on component mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Developer Simulation Engine (strictly isolated for testing / demo validation)
  const startDevSimulation = () => {
    stopCamera();
    setCameraError(null);
    setIsSimulating(true);
    setIsSessionRunning(true);
    evaluatorRef.current.reset();
    simProgressRef.current = 0;
    setShowDevSimModal(false);

    audioFeedback.speak(`Simulated test motion running for ${evaluatorRef.current.name}.`, true);

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = setInterval(() => {
      simProgressRef.current = (simProgressRef.current + 0.035) % 1.0;

      const simPose = getSimulatedFrameForExercise(
        exerciseCode,
        simProgressRef.current,
        simulateErrors
      );

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Grid backdrop
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          const currentStats = evaluatorRef.current.processFrame(simPose);
          setStats(currentStats);

          if (currentStats.newLogEntry) {
            const item: FlawLogItem = {
              id: `${Date.now()}-${Math.random()}`,
              ...currentStats.newLogEntry,
            };
            setFlawLogs((prev) => [item, ...prev].slice(0, 20));
          }

          if (currentStats.isRepCompleted) {
            if (currentStats.lastRepValid) {
              audioFeedback.playChime('success');
              audioFeedback.speak(`Rep ${currentStats.validReps} counted.`);
              if (currentStats.validReps >= targetReps) {
                confetti({ particleCount: 65, spread: 55, origin: { y: 0.6 } });
              }
            } else {
              audioFeedback.playChime('correction');
              audioFeedback.speak(currentStats.feedback);
            }
          }

          let activeJointIdx = LEFT_KNEE;
          if (exerciseCode === 'shoulder_abduction') activeJointIdx = LEFT_SHOULDER;
          if (exerciseCode === 'bicep_curl') activeJointIdx = LEFT_ELBOW;

          drawSkeletonOnCanvas(ctx, simPose, canvas.width, canvas.height, {
            activeJointIndex: activeJointIdx,
            activeAngleDeg: currentStats.currentAngle,
            isMirrored: false,
            highlightSide: 'both',
            statusColor: currentStats.feedbackType === 'correction' ? '#f59e0b' : '#22c55e',
          });
        }
      }
    }, 50);
  };

  const stopDevSimulation = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulating(false);
  };

  // Finish Workout Session
  const handleFinishWorkout = () => {
    stopCamera();
    stopDevSimulation();
    setIsSessionRunning(false);

    navigate('/workout/summary', {
      state: {
        exerciseCode,
        exerciseName: evaluatorRef.current.name,
        validReps: stats.validReps,
        invalidAttempts: stats.invalidAttempts,
        accuracyPct: stats.accuracyPct,
        durationSeconds: sessionSeconds,
        targetReps,
        formBreakdown: stats.formBreakdown,
      },
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calibration status booleans
  const isCameraConnected = cameraActive && !cameraError;
  const isPersonDetected = stats.personDetected;
  const isFullBodyVisible = stats.fullBodyVisible;
  const isTrackingActive = fps > 0 || isSimulating;
  const isReadyToCount = isCameraConnected && isPersonDetected && isFullBodyVisible;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-3xl border border-cream-300 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Exercise Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-forest-50 border border-forest-200 px-3 py-1.5 rounded-2xl">
            <Activity className="w-4 h-4 text-forest-700" />
            <span className="text-xs font-bold text-forest-900">Exercise:</span>
            <select
              value={exerciseCode}
              onChange={(e) => handleExerciseChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-forest-800 focus:outline-none cursor-pointer"
            >
              <option value="squat">Bodyweight Squat</option>
              <option value="shoulder_abduction">Standing Shoulder Abduction</option>
              <option value="bicep_curl">Bicep Curl</option>
              <option value="sit_to_stand">Sit-to-Stand Test</option>
            </select>
          </div>

          <div className="text-xs text-charcoal-600 hidden sm:block">
            Target: <span className="font-bold text-charcoal-900">{targetReps} Reps</span>
          </div>
        </div>

        {/* Center: Session Timer & FPS Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-charcoal-900 text-white px-4 py-1.5 rounded-xl text-xs font-mono font-bold shadow-inner">
            <div
              className={`w-2 h-2 rounded-full ${
                isSessionRunning ? 'bg-emerald-400 animate-ping' : 'bg-charcoal-500'
              }`}
            />
            <span>{formatTime(sessionSeconds)}</span>
          </div>

          {cameraActive && (
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-cream-100 text-charcoal-600 border border-cream-200">
              {fps} FPS
            </span>
          )}
        </div>

        {/* Right: Audio guidance & Actions */}
        <div className="flex items-center space-x-2.5">
          <VoiceFeedbackWidget />

          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-colors flex items-center space-x-1 ${
              showDebug
                ? 'bg-forest-100 border-forest-300 text-forest-900'
                : 'bg-white border-cream-300 text-charcoal-600 hover:bg-cream-100'
            }`}
            title="Toggle Computer Vision Debug Diagnostics"
          >
            {showDebug ? <Eye className="w-4 h-4 text-forest-700" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden md:inline">Debug Overlay</span>
          </button>

          <button
            onClick={() => setShowDevSimModal(true)}
            className="p-2 rounded-xl text-xs font-semibold border border-cream-300 text-charcoal-600 hover:bg-cream-100 transition-colors"
            title="Developer Simulation Tools"
          >
            <Wrench className="w-4 h-4" />
          </button>

          <button
            onClick={handleFinishWorkout}
            disabled={stats.validReps === 0 && stats.invalidAttempts === 0 && sessionSeconds < 4}
            className="px-4 py-2 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-40"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Finish Workout</span>
          </button>
        </div>
      </div>

      {/* Camera Setup & Calibration Checklist Ribbon */}
      <div className="bg-white rounded-2xl border border-cream-300 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1.5 font-bold text-charcoal-800">
          <ShieldCheck className="w-4 h-4 text-forest-700" />
          <span>Camera Setup & Calibration:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          {/* Item 1 */}
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isCameraConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-charcoal-100 text-charcoal-400'
              }`}
            >
              {isCameraConnected ? '✓' : '•'}
            </span>
            <span className={isCameraConnected ? 'text-charcoal-900' : 'text-charcoal-400'}>
              Camera Connected
            </span>
          </div>

          {/* Item 2 */}
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isPersonDetected ? 'bg-emerald-100 text-emerald-800' : 'bg-charcoal-100 text-charcoal-400'
              }`}
            >
              {isPersonDetected ? '✓' : '•'}
            </span>
            <span className={isPersonDetected ? 'text-charcoal-900' : 'text-charcoal-400'}>
              Person Detected
            </span>
          </div>

          {/* Item 3 */}
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isFullBodyVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-charcoal-100 text-charcoal-400'
              }`}
            >
              {isFullBodyVisible ? '✓' : '•'}
            </span>
            <span className={isFullBodyVisible ? 'text-charcoal-900' : 'text-charcoal-400'}>
              Full Body Visible
            </span>
          </div>

          {/* Item 4 */}
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isTrackingActive ? 'bg-emerald-100 text-emerald-800' : 'bg-charcoal-100 text-charcoal-400'
              }`}
            >
              {isTrackingActive ? '✓' : '•'}
            </span>
            <span className={isTrackingActive ? 'text-charcoal-900' : 'text-charcoal-400'}>
              Pose Tracking Active
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isReadyToCount ? (
            <span className="px-2.5 py-1 rounded-xl bg-forest-100 text-forest-800 font-bold text-xs flex items-center space-x-1">
              <span>Ready to begin</span>
              <span>✓</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-xs">
              Position full body in frame
            </span>
          )}
        </div>
      </div>

      {/* Main Workout Stage Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Video + Skeleton Canvas Stage */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-[16/10] bg-charcoal-950 rounded-3xl overflow-hidden shadow-2xl border border-charcoal-800 flex items-center justify-center">
            {/* 1. Live Camera Video Feed (Mirrored naturally) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
                cameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* 2. Skeleton Canvas Overlay (Transparent, on top of video) */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* 3. Loading Spinner when starting camera */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-charcoal-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20 space-y-3">
                <div className="w-10 h-10 border-4 border-forest-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-mint-300">Initializing MediaPipe Pose Engine & Webcam...</p>
                <p className="text-xs text-charcoal-400">Loading neural models and requesting camera permissions</p>
              </div>
            )}

            {/* 4. Camera Error State Card */}
            {cameraError && (
              <div className="absolute inset-0 bg-charcoal-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-200">{cameraError.title}</h3>
                  <p className="text-xs text-charcoal-300 max-w-md mt-1 leading-relaxed">
                    {cameraError.message}
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-md"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>

                  <button
                    onClick={() => {
                      alert("Camera Troubleshooting:\n\n1. Ensure you are on http://localhost:5173 or HTTPS.\n2. Click the camera lock icon in your browser address bar and select 'Allow'.\n3. Close any other open apps using your webcam (Zoom, Teams, Skype).\n4. Unplug and reconnect external webcams.");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 font-semibold text-xs transition-colors border border-charcoal-700"
                  >
                    Camera Settings / Help
                  </button>
                </div>
              </div>
            )}

            {/* 5. Live Top Feedback Banner */}
            {(cameraActive || isSimulating) && (
              <div className="absolute top-4 inset-x-4 flex justify-between items-start pointer-events-none z-20">
                <div
                  className={`px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-lg border text-xs sm:text-sm font-bold flex items-center space-x-2.5 max-w-lg transition-all ${
                    stats.feedbackType === 'success'
                      ? 'bg-forest-950/90 text-emerald-300 border-forest-500/60 shadow-forest-950/40'
                      : stats.feedbackType === 'correction'
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-amber-950/40'
                      : stats.feedbackType === 'warning'
                      ? 'bg-red-950/90 text-red-300 border-red-500/60 shadow-red-950/40'
                      : 'bg-charcoal-900/90 text-white border-charcoal-700'
                  }`}
                >
                  {stats.feedbackType === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                  {stats.feedbackType === 'correction' && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                  {stats.feedbackType === 'warning' && <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />}
                  {stats.feedbackType === 'info' && <Info className="w-5 h-5 text-mint-400 flex-shrink-0" />}
                  <span>{stats.feedback}</span>
                </div>

                {/* Live Joint Angle Display (Shows -- when no person/landmarks are detected) */}
                <div className="bg-charcoal-900/90 backdrop-blur-md border border-white/20 text-white px-3.5 py-1.5 rounded-xl font-mono text-xs shadow-lg">
                  <span className="text-charcoal-400 font-sans mr-1">{stats.detectedJointName}:</span>
                  <span className="text-mint-300 font-bold">
                    {stats.currentAngle !== null ? `${stats.currentAngle}°` : '--'}
                  </span>
                </div>
              </div>
            )}

            {/* 6. Live Bottom Ribbon */}
            {(cameraActive || isSimulating) && (
              <div className="absolute bottom-4 inset-x-4 flex justify-between items-center pointer-events-none z-20">
                <div className="flex items-center space-x-2">
                  <div className="bg-charcoal-900/90 backdrop-blur-md border border-forest-500/40 px-3.5 py-1.5 rounded-xl text-white text-xs">
                    <span className="text-charcoal-400 text-[10px] uppercase font-bold block">Phase</span>
                    <span className="font-extrabold text-mint-300 capitalize">
                      {stats.state.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>

                  <div className="bg-charcoal-900/90 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-white text-xs">
                    <span className="text-charcoal-400 text-[10px] uppercase font-bold block">Form</span>
                    <span
                      className={`font-extrabold ${
                        stats.formStatus === 'GOOD'
                          ? 'text-emerald-400'
                          : stats.formStatus === 'CORRECTION_NEEDED'
                          ? 'text-amber-400'
                          : 'text-charcoal-400'
                      }`}
                    >
                      {stats.formStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-forest-900/90 backdrop-blur-md border border-forest-400/50 px-4 py-2 rounded-2xl text-center text-white shadow-lg">
                    <span className="text-[10px] uppercase font-bold text-forest-200 block">Valid Reps</span>
                    <span className="text-2xl font-black text-emerald-300 leading-none">{stats.validReps}</span>
                  </div>

                  <div className="bg-amber-950/90 backdrop-blur-md border border-amber-500/40 px-4 py-2 rounded-2xl text-center text-white shadow-lg">
                    <span className="text-[10px] uppercase font-bold text-amber-200 block">Invalid</span>
                    <span className="text-2xl font-black text-amber-400 leading-none">{stats.invalidAttempts}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. CV Developer Debug Overlay */}
            {showDebug && (
              <div className="absolute top-16 left-4 bg-charcoal-950/90 backdrop-blur-md border border-mint-500/50 text-white p-3.5 rounded-2xl text-[11px] font-mono z-30 shadow-2xl space-y-1 pointer-events-none max-w-xs">
                <div className="text-mint-400 font-bold border-b border-charcoal-700 pb-1 mb-1">
                  CV Pipeline Diagnostics
                </div>
                <div>FPS: <span className="text-emerald-300">{fps}</span></div>
                <div>Person Detected: <span className={stats.personDetected ? "text-emerald-400" : "text-red-400"}>{stats.personDetected ? "YES" : "NO"}</span></div>
                <div>Full Body Visible: <span className={stats.fullBodyVisible ? "text-emerald-400" : "text-amber-400"}>{stats.fullBodyVisible ? "YES" : "NO"}</span></div>
                <div>Left Knee: <span className="text-mint-300">{stats.leftKneeAngle !== null ? `${stats.leftKneeAngle}°` : '--'}</span></div>
                <div>Right Knee: <span className="text-mint-300">{stats.rightKneeAngle !== null ? `${stats.rightKneeAngle}°` : '--'}</span></div>
                <div>Hip Angle: <span className="text-mint-300">{stats.hipAngle !== null ? `${stats.hipAngle}°` : '--'}</span></div>
                <div>Torso Angle: <span className="text-mint-300">{stats.torsoAngle !== null ? `${stats.torsoAngle}°` : '--'}</span></div>
                <div>Phase: <span className="text-sky-300">{stats.state}</span></div>
                <div>Form: <span className="text-emerald-300">{stats.formStatus}</span></div>
                <div>Valid Reps: <span className="text-emerald-300">{stats.validReps}</span></div>
                <div>Invalid Attempts: <span className="text-amber-300">{stats.invalidAttempts}</span></div>
              </div>
            )}
          </div>

          {/* Camera Controls Toolbar */}
          <div className="p-3.5 bg-white rounded-2xl border border-cream-300 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded-xl transition-colors"
                >
                  Turn Off Camera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  disabled={cameraLoading}
                  className="px-4 py-1.5 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <CameraIcon className="w-3.5 h-3.5" />
                  <span>Turn On Camera</span>
                </button>
              )}

              {isSimulating && (
                <button
                  onClick={stopDevSimulation}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-xl transition-colors"
                >
                  Stop Simulated Mode
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3 text-charcoal-500">
              <span>Webcam resolution: 1280×720</span>
              <span className="w-1 h-1 rounded-full bg-cream-400" />
              <span>MediaPipe Pose Landmarker Lite</span>
            </div>
          </div>
        </div>

        {/* Right Column: Target Progress, Biomechanical Rules & Real Flaws Log */}
        <div className="lg:col-span-4 space-y-5">
          {/* Progress Card */}
          <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-charcoal-900 mb-2">Target Repetitions Progress</h3>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-extrabold text-forest-800">{stats.validReps}</span>
              <span className="text-xs font-semibold text-charcoal-500">of {targetReps} Prescribed</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-cream-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-forest-700 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (stats.validReps / targetReps) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-charcoal-500 mt-2">
              <span>Invalid Attempts: <strong className="text-amber-700">{stats.invalidAttempts}</strong></span>
              <span>{Math.round((stats.validReps / targetReps) * 100)}% complete</span>
            </div>
          </div>

          {/* Real-Time Biomechanical Rules Panel (Dynamically matches exercise) */}
          <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-forest-900 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-forest-700" />
              <span>Real-Time Biomechanical Rules</span>
            </div>

            <div className="text-xs text-charcoal-700 space-y-2">
              {exerciseCode === 'squat' && (
                <>
                  <p>• <strong>Primary Joint:</strong> Knee flexion (Hip → Knee → Ankle)</p>
                  <p>• <strong>Descent Trigger:</strong> Knee angle below 140°</p>
                  <p>• <strong>Valid Depth:</strong> Knee angle must reach ≤ 100°</p>
                  <p>• <strong>Torso Alignment:</strong> Chest upright (&lt; 45° forward lean)</p>
                  <p>• <strong>Recovery:</strong> Stand tall (&gt; 155°) to credit repetition</p>
                </>
              )}
              {exerciseCode === 'shoulder_abduction' && (
                <>
                  <p>• <strong>Primary Joint:</strong> Shoulder elevation (Hip → Shoulder → Elbow)</p>
                  <p>• <strong>Starting Posture:</strong> Arm at side &lt; 35°</p>
                  <p>• <strong>Target Peak:</strong> 80° – 95° horizontal plane</p>
                  <p>• <strong>Impingement Warning:</strong> Elevating &gt; 115° flags over-reach</p>
                </>
              )}
              {exerciseCode === 'bicep_curl' && (
                <>
                  <p>• <strong>Primary Joint:</strong> Elbow flexion (Shoulder → Elbow → Wrist)</p>
                  <p>• <strong>Extension Starting:</strong> Elbow angle &gt; 145°</p>
                  <p>• <strong>Contraction Peak:</strong> Elbow angle ≤ 55°</p>
                  <p>• <strong>Incomplete Flag:</strong> Lowering early triggers curl warning</p>
                </>
              )}
              {exerciseCode === 'sit_to_stand' && (
                <>
                  <p>• <strong>Primary Joint:</strong> Knee and hip extension transitions</p>
                  <p>• <strong>Starting State:</strong> Fully seated on chair (knee ~90°)</p>
                  <p>• <strong>Standing Peak:</strong> Full upright extension (knee &gt; 165°)</p>
                  <p>• <strong>Seated Completion:</strong> Controlled lowering back to chair</p>
                </>
              )}
            </div>
          </div>

          {/* Session Form Flaws Log (Real-time live log from actual detections) */}
          <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                Session Form Flaws Log
              </h4>
              <span className="text-[10px] text-charcoal-400 font-mono">
                {flawLogs.length} events
              </span>
            </div>

            {flawLogs.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {flawLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      log.type === 'valid'
                        ? 'bg-forest-50 text-forest-900 border border-forest-100'
                        : log.type === 'flaw'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-cream-50 text-charcoal-700 border border-cream-200'
                    }`}
                  >
                    <span className="font-medium">{log.text}</span>
                    <span className="text-[10px] text-charcoal-400 ml-2 font-mono flex-shrink-0">
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-400 italic py-2">
                No movements recorded yet. Stand in frame and begin your set.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Developer / Testing Modal (Kept strictly isolated behind Developer Settings) */}
      {showDevSimModal && (
        <div className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-cream-300 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-forest-700" />
                <h3 className="text-base font-bold text-charcoal-900">Developer Testing Harness</h3>
              </div>
              <button
                onClick={() => setShowDevSimModal(false)}
                className="text-charcoal-400 hover:text-charcoal-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              This developer tool injects synthetic kinematic frames into the state machine to verify unit state transitions without physical webcam input.
            </p>

            <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 space-y-2 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-charcoal-800">
                <input
                  type="checkbox"
                  checked={simulateErrors}
                  onChange={(e) => setSimulateErrors(e.target.checked)}
                  className="rounded text-forest-700 accent-forest-700 w-4 h-4"
                />
                <span>Simulate Imperfect Form (shallow depth / torso lean)</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowDevSimModal(false)}
                className="px-4 py-2 rounded-xl bg-cream-100 text-charcoal-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={startDevSimulation}
                className="px-5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs"
              >
                Run Simulated Harness
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
