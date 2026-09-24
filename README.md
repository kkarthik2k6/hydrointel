# 💧 HydroIntel — Smart Water Intelligence

> **AI-Powered Water Demand Forecasting & Municipal Decision Support for Hyderabad (GHMC)**

---

## 📌 **What is HydroIntel?**

**HydroIntel** is a web-based decision dashboard for municipal water authorities. It uses **Machine Learning** to accurately forecast daily water demand across Hyderabad zones and leverages **Google Gemini AI** to produce immediate operational action plans.

---

## ⚡ **Key Features**

- **🔮 Smart Demand Forecasting**: Predicts water dispatch (in Megaliters / ML) using a trained Random Forest Regressor based on weather, demographics, and previous dispatch.
- **🤖 Gemini AI Directives**: Delivers automated 3-point municipal advisories (Supply Timing, Weather Adjustments, Public Advisories) with multi-model failover.
- **🪟 Apple VisionOS Liquid Glass UI**: Ultra-clean frosted glass interface featuring interactive 3D tilt, water ripple physics, and instant Dark / Light mode switching.
- **📊 Real-Time Analytics**:
  - **Reservoir Capacity Gauge**: Visual needle indicator for demand stress levels.
  - **Multi-View Zone Charts**: Switch on-the-fly between Bar and Radar profile comparisons.
- **🔊 Operator Voice Briefing**: Built-in audio playback and one-click PDF export for field teams.

---

## 🛠️ **Tech Stack**

- **Backend**: Python 3.10+, Flask
- **Machine Learning**: Scikit-Learn (Random Forest), Pandas, NumPy, Joblib
- **Generative AI**: Google GenAI SDK (Gemini 3.6 Flash / 2.0 Flash)
- **Frontend**: Vanilla HTML5, VisionOS CSS3 Design System, Chart.js

---

## 📁 **Project Structure (What is What)**

| File / Folder | Purpose |
| :--- | :--- |
| **`app.py`** | Main Flask server, routes, and Gemini API integration |
| **`clean_data.py`** | Data cleaning script that fixes missing sensor logs and merges records |
| **`train_model.py`** | Machine Learning script that trains and saves the Random Forest model |
| **`final_dataset.csv`** | Cleaned dataset used for training the model |
| **`model.pkl`** | Trained Random Forest machine learning model |
| **`model_columns.pkl`** | Encoded feature column structure |
| **`requirements.txt`** | List of required Python packages |
| **`.env.example`** | Safe template showing required environment variables |
| **`static/css/`** | VisionOS Liquid Glass styling, themes, and animations |
| **`static/js/`** | Client logic: 3D tilt, canvas effects, audio, and charts |
| **`templates/`** | HTML dashboard templates |

---

## 🚀 **How to Run the Project**

### **Step 1: Activate Virtual Environment**
Open your terminal inside the `hydrointel` folder:

```powershell
# Windows:
.\venv\Scripts\activate

# macOS / Linux:
source venv/bin/activate
```

---

### **Step 2: Install Dependencies**
```bash
pip install -r requirements.txt
```

---

### **Step 3: Setup Your API Key**
Create your `.env` file from the provided template:

```powershell
# Windows:
Copy-Item .env.example .env

# macOS / Linux:
cp .env.example .env
```

Open `.env` and paste your Google Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

---

### **Step 4: Start the Web App**
```bash
python app.py
```

Open your browser and visit: **`http://127.0.0.1:5000`**

---

### 🔁 **(Optional) Re-clean Data or Retrain Model**
If you ever update the raw datasets inside `datasets/`:
```bash
python clean_data.py
python train_model.py
```
