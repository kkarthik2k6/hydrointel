"""HydroIntel — Random Forest Model Training Pipeline.

Trains a RandomForestRegressor on `datasets/final_dataset.csv`, evaluates
hold-out metrics, and serializes artifacts into `models/`.
"""

from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "datasets" / "final_dataset.csv"
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "model.pkl"
COLUMNS_PATH = MODELS_DIR / "model_columns.pkl"

FEATURE_COLS = [
    "Zone",
    "Temperature_C",
    "Rainfall_mm",
    "Baseline_Population",
    "Previous_Day_Dispatch_ML",
]
TARGET_COL = "Actual_Dispatch_ML"


def _load_csv(path: Path) -> pd.DataFrame:
    """Read a CSV file and narrow its static return type to DataFrame."""
    df = pd.read_csv(path)
    assert isinstance(df, pd.DataFrame)
    return df


def train_and_save_model() -> Tuple[RandomForestRegressor, float]:
    """Train the Random Forest model, log metrics, and persist artifacts."""
    df = _load_csv(DATASET_PATH)

    X_encoded = pd.get_dummies(df[FEATURE_COLS], columns=["Zone"])
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, preds))
    rmse = float(np.sqrt(float(mean_squared_error(y_test, preds))))
    r2 = float(r2_score(y_test, preds))

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(list(X_encoded.columns), COLUMNS_PATH)
    joblib.dump(model, MODEL_PATH, compress=3)

    print(f"Model trained -> MAE: {mae:.4f} ML | RMSE: {rmse:.4f} ML | R2: {r2:.4f} ({r2 * 100:.2f}%)")
    print(f"Saved artifacts to '{MODELS_DIR.relative_to(BASE_DIR)}/'")
    return model, r2


if __name__ == "__main__":
    train_and_save_model()
