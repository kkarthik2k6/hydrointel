"""HydroIntel — Data Cleaning and Feature Pipeline.

Ingests raw municipal weather, demographic, and water dispatch CSVs from
`datasets/`, repairs sensor dropouts/anomalies, and writes `datasets/final_dataset.csv`.
"""

from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
OUTPUT_FILE = DATASETS_DIR / "final_dataset.csv"

DISPATCH_COLS = ("Actual_Dispatch_ML", "Previous_Day_Dispatch_ML")
MAX_VALID_DISPATCH_ML = 150.0


def _load_csv(path: Path) -> pd.DataFrame:
    """Read a CSV file and narrow its static return type to DataFrame."""
    df = pd.read_csv(path)
    assert isinstance(df, pd.DataFrame)
    return df


def clean_and_merge() -> pd.DataFrame:
    """Clean raw datasets and merge them into a unified ML-ready table."""
    weather_df = _load_csv(DATASETS_DIR / "raw_weather_data.csv")
    demo_df = _load_csv(DATASETS_DIR / "raw_zone_demographics.csv")
    dispatch_df = _load_csv(DATASETS_DIR / "raw_water_dispatch_records.csv")

    # Standardize zone names and preserve municipal abbreviations
    demo_df["Zone"] = (
        demo_df["Zone"]
        .astype(str)
        .str.strip()
        .str.replace("_", " ", regex=False)
        .str.title()
        .replace({"Lb Nagar": "LB Nagar"})
    )

    # Impute missing weather telemetry
    weather_df["Temperature_C"] = weather_df["Temperature_C"].interpolate(method="linear")
    weather_df["Rainfall_mm"] = weather_df["Rainfall_mm"].fillna(0.0)

    # Replace sensor dropouts (<= 0) and extreme spikes (> 150 ML) with each zone's median
    for zone, group in dispatch_df.groupby("Zone"):
        zone_mask = dispatch_df["Zone"] == zone
        zone_median = float(group["Actual_Dispatch_ML"].median())
        for col in DISPATCH_COLS:
            invalid = zone_mask & ((dispatch_df[col] <= 0.0) | (dispatch_df[col] > MAX_VALID_DISPATCH_ML))
            dispatch_df.loc[invalid, col] = zone_median

    # Merge dispatch, weather, and demographics
    final_df = (
        dispatch_df
        .merge(weather_df, on="Date", how="left")
        .merge(demo_df, on="Zone", how="left")
    )

    final_df["Temperature_C"] = final_df["Temperature_C"].round(1)
    for col in DISPATCH_COLS:
        final_df[col] = final_df[col].round(4)

    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"ETL complete: saved '{OUTPUT_FILE.relative_to(BASE_DIR)}' ({len(final_df):,} rows, {len(final_df.columns)} cols)")
    return final_df


if __name__ == "__main__":
    clean_and_merge()
