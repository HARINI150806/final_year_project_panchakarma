import os
import json
import time
from datetime import datetime
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import HistGradientBoostingRegressor

DATASET_PATH = "data/panchakarma_dataset_10000.csv"
MODEL_PATH = "models/panchakarma_recovery_model.joblib"
METADATA_PATH = "models/model_metadata.json"

CATEGORICAL_FEATURES = ["Gender", "MedicalCondition", "TherapyName"]
NUMERICAL_FEATURES = [
    "Age",
    "TotalSessions",
    "CompletedSessions",
    "PainLevel",
    "SleepLevel",
    "EnergyLevel",
    "OverallCondition"
]
TARGET = "CurrentRecoveryPercentage"

def normalize_gender(val: str) -> str:
    if not val:
        return "Female"
    s = str(val).strip().capitalize()
    return s if s in ["Male", "Female"] else "Female"

def normalize_therapy(val: str) -> str:
    if not val:
        return "Abhyanga (Oil Massage)"
    s = str(val).strip().lower()
    mapping = {
        "abhyanga": "Abhyanga (Oil Massage)",
        "basti": "Basti (Enema Therapy)",
        "nasya": "Nasya (Nasal Therapy)",
        "pizhichil": "Pizhichil (Warm Oil Squeeze)",
        "shirodhara": "Shirodhara (Oil Pouring)",
        "udvartana": "Udvartana (Herbal Powder Massage)",
        "vamana": "Vamana (Emesis Therapy)",
        "virechana": "Virechana (Purgation)",
    }
    for key, canonical in mapping.items():
        if key in s:
            return canonical
    return val

def train_and_save_model():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Loading dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH, keep_default_na=False)
    
    # Ensure MedicalCondition is clean
    df["MedicalCondition"] = df["MedicalCondition"].replace("", "None").fillna("None")
    
    print(f"Total records loaded: {len(df)}")
    
    X = df[CATEGORICAL_FEATURES + NUMERICAL_FEATURES]
    y = df[TARGET]
    
    # Train / Test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    
    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
            ("num", "passthrough", NUMERICAL_FEATURES)
        ]
    )
    
    from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error, max_error

    # High-Performance Histogram Gradient Boosting Regressor (LightGBM/XGBoost equivalent)
    hgb = HistGradientBoostingRegressor(
        max_iter=180,
        max_depth=6,
        learning_rate=0.08,
        random_state=42
    )
    
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", hgb)
    ])
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Training Gradient Boosting Regressor...")
    start_time = time.time()
    pipeline.fit(X_train, y_train)
    training_duration = time.time() - start_time
    print(f"Training completed in {training_duration:.3f} seconds.")
    
    # Evaluation on Hold-Out Test Set
    test_preds = pipeline.predict(X_test)
    r2 = float(r2_score(y_test, test_preds))
    mae = float(mean_absolute_error(y_test, test_preds))
    rmse = float(np.sqrt(mean_squared_error(y_test, test_preds)))
    m_err = float(max_error(y_test, test_preds))
    
    print("\n" + "=" * 50)
    print("      XGBOOST MODEL EVALUATION METRICS")
    print("=" * 50)
    print(f"R² Score (Variance Explained) : {r2 * 100:.2f}% ({r2:.4f})")
    print(f"Mean Absolute Error (MAE)     : {mae:.2f}%")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f}%")
    print(f"Maximum Single Error          : {m_err:.2f}%")
    print("=" * 50)
    
    from sklearn.inspection import permutation_importance
    perm_result = permutation_importance(pipeline, X_test, y_test, n_repeats=5, random_state=42, n_jobs=1)
    feature_names = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
    feat_imp = sorted(
        zip(feature_names, [float(x) for x in perm_result.importances_mean]),
        key=lambda x: x[1],
        reverse=True
    )
    
    print("\nTop Features in Recovery Prediction (Permutation Importance):")
    for f_name, f_imp in feat_imp[:10]:
        print(f"  - {f_name:<25}: {f_imp:.4f}")
        
    # Fit full dataset for production artifact
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Retraining final pipeline on all 10,000 records...")
    pipeline.fit(X, y)
    
    # Save model artifact
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Pipeline saved to: {MODEL_PATH}")
    
    # Save metadata
    metadata = {
        "model_name": "Panchakarma Recovery XGBoost Regressor",
        "model_version": "XGBoost-v2.0-Production",
        "trained_at": datetime.now().isoformat(),
        "total_training_records": len(df),
        "metrics": {
            "r2_score": r2,
            "mae": mae,
            "rmse": rmse,
            "max_error": m_err,
            "training_duration_seconds": round(training_duration, 3)
        },
        "categorical_features": CATEGORICAL_FEATURES,
        "numerical_features": NUMERICAL_FEATURES,
        "feature_importances": dict(feat_imp[:15]),
        "unique_medical_conditions": sorted(df["MedicalCondition"].unique().tolist()),
        "unique_therapies": sorted(df["TherapyName"].unique().tolist())
    }
    
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Model metadata saved to: {METADATA_PATH}")
    print("\n✓ Model training and serialization complete!")

if __name__ == "__main__":
    train_and_save_model()
