"""
HydroIntel — Data Cleaning and Feature Pipeline
Author: HydroIntel Engineering Team
Description: Ingests raw municipal weather, demographics, and dispatch logs, 
             corrects sensor dropouts and anomalies, and outputs final_dataset.csv.
"""

from pathlib import Path
import pandas as pd
import numpy as np

# Base paths
BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets"
OUTPUT_FILE = BASE_DIR / "final_dataset.csv"


def clean_and_merge() -> pd.DataFrame:
    """Clean raw datasets and merge them into a unified feature set."""
    print("💧 [HydroIntel ETL] Starting Data Cleaning and Merging Pipeline...")

    # 1. Load Raw Datasets
    print(" -> Loading raw datasets from 'datasets/' folder...")
    weather_df = pd.read_csv(DATASETS_DIR / "raw_weather_data.csv")
    demo_df = pd.read_csv(DATASETS_DIR / "raw_zone_demographics.csv")
    dispatch_df = pd.read_csv(DATASETS_DIR / "raw_water_dispatch_records.csv")

    # 2. Clean Demographics Text & Standardize Zone Names
    print(" -> Standardizing zone naming conventions...")
    demo_df["Zone"] = (
        demo_df["Zone"]
        .astype(str)
        .str.lower()
        .str.replace("_", " ")
        .str.title()
        .str.strip()
    )
    # Fix casing for municipal abbreviations
    demo_df["Zone"] = demo_df["Zone"].replace({"Lb Nagar": "LB Nagar"})

    # 3. Clean Weather Telemetry
    print(" -> Imputing missing weather sensor telemetry...")
    # Linear interpolation for temperature gaps between consecutive days
    weather_df["Temperature_C"] = weather_df["Temperature_C"].interpolate(method="linear")
    # Impute missing rainfall to 0.0mm (dry sensor default)
    weather_df["Rainfall_mm"] = weather_df["Rainfall_mm"].fillna(0.0)

    # 4. Clean Dispatch Records (Anomalies & Pipe-burst Drops)
    print(" -> Filtering telemetry anomalies (dropouts and extreme spikes)...")
    for zone in dispatch_df["Zone"].unique():
        zone_mask = dispatch_df["Zone"] == zone
        zone_median = dispatch_df.loc[zone_mask, "Actual_Dispatch_ML"].median()

        # Fix actual dispatch drops (0.0 ML) and unrealistic surges (> 150 ML)
        dispatch_df.loc[zone_mask & (dispatch_df["Actual_Dispatch_ML"] == 0.0), "Actual_Dispatch_ML"] = zone_median
        dispatch_df.loc[zone_mask & (dispatch_df["Actual_Dispatch_ML"] > 150.0), "Actual_Dispatch_ML"] = zone_median

        # Fix previous day dispatch outliers
        dispatch_df.loc[zone_mask & (dispatch_df["Previous_Day_Dispatch_ML"] == 0.0), "Previous_Day_Dispatch_ML"] = zone_median
        dispatch_df.loc[zone_mask & (dispatch_df["Previous_Day_Dispatch_ML"] > 150.0), "Previous_Day_Dispatch_ML"] = zone_median

    # 5. Merge Datasets into Unified Table
    print(" -> Merging dispatch, weather, and demographic features...")
    merged_df = pd.merge(dispatch_df, weather_df, on="Date", how="left")
    final_df = pd.merge(merged_df, demo_df, on="Zone", how="left")

    # Round continuous telemetry values for precision consistency
    final_df["Temperature_C"] = final_df["Temperature_C"].round(1)
    final_df["Actual_Dispatch_ML"] = final_df["Actual_Dispatch_ML"].round(4)
    final_df["Previous_Day_Dispatch_ML"] = final_df["Previous_Day_Dispatch_ML"].round(4)

    # 6. Export Final Unified Dataset
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"\n✅ ETL Complete: Saved '{OUTPUT_FILE.name}'")
    print(f"   Total Records: {len(final_df):,} | Feature Count: {len(final_df.columns)}\n")

    return final_df


if __name__ == "__main__":
    clean_and_merge()