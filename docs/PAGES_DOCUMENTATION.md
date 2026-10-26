# MoveWell: Complete Page-by-Page Architectural & Functional Documentation

This document provides a comprehensive technical and functional breakdown of all 13 pages and views implemented across the **MoveWell** AI-Powered Computer Vision Rehabilitation Platform.

---

## Table of Contents
1. [Page 1: Public Landing Page (`/`)](#1-page-1-public-landing-page-)
2. [Page 2: Authentication & Sign In (`/login`)](#2-page-2-authentication--sign-in-login)
3. [Page 3: Account Registration (`/register`)](#3-page-3-account-registration-register)
4. [Page 4: Patient Dashboard (`/patient/dashboard`)](#4-page-4-patient-dashboard-patientdashboard)
5. [Page 5: Exercise Plan Detail & Biomechanical Guide (`/plan/:id`)](#5-page-5-exercise-plan-detail--biomechanical-guide-planid)
6. [Page 6: Live AI Workout Studio (`/workout/live`)](#6-page-6-live-ai-workout-studio-workoutlive)
7. [Page 7: Workout Completion & Kinematic Summary (`/workout/summary`)](#7-page-7-workout-completion--kinematic-summary-workoutsummary)
8. [Page 8: Patient Progress Analytics & History (`/patient/progress`)](#8-page-8-patient-progress-analytics--history-patientprogress)
9. [Page 9: Clinician Portal & Patient Roster (`/clinician/dashboard`)](#9-page-9-clinician-portal--patient-roster-cliniciandashboard)
10. [Page 10: Clinical Prescription & Plan Builder (`/clinician/create-plan`)](#10-page-10-clinical-prescription--plan-builder-cliniciancreate-plan)
11. [Page 11: Clinician Patient Detail & Weekly Report (`/clinician/patient/:id`)](#11-page-11-clinician-patient-detail--weekly-report-clinicianpatientid)
12. [Page 12: Telehealth Consultations & Appointments (`/appointments`)](#12-page-12-telehealth-consultations--appointments-appointments)
13. [Page 13: Profile, Audio Guidance & System Settings (`/profile`)](#13-page-13-profile-audio-guidance--system-settings-profile)

---

## 1. Page 1: Public Landing Page (`/`)

### Purpose
The front-facing landing page introduces the MoveWell platform vision, highlights the core problem in physical rehabilitation (patients performing exercises with incorrect form at home without real-time correction), and explains the end-to-end clinical workflow connecting patients and doctors.

### Key Sections & Components
1. **Hero Header**:
   - Healthcare aesthetic banner: *"AI-Powered Intelligent Rehabilitation Management"*.
   - Prominent Call to Action (CTA) buttons: **"Launch Live Camera Workout"** and **"Physiotherapist Portal"**.
   - Hero visual card showcasing a live camera feed preview with real-time pose tracking simulation and HUD overlays.
2. **Clinical Methodology Pipeline (4-Stage Flow)**:
   - **Step 1: Clinician Prescribes Plan** — Customized movement sets, reps, and joint angle bounds.
   - **Step 2: Webcam Pose Detection** — Client-side MediaPipe landmark extraction running at 60 FPS without server video uploads.
   - **Step 3: FSM Quality Verification** — Movement state machines that count only verified repetitions.
   - **Step 4: Reporting & Doctor Review** — Longitudinal tracking, automated weekly reports, and telehealth consultation.
3. **Supported Rehabilitation Exercises Showcase**:
   - Dynamic exercise cards for **Bodyweight Squat**, **Standing Shoulder Abduction**, **Bicep Curl**, and **Sit-to-Stand Test**.
   - Details target muscle groups, kinematic joint angles, and error detection criteria.
4. **Academic & Clinical Disclaimer**:
   - Explicit notification that MoveWell is an exercise guidance and rehabilitation prototype, preserving clinical oversight.

---

## 2. Page 2: Authentication & Sign In (`/login`)

### Purpose
Provides secure JWT-based access for both user roles (**Patient** and **Physiotherapist**), with pre-seeded demo accounts for demonstration.

### Key Features
1. **Quick Demonstration Buttons (1-Click Login)**:
   - **Demo Patient**: Instantly logs in as *Alex Morgan* (ACL Reconstruction recovery).
   - **Demo Clinician**: Instantly logs in as *Dr. Elena Vance, DPT* (Senior Physiotherapist).
   - Eliminates typing during presentations and project grading.
2. **Standard Credentials Form**:
   - Email and password inputs with field validation.
   - Communicates with `POST /api/v1/auth/login`.
   - Stores JWT token in `localStorage` and populates `AuthContext`.
3. **Role-Based Redirect**:
   - Redirects clinicians directly to `/clinician/dashboard`.
   - Redirects patients directly to `/patient/dashboard`.

---

## 3. Page 3: Account Registration (`/register`)

### Purpose
Allows new patients or clinicians to register an account with encrypted password storage.

### Key Features
1. **Role Toggle**:
   - Switch between **Patient** and **Physiotherapist** account modes.
2. **Patient Medical Intake Fields**:
   - Full Name, Email, Password (min 6 characters).
   - Medical Condition / Rehabilitation Goal dropdown (e.g., *Post-op ACL Recovery*, *Rotator Cuff Tendinitis*, *Total Knee Replacement Mobility*).
   - Patient Age and Emergency Contact.
3. **Backend Integration**:
   - Calls `POST /api/v1/auth/register`.
   - Automatically provisions a `PatientProfile` linked to the primary clinician.

---

## 4. Page 4: Patient Dashboard (`/patient/dashboard`)

### Purpose
The primary homepage for authenticated patients. Summarizes their daily recovery schedule, active prescription, adherence streak, and recent clinician recommendations.

### Key Features & Components
1. **Welcome & Recovery Stage Banner**:
   - Displays patient's diagnosis and active recovery phase (e.g., *"Phase 2 - Strength & Stabilization"*).
   - Quick launch button: **"Start Workout Studio"**.
2. **Kinematic KPI Metric Tiles**:
   - **Valid Reps Completed**: Total repetitions meeting clinical criteria.
   - **Overall Form Accuracy %**: Biomechanical pass rate across sessions.
   - **Sessions Completed**: Weekly volume versus prescribed target.
   - **Adherence Streak**: Days of continuous compliance.
3. **Assigned Movement Plan Grid**:
   - Cards displaying the assigned exercises, sets, target reps, scheduled days, and target joint angle ranges.
4. **Recent Rehabilitation Sessions Table**:
   - Date, duration, valid reps, accuracy percentage, and clinician review status.
5. **Doctor Advice & Upcoming Consultations Sidebar**:
   - Form adjustment recommendations written by the supervising physiotherapist.
   - Upcoming telehealth appointment links with 1-click video call button.

---

## 5. Page 5: Exercise Plan Detail & Biomechanical Guide (`/plan/:id`)

### Purpose
A detailed instructional guide for patients explaining how each exercise in their prescribed plan should be performed safely.

### Key Features
1. **Plan Prescription Overview**:
   - Clinician author, clinical objectives, target frequency, and sets/reps breakdown.
2. **Movement-by-Movement Breakdown**:
   - Target muscle groups and primary joint tracked.
   - **Kinematic Target Inflection Angles**: Documented angle bounds (e.g., knee inflection $\le 100^\circ$ for squats, shoulder elevation $80^\circ - 95^\circ$).
   - **Reference Tempo**: Prescribed rep duration in seconds.
3. **Safety Precautions & Error Prevention**:
   - Specific warnings (e.g., preventing knee valgus collapse, avoiding torso forward pitch, avoiding painful over-elevation).
4. **Step-by-Step Execution Guide**:
   - Sequential instructions for preparation, descent/inflection, and recovery.

---

## 6. Page 6: Live AI Workout Studio (`/workout/live`)

### Purpose
The core computer vision engine. Uses the user's real webcam, tracks 33 anatomical landmarks in real time via MediaPipe Pose Landmarker, renders a dynamic skeleton overlay, calculates joint angles, runs finite state machines, and provides instant audio-visual corrective feedback.

### Key Features & Architecture
1. **Actual Webcam Video Feed**:
   - Accessible via standard `navigator.mediaDevices.getUserMedia`.
   - Mirrored naturally (`transform: scaleX(-1)`) for intuitive user feedback.
   - Responsive sizing inside the viewport.
2. **Transparent Canvas Skeleton Overlay**:
   - Drawn continuously on top of the live video using HTML5 Canvas.
   - Traces 33 body landmarks (head, shoulders, elbows, wrists, hips, knees, ankles, feet).
   - High-contrast glowing bone connection lines (mint green when posture is good, amber/red during errors).
   - **Active Joint Highlighting**: Draws a pulsing ring, angle arc, and a real-time angle badge (e.g., `118°`) directly next to the tracked joint.
3. **Camera Setup & Calibration Checklist Ribbon**:
   - Top status bar verifying:
     - ✓ **Camera Connected**
     - ✓ **Person Detected**
     - ✓ **Full Body Visible** (verifies required exercise landmarks have confidence $\ge 0.45$)
     - ✓ **Pose Tracking Active** (FPS $> 0$)
   - Switches to *"Ready to begin ✓"* when all conditions are satisfied.
4. **Dynamic Joint Angle Display**:
   - Displays `Angle: --` when no person is detected (avoids misleading `0°` readings).
   - Shows live degrees (e.g., `Knee: 147°`) once the body is detected.
5. **Finite-State Repetition Counting**:
   - **Squat**: `READY` $\rightarrow$ `STANDING` $\rightarrow$ `DESCENDING` $\rightarrow$ `BOTTOM` (knee $\le 100^\circ$) $\rightarrow$ `ASCENDING` $\rightarrow$ `STANDING` $\rightarrow$ `VALID REP +1`.
   - **Invalid Attempt Handling**: Incomplete depth or excessive torso lean triggers an invalid count and specific voice feedback without incrementing valid reps.
6. **Live Voice Guidance & Audio Tones**:
   - Web Speech API text-to-speech announces corrections (e.g., *"Squat lower for full depth"*, *"Keep chest upright"*).
   - Includes cooldown timers (3.5s) to eliminate repetitive audio chatter.
   - Synthesized Web Audio chimes (ascending harmonic chime for completed valid reps, soft dual-tone cue for corrections).
   - Mute and volume slider in header.
7. **Session Form Flaws Log**:
   - Real-time event log populated with actual detected problems:
     - `✓ Good squat depth (Rep 1)`
     - `⚠ Insufficient depth — Rep attempt 2`
     - `⚠ Excessive forward lean — Rep attempt 3`
8. **Developer / Debug Overlay**:
   - Toggle button displaying real-time FPS, pose confidence, person detection flag, left/right knee angles, hip angle, torso angle, and movement phase.
   - **Isolated Testing Harness**: A developer modal allowing synthetic kinematic simulation for offline evaluation.

---

## 7. Page 7: Workout Completion & Kinematic Summary (`/workout/summary`)

### Purpose
Displays a comprehensive recap immediately after completing a workout session and allows persisting the results to the medical database.

### Key Features
1. **Celebration Animation**:
   - Confetti particle celebration upon hitting targets.
2. **Primary KPI Grid**:
   - Valid Repetitions count vs. Prescribed Target.
   - Form Accuracy Percentage (biomechanical pass rate).
   - Invalid Attempts count (uncounted flaws).
   - Total Active Duration.
3. **Form Flaw Breakdown**:
   - Lists specific flaw occurrences recorded during the session (e.g., `incomplete_depth: 2`, `excessive_torso_lean: 1`).
4. **Database Persistence**:
   - **"Save Session to Medical History"** button: Sends structured results, form breakdowns, and feedback event logs to `POST /api/v1/sessions`.
   - Visual confirmation once synced to the database.
5. **Navigation**:
   - Links to repeat exercise, return to dashboard, or inspect progress charts.

---

## 8. Page 8: Patient Progress Analytics & History (`/patient/progress`)

### Purpose
Longitudinal recovery tracking using interactive **Recharts** visualizations to monitor patient improvement over time.

### Key Visualizations & Tables
1. **Form Accuracy Trend (AreaChart)**:
   - Green gradient area chart plotting session-by-session accuracy percentages.
   - Illustrates motor learning and technique improvement.
2. **Valid vs. Invalid Repetitions Comparison (BarChart)**:
   - Dual-color bar chart comparing valid reps (green) against invalid attempts (amber) across historical dates.
3. **Summary KPI Statistics**:
   - Cumulative valid repetitions completed.
   - Average accuracy across all sessions.
   - Total sessions completed and average session duration.
4. **Historical Session Log Table**:
   - Full tabular breakdown of past sessions with timestamps, durations, rep counts, pass rates, and supervising doctor review status.

---

## 9. Page 9: Clinician Portal & Patient Roster (`/clinician/dashboard`)

### Purpose
The command center for physiotherapists and orthopedic doctors to remotely monitor their entire cohort of home-rehabilitation patients.

### Key Features
1. **Clinician Header & Credentials**:
   - Displays doctor identity, department, and active status.
   - Quick action: **"+ Create & Assign Plan"**.
2. **Cohort Health Metric Tiles**:
   - Active Patients under supervision.
   - Cohort Adherence Rate % (prescribed vs. completed sessions).
   - Total Supervised Sessions kinematically tracked.
   - Automated Weekly Reports ready for review.
3. **Registered Patient Roster Table**:
   - Patient Avatar, Name, and Email.
   - Primary Diagnosis / Injury (e.g., *Post-op ACL Recovery*, *Rotator Cuff Tendinitis*).
   - Rehabilitation Stage badge (e.g., *Phase 1*, *Phase 2*).
   - Live Adherence Progress Bar.
   - Latest Form Accuracy percentage.
   - **"Review Details"** button navigating to deep-dive patient inspection.

---

## 10. Page 10: Clinical Prescription & Plan Builder (`/clinician/create-plan`)

### Purpose
A structured form allowing physiotherapists to build and prescribe customized exercise programs for specific patients.

### Key Features
1. **Patient Selection**:
   - Dropdown of assigned patients with diagnosis context.
2. **Plan Metadata**:
   - Plan Title (e.g., *"Phase 2 ACL Knee Flexion & Stability"*).
   - Clinical Objective / Description.
3. **Dynamic Movement Builder**:
   - Add/Remove multiple exercises from the catalog (Squat, Shoulder Abduction, Bicep Curl, Sit-to-Stand).
   - Configure **Target Sets** (e.g., 3 sets).
   - Configure **Target Reps** (e.g., 10 reps).
   - Configure **Scheduled Days** (e.g., "Mon, Wed, Fri").
   - Custom doctor clinical instructions for the patient.
4. **Submission**:
   - Sends payload to `POST /api/v1/plans`.
   - Automatically marks previous active plans as completed and activates the new prescription.

---

## 11. Page 11: Clinician Patient Detail & Weekly Report (`/clinician/patient/:id`)

### Purpose
Provides doctors with an in-depth clinical drilldown into a specific patient's exercise history, kinematic performance, and allows generating automated progress reports.

### Key Features
1. **Patient Clinical Profile**:
   - Patient diagnosis, age, gender, contact, and doctor clinical notes.
2. **Automated Weekly Progress Report Generator**:
   - Clicking **"Generate Weekly Report"** queries `GET /api/v1/clinicians/patients/{id}/weekly-report`.
   - Aggregates the last 7 days of workout data into an executive summary:
     - Adherence rate vs. target.
     - Average form accuracy.
     - Total valid reps vs. invalid attempts.
     - Most frequent form flaw (e.g., *incomplete depth*).
     - Clinical recommendation notes.
3. **Kinematic Session Records**:
   - Detailed inspection of each session completed by the patient, including timestamps, durations, and rep counts.
4. **Prescribe Clinical Recommendation**:
   - Form allowing the doctor to send feedback notes categorized by **Form Adjustment**, **Recovery Protocol**, **Frequency**, or **Safety Caution**.

---

## 12. Page 12: Telehealth Consultations & Appointments (`/appointments`)

### Purpose
Connects patients and physiotherapists for remote virtual consultations and follow-up examinations.

### Key Features
1. **Consultation Calendar List**:
   - Displays scheduled, completed, and cancelled appointments.
   - Shows consultation reason, date/time, and supervising clinician name.
2. **Telehealth Video Integration**:
   - 1-click **"Join Video Call"** button linking directly to the virtual meeting room.
3. **Schedule Consultation Modal**:
   - Booking form specifying consultation reason, preferred date and time, and pre-appointment notes.
   - Communicates with `POST /api/v1/appointments`.
4. **Clinician Status Management**:
   - Clinicians can mark appointments as completed or cancelled directly from the UI.

---

## 13. Page 13: Profile, Audio Guidance & System Settings (`/profile`)

### Purpose
User account management, voice guidance customization, and clinical architecture documentation.

### Key Features
1. **Identity & Clinical Role Card**:
   - Avatar, name, email, and active role (*Patient* vs. *Physiotherapist*).
2. **Audio Guidance & Text-to-Speech Settings**:
   - **Mute Toggle**: Disables speech announcements during live workouts.
   - **Volume Slider**: Adjusts speech synthesis volume (0% to 100%).
   - **"Test Voice Synthesis" Button**: Audits the browser's Web Speech engine with a sample announcement.
3. **System & Clinical Architecture Overview**:
   - Documents the underlying technology: MediaPipe Pose Landmarker, Biomechanical FSMs, FastAPI REST persistence, and client-side privacy architecture.
