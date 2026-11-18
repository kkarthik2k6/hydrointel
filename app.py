"""HydroIntel — Municipal Water Demand Forecasting & Intelligence Platform.

Flask web service combining a Random Forest demand prediction model with
Google Gemini AI operational directives for Hyderabad (GHMC) zones.
"""

from collections.abc import Mapping
import json
import logging
import math
import os
from pathlib import Path
import time
from typing import Dict, Tuple, TypedDict

from dotenv import load_dotenv
from flask import Flask, render_template, request
from google import genai
import joblib
import markdown
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

load_dotenv(BASE_DIR / ".env")
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger("hydrointel")

app = Flask(__name__)

# Trained ML model & encoded column schema
model = joblib.load(MODELS_DIR / "model.pkl")
model_columns = joblib.load(MODELS_DIR / "model_columns.pkl")

# Google Gemini client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
if not gemini_client:
    logger.warning("GEMINI_API_KEY not found in environment or .env file.")

GEMINI_MODELS = ("gemini-3.6-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash")


class ZoneInfo(TypedDict):
    population: int
    benchmark: float


class TelemetryData(TypedDict):
    zone: str
    population: float
    temperature: float
    rainfall: float
    prev_dispatch: float


# Single source of truth for GHMC zones (population & baseline dispatch in ML)
ZONES: Dict[str, ZoneInfo] = {
    "Banjara Hills": {"population": 65200, "benchmark": 47.5},
    "Kukatpally": {"population": 315500, "benchmark": 78.2},
    "LB Nagar": {"population": 385000, "benchmark": 62.4},
    "Malkajgiri": {"population": 110000, "benchmark": 54.1},
    "Secunderabad": {"population": 250000, "benchmark": 51.8},
    "Uppal": {"population": 95000, "benchmark": 43.6},
}
ZONE_BENCHMARKS: Dict[str, float] = {k: v["benchmark"] for k, v in ZONES.items()}
ZONE_LABELS_JSON = json.dumps(list(ZONE_BENCHMARKS.keys()))
ZONE_BASELINES_JSON = json.dumps(list(ZONE_BENCHMARKS.values()))


def parse_telemetry_form(form: Mapping[str, str]) -> Tuple[TelemetryData | None, str | None]:
    """Validate and parse telemetry fields submitted from the dashboard form."""
    zone = form.get("zone", "").strip()
    if zone not in ZONES:
        return None, "Please select a valid GHMC zone."

    try:
        population = float(form["population"])
        temperature = float(form["temperature"])
        rainfall = float(form["rainfall"])
        prev_dispatch = float(form["prev_dispatch"])
    except (KeyError, ValueError):
        return None, "Please provide valid numeric values for all telemetry fields."

    if not all(math.isfinite(v) for v in (population, temperature, rainfall, prev_dispatch)):
        return None, "Telemetry values must be finite numbers."
    if population <= 0 or rainfall < 0 or prev_dispatch < 0:
        return None, "Population must be positive, and rainfall / previous dispatch cannot be negative."

    data: TelemetryData = {
        "zone": zone,
        "population": population,
        "temperature": temperature,
        "rainfall": rainfall,
        "prev_dispatch": prev_dispatch,
    }
    return data, None


def predict_demand(data: TelemetryData) -> float:
    """Run Random Forest inference for a single telemetry payload."""
    input_df = pd.DataFrame([{
        "Zone": data["zone"],
        "Temperature_C": data["temperature"],
        "Rainfall_mm": data["rainfall"],
        "Baseline_Population": data["population"],
        "Previous_Day_Dispatch_ML": data["prev_dispatch"],
    }])
    encoded = pd.get_dummies(input_df, columns=["Zone"]).reindex(columns=model_columns, fill_value=0)
    return round(float(model.predict(encoded)[0]), 2)


def get_sustainability_tips(data: TelemetryData, prediction: float) -> str:
    """Generate a concise 3-point municipal operational directive via Google Gemini."""
    if not gemini_client:
        return (
            "**Gemini API Not Configured**: Add your `GEMINI_API_KEY` to the `.env` file "
            "to enable automated AI operational directives."
        )

    prompt = (
        f"You are a smart water management assistant for Hyderabad.\n"
        f"Given:\n"
        f"- Zone: {data['zone']}\n"
        f"- Population: {data['population']:,.0f}\n"
        f"- Temperature: {data['temperature']} °C\n"
        f"- Rainfall: {data['rainfall']} mm\n"
        f"- Predicted Water Demand: {prediction} Megaliters (ML)\n\n"
        f"Provide a very simple, direct 3-point plan in plain English:\n"
        f"1. Water Release Timing (best hours to supply to avoid wastage).\n"
        f"2. Weather Adjustment (how the {data['temperature']}°C temp or {data['rainfall']}mm rain affects supply).\n"
        f"3. Public Advisory (one simple action residents should follow today).\n\n"
        f"Rules: Keep language simple and easy to read. Use bullet points. Maximum 3 short points."
    )

    for model_name in GEMINI_MODELS:
        for attempt in range(2):
            try:
                response = gemini_client.models.generate_content(model=model_name, contents=prompt)
                if response and response.text:
                    return response.text
            except Exception as exc:
                if attempt == 0:
                    time.sleep(2)
                    continue
                logger.info("Model '%s' unavailable (%s). Trying next fallback.", model_name, exc)

    return (
        "AI recommendations are temporarily experiencing high traffic. "
        "Baseline operational metrics remain fully calculated above."
    )


@app.route("/", methods=["GET"])
def index():
    """Render the main forecasting dashboard."""
    return render_template("index.html", prediction=None, zones=ZONES)


@app.route("/predict", methods=["POST"])
def predict():
    """Validate telemetry input, run ML demand prediction, and render results."""
    form_data, error = parse_telemetry_form(request.form)
    if error or form_data is None:
        return (
            render_template(
                "index.html",
                prediction=None,
                zones=ZONES,
                error=error,
            ),
            400,
        )

    predicted_dispatch = predict_demand(form_data)
    baseline = ZONE_BENCHMARKS.get(form_data["zone"], predicted_dispatch)
    variance = round(predicted_dispatch - baseline, 2)
    is_above = variance > 0
    ai_html = markdown.markdown(get_sustainability_tips(form_data, predicted_dispatch))

    return render_template(
        "index.html",
        prediction=predicted_dispatch,
        form_data=form_data,
        population_display=f"{form_data['population']:,.0f}",
        baseline=baseline,
        variance=variance,
        variance_icon="📈" if is_above else "📉",
        variance_icon_class="rose" if is_above else "emerald",
        variance_value_class="negative" if is_above else "positive",
        variance_prefix="+" if is_above else "",
        zone_labels_json=ZONE_LABELS_JSON,
        zone_baselines_json=ZONE_BASELINES_JSON,
        ai_recommendation=ai_html,
        zones=ZONES,
    )


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    port = int(os.environ.get("PORT", "5000"))
    app.run(debug=debug, port=port)
