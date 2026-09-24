"""
MeetMux Control Tower — ML Model Trainer
Trains XGBoost Classifier & Regressor on synthetic India supply chain dataset.
Saves model artifacts to /ml/model.pkl and evaluation metrics to /ml/metrics.json.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from xgboost import XGBClassifier, XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, mean_squared_error
)

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ml.feature_engineering import extract_features, FEATURE_COLUMNS

def train_model(dataset_path="data/training_dataset.csv"):
    if not os.path.exists(dataset_path):
        from data.synthetic_generator import generate_all
        generate_all()

    df = pd.read_csv(dataset_path)
    X = extract_features(df)
    
    y_clf = df['is_delayed'].values
    y_reg = df['delay_hours'].values

    # Stratified split
    X_train, X_test, y_clf_train, y_clf_test, y_reg_train, y_reg_test = train_test_split(
        X, y_clf, y_reg, test_size=0.2, random_state=42, stratify=y_clf
    )

    # Train Classifier
    clf = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='logloss'
    )
    clf.fit(X_train, y_clf_train)

    # Train Regressor
    reg = XGBRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.08,
        random_state=42
    )
    reg.fit(X_train, y_reg_train)

    # Evaluation
    clf_preds = clf.predict(X_test)
    clf_probs = clf.predict_proba(X_test)[:, 1]
    reg_preds = reg.predict(X_test)

    acc = accuracy_score(y_clf_test, clf_preds)
    prec = precision_score(y_clf_test, clf_preds, zero_division=0)
    rec = recall_score(y_clf_test, clf_preds, zero_division=0)
    f1 = f1_score(y_clf_test, clf_preds, zero_division=0)
    auc = roc_auc_score(y_clf_test, clf_probs)
    cm = confusion_matrix(y_clf_test, clf_preds).tolist()
    rmse = float(np.sqrt(mean_squared_error(y_reg_test, reg_preds)))

    metrics = {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(auc), 4),
        "confusion_matrix": cm,
        "rmse_delay_hours": round(rmse, 2),
        "note": "Trained on synthetic demo data (MeetMux India Network)",
        "features": FEATURE_COLUMNS
    }

    os.makedirs("ml", exist_ok=True)
    
    # Save artifacts
    artifacts = {
        "classifier": clf,
        "regressor": reg,
        "features": FEATURE_COLUMNS
    }
    joblib.dump(artifacts, "ml/model.pkl")

    with open("ml/metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"[OK] XGBoost Model successfully trained!")
    print(f"   Accuracy: {metrics['accuracy']} | F1: {metrics['f1_score']} | ROC-AUC: {metrics['roc_auc']}")
    return metrics

if __name__ == "__main__":
    train_model()
