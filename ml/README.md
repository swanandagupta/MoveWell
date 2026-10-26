# MoveWell ML & UI-PRMD Evaluation Pipeline

## Overview
MoveWell uses pretrained MediaPipe Pose Landmarker for real-time skeleton landmark extraction and deterministic, rule-based biomechanical finite-state machines for repetition counting and quality validation.

In addition, MoveWell provides an optional offline Machine Learning evaluation pipeline designed for the **UI-PRMD** (University of Idaho - Physical Rehabilitation Movements Dataset).

## About UI-PRMD
- **Description**: UI-PRMD is a public dataset consisting of 10 rehabilitation physical exercises performed by 10 healthy individuals (subjects). Each exercise was repeated 10 times in both correct and incorrect biomechanical forms.
- **Data Modalities**:
  1. Vicon motion capture system (joint positions and angles).
  2. Microsoft Kinect v2 depth sensor (skeletal positions and angles).
- **Exercises included in UI-PRMD**:
  - Deep Squat (matches MoveWell Exercise #1)
  - Shoulder Abduction (matches MoveWell Exercise #2)
  - Bicep Curl (matches MoveWell Exercise #3)
  - Sit to Stand (matches MoveWell Exercise #4)
  - Hurdle step, lunges, straight leg raise, trunk rotation, shoulder flexion, and inline lunge.
- **Source & Acquisition**:
  - Paper: *A Dataset of Physical Rehabilitation Movements (UI-PRMD)*, Vakanski et al., Data in Brief 2020.
  - Repository / DOI: Available on GitHub / Zenodo (https://github.com/vakanski/UI-PRMD).
  - License: Creative Commons Attribution 4.0 International (CC-BY 4.0). Permitted for academic and research reuse with proper citation.

## Machine Learning Strategy
1. **Subject-Independent Split (Leave-Subjects-Out)**:
   - To prevent data leakage across identical biometric proportions, subjects 1 through 7 are used for training, while subjects 8 through 10 are held out strictly for testing.
2. **Feature Representation**:
   - Time-series landmark sequences normalized by torso length (inter-shoulder and shoulder-to-hip distance).
   - Angle trajectory statistical summaries: min, max, mean, standard deviation, and inflection velocity.
3. **Model Classifier**:
   - Random Forest / Gradient Boosting / SVM binary classifier for distinguishing Correct vs. Incorrect executions.
4. **Evaluation Metrics**:
   - Precision, Recall, F1-Score, and Confusion Matrix.
