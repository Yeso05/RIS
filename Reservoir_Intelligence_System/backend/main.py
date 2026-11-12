import os
import sys
import numpy as np
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ml'))

from ml.dataset_generator import generate_reservoir_alpha_dataset
from ml.train_models import train_and_evaluate_models
from ml.decision_engine import calculate_ris_assessment

app = FastAPI(
    title="Reservoir Intelligence System (RIS) Prototype API",
    description="AI Decision-Support System for Reservoir Alpha",
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
    reservoir_level_m: float
    inflow_cusecs: float
    rainfall_mm: float
    electricity_demand_mw: float

@app.get("/")
def read_root():
    return {
        "system": "RIS — Reservoir Intelligence System",
        "reservoir_identity": "Reservoir Alpha",
        "status": "Operational Decision Support Prototype",
        "system_status": {
            "data_source": "Simulated Prototype Data",
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
        "reservoir_identity": "Reservoir Alpha",
        "data_source": "Simulated Prototype Data",
        "ai_engine": "Online",
        "prediction_status": "Available",
        "decision_engine": "Ready",
        "physical_gate_control": "Not Connected",
        "safety_notice": "AI DECISION SUPPORT — OPERATOR APPROVAL REQUIRED"
    }

@app.get("/api/current-conditions")
def get_current_conditions():
    latest = DATASET.iloc[-1]
    return {
        "reservoir_name": "Reservoir Alpha",
        "timestamp_ist": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
        "reservoir_level_m": float(latest["reservoir_level_m"]),
        "max_reservoir_level_m": 50.0,
        "storage_mcm": float(latest["storage_mcm"]),
        "max_storage_mcm": 1200.0,
        "inflow_cusecs": float(latest["inflow_cusecs"]),
        "rainfall_mm": float(latest["rainfall_mm"]),
        "electricity_demand_mw": float(latest["electricity_demand_mw"]),
        "hydropower_mw": float(latest["hydropower_mw"]),
        "temperature_c": float(latest["temperature_c"]),
        "water_condition": latest["water_condition"]
    }

@app.get("/api/decision/today")
def get_todays_decision():
    latest = DATASET.iloc[-1]
    assessment = calculate_ris_assessment(
        reservoir_level_m=float(latest["reservoir_level_m"]),
        inflow_cusecs=float(latest["inflow_cusecs"]),
        rainfall_mm=float(latest["rainfall_mm"]),
        electricity_demand_mw=float(latest["electricity_demand_mw"])
    )
    
    return {
        "date": datetime.now().strftime("%d %b %Y"),
        "reservoir_name": "Reservoir Alpha",
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
        "safety_disclaimer": "AI DECISION SUPPORT — OPERATOR APPROVAL REQUIRED"
    }

@app.get("/api/predictions")
def get_predictions():
    predictions = []
    base_date = datetime.now()
    latest = DATASET.iloc[-1]
    
    curr_lvl = float(latest["reservoir_level_m"])
    curr_inf = float(latest["inflow_cusecs"])
    curr_rain = float(latest["rainfall_mm"])
    curr_dem = float(latest["electricity_demand_mw"])
    
    for day in range(1, 8):
        target_date = base_date + timedelta(days=day)
        rain_pred = max(0.0, round(curr_rain + np.sin(day) * 10.0 + np.random.uniform(-3, 3), 1))
        inf_pred = max(1500.0, round(curr_inf + rain_pred * 220 + np.random.uniform(-800, 1200), 0))
        dem_pred = round(curr_dem + np.cos(day) * 140 + np.random.uniform(-30, 50), 0)
        
        lvl_pred = round(np.clip(curr_lvl + (inf_pred - 20000) / 18000.0, 15.0, 49.5), 1)
        curr_lvl = lvl_pred
        
        risk_score = (lvl_pred / 50.0) * 0.45 + (inf_pred / 65000.0) * 0.35 + (rain_pred / 140.0) * 0.20
        risk_label = "CRITICAL" if risk_score > 0.72 else "HIGH" if risk_score > 0.52 else "MODERATE" if risk_score > 0.35 else "LOW"
        
        predictions.append({
            "day": f"Day +{day}",
            "date": target_date.strftime("%d %b"),
            "predicted_rainfall_mm": rain_pred,
            "predicted_inflow_cusecs": inf_pred,
            "predicted_level_m": lvl_pred,
            "predicted_demand_mw": dem_pred,
            "predicted_flood_risk": risk_label
        })
        
    return {
        "lookahead_days": 7,
        "predictions": predictions
    }

@app.post("/api/simulation/assess")
def run_simulation_assessment(input_data: SimulationInput):
    assessment = calculate_ris_assessment(
        reservoir_level_m=input_data.reservoir_level_m,
        inflow_cusecs=input_data.inflow_cusecs,
        rainfall_mm=input_data.rainfall_mm,
        electricity_demand_mw=input_data.electricity_demand_mw
    )
    
    return {
        "inputs": input_data.dict(),
        "assessment": assessment
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
            electricity_demand_mw=float(row["electricity_demand_mw"])
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
        "history": records
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
    return {
        "name": "Reservoir Alpha",
        "type": "Prototype Reservoir Location",
        "latitude": 20.0000,
        "longitude": 78.0000,
        "specifications": {
            "max_water_level_m": 50.0,
            "full_storage_capacity_mcm": 1200.0,
            "spillway_gates_count": 12,
            "hydroelectric_capacity_mw": 240
        },
        "map_nodes": [
            {
                "id": "main_spillway",
                "name": "Main Spillway Gates (12 Radial Gates)",
                "lat": 20.0000,
                "lng": 78.0000,
                "type": "Spillway Control",
                "status": "Operational Prototype"
            },
            {
                "id": "reservoir_body",
                "name": "Reservoir Alpha Storage Body",
                "lat": 20.0250,
                "lng": 77.9850,
                "type": "Storage Body",
                "status": "Monitoring Active"
            },
            {
                "id": "upstream_sensor",
                "name": "Upstream Gauging Station",
                "lat": 20.2500,
                "lng": 77.9500,
                "type": "Inflow Sensor Node",
                "status": "Active Telemetry"
            },
            {
                "id": "powerhouse_node",
                "name": "Hydropower Plant (240 MW)",
                "lat": 19.9950,
                "lng": 78.0050,
                "type": "Hydro Generation",
                "status": "Synchronized"
            }
        ]
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
            "message": f"Predicted inflow is increasing and reservoir storage is approaching the defined safety threshold ({lvl:.1f} m / 50.0 m)."
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
        "alerts": alerts
    }

@app.get("/api/model-performance")
def get_model_performance():
    return MODEL_METRICS

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
