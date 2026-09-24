import os
import math
import logging
from pathlib import Path
import pandas as pd
import joblib

logger = logging.getLogger("rag_service.predictor")

MODEL_PATH = Path(__file__).parent / "models" / "panchakarma_recovery_model.joblib"

_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        if MODEL_PATH.exists():
            try:
                _pipeline = joblib.load(MODEL_PATH)
                logger.info(f"Loaded trained XGBoost model from {MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load XGBoost pipeline from {MODEL_PATH}: {e}")
        else:
            logger.warning(f"Model file not found at {MODEL_PATH}")
    return _pipeline

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
    return "Abhyanga (Oil Massage)"

def normalize_medical_condition(val: str) -> str:
    if not val or str(val).strip().lower() in ["none", "null", "undefined", "na", "n/a", "no", "normal"]:
        return "None"
    s = str(val).strip().lower()
    if "diabetes" in s and "hypertension" in s:
        return "Diabetes + Hypertension"
    elif "diabetes" in s:
        return "Diabetes"
    elif "hypertension" in s or "bp" in s:
        return "Hypertension"
    elif "arthrit" in s or "joint" in s:
        return "Arthritis"
    elif "obese" in s or "obesity" in s or "weight" in s:
        return "Obesity"
    elif "thyroid" in s:
        return "Hypothyroidism"
    return "None"

def predict_recovery_xgboost(
    age: int = 35,
    gender: str = "FEMALE",
    therapy_type: str = "Abhyanga",
    session_number: int = 1,
    total_sessions: int = 7,
    pain_level: int = 5,
    sleep_quality: int = 6,
    energy_level: int = 6,
    overall_condition: int = 7,
    current_recovery_percentage: float = 47.0,
    medical_condition: str = "None"
) -> dict:
    """
    Production XGBoost Recovery Predictor Model pipeline.
    Calculates predicted recovery percentages using the trained XGBRegressor pipeline.
    """
    pipeline = get_pipeline()
    
    # Safe bounds
    age = max(18, min(85, int(age if age else 35)))
    norm_gender = normalize_gender(gender)
    norm_therapy = normalize_therapy(therapy_type)
    norm_condition = normalize_medical_condition(medical_condition)
    
    total_sessions = max(1, min(20, int(total_sessions if total_sessions else 7)))
    session_number = max(1, min(total_sessions, int(session_number if session_number else 1)))
    
    pain_level = max(1, min(10, int(pain_level if pain_level is not None else 5)))
    sleep_level = max(1, min(10, int(sleep_quality if sleep_quality is not None else 6)))
    energy_level = max(1, min(10, int(energy_level if energy_level is not None else 6)))
    overall_condition = max(1, min(10, int(overall_condition if overall_condition is not None else 7)))

    if pipeline is not None:
        try:
            # 1. Current session recovery inference from trained XGBoost model
            input_df = pd.DataFrame([{
                "Gender": norm_gender,
                "MedicalCondition": norm_condition,
                "TherapyName": norm_therapy,
                "Age": age,
                "TotalSessions": total_sessions,
                "CompletedSessions": session_number,
                "PainLevel": pain_level,
                "SleepLevel": sleep_level,
                "EnergyLevel": energy_level,
                "OverallCondition": overall_condition
            }])
            
            raw_current_pred = float(pipeline.predict(input_df)[0])
            current_pred = round(max(10.0, min(99.0, raw_current_pred)), 1)
            
            # 2. Projected final recovery at total sessions completion
            if session_number >= total_sessions:
                predicted_final = current_pred
            else:
                # Progressive clinical trajectory towards the final session
                remaining_sessions = total_sessions - session_number
                projected_pain = max(1, pain_level - min(3, remaining_sessions))
                projected_sleep = min(10, sleep_level + min(2, math.ceil(remaining_sessions / 2)))
                projected_energy = min(10, energy_level + min(2, math.ceil(remaining_sessions / 2)))
                projected_condition = min(10, overall_condition + min(2, math.ceil(remaining_sessions / 2)))
                
                projected_df = pd.DataFrame([{
                    "Gender": norm_gender,
                    "MedicalCondition": norm_condition,
                    "TherapyName": norm_therapy,
                    "Age": age,
                    "TotalSessions": total_sessions,
                    "CompletedSessions": total_sessions,
                    "PainLevel": projected_pain,
                    "SleepLevel": projected_sleep,
                    "EnergyLevel": projected_energy,
                    "OverallCondition": projected_condition
                }])
                raw_final_pred = float(pipeline.predict(projected_df)[0])
                # Ensure monotonic improvement over current prediction
                predicted_final = round(max(current_pred, min(98.5, raw_final_pred)), 1)

            # Determine clinical recovery status
            if predicted_final >= 75.0:
                status = "Improving"
            elif predicted_final >= 50.0:
                status = "Stable"
            else:
                status = "Needs Attention"

            return {
                "predicted_final_recovery": predicted_final,
                "predicted_current_recovery": current_pred,
                "model_version": "XGBoost-v2.0-Production",
                "status": status
            }
        except Exception as e:
            logger.error(f"Error evaluating trained XGBoost model: {e}")

    # Robust heuristic fallback if model could not be evaluated
    session_ratio = min(1.0, max(0.1, session_number / total_sessions))
    clinical_score = (
        (10 - pain_level) * 0.35 +
        sleep_level * 0.25 +
        energy_level * 0.20 +
        overall_condition * 0.20
    ) * 10.0
    weight_current = min(0.85, 0.4 + (session_ratio * 0.45))
    weight_clinical = 1.0 - weight_current
    cur_rec = current_recovery_percentage if current_recovery_percentage else clinical_score
    raw_projected = (cur_rec * weight_current) + (clinical_score * weight_clinical)
    remaining_ratio = 1.0 - session_ratio
    expected_boost = remaining_ratio * 25.0
    predicted_final = min(98.0, max(30.0, raw_projected + expected_boost))
    predicted_final = round(predicted_final, 1)

    return {
        "predicted_final_recovery": predicted_final,
        "predicted_current_recovery": round(raw_projected, 1),
        "model_version": "XGBoost-v2.0-Fallback",
        "status": "Improving" if predicted_final >= 75.0 else ("Stable" if predicted_final >= 50.0 else "Needs Attention")
    }
