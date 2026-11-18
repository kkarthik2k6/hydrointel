# 💧 HydroIntel — Smart Water Intelligence

> **AI-Powered Water Demand Forecasting & Municipal Decision Support for Hyderabad (GHMC)**

HydroIntel is a Flask web dashboard for municipal water authorities. It pairs a **Random Forest Regressor** for daily zone demand forecasting with **Google Gemini AI** for concise operational action plans.

## Key Features

- **Smart Demand Forecasting**: Predicts daily water dispatch (Megaliters / ML) from zone demographics, temperature, rainfall, and previous-day dispatch.
- **Gemini AI Directives**: Generates 3-point municipal advisories (release timing, weather adjustment, public advisory) with automatic multi-model fallback.
- **VisionOS Liquid Glass UI**: Frosted-glass interface with Dark/Light mode, 4 ambient accent themes, 3D tilt glare, and water ripple effects.
- **Interactive Analytics**: Reservoir fill simulation, baseline gauge, Bar/Radar zone comparison charts, voice briefing, clipboard copy, and PDF print export.

## Project Structure

```text
hydrointel/
├── app.py                  # Flask server, validation, ML inference & Gemini API
├── datasets/               # Raw municipal CSVs + cleaned final_dataset.csv
├── models/                 # Serialized model.pkl and model_columns.pkl
├── scripts/
│   ├── clean_data.py       # ETL pipeline: raw CSVs -> datasets/final_dataset.csv
│   └── train_model.py      # Trains Random Forest -> models/
├── static/
│   ├── css/style.css       # VisionOS Liquid Glass design system
│   └── js/app.js           # Client interactions, telemetry loader & Chart.js
├── templates/
│   └── index.html          # Input & results dashboard template
├── .env.example            # Environment variable template
└── requirements.txt        # Python dependencies
```

## Quick Start

1. **Activate virtual environment & install dependencies**

   ```powershell
   # Windows
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure your Gemini API key**

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `GEMINI_API_KEY` inside `.env`.

3. **Run the dashboard**

   ```powershell
   python app.py
   ```

   Open `http://127.0.0.1:5000` in your browser.

## Rebuilding Data & Model (Optional)

If you update the raw CSV files inside `datasets/`:

```powershell
python scripts/clean_data.py
python scripts/train_model.py
```
