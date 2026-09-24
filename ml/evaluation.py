"""
MeetMux Control Tower — Model Evaluation & Validation Suite
Returns model accuracy metrics, ROC-AUC, confusion matrix, and feature importances.
"""

import json
import os

METRICS_PATH = "ml/metrics.json"

def get_model_evaluation():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            return json.load(f)
    else:
        from ml.train import train_model
        return train_model()

if __name__ == "__main__":
    print(json.dumps(get_model_evaluation(), indent=2))
