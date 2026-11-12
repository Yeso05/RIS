import os
import sys
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ml'))

from ml.dataset_generator import generate_reservoir_alpha_dataset
from ml.train_models import forecast_next_days, train_and_evaluate_models
from ml.decision_engine import calculate_ris_assessment
from config import RESERVOIR_CONFIG

RESERVOIR_DISPLAY_NAME = RESERVOIR_CONFIG.name or "Reservoir"

app = FastAPI(
    title="Reservoir Intelligence System (RIS) Prototype API",
    description="Configurable AI decision-support system for reservoir operations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global dataset & ML models
DATASET = generate_reservoir_alpha_dataset(num_days=365)
MODEL_METRICS, TRAINED_MODELS = train_and_evaluate_models()

class SimulationInput(BaseModel):
    reservoir_level_m: float = Field(ge=0, le=100)
    inflow_cusecs: float = Field(ge=0)
    rainfall_mm: float = Field(ge=0)
    electricity_demand_mw: float = Field(ge=0)


def _forecast_for_latest(days=7):
    return forecast_next_days(
        TRAINED_MODELS,
        DATASET.iloc[-1],
        days=days,
        config=RESERVOIR_CONFIG,
    )


def _model_prediction_for_inputs(
    reservoir_level_m,
    inflow_cusecs,
    rainfall_mm,
    electricity_demand_mw,
):
    latest = DATASET.iloc[-1].copy()
    latest["reservoir_level_m"] = reservoir_level_m
    latest["inflow_cusecs"] = inflow_cusecs
    latest["rainfall_mm"] = rainfall_mm
    latest["electricity_demand_mw"] = electricity_demand_mw
    return forecast_next_days(
        TRAINED_MODELS,
        latest,
        days=1,
        config=RESERVOIR_CONFIG,
    )[0]

@app.get("/")
def read_root():
    return {
        "system": "RIS — Reservoir Intelligence System",
        "reservoir_identity": RESERVOIR_DISPLAY_NAME,
        "status": "Operational Decision Support Prototype",
        "system_status": {
            "data_source": "Synthetic data",
            "ai_engine": "Online",
            "prediction_status": "Available",
            "decision_engine": "Ready",
            "physical_gate_control": "Not Connected"
        },
        "safety_disclaimer": "AI DECISION SUPPORT — OPERATOR APPROVAL REQUIRED. This prototype provides recommendations only and does not directly control physical reservoir gates."
    }

@app.get("/api/system-status")
def get_system_status():
    return {
        "reservoir_identity": RESERVOIR_DISPLAY_NAME,
        "data_source": "Synthetic data",
        "ai_engine": "Online",
        "prediction_status": "Available",
        "decision_engine": "Ready",
        "physical_gate_control": "Not Connected",
        "safety_notice": "AI DECISION SUPPORT — OPERATOR APPROVAL REQUIRED"
    }


@app.get("/api/reservoir-config")
def get_reservoir_config():
    return {
        "name": RESERVOIR_CONFIG.name,
        "description": RESERVOIR_CONFIG.description,
        "location": {
            "latitude": RESERVOIR_CONFIG.latitude,
            "longitude": RESERVOIR_CONFIG.longitude,
        },
        "max_water_level_m": RESERVOIR_CONFIG.max_water_level_m,
        "full_storage_capacity_mcm": RESERVOIR_CONFIG.full_storage_capacity_mcm,
        "safety_threshold_m": RESERVOIR_CONFIG.safety_threshold_m,
        "minimum_operating_level_m": RESERVOIR_CONFIG.minimum_operating_level_m,
        "spillway_gates_count": RESERVOIR_CONFIG.spillway_gates_count,
        "hydroelectric_capacity_mw": RESERVOIR_CONFIG.hydroelectric_capacity_mw,
        "data_source": "Synthetic data",
        "physical_gate_control": "Not Connected",
    }

@app.get("/api/current-conditions")
def get_current_conditions():
    latest = DATASET.iloc[-1]
    return {
        "reservoir_name": RESERVOIR_DISPLAY_NAME,
        "timestamp_ist": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
        "reservoir_level_m": float(latest["reservoir_level_m"]),
        "max_reservoir_level_m": RESERVOIR_CONFIG.max_water_level_m,
        "storage_mcm": float(latest["storage_mcm"]),
        "max_storage_mcm": RESERVOIR_CONFIG.full_storage_capacity_mcm,
        "inflow_cusecs": float(latest["inflow_cusecs"]),
        "outflow_cusecs": float(latest["recommended_release_cusecs"]),
        "rainfall_mm": float(latest["rainfall_mm"]),
        "electricity_demand_mw": float(latest["electricity_demand_mw"]),
        "hydropower_mw": float(latest["hydropower_mw"]),
        "temperature_c": float(latest["temperature_c"]),
        "water_condition": latest["water_condition"],
        "data_source": "Synthetic data",
    }

@app.get("/api/decision/today")
def get_todays_decision():
    latest = DATASET.iloc[-1]
    model_prediction = _model_prediction_for_inputs(
        float(latest["reservoir_level_m"]),
        float(latest["inflow_cusecs"]),
        float(latest["rainfall_mm"]),
        float(latest["electricity_demand_mw"]),
    )
    assessment = calculate_ris_assessment(
        reservoir_level_m=float(latest["reservoir_level_m"]),
        inflow_cusecs=float(latest["inflow_cusecs"]),
        rainfall_mm=float(latest["rainfall_mm"]),
        electricity_demand_mw=float(latest["electricity_demand_mw"]),
        config=RESERVOIR_CONFIG,
        predictions={
            "rainfall_mm": model_prediction["predicted_rainfall_mm"],
            "inflow_cusecs": model_prediction["predicted_inflow_cusecs"],
            "demand_mw": model_prediction["predicted_demand_mw"],
        },
    )
    
    return {
        "date": datetime.now().strftime("%d %b %Y"),
        "reservoir_name": RESERVOIR_DISPLAY_NAME,
        "inputs": {
            "reservoir_level_m": float(latest["reservoir_level_m"]),
            "inflow_cusecs": float(latest["inflow_cusecs"]),
            "rainfall_mm": float(latest["rainfall_mm"]),
            "electricity_demand_mw": float(latest["electricity_demand_mw"])
        },
        "assessment": {
            "flood_risk": assessment["flood_risk"],
            "water_condition": assessment["water_condition"]
        },
        "recommendation": {
            "action": assessment["gate_decision"],  # OPEN / HOLD / REDUCE / CLOSE
            "recommended_opening_pct": assessment["recommended_opening_pct"],
            "recommended_release_cusecs": assessment["recommended_release_cusecs"],
            "expected_level_tomorrow_m": assessment["expected_level_tomorrow_m"],
            "hydropower_estimate_mw": assessment["hydropower_estimate_mw"],
            "ai_confidence_pct": assessment["ai_confidence_pct"]
        },
        "paragraph_reason": assessment["paragraph_reason"],
        "reasons": assessment["reasons"],
        "safety_disclaimer": "AI DECISION SUPPORT — OPERATOR APPROVAL REQUIRED",
        "data_source": "Synthetic data",
    }

@app.get("/api/predictions")
def get_predictions():
    predictions = _forecast_for_latest(days=7)
    return {
        "lookahead_days": 7,
        "predictions": predictions,
        "model_source": "Trained model inference",
        "data_source": "Synthetic data",
    }

@app.post("/api/simulation/assess")
def run_simulation_assessment(input_data: SimulationInput):
    model_prediction = _model_prediction_for_inputs(
        input_data.reservoir_level_m,
        input_data.inflow_cusecs,
        input_data.rainfall_mm,
        input_data.electricity_demand_mw,
    )
    assessment = calculate_ris_assessment(
        reservoir_level_m=input_data.reservoir_level_m,
        inflow_cusecs=input_data.inflow_cusecs,
        rainfall_mm=input_data.rainfall_mm,
        electricity_demand_mw=input_data.electricity_demand_mw,
        config=RESERVOIR_CONFIG,
        predictions={
            "rainfall_mm": model_prediction["predicted_rainfall_mm"],
            "inflow_cusecs": model_prediction["predicted_inflow_cusecs"],
            "demand_mw": model_prediction["predicted_demand_mw"],
        },
    )
    
    return {
        "inputs": input_data.dict(),
        "assessment": assessment,
        "model_prediction": model_prediction,
        "data_source": "Synthetic data",
    }

@app.get("/api/history/30-days")
def get_30_day_history():
    recent_30 = DATASET.tail(30).copy().iloc[::-1]
    records = []
    
    for idx, row in recent_30.iterrows():
        assessment = calculate_ris_assessment(
            reservoir_level_m=float(row["reservoir_level_m"]),
            inflow_cusecs=float(row["inflow_cusecs"]),
            rainfall_mm=float(row["rainfall_mm"]),
            electricity_demand_mw=float(row["electricity_demand_mw"]),
            config=RESERVOIR_CONFIG,
        )
        
        records.append({
            "date": row["date"],
            "reservoir_level_m": float(row["reservoir_level_m"]),
            "storage_mcm": float(row["storage_mcm"]),
            "inflow_cusecs": float(row["inflow_cusecs"]),
            "rainfall_mm": float(row["rainfall_mm"]),
            "electricity_demand_mw": float(row["electricity_demand_mw"]),
            "flood_risk": row["flood_risk"],
            "ai_decision": row["gate_decision"],
            "recommended_opening_pct": int(row["recommended_opening_pct"]),
            "recommended_release_cusecs": int(row["recommended_release_cusecs"]),
            "paragraph_reason": assessment["paragraph_reason"],
            "reasons": assessment["reasons"]
        })
        
    return {
        "count": len(records),
        "history": records,
        "data_source": "Synthetic data",
    }

@app.get("/api/analytics")
def get_analytics():
    recent_30 = DATASET.tail(30).copy()
    
    time_series = []
    conditions_vs_gate = []
    
    for idx, row in recent_30.iterrows():
        time_series.append({
            "date": row["date"][-5:],
            "full_date": row["date"],
            "reservoir_level_m": float(row["reservoir_level_m"]),
            "inflow_cusecs": float(row["inflow_cusecs"]),
            "rainfall_mm": float(row["rainfall_mm"]),
            "electricity_demand_mw": float(row["electricity_demand_mw"]),
            "recommended_opening_pct": int(row["recommended_opening_pct"]),
            "recommended_release_cusecs": int(row["recommended_release_cusecs"]),
            "gate_decision": row["gate_decision"]
        })
        
        conditions_vs_gate.append({
            "date": row["date"][-5:],
            "reservoir_level_m": float(row["reservoir_level_m"]),
            "inflow_cusecs": float(row["inflow_cusecs"]),
            "gate_opening_pct": int(row["recommended_opening_pct"]),
            "gate_decision": row["gate_decision"],
            "flood_risk": row["flood_risk"]
        })
        
    return {
        "time_series": time_series,
        "conditions_vs_gate": conditions_vs_gate
    }

@app.get("/api/dam-info")
def get_dam_info():
    map_nodes = []
    if RESERVOIR_CONFIG.latitude is not None and RESERVOIR_CONFIG.longitude is not None:
        map_nodes = [
            {
                "id": "main_spillway",
                "name": "Main Spillway",
                "lat": RESERVOIR_CONFIG.latitude,
                "lng": RESERVOIR_CONFIG.longitude,
                "type": "Spillway Control",
                "status": "Configured",
            },
            {
                "id": "reservoir_body",
                "name": f"{RESERVOIR_DISPLAY_NAME} Storage Body",
                "lat": RESERVOIR_CONFIG.latitude + 0.025,
                "lng": RESERVOIR_CONFIG.longitude - 0.015,
                "type": "Storage Body",
                "status": "Configured",
            },
        ]

    return {
        "name": RESERVOIR_CONFIG.name,
        "type": RESERVOIR_CONFIG.description,
        "latitude": RESERVOIR_CONFIG.latitude,
        "longitude": RESERVOIR_CONFIG.longitude,
        "specifications": {
            "max_water_level_m": (
                RESERVOIR_CONFIG.max_water_level_m
                if os.getenv("RIS_MAX_WATER_LEVEL_M") is not None
                else None
            ),
            "full_storage_capacity_mcm": (
                RESERVOIR_CONFIG.full_storage_capacity_mcm
                if os.getenv("RIS_FULL_STORAGE_CAPACITY_MCM") is not None
                else None
            ),
            "spillway_gates_count": (
                RESERVOIR_CONFIG.spillway_gates_count
                if os.getenv("RIS_SPILLWAY_GATES_COUNT") is not None
                else None
            ),
            "hydroelectric_capacity_mw": (
                RESERVOIR_CONFIG.hydroelectric_capacity_mw
                if os.getenv("RIS_HYDROELECTRIC_CAPACITY_MW") is not None
                else None
            ),
        },
        "map_nodes": map_nodes,
        "data_source": "Synthetic data",
    }

@app.get("/api/alerts")
def get_system_alerts():
    latest = DATASET.iloc[-1]
    lvl = float(latest["reservoir_level_m"])
    inf = float(latest["inflow_cusecs"])
    
    alerts = []
    
    if lvl > 44.0:
        alerts.append({
            "id": "ALT-001",
            "severity": "CRITICAL",
            "title": "HIGH FLOOD RISK",
            "timestamp": "10 mins ago",
            "message": f"Predicted inflow is increasing and reservoir storage is approaching the defined safety threshold ({lvl:.1f} m / {RESERVOIR_CONFIG.max_water_level_m:.1f} m)."
        })
    elif lvl > 38.0:
        alerts.append({
            "id": "ALT-002",
            "severity": "WARNING",
            "title": "ELEVATED WATER LEVEL WATCH",
            "timestamp": "25 mins ago",
            "message": f"Reservoir level reached {lvl:.1f} m. Upstream inflow telemetry closely monitored."
        })
        
    if float(latest["electricity_demand_mw"]) > 2800:
        alerts.append({
            "id": "ALT-003",
            "severity": "INFO",
            "title": "HIGH DEMAND OPPORTUNITY",
            "timestamp": "45 mins ago",
            "message": "Electricity demand is elevated while water availability remains sufficient."
        })
        
    if lvl < 25.0:
        alerts.append({
            "id": "ALT-004",
            "severity": "WARNING",
            "title": "LOW WATER AVAILABILITY",
            "timestamp": "1 hour ago",
            "message": "Reservoir level and inflow are decreasing. Water conservation is recommended."
        })
        
    alerts.append({
        "id": "ALT-005",
        "severity": "INFO",
        "title": "DECISION SUPPORT ONLINE",
        "timestamp": "Just now",
        "message": "AI Decision Support Engine updated daily recommendation."
    })
    
    return {
        "count": len(alerts),
        "alerts": alerts,
        "data_source": "Synthetic data",
    }

@app.get("/api/model-performance")
def get_model_performance():
    return MODEL_METRICS

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
