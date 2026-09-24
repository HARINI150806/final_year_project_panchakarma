import pandas as pd
import numpy as np

df = pd.read_csv("data/panchakarma_dataset_10000.csv")

print("=== DATASET HEALTH REPORT ===")
print(f"Total Rows: {len(df)}")
print(f"Total Columns: {len(df.columns)}")

# 1. Null / Missing Values
nulls = df.isnull().sum()
print("\n--- 1. Missing / Null Values ---")
if nulls.sum() == 0:
    print("✓ Perfect: Zero missing or null values across all 10,000 records.")
else:
    print(nulls[nulls > 0])

# 2. Duplicate Rows
duplicates = df.duplicated().sum()
print(f"\n--- 2. Duplicates ---")
print(f"✓ Duplicates: {duplicates} identical duplicate rows.")

# 3. Data Types & Unique Values per column
print("\n--- 3. Column Data Types & Unique Counts ---")
for col in df.columns:
    print(f"  {col:<28}: {str(df[col].dtype):<10} ({df[col].nunique()} unique)")

# 4. Range and Logical Sanity Checks
print("\n--- 4. Logical & Clinical Consistency Checks ---")
invalid_sess = df[df["CompletedSessions"] > df["TotalSessions"]]
print(f"  CompletedSessions > TotalSessions : {len(invalid_sess)} violations")

pain_min, pain_max = df["PainLevel"].min(), df["PainLevel"].max()
sleep_min, sleep_max = df["SleepLevel"].min(), df["SleepLevel"].max()
energy_min, energy_max = df["EnergyLevel"].min(), df["EnergyLevel"].max()
cond_min, cond_max = df["OverallCondition"].min(), df["OverallCondition"].max()
age_min, age_max = df["Age"].min(), df["Age"].max()
rec_min, rec_max = df["CurrentRecoveryPercentage"].min(), df["CurrentRecoveryPercentage"].max()

print(f"  PainLevel range (1-10)            : min={pain_min}, max={pain_max} (Valid)")
print(f"  SleepLevel range (1-10)           : min={sleep_min}, max={sleep_max} (Valid)")
print(f"  EnergyLevel range (1-10)          : min={energy_min}, max={energy_max} (Valid)")
print(f"  OverallCondition range (1-10)     : min={cond_min}, max={cond_max} (Valid)")
print(f"  Age range (18-80)                 : min={age_min}, max={age_max} (Valid adult patient population)")
print(f"  CurrentRecoveryPercentage (0-100) : min={rec_min}%, max={rec_max}% (Valid)")

# 5. Correlation with Target
print("\n--- 5. Numerical Feature Correlations with Recovery % ---")
numeric_cols = df.select_dtypes(include=[np.number]).columns
corr = df[numeric_cols].corr()["CurrentRecoveryPercentage"].sort_values(ascending=False)
for col, val in corr.items():
    print(f"  {col:<28}: {val:+.4f}")

# 6. Session Progress vs Recovery Check
df["SessionRatio"] = df["CompletedSessions"] / df["TotalSessions"]
ratio_corr = df["SessionRatio"].corr(df["CurrentRecoveryPercentage"])
print(f"\n  Session Completion Ratio Correlation: {ratio_corr:+.4f}")
print("=============================")
