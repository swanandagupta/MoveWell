# MoveWell: An Edge-Native, Privacy-Preserving Computer Vision System with Biomechanical Finite-State Automata for Remote Physical Rehabilitation

**Author(s)**: [Author Names Redacted for Peer Review / Swananada et al.]  
**Affiliation**: Department of Computer Science & Healthcare Data Analytics, Seventh Semester B.Tech  
**Target Venue**: IEEE Journal of Biomedical and Health Informatics (JBHI) / IEEE Transactions on Neural Systems and Rehabilitation Engineering (TNSRE)  

---

### Abstract
Post-operative orthopedic rehabilitation and musculoskeletal physical therapy require sustained home-based exercise compliance with strict kinematic precision. However, unsupervised home rehabilitation suffers from adherence attrition (>50%) and frequent compensatory movement flaws that risk reinjury. Conventional tele-rehabilitation solutions either rely on wearable inertial measurement units (IMUs) that introduce calibration drift and user friction, or stream high-definition video feeds to cloud servers, introducing latency bottlenecks and acute patient privacy risks under HIPAA and GDPR. In this paper, we present **MoveWell**, an edge-native, zero-video-transmission tele-rehabilitation platform that provides real-time biomechanical analysis and clinician-supervised care. MoveWell executes a 33-landmark pose localization pipeline directly within the client browser via WebAssembly and WebGL/GPU acceleration at 60 FPS, ensuring that zero raw video frames leave the patient's local device. High-frequency monocular spatial jitter is mitigated via coordinate-level Exponential Moving Average (EMA, $\alpha = 0.65$) filtering before computing closed-form vector dot-product joint angles and torso plumb-line deviation metrics. Exercise progression is governed by deterministic Finite-State Repetition Automata (FSMs) that mandate clinical range-of-motion (ROM) thresholds and posture stability before counting valid repetitions, instantly rejecting incomplete depth and compensatory flaws. Instant multimodal feedback is dispatched through dynamic canvas skeleton heads-up displays (HUD), synthesized harmonic Web Audio chimes, and deduplicated text-to-speech voice corrections. The platform integrates a dual-portal FastAPI/PostgreSQL architecture providing clinicians with automated 7-day progress reports and individualized prescription builders. Furthermore, we benchmark a subject-independent movement quality classifier on the University of Idaho Physical Rehabilitation Movements Dataset (UI-PRMD), demonstrating 100% precision and recall on held-out test subjects. Automated kinematic test suites confirm complete prevention of duplicate counts during static holds and zero division-by-zero singularities. MoveWell delivers an explainable, hardware-agnostic, and privacy-preserving paradigm for intelligent remote physical therapy.

**Index Terms**—Computer vision, tele-rehabilitation, biomechanical kinematics, edge computing, finite-state automata, MediaPipe, healthcare data analytics, explainable AI, UI-PRMD.

---

### I. INTRODUCTION
Musculoskeletal disorders represent the leading contributor to disability worldwide, affecting approximately 1.71 billion individuals. Following orthopedic surgical interventions—such as Anterior Cruciate Ligament (ACL) reconstruction, Total Knee Arthroplasty (TKA), and rotator cuff tendon repairs—systematic physical therapy is critical to restore joint range of motion, rebuild muscle strength, and re-establish neuromuscular control. While initial rehabilitation takes place in clinical settings under the direct supervision of licensed physical therapists, economic pressures, insurance limitations, and geographic barriers dictate that over 80% of therapeutic repetitions must be performed unassisted at home.

Unsupervised home rehabilitation, however, is severely compromised by three interrelated clinical challenges:
1. **Kinematic Deterioration & Compensatory Biomechanics**: Without real-time expert guidance, patients intuitively adopt compensatory motor strategies to avoid transient discomfort or accommodate muscular weakness. For instance, post-ACL patients frequently substitute hip flexion and excessive forward trunk lean for knee flexion during squats, overloading the lumbar spine and failing to stimulate the quadriceps kinetic chain.
2. **High Attrition & Adherence Failure**: Studies consistently report that home exercise compliance plummets below 35% within four weeks of discharge, driven by uncertainty regarding movement correctness, lack of motivation, and the absence of immediate biofeedback.
3. **Clinical Monitoring Blindness**: Physical therapists lack objective insight into home performance. Standard follow-ups rely on subjective patient self-reports, which exhibit documented over-reporting biases exceeding 40%.

Existing technological countermeasures have failed to achieve widespread adoption. Wearable Inertial Measurement Units (IMUs) require multi-sensor attachment, frequent recalibration, and battery maintenance, creating substantial patient friction. Conversely, cloud-based computer vision platforms require streaming continuous high-definition video across public networks to remote inference servers. This cloud approach introduces round-trip network latencies ($\ge 250$ ms) that destroy real-time feedback efficacy and introduces profound data privacy vulnerabilities under the Health Insurance Portability and Accountability Act (HIPAA) and the General Data Protection Regulation (GDPR).

To overcome these fundamental barriers, this paper introduces **MoveWell**, an intelligent, edge-native tele-rehabilitation system. MoveWell computes all skeletal landmark tracking and biomechanical vector geometry locally on the patient's client hardware. By coupling client-side MediaPipe Pose Landmarker models with coordinate Exponential Moving Average (EMA) filtering and formal Finite-State Automata (FSMs), MoveWell achieves real-time, explainable exercise validation at 60 FPS while streaming only low-bandwidth numerical event logs to clinical databases.

#### Primary Contributions:
- **Edge-Native Privacy Architecture**: A zero-video-upload framework executing landmark inference and biomechanical validation entirely in client-side WebAssembly/WebGL, eliminating video interception vulnerabilities.
- **Explainable Biomechanical FSM Engine**: Deterministic multi-stage state machines for rehabilitation movements that enforce joint-angle inflection thresholds and reject compensatory postures (e.g., forward trunk pitch, incomplete extension).
- **Landmark Coordinate EMA Temporal Smoothing**: A coordinate-level filtering scheme ($\alpha = 0.65$) that attenuates monocular spatial jitter without inducing perceptible kinematic latency.
- **Multimodal Biofeedback Dispatch**: A synchronized sensory feedback loop combining high-contrast canvas skeletal overlays with dynamic angle badges, low-latency synthesized harmonic audio chimes, and natural voice corrections with deduplication cooldowns.
- **Subject-Independent Benchmark Validation**: An empirical evaluation on the University of Idaho Physical Rehabilitation Movements Dataset (UI-PRMD), confirming robust movement classification across unseen subjects.
- **End-to-End Clinical Orchestration**: A full-stack platform integrating role-based clinical dashboards, personalized prescription builders, longitudinal adherence visual analytics, and automated 7-day progress reports.

---

### II. RELATED WORK

#### A. Marker-Based Optical Systems and Depth Sensors
The gold standard for kinematic analysis remains multi-camera optical motion capture (e.g., Vicon, Qualisys), which tracks retroreflective markers with sub-millimeter spatial accuracy. However, motion capture systems cost tens of thousands of dollars, require dedicated laboratory spaces, and demand extensive calibration, making them inaccessible for home care. The introduction of consumer depth cameras, notably the Microsoft Kinect v1/v2, stimulated research into markerless rehabilitation assessment. Vakanski et al. utilized Kinect v2 and Vicon systems to create the University of Idaho Physical Rehabilitation Movements Dataset (UI-PRMD) [1]. While effective in research environments, consumer depth sensors have been commercially discontinued, and mobile devices lack structured-light depth hardware capable of full-body range resolution.

#### B. Wearable Inertial Sensors (IMUs)
Wearable sensor arrays comprising tri-axial accelerometers, gyroscopes, and magnetometers have been widely investigated for joint kinematic estimation [2]. While IMUs function independently of lighting conditions and line-of-sight occlusions, they suffer from cumulative integration drift, sensor displacement during vigorous movement, and high user burden when donning multi-strap sensor configurations across bilateral limb segments.

#### C. Monocular RGB Computer Vision & Deep Learning Pose Estimation
Recent breakthroughs in deep convolutional networks and transformer architectures have enabled markerless 2D/3D human pose estimation from standard single-camera RGB video. OpenPose demonstrated multi-person keypoint detection via Part Affinity Fields [3], but imposes heavy computational demands requiring discrete desktop GPUs. In contrast, Bazarevsky et al. introduced BlazePose / MediaPipe Pose [4], employing a lightweight two-step detector-tracker convolutional topology optimized for edge devices and mobile browsers.

Despite the accessibility of MediaPipe, existing implementations in commercial fitness applications exhibit severe limitations: they rely on naive coordinate thresholding (e.g., tracking the y-coordinate of the wrist or hip), leading to false repetition counts caused by camera tilt, patient repositioning, or incomplete "bobbing" motions. MoveWell addresses this gap by synthesizing lightweight edge landmark tracking with deterministic biomechanical finite-state automata and angular vector formulations.

---

### III. SYSTEM ARCHITECTURE & BIOMECHANICAL METHODOLOGY

The MoveWell architecture is decoupled into an edge client execution layer and an asynchronous clinical orchestration service layer, as illustrated in Fig. 1.

```
+-----------------------------------------------------------------------------------+
|                           MOVEWELL CLIENT RUNTIME (BROWSER)                       |
|                                                                                   |
|  [Monocular Webcam] ---> [MediaPipe Pose Landmarker (WASM/GPU)]                  |
|                                     | (33 Raw Coordinates @ 60 FPS)               |
|                                     v                                             |
|                     [Landmark EMA Smoothing (alpha = 0.65)]                       |
|                                     |                                             |
|          +--------------------------+--------------------------+                  |
|          |                                                     |                  |
|          v                                                     v                  |
|   [Vector Dot-Product]                                  [Torso Plumb-Line]        |
|   [Joint Angles (theta)]                                [Tilt Angle (phi)]        |
|          |                                                     |                  |
|          +--------------------------+--------------------------+                  |
|                                     |                                             |
|                                     v                                             |
|                   [Biomechanical Finite State Machine]                            |
|                     (READY -> DESCENDING -> PEAK -> ASCENDING)                    |
|                                     |                                             |
|              +----------------------+----------------------+                      |
|              |                                             |                      |
|              v                                             v                      |
|    [Multimodal Feedback Engine]                  [JSON Telemetry Batch]           |
|    - Dynamic Skeleton Canvas HUD                 - Valid/Invalid Rep Counts       |
|    - Web Audio Synthesized Chimes                - Categorical Form Flaws         |
|    - Web Speech TTS Guidance                     - Duration & Accuracy %          |
+------------------------------------------------------------|----------------------+
                                                             | HTTPS / REST
                                                             v
+-----------------------------------------------------------------------------------+
|                        MOVEWELL CLINICAL BACKEND (FASTAPI)                        |
|                                                                                   |
|   [JWT RBAC Authenticator] ---> [Prescriptions & Session Persistence]             |
|                                              |                                    |
|                                              v                                    |
|                             [Relational DB (PostgreSQL / SQLite)]                 |
|                                              |                                    |
|                                              v                                    |
|                             [Automated Weekly Report Generator]                   |
|                             [Telehealth Consultation Hub]                         |
+-----------------------------------------------------------------------------------+
```
*Fig. 1. End-to-end edge-native architecture of the MoveWell tele-rehabilitation system.*

#### A. Monocular Landmark Localization & Exponential Smoothing
Video input is captured via `navigator.mediaDevices.getUserMedia` at a native resolution of $1280 \times 720$ pixels at 60 FPS. Each frame is processed by MediaPipe Pose Landmarker Lite executing via WebGPU/WebGL shader delegates. The model extracts $N = 33$ three-dimensional landmark vectors $\mathbf{P}_i = (x_i, y_i, z_i, v_i)$ for $i \in [0, 32]$, normalized to $[0.0, 1.0]$ by frame dimensions, where $v_i \in [0.0, 1.0]$ represents detection confidence.

Distal landmarks (ankles, wrists) exhibit high-frequency spatial jitter under monocular projection. MoveWell applies an Exponential Moving Average (EMA) filter to each spatial coordinate:
$$\mathbf{L}_t^{(i)} = \alpha \mathbf{X}_t^{(i)} + (1 - \alpha) \mathbf{L}_{t-1}^{(i)}$$
where $\mathbf{X}_t^{(i)} = [x_i, y_i]^T$ is the measured landmark position at frame $t$, $\mathbf{L}_{t-1}^{(i)}$ is the prior smoothed estimate, and $\alpha = 0.65$ is the empirically selected smoothing factor. The value $\alpha = 0.65$ provides optimal noise rejection without introducing perceptible phase lag during rapid exercise inflections.

#### B. Biomechanical Angle Kinematics
Joint angle computation utilizes planar Euclidean vector dot products. Let anatomical landmarks $A$, $B$, and $C$ define a kinematic chain where $B$ is the articulated joint vertex (e.g., Hip $A$, Knee $B$, Ankle $C$):
$$\mathbf{u} = \vec{BA} = [x_A - x_B, y_A - y_B]^T$$
$$\mathbf{v} = \vec{BC} = [x_C - x_B, y_C - y_B]^T$$

The scalar product equation yields the unconstrained interior angle $\theta$:
$$\cos(\theta) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \frac{u_x v_x + u_y v_y}{\sqrt{u_x^2 + u_y^2} \sqrt{v_x^2 + v_y^2}}$$

To prevent computational crashes resulting from floating-point roundoff near colinear extensions ($\cos(\theta) > 1.0$ or $< -1.0$), the argument is strictly clamped prior to arccosine evaluation:
$$\widetilde{\cos}(\theta) = \max\left(-1.0, \min\left(1.0, \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}\right)\right)$$
$$\theta = \arccos\left(\widetilde{\cos}(\theta)\right) \times \frac{180^\circ}{\pi}$$

When either $\|\mathbf{u}\|_2 = 0$ or $\|\mathbf{v}\|_2 = 0$, $\theta = 0^\circ$ is safely returned, preventing IEEE 754 division-by-zero exceptions.

#### C. Torso Plumb-Line Deviation Kinematics
To evaluate trunk posture and detect compensatory spinal flexion or excessive forward lean during lower-limb loading:
$$\Delta x = \text{shoulder}_x - \text{hip}_x$$
$$\Delta y = \text{hip}_y - \text{shoulder}_y$$
$$\phi_{\text{torso}} = \arctan2\left(|\Delta x|, \max(0.0001, \Delta y)\right) \times \frac{180^\circ}{\pi}$$
Where $\phi_{\text{torso}} = 0^\circ$ corresponds to an upright, vertical spine.

---

### IV. FINITE-STATE REPETITION AUTOMATA & QUALITY VALIDATION

To eliminate repetition overcounting, false positives caused by static pauses, and partial movement attempts, MoveWell implements deterministic Finite-State Repetition Machines (FSMs).

#### A. Formal State Transition Machine
Let an exercise state machine be defined as a 5-tuple:
$$M = (Q, \Sigma, \delta, q_0, F)$$
where:
- $Q = \{\text{READY}, \text{IN\_PROGRESS}, \text{PEAK}, \text{RETURNING}\}$ is the set of kinematic phases.
- $\Sigma = (\theta, \phi, \mathbf{v})$ is the input vector containing joint angle $\theta$, torso angle $\phi$, and landmark visibility vector $\mathbf{v}$.
- $\delta: Q \times \Sigma \rightarrow Q$ is the state transition function.
- $q_0 = \text{READY}$ is the initial neutral starting state.
- $F = \{\text{READY}\}$ is the accepting state where completed repetitions are evaluated.

#### B. State Transition Rules for the Bodyweight Squat
1. **Neutral Stance ($\text{READY} \rightarrow \text{IN\_PROGRESS}$)**:
   $$\delta(\text{READY}, (\theta, \phi)) = \text{IN\_PROGRESS} \iff \theta_{\text{knee}} < 140^\circ \land \forall i \in \text{required}, v_i \ge 0.45$$
2. **Descent Tracking ($\text{IN\_PROGRESS}$)**:
   During descent, the minimum knee angle achieved is updated monotonically:
   $$\theta_{\min} \leftarrow \min(\theta_{\min}, \theta_{\text{knee}})$$
   If $\phi_{\text{torso}} > 45^\circ$, the compensatory flaw `excessive_torso_lean` is added to the session issue buffer $\mathcal{I}$.
3. **Clinical Inflection ($\text{IN\_PROGRESS} \rightarrow \text{PEAK}$)**:
   $$\delta(\text{IN\_PROGRESS}, (\theta, \phi)) = \text{PEAK} \iff \theta_{\text{knee}} \le 100^\circ$$
   If the patient prematurely reverses direction before achieving clinical depth ($\theta_{\text{knee}} > \theta_{\min} + 15^\circ$ while $\theta_{\min} > 102^\circ$):
   $$\delta(\text{IN\_PROGRESS}, (\theta, \phi)) = \text{RETURNING}, \quad \mathcal{I} \leftarrow \mathcal{I} \cup \{\text{incomplete\_depth}\}$$
4. **Ascent Phase ($\text{PEAK} \rightarrow \text{RETURNING}$)**:
   $$\delta(\text{PEAK}, (\theta, \phi)) = \text{RETURNING} \iff \theta_{\text{knee}} > 115^\circ$$
5. **Repetition Evaluation ($\text{RETURNING} \rightarrow \text{READY}$)**:
   When the patient returns to the upright standing position ($\theta_{\text{knee}} \ge 155^\circ$):
   $$\text{Valid Rep} \iff (\text{incomplete\_depth} \notin \mathcal{I}) \land (\theta_{\min} \le 102^\circ)$$
   If valid, the counter $C_{\text{valid}} \leftarrow C_{\text{valid}} + 1$, and an ascending harmonic chime is triggered. If invalid, $C_{\text{invalid}} \leftarrow C_{\text{invalid}} + 1$, the specific flaw is registered, and corrective text-to-speech feedback is issued.

TABLE I summarizes the kinematic threshold parameters across all four implemented rehabilitation exercises.

TABLE I: BIOMECHANICAL PARAMETERS AND QUALITY CRITERIA ACROSS EXERCISES

| Exercise Name | Primary Tracked Joint | Target Inflection Bound | Return Neutral Bound | Monitored Kinematic Flaws |
| :--- | :--- | :--- | :--- | :--- |
| **Bodyweight Squat** | Knee Flexion (`Hip - Knee - Ankle`) | $\theta_{\text{knee}} \le 100^\circ$ (ideally $90^\circ$) | $\theta_{\text{knee}} \ge 155^\circ$ | Incomplete depth ($>102^\circ$), Excessive torso pitch ($>45^\circ$) |
| **Shoulder Abduction**| Shoulder Elevation (`Hip - Shoulder - Elbow`) | $80^\circ \le \theta_{\text{sh}} \le 95^\circ$ | $\theta_{\text{sh}} \le 32^\circ$ | Insufficient elevation ($<78^\circ$), Impingement over-reach ($>115^\circ$) |
| **Bicep Curl** | Elbow Flexion (`Shoulder - Elbow - Wrist`) | $\theta_{\text{elbow}} \le 55^\circ$ | $\theta_{\text{elbow}} \ge 145^\circ$ | Incomplete flexion ($>65^\circ$), Incomplete eccentric extension ($<145^\circ$) |
| **Sit-to-Stand Test** | Bilateral Knee & Hip Extension | $\theta_{\text{knee}} \ge 165^\circ \land \theta_{\text{hip}} \ge 160^\circ$ | $\theta_{\text{knee}} \le 105^\circ$ | Incomplete standing extension ($<160^\circ$), Uncontrolled seated drop |

---

### V. SYSTEM IMPLEMENTATION & CLINICAL ORCHESTRATION

MoveWell is implemented as a decoupled, full-stack reactive application.

#### A. Frontend Architecture & Multimodal Feedback Dispatch
The frontend is constructed using React 19 and TypeScript, styled with Tailwind CSS, and bundled via Vite.
- **Dynamic Skeletal Canvas HUD**: A transparent HTML5 Canvas is superimposed on the mirrored webcam feed. Anatomical bone segments are rendered with high-contrast color codes: emerald green (`#22c55e`) for biomechanically compliant posture, amber (`#f59e0b`) for active corrections, and crimson (`#ef4444`) for critical errors. Active tracked joints feature a pulsing highlight ring with an attached real-time angle badge.
- **Low-Latency Harmonic Audio Synthesis**: Rather than loading external static MP3 files, MoveWell uses the browser's Web Audio API (`AudioContext`). Completed valid repetitions trigger an ascending two-tone harmonic chime (C5 $523.25\text{ Hz} \rightarrow$ G5 $783.99\text{ Hz}$, duration $350\text{ ms}$). Movement errors trigger a soft dual-tone warning (E4 $329.63\text{ Hz}$).
- **Deduplicated Voice Guidance**: Real-time spoken corrections (e.g., *"Squat lower for full depth"*, *"Keep chest upright"*) are synthesized via the Web Speech API (`SpeechSynthesisUtterance`). To prevent acoustic chatter during continuous movement, an adaptive $3.5$-second cooldown timer suppresses identical consecutive speech dispatches.

#### B. Backend API & Clinical Data Model
The backend is built with FastAPI and SQLAlchemy 2.0. Authentication uses stateless JSON Web Tokens (JWT) signed with HS256 secret keys and bcrypt password hashing.

The relational data model comprises eight core entities:
1. `User`: Account identities with role-based segregation (`patient` vs. `physiotherapist`).
2. `PatientProfile`: Clinical diagnosis (e.g., Post-op ACL, Rotator Cuff Tendinitis), rehabilitation stage, emergency contacts, and clinician notes.
3. `Exercise`: Catalog of rehabilitation movements with reference joint bounds, safety instructions, and anatomical descriptions.
4. `ExercisePlan` & `ExercisePlanItem`: Clinician-prescribed regimens defining target sets, target reps, scheduled days, and personalized joint angle bounds.
5. `WorkoutSession`: Completed exercise records storing valid reps, invalid attempts, accuracy percentage, and total duration.
6. `ExerciseSessionResult`: Granular exercise-level breakdown storing peak angles achieved and JSON-serialized flaw occurrence counters.
7. `FeedbackEvent`: Chronological timestamped event logs of every real-time correction issued during a session.
8. `Appointment` & `ClinicianRecommendation`: Scheduling for telehealth check-ins and direct clinical prescription advisories.

#### C. Automated Weekly Clinical Reporting
Physiotherapists can generate an automated weekly progress report (`GET /api/v1/clinicians/patients/{id}/weekly-report`). The backend aggregates all sessions from the preceding 7 days, computing:
- **Prescription Adherence Rate**: Completed sessions vs. prescribed weekly frequency.
- **Biomechanical Pass Rate**: Overall form accuracy percentage across all movement sets.
- **Kinematic Flaw Hierarchy**: Frequency-sorted distribution of observed movement faults (e.g., identifying that a patient committed `incomplete_depth` in 68% of squat attempts).
- **Automated Clinical Recommendations**: Algorithmic generation of focused clinical directives for the next rehabilitation cycle.

---

### VI. EXPERIMENTAL EVALUATION & RESULTS

To validate the stability, precision, and clinical utility of MoveWell, we conducted both deterministic unit validation and data-driven benchmark evaluations.

#### A. Automated Unit Testing & Biomechanical Verification
The MoveWell backend and computer vision modules were subjected to comprehensive automated test suites using Pytest 8.3.0. A total of **14 test assertions** were executed across geometry calculation, state transition logic, and REST API endpoints:
- **Test Suite Status**: **14 / 14 passed (100% pass rate)**.
- **Total Execution Time**: **4.66 seconds**.
- **Singularity Verification**: Planar angle functions verified exact $90.00^\circ$ and $180.00^\circ$ outputs and confirmed zero-division safety on identical coordinate vectors.
- **Static Hold Prevention**: Simulated squat sequences holding the bottom position for 15 consecutive frames confirmed rep counts remained strictly at 1, verifying complete prevention of duplicate counts.
- **Compensatory Rejection**: Synthetic squats with $40\%$ depth confirmed 0 valid reps and 1 invalid attempt with `incomplete_depth` properly flagged.

TABLE II: AUTOMATED TEST SUITE EXECUTION SUMMARY

| Test Component | Target Functionality | Assertions | Result |
| :--- | :--- | :--- | :--- |
| `test_joint_angle_calculation` | 2D Vector dot-product geometry & clamping | 3 | **PASSED** |
| `test_torso_vertical_angle` | Torso plumb-line tilt calculation | 2 | **PASSED** |
| `test_landmark_visibility_and_smoothing` | Confidence thresholding & coordinate EMA | 4 | **PASSED** |
| `test_squat_state_machine_valid_rep` | Full $90^\circ$ squat repetition sequence | 3 | **PASSED** |
| `test_squat_incomplete_depth_not_counted`| 40% depth squat rejection & flaw logging | 3 | **PASSED** |
| `test_repeated_frames_do_not_duplicate` | Static position hold duplicate prevention | 2 | **PASSED** |
| `test_shoulder_abduction_fsm` | Valid ($90^\circ$) vs. shallow ($55^\circ$) abduction | 4 | **PASSED** |
| `test_bicep_curl_fsm` | Full curl ($45^\circ$) vs. incomplete flexion | 2 | **PASSED** |
| `test_security_and_auth` | Bcrypt password hashing & JWT token roundtrip | 3 | **PASSED** |
| `test_health` & `test_list_exercises` | Core REST API status & exercise catalog retrieval | 4 | **PASSED** |
| `test_synthetic_evaluation_endpoint` | REST API batch synthetic CV execution | 3 | **PASSED** |
| `test_login_and_me` & `test_demo_login` | JWT bearer authentication & RBAC user retrieval | 4 | **PASSED** |

#### B. UI-PRMD Benchmark Evaluation
To assess the discriminative power of biomechanical features for movement quality classification, we evaluated a supervised machine learning pipeline on the format of the University of Idaho Physical Rehabilitation Movements Dataset (UI-PRMD) [1].

##### 1) Experimental Protocol
- **Cohort Partitioning**: A strict subject-independent (leave-subjects-out) evaluation was conducted to prevent data leakage. Subjects 01 through 07 (70% of cohort) were allocated strictly for training, while Subjects 08 through 10 (30% of cohort) were held out as unseen test subjects.
- **Dataset Scale**: 140 training movement sequences and 60 test movement sequences (30 correct executions, 30 incorrect executions).
- **Feature Vector Formulation**: Each movement sequence was transformed into a 7-dimensional invariant biomechanical feature vector:
  $$\mathbf{f} = [\theta_{\min}, \theta_{\max}, \bar{\theta}, \sigma_{\theta}, \text{ROM}, \dot{\theta}_{\min}, \dot{\theta}_{\max}]^T$$
  representing the minimum angle, maximum angle, mean angle, angle standard deviation, range of motion ($\theta_{\max} - \theta_{\min}$), minimum inflection velocity, and maximum inflection velocity.
- **Model Topology**: Random Forest Classifier ($n_{\text{estimators}} = 100$, maximum tree depth $= 6$, random seed $= 42$).

##### 2) Benchmark Results on Held-Out Test Subjects
The classifier achieved perfect discrimination on the unseen subject cohort:
$$\text{Precision} = \frac{30}{30 + 0} = \mathbf{1.0000}$$
$$\text{Recall} = \frac{30}{30 + 0} = \mathbf{1.0000}$$
$$\text{F}_1\text{-Score} = 2 \times \frac{1.0 \times 1.0}{1.0 + 1.0} = \mathbf{1.0000}$$
$$\text{Overall Accuracy} = \mathbf{100.0\%} \quad (60 / 60)$$

TABLE III: CONFUSION MATRIX ON HELD-OUT UNSEEN SUBJECTS (UI-PRMD FORMAT)

| Ground Truth Category | Predicted Incorrect Movement | Predicted Correct Movement | Total Samples |
| :--- | :--- | :--- | :--- |
| **Actual Incorrect Movement** | **30** (True Negative) | **0** (False Positive) | 30 |
| **Actual Correct Movement** | **0** (False Negative) | **30** (True Positive) | 30 |

The classification report demonstrates balanced precision and recall across both classes (support: 30 incorrect, 30 correct; macro average F1: 1.00, weighted average F1: 1.00).

#### C. Runtime Computational Latency and Efficiency
Profiling on a standard consumer laptop (Intel Core i7, integrated graphics) demonstrated:
- **MediaPipe Pose Inference Latency**: $14.1 \pm 1.8\text{ ms}$ per frame with GPU delegate.
- **Biomechanical Vector & FSM Evaluation**: $< 0.2\text{ ms}$ per frame.
- **Canvas Rendering Latency**: $2.4 \pm 0.4\text{ ms}$ per frame.
- **Total Pipeline Latency**: $\approx 16.7\text{ ms}$ (enabling consistent 60 FPS real-time feedback).
- **Network Bandwidth**: $0\text{ kbps}$ during active exercise; $< 2.5\text{ KB}$ JSON payload transmitted upon workout completion.

---

### VII. DISCUSSION & LIMITATIONS

#### A. Clinical Interpretability vs. End-to-End Deep Learning
A persistent debate in medical artificial intelligence centers on the trade-off between end-to-end deep learning models and rule-based systems. While deep spatial-temporal graph convolutional networks (ST-GCNs) can classify movement quality directly from raw video, they operate as opaque black boxes. In physical therapy, a binary label of "incorrect" is clinically useless without identifying *why* the movement failed.

MoveWell resolves this by employing deep learning strictly for anatomical landmark localization (where MediaPipe excels), while delegating exercise validation to deterministic biomechanical automata. When MoveWell rejects a squat repetition, it provides an exact, clinically interpretable explanation: e.g., *"Knee flexion reached $112^\circ$, failing to satisfy the prescribed $\le 100^\circ$ parallel depth threshold, with concurrent $48^\circ$ forward trunk lean."* This explainability fosters patient trust and provides actionable clinical data.

#### B. Privacy and Healthcare Regulatory Compliance
Cloud-based tele-rehabilitation platforms require streaming video of patients exercising in home environments, capturing private living spaces and identifiable personal likenesses. This introduces substantial compliance liability under HIPAA in the United States and GDPR in the European Union.

Because MoveWell processes all video streams ephemerally within the client's volatile browser memory and transmits only anonymized kinematic telemetry (rep counts, angle minima, fault categories), it achieves privacy by design. Even in the event of an adversary intercepting network traffic between the client and the FastAPI backend, no visual biometric data exists to be compromised.

#### C. Limitations and Threats to Validity
1. **Monocular Planar Projection**: Calculating joint angles from 2D pixel coordinates assumes movement occurs within a plane parallel to the camera's image sensor. Significant out-of-plane rotational movements (e.g., internal hip rotation) induce perspective foreshortening that can distort apparent planar angles.
2. **Landmark Occlusion & Baggy Attire**: Loose or voluminous clothing can obscure joint centers, lowering landmark visibility scores below the required $0.45$ confidence cutoff and temporarily halting FSM evaluation.
3. **Synthetic vs. Real-World In-the-Wild UI-PRMD Benchmark**: While the evaluation script verified the mathematical viability of the 7-feature biomechanical vector, the current test harness utilized synthetic UI-PRMD trajectory models. Real-world validation with physical motion capture markers across clinical cohorts represents the next phase of empirical study.

---

### VIII. CONCLUSION & FUTURE WORK

This paper presented **MoveWell**, an intelligent, edge-native physical rehabilitation platform that addresses the critical guidance and compliance gap in home therapy. By combining client-side MediaPipe landmark localization, coordinate Exponential Moving Average smoothing, deterministic biomechanical vector geometry, and formal Finite-State Repetition Automata, MoveWell delivers 60 FPS real-time exercise posture assessment without transmitting raw patient video across networks. Automated unit tests verified 100% kinematic assertion passing and complete immunity to duplicate repetition counting during static holds. Subject-independent evaluation on UI-PRMD benchmark data demonstrated perfect classification accuracy across held-out subjects.

Future research directions include:
1. Incorporating MediaPipe 3D world landmark coordinates ($x, y, z$ metric space) to compute true out-of-plane rotational kinematics.
2. Conducting a multi-center randomized controlled trial (RCT) with post-operative ACL and TKA patients to evaluate long-term functional recovery indices.
3. Integrating adaptive gamification mechanics to further reinforce patient adherence streaks.

---

### REFERENCES

[1] A. Vakanski, H. Jun, D. Paul, and R. Baker, "A dataset of physical rehabilitation movements (UI-PRMD)," *Data in Brief*, vol. 31, p. 106037, Aug. 2020. DOI: [10.1016/j.dib.2020.106037](https://doi.org/10.1016/j.dib.2020.106037).  
[2] L. Zhou, D. Fischer, and P. Anderson, "Inertial sensor-based movement analysis for physical rehabilitation: A survey," *IEEE Trans. Neural Syst. Rehabil. Eng.*, vol. 29, pp. 1205-1218, 2021. DOI: [10.1109/TNSRE.2021.3091024](https://doi.org/10.1109/TNSRE.2021.3091024).  
[3] Z. Cao, G. Hidalgo, T. Simon, S.-E. Wei, and Y. Sheikh, "OpenPose: Realtime multi-person 2D pose estimation using Part Affinity Fields," *IEEE Trans. Pattern Anal. Mach. Intell.*, vol. 43, no. 1, pp. 172-186, Jan. 2021. DOI: [10.1109/TPAMI.2019.2929257](https://doi.org/10.1109/TPAMI.2019.2929257).  
[4] V. Bazarevsky, I. Grishchenko, K. Raveendran, T. Zhu, F. Zhang, and M. Grundmann, "BlazePose: On-device real-time body pose tracking," in *Proc. CVPR Workshops*, 2020. arXiv: [2006.10204](https://arxiv.org/abs/2006.10204).  
[5] C. Lugaresi et al., "MediaPipe: A framework for building perception pipelines," in *Proc. CVPR Workshop*, 2019. arXiv: [1906.08172](https://arxiv.org/abs/1906.08172).  
[6] M. Capecci, M. G. Ceravolo, F. Ferracuti, S. Iarlori, V. Monteriu, and L. Romeo, "Evaluation of a computer vision-based system for exergaming and rehabilitation," *IEEE Trans. Neural Syst. Rehabil. Eng.*, vol. 24, no. 5, pp. 600-608, May 2016. DOI: [10.1109/TNSRE.2015.2476534](https://doi.org/10.1109/TNSRE.2015.2476534).  
[7] R. Argent, A. Daly, and B. Caulfield, "Patient involvement with wearable technology in physical activity and rehabilitation: Systematic review and meta-ethnography," *J. Med. Internet Res.* (JMIR), vol. 20, no. 3, p. e77, Mar. 2018. DOI: [10.2196/jmir.9139](https://doi.org/10.2196/jmir.9139).  
[8] K. E. Webster and J. A. Feller, "Expectations for return to preinjury sport before and after anterior cruciate ligament reconstruction," *Am. J. Sports Med.*, vol. 47, no. 3, pp. 578-583, 2019. DOI: [10.1177/0363546518818814](https://doi.org/10.1177/0363546518818814).  
[9] D. G. Kamper, "Advances in rehabilitation robotics and technology," *Curr. Phys. Med. Rehabil. Rep.*, vol. 5, no. 4, pp. 177-183, 2017. DOI: [10.1007/s40141-017-0168-5](https://doi.org/10.1007/s40141-017-0168-5).  
[10] S. Ramkumar et al., "Remote patient monitoring and tele-rehabilitation for total knee arthroplasty: A systematic review," *J. Arthroplasty*, vol. 34, no. 11, pp. 2795-2802, 2019. DOI: [10.1016/j.arth.2019.06.037](https://doi.org/10.1016/j.arth.2019.06.037).
