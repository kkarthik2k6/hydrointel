"""
HydroIntel — Municipal Water Demand Forecasting & Intelligence Platform
Author: HydroIntel Engineering Team
Description: Flask web service integrating Random Forest ML demand prediction 
             with Google Gemini AI automated operational directives.
"""

from pathlib import Path
import os
import time
from typing import Dict, Any, Optional

from flask import Flask, render_template, request
from google import genai
import joblib
import markdown
import pandas as pd
from dotenv import load_dotenv

# Base Directories
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"
COLUMNS_PATH = BASE_DIR / "model_columns.pkl"

# Load environment configuration (.env)
load_dotenv(BASE_DIR / ".env")

# Initialize Flask Application
app = Flask(__name__)

# Load Trained ML Model & Feature Column Structure
model = joblib.load(MODEL_PATH)
model_columns = joblib.load(COLUMNS_PATH)

# Configure Google Gemini Client from Environment Variable
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("[WARNING] 'GEMINI_API_KEY' not found in environment or .env file.")
    gemini_client = None
else:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Baseline Historical Averages for GHMC Zones (Megaliters)
ZONE_BENCHMARKS: Dict[str, float] = {
    "Banjara Hills": 47.5,
    "Kukatpally": 78.2,
    "LB Nagar": 62.4,
    "Malkajgiri": 54.1,
    "Secunderabad": 51.8,
    "Uppal": 43.6,
}


def get_sustainability_tips(
    zone: str, 
    population: float, 
    temp: float, 
    rainfall: float, 
    prediction: float
) -> str:
    """Generate clear, actionable municipal operational directives using Google Gemini.
    
    Includes multi-model fallback to ensure high availability during peak demand.
    """
    if not gemini_client:
        return (
            "**Gemini API Not Configured**: Please configure your `GEMINI_API_KEY` "
            "in the `.env` file to enable automated AI operational directives."
        )

    fallback_models = ["gemini-3.6-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"]

    prompt = f"""
    You are a smart water management assistant for Hyderabad.
    Given:
    - Zone: {zone}
    - Population: {population:,.0f}
    - Temperature: {temp} °C
    - Rainfall: {rainfall} mm
    - Predicted Water Demand: {prediction} Megaliters (ML)

    Provide a very simple, direct 3-point plan in plain English:
    1. Water Release Timing (best hours to supply to avoid wastage).
    2. Weather Adjustment (how the {temp}°C temp or {rainfall}mm rain affects supply).
    3. Public Advisory (one simple action residents should follow today).

    Rules:
    - Keep language simple and easy to read.
    - Use bullet points.
    - Maximum 3 short points.
    """

    for model_name in fallback_models:
        for attempt in range(2):
            try:
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                if attempt < 1:
                    time.sleep(2)
                    continue
                print(f"[Gemini Notice] Model '{model_name}' unavailable ({e}). Trying next fallback...")
                break

    return (
        "AI recommendations are temporarily experiencing high traffic. "
        "Baseline operational metrics remain fully calculated above."
    )


@app.route("/", methods=["GET"])
def index():
    """Render the main forecasting input dashboard."""
    return render_template(
        "index.html",
        prediction=None,
        zone_benchmarks=ZONE_BENCHMARKS,
    )


@app.route("/predict", methods=["POST"])
def predict():
    """Handle telemetry input, run ML model inference, and query Gemini advisory."""
    zone = request.form["zone"]
    population = float(request.form["population"])
    temperature = float(request.form["temperature"])
    rainfall = float(request.form["rainfall"])
    prev_dispatch = float(request.form["prev_dispatch"])

    form_data: Dict[str, Any] = {
        "zone": zone,
        "population": population,
        "temperature": temperature,
        "rainfall": rainfall,
        "prev_dispatch": prev_dispatch,
    }

    # Prepare feature dataframe aligned with model training schema
    input_df = pd.DataFrame([{
        "Zone": zone,
        "Temperature_C": temperature,
        "Rainfall_mm": rainfall,
        "Baseline_Population": population,
        "Previous_Day_Dispatch_ML": prev_dispatch,
    }])

    # One-Hot Encode categorical zone and align columns
    input_encoded = pd.get_dummies(input_df, columns=["Zone"])
    input_encoded = input_encoded.reindex(columns=model_columns, fill_value=0)

    # Machine Learning Demand Inference
    predicted_val = model.predict(input_encoded)[0]
    predicted_dispatch = round(float(predicted_val), 2)

    # Gemini Operational Directives
    ai_tips_raw = get_sustainability_tips(
        zone=zone,
        population=population,
        temp=temperature,
        rainfall=rainfall,
        prediction=predicted_dispatch,
    )
    ai_tips_html = markdown.markdown(ai_tips_raw or "")

    return render_template(
        "index.html",
        prediction=predicted_dispatch,
        form_data=form_data,
        ai_recommendation=ai_tips_html,
        zone_benchmarks=ZONE_BENCHMARKS,
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)