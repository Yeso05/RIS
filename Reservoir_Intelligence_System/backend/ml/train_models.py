import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score, f1_score
from sklearn.model_selection import train_test_split

def train_and_evaluate_models(data_path="reservoir_alpha_365d.csv"):
    if not os.path.exists(data_path):
        from dataset_generator import generate_reservoir_alpha_dataset
        df = generate_reservoir_alpha_dataset()
        df.to_csv(data_path, index=False)
    else:
        df = pd.read_csv(data_path)
        
    df['prev_rainfall'] = df['rainfall_mm'].shift(1).fillna(df['rainfall_mm'].mean())
    df['prev_inflow'] = df['inflow_cusecs'].shift(1).fillna(df['inflow_cusecs'].mean())
    df['prev_level'] = df['reservoir_level_m'].shift(1).fillna(df['reservoir_level_m'].mean())
    df['prev_demand'] = df['electricity_demand_mw'].shift(1).fillna(df['electricity_demand_mw'].mean())
    
    X = df[['prev_level', 'prev_inflow', 'prev_rainfall', 'prev_demand', 'temperature_c']]
    
    y_rain = df['rainfall_mm']
    y_inflow = df['inflow_cusecs']
    y_demand = df['electricity_demand_mw']
    y_flood = df['flood_risk']
    
    X_train, X_test, yr_train, yr_test = train_test_split(X, y_rain, test_size=0.2, random_state=42)
    _, _, yi_train, yi_test = train_test_split(X, y_inflow, test_size=0.2, random_state=42)
    _, _, yd_train, yd_test = train_test_split(X, y_demand, test_size=0.2, random_state=42)
    _, _, yf_train, yf_test = train_test_split(X, y_flood, test_size=0.2, random_state=42)
    
    rf_rain = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_rain.fit(X_train, yr_train)
    pred_rain = rf_rain.predict(X_test)
    
    rain_metrics = {
        "mae": round(float(mean_absolute_error(yr_test, pred_rain)), 2),
        "rmse": round(float(np.sqrt(mean_squared_error(yr_test, pred_rain))), 2),
        "r2": round(float(r2_score(yr_test, pred_rain)), 3)
    }
    
    gb_inflow = GradientBoostingRegressor(n_estimators=120, random_state=42)
    gb_inflow.fit(X_train, yi_train)
    pred_inflow = gb_inflow.predict(X_test)
    
    inflow_metrics = {
        "mae": round(float(mean_absolute_error(yi_test, pred_inflow)), 2),
        "rmse": round(float(np.sqrt(mean_squared_error(yi_test, pred_inflow))), 2),
        "r2": round(float(r2_score(yi_test, pred_inflow)), 3)
    }
    
    rf_demand = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_demand.fit(X_train, yd_train)
    pred_demand = rf_demand.predict(X_test)
    
    demand_metrics = {
        "mae": round(float(mean_absolute_error(yd_test, pred_demand)), 2),
        "rmse": round(float(np.sqrt(mean_squared_error(yd_test, pred_demand))), 2),
        "r2": round(float(r2_score(yd_test, pred_demand)), 3)
    }
    
    rf_flood = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_flood.fit(X_train, yf_train)
    pred_flood = rf_flood.predict(X_test)
    
    flood_metrics = {
        "accuracy": round(float(accuracy_score(yf_test, pred_flood)), 3),
        "f1_score": round(float(f1_score(yf_test, pred_flood, average='macro')), 3)
    }
    
    performance = {
        "disclaimer": "Prototype evaluation using synthetic data",
        "rainfall_model": {
            "model_type": "Random Forest Regressor",
            "purpose": "Catchment Rainfall Forecasting",
            "metrics": rain_metrics
        },
        "inflow_model": {
            "model_type": "Gradient Boosting Regressor",
            "purpose": "Reservoir Water Inflow Forecasting",
            "metrics": inflow_metrics
        },
        "electricity_demand_model": {
            "model_type": "Random Forest Regressor",
            "purpose": "Regional Grid Load Forecasting",
            "metrics": demand_metrics
        },
        "flood_risk_model": {
            "model_type": "Random Forest Classifier",
            "purpose": "Flood Risk Level Scoring",
            "metrics": flood_metrics
        }
    }
    
    return performance, {
        "rain_model": rf_rain,
        "inflow_model": gb_inflow,
        "demand_model": rf_demand,
        "flood_model": rf_flood
    }

if __name__ == "__main__":
    metrics, _ = train_and_evaluate_models()
    print(json.dumps(metrics, indent=2))
