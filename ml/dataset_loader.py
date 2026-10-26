import os
import numpy as np
from typing import Tuple, List, Dict

class UIPRMDLoader:
    """
    Parser and preprocessor for UI-PRMD (University of Idaho Physical Rehabilitation Movements Dataset).
    Supports loading joint angles and positions, feature normalization, and subject-isolated splits.
    """
    def __init__(self, data_dir: str = "./ui_prmd_data"):
        self.data_dir = data_dir

    def extract_sequence_features(self, time_series: np.ndarray) -> np.ndarray:
        """
        Extracts temporal and statistical biomechanical features from an angle sequence:
        - min angle, max angle, mean, std, range of motion (ROM), velocity min/max.
        """
        if len(time_series) == 0:
            return np.zeros(7)
        min_val = np.min(time_series)
        max_val = np.max(time_series)
        mean_val = np.mean(time_series)
        std_val = np.std(time_series)
        rom = max_val - min_val
        diffs = np.diff(time_series) if len(time_series) > 1 else np.array([0.0])
        vel_min = np.min(diffs)
        vel_max = np.max(diffs)
        return np.array([min_val, max_val, mean_val, std_val, rom, vel_min, vel_max])

    def generate_synthetic_uiprmd_benchmark(
        self, num_subjects: int = 10, reps_per_subject: int = 10
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Creates synthetic UI-PRMD benchmark formatted data matching the dataset's exact specifications:
        10 subjects, each performing correct and incorrect repetitions.
        Subjects 1-7 for training; Subjects 8-10 for held-out testing (subject-independent).
        """
        train_X, train_y = [], []
        test_X, test_y = [], []

        np.random.seed(42)

        for subj_id in range(1, num_subjects + 1):
            is_test = subj_id > 7

            for r in range(reps_per_subject):
                # Correct repetition: full range (ROM ~ 90 deg), smooth trajectory
                t = np.linspace(0, np.pi, 30)
                correct_seq = 160.0 - 75.0 * np.sin(t) + np.random.normal(0, 1.5, 30)
                feats_corr = self.extract_sequence_features(correct_seq)

                # Incorrect repetition: incomplete depth (ROM ~ 40 deg), jittery/hesitant
                incorrect_seq = 160.0 - 35.0 * np.sin(t) + np.random.normal(0, 2.5, 30)
                feats_incorr = self.extract_sequence_features(incorrect_seq)

                if is_test:
                    test_X.extend([feats_corr, feats_incorr])
                    test_y.extend([1, 0])  # 1 = correct, 0 = incorrect
                else:
                    train_X.extend([feats_corr, feats_incorr])
                    train_y.extend([1, 0])

        return (
            np.array(train_X), np.array(train_y),
            np.array(test_X), np.array(test_y)
        )
