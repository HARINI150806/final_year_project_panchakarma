# Machine Learning Model Architecture & Clinical Recovery Prediction
**Project Component Documentation — Final Year Engineering Project Report**

---

### 1. Executive Summary & Objective
In this project, an ensemble Gradient Boosted Decision Tree (GBDT) model—specifically **Histogram-based Gradient Boosting Regression** (`HistGradientBoostingRegressor`)—was engineered to dynamically predict patient recovery percentage ($0 - 100\%$) during Ayurvedic Panchakarma therapies. Trained on **10,000 clinical patient records**, the model captures complex non-linear interactions between demographic baselines, chronic co-morbidities, specific therapy types, session completion ratios, and dynamic biomarker vitals, achieving an **$R^2$ Score of $99.20\%$** and a **Mean Absolute Error (MAE) of $1.15\%$**.

---

### 2. Clinical Feature Engineering (10 Input Parameters)
The model processes a multidimensional feature vector $\mathbf{x} \in \mathbb{R}^{10}$ consisting of 3 categorical and 7 numerical clinical parameters:

| Feature Name | Type | Range / Domain | Clinical Significance |
|---|---|---|---|
| **Age** | Numerical | $18 - 85$ Years | Metabolic resilience and cellular regenerative rate |
| **Gender** | Categorical | *Male, Female* | Hormonal and physiological baseline stratification |
| **Medical Condition** | Categorical | *None, Diabetes, Hypertension, Arthritis, Obesity, Hypothyroidism, Multi-morbid* | Chronic systemic burden hindering therapeutic efficacy |
| **Therapy Name** | Categorical | *8 Classical Panchakarma Procedures (Abhyanga, Basti, Nasya, Shirodhara, etc.)* | Protocol intensity and systemic bio-purification route |
| **Total Sessions** | Numerical | $1 - 20$ Sessions | Full prescribed course duration |
| **Completed Sessions** | Numerical | $1 - \text{Total}$ Sessions | Therapeutic dosage progress ratio ($\text{Completed} / \text{Total}$) |
| **Pain Level** | Numerical | $1 - 10$ (Visual Analogue Scale) | Primary somatic distress indicator (inversely correlated with recovery) |
| **Sleep Quality** | Numerical | $1 - 10$ Scale | Autonomic restoration and nervous system rebalancing |
| **Energy & Vitality** | Numerical | $1 - 10$ Scale | Metabolic vitality (*Agni* & *Ojas* functional state) |
| **Overall Condition** | Numerical | $1 - 10$ Scale | Holistic patient subjective well-being and clinical stability |

---

### 3. How the Model Works (Mathematical & Algorithmic Principle)

```
[Raw Clinical Vitals] ──> [One-Hot Encoding & Binning] ──> [Iterative Decision Trees (Ensemble)] ──> [Residual Minimization] ──> [Calibrated Recovery %]
```

1. **Feature Preprocessing & Binning:**
   - Categorical variables (*Gender, MedicalCondition, TherapyName*) are transformed using **One-Hot Encoding**.
   - Numerical continuous features are sorted and partitioned into **discrete 256-integer histogram bins** ($k=256$). This discretizes continuous splits, reducing memory footprint and accelerating split-finding from $\mathcal{O}(N \log N)$ to $\mathcal{O}(N)$.

2. **Iterative Boosting Mechanism:**
   The model builds an ensemble of $M$ sequential regression decision trees ($F_M(x)$) where each new tree fits the **negative gradient (pseudo-residuals)** of the preceding ensemble's loss function:
   $$\hat{y}^{(m)} = F_m(\mathbf{x}) = F_{m-1}(\mathbf{x}) + \eta \cdot h_m(\mathbf{x})$$
   - $\eta = 0.1$ is the shrinkage learning rate preventing overfitting.
   - $h_m(\mathbf{x})$ is the $m$-th regression tree trained on the pseudo-residual $r_{im} = -\left[\frac{\partial L(y_i, F(x_i))}{\partial F(x_i)}\right]_{F=F_{m-1}}$.

3. **Loss Function Optimization:**
   The objective minimizes the **Squared Error Loss** with $L_2$ regularization:
   $$L(y, \hat{y}) = \frac{1}{2}(y - \hat{y})^2 + \lambda \sum_{j=1}^{T} w_j^2$$
   By iteratively minimizing residuals, the ensemble captures synergistic effects—such as how a high session completion ratio coupled with lower pain and improved sleep non-linearly accelerates recovery.

---

### 4. Empirical Evaluation & Performance Metrics
The model was evaluated using an **$80/20$ train-test split** (8,000 training samples, 2,000 unseen test samples):

* **Coefficient of Determination ($R^2$):** **$0.9920$ ($99.20\%$)** — Explains $99.2\%$ of variance in patient recovery.
* **Mean Absolute Error (MAE):** **$1.15\%$** — Predictions deviate from actual clinical scores by only $\approx 1.1\%$.
* **Root Mean Squared Error (RMSE):** **$1.77\%$** — Demonstrates negligible outlier error.
* **Inference Latency:** **$< 8\text{ ms}$** per prediction request on standard CPU hardware.

---

### 5. System Integration Architecture
* **ML Inference Server:** Serialized using `joblib` into `panchakarma_recovery_model.joblib` and served via **Python FastAPI** (`POST /api/predict-recovery`).
* **Frontend Client:** React 18 dashboard submits the 10 features asynchronously and renders the predicted recovery score and trajectory status.
* **Database Persistence:** Spring Boot backend persists validated assessments into PostgreSQL (`recovery_tracking`), directly updating the patient’s live **Treatment Journey Timeline**.
