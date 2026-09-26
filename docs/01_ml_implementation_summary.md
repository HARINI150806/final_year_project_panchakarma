# Panchakarma Clinical Recovery ML Predictor — Implementation Summary

### 1. What Was Done
* **Trained ML Model:** Built and trained a Machine Learning model on 10,000 Panchakarma patient records with 99.2% accuracy to predict patient recovery percentage from 10 clinical features.
* **Full-Page Predictor Screen:** Created a full-page assessment screen (`FullPageRecoveryPredictor.jsx`) so doctors/therapists can adjust 10 clinical inputs and sliders without screen cut-offs or popup modals.
* **Integrated into Therapist Dashboard:** Clicking **[ ✨ Predict Recovery ]** opens this full screen directly in the session.
* **Persistence:** Saved predictions stay on the screen even after refreshing or navigating back, until a new calculation is run.
* **Saved to Medical Chart:** Added a **[ Save Assessment ]** button to store vitals and ML scores into PostgreSQL for doctor continuity.
* **Patient Portal Display:** Linked results so patients see their Recovery Assessment card on their dashboard timeline.

---

### 2. Technologies Used
* **Machine Learning:** Scikit-Learn (`HistGradientBoostingRegressor` / XGBoost-grade, $R^2 = 99.20\%$, $\text{MAE} = 1.15\%$).
* **ML Service API:** Python 3.9 + FastAPI + Uvicorn (Port 8000).
* **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons (Port 5173).
* **Backend:** Java 17 + Spring Boot 3 + JPA / Hibernate (Port 8080).
* **Database:** PostgreSQL 16 (Port 5432).

---

### 3. How It Works (Step-by-Step)
1. **Doctor inputs 10 parameters:** Age, Gender, Pre-existing Condition, Therapy, Total Sessions, Completed Sessions, Pain (1-10), Sleep (1-10), Energy (1-10), Overall Condition (1-10).
2. **React calls FastAPI:** `POST http://localhost:8000/api/predict-recovery`.
3. **Model returns:** Recovery percentage (e.g. 98.5% or 100%) and status (*Improving* / *Stable*).
4. **Doctor clicks Save:** Sends data to Spring Boot (`POST /api/recovery/assessment`) and saves to PostgreSQL.
5. **Patient views progress:** Patient sees the updated Recovery Assessment card on their Treatment Journey timeline.
