import pandas as pd
import numpy as np
import time
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, HistGradientBoostingRegressor
from xgboost import XGBRegressor

df = pd.read_csv("data/panchakarma_dataset_10000.csv")

categorical_features = ["Gender", "MedicalCondition", "TherapyName"]
numerical_features = ["Age", "TotalSessions", "CompletedSessions", "PainLevel", "SleepLevel", "EnergyLevel", "OverallCondition"]
target = "CurrentRecoveryPercentage"

X = df[categorical_features + numerical_features]
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
        ("num", "passthrough", numerical_features)
    ]
)

models = {
    "Ridge Linear Regression": Ridge(alpha=1.0),
    "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
    "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42),
    "HistGradientBoostingRegressor": HistGradientBoostingRegressor(max_iter=100, max_depth=6, random_state=42),
    "XGBoost Regressor": XGBRegressor(n_estimators=150, max_depth=5, learning_rate=0.08, random_state=42, n_jobs=-1)
}

header = f"{'Model':<30} | {'R2 Score':<10} | {'MAE (%)':<10} | {'RMSE':<10} | {'Train Time (s)':<15}"
print(header)
print("-" * len(header))

for name, model in models.items():
    pipe = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", model)
    ])
    
    t0 = time.time()
    pipe.fit(X_train, y_train)
    train_time = time.time() - t0
    
    preds = pipe.predict(X_test)
    r2 = r2_score(y_test, preds)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    
    print(f"{name:<30} | {r2:<10.4f} | {mae:<10.2f} | {rmse:<10.2f} | {train_time:<15.3f}")
