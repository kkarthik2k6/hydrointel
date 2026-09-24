"""
HydroIntel — Random Forest Model Training Pipeline
Author: HydroIntel Engineering Team
Description: Trains a Random Forest Regressor on historical GHMC water dispatch,
             evaluates error metrics, and serializes the model and feature columns.
"""

from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

# Base paths
BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "final_dataset.csv"
MODEL_PATH = BASE_DIR / "model.pkl"
COLUMNS_PATH = BASE_DIR / "model_columns.pkl"


def train_and_save_model() -> Tuple[RandomForestRegressor, float]:
    """Train the Random Forest regressor, evaluate metrics, and save artifacts."""
    print("🌲 [HydroIntel ML] Starting Model Training Pipeline...")

    # 1. Load Feature Dataset
    print(f" -> Loading feature dataset from '{DATASET_PATH.name}'...")
    df = pd.read_csv(DATASET_PATH)

    # 2. Select Features and Target Variable
    features = [
        "Zone",
        "Temperature_C",
        "Rainfall_mm",
        "Baseline_Population",
        "Previous_Day_Dispatch_ML",
    ]
    target = "Actual_Dispatch_ML"

    X = df[features]
    y = df[target]

    # 3. One-Hot Encode Categorical Features
    print(" -> One-Hot Encoding categorical features ('Zone')...")
    X_encoded = pd.get_dummies(X, columns=["Zone"])

    # Persist column order so runtime inference matches training dimensions
    feature_columns = list(X_encoded.columns)
    joblib.dump(feature_columns, COLUMNS_PATH)
    print(f" -> Serialized feature columns schema to '{COLUMNS_PATH.name}'")

    # 4. Train / Test Split (80% / 20%)
    print(" -> Splitting dataset (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.2, random_state=42
    )

    # 5. Train Random Forest Regressor
    print(" -> Fitting RandomForestRegressor (n_estimators=100)...")
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)

    # 6. Model Evaluation
    print(" -> Evaluating model against unseen test split...")
    predictions = rf_model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)

    print("\n" + "=" * 45)
    print("   HYDROINTEL MODEL PERFORMANCE BENCHMARKS   ")
    print("=" * 45)
    print(f"   • Mean Absolute Error (MAE) : {mae:.4f} ML")
    print(f"   • Root Mean Sq Error (RMSE) : {rmse:.4f} ML")
    print(f"   • R² Score (Accuracy Fit)   : {r2:.4f} ({r2 * 100:.2f}%)")
    print("=" * 45 + "\n")

    # 7. Serialize Trained Model
    joblib.dump(rf_model, MODEL_PATH)
    print(f"✅ Success! Trained model serialized to '{MODEL_PATH.name}'.\n")

    return rf_model, r2


if __name__ == "__main__":
    train_and_save_model()