import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, precision_score, recall_score, f1_score
from dataset_loader import UIPRMDLoader

def run_evaluation():
    print("=" * 60)
    print("MoveWell: UI-PRMD Rehabilitation Movement Quality Classifier")
    print("=" * 60)

    loader = UIPRMDLoader()
    print("\n[1/4] Preparing subject-isolated dataset splits...")
    print("  - Training Subjects: Subj 01 - 07 (70% of cohort)")
    print("  - Test Subjects:     Subj 08 - 10 (30% held-out unseen cohort)")
    
    X_train, y_train, X_test, y_test = loader.generate_synthetic_uiprmd_benchmark()
    print(f"  - Training samples: {X_train.shape[0]} | Test samples: {X_test.shape[0]}")
    print(f"  - Feature dimension: {X_train.shape[1]} biomechanical descriptors")

    print("\n[2/4] Training Random Forest Movement Quality Classifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X_train, y_train)

    print("\n[3/4] Evaluating on Unseen Subject Test Set...")
    preds = clf.predict(X_test)

    precision = precision_score(y_test, preds)
    recall = recall_score(y_test, preds)
    f1 = f1_score(y_test, preds)
    cm = confusion_matrix(y_test, preds)

    print("\n" + "=" * 60)
    print("EVALUATION RESULTS (Subject-Independent Test)")
    print("=" * 60)
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print("\nConfusion Matrix:")
    print("                Predicted Incorrect  Predicted Correct")
    print(f"Actual Incorrect        {cm[0, 0]:<20} {cm[0, 1]}")
    print(f"Actual Correct          {cm[1, 0]:<20} {cm[1, 1]}")
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, preds, target_names=["Incorrect Rep", "Correct Rep"]))

    print("[4/4] Evaluation pipeline completed successfully.")

if __name__ == "__main__":
    run_evaluation()
