import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_reservoir_alpha_dataset(num_days=365, seed=42):
    """
    Generates realistic 365-day historical dataset for Reservoir Alpha.
    Engineering Specs:
    - Full Reservoir Level (FRL): 50.0 meters
    - Maximum Storage Capacity: 1,200 MCM (Million Cubic Meters)
    - Full Spillway Discharge Capacity: 75,000 cusecs
    """
    np.random.seed(seed)
    base_date = datetime(2026, 8, 31) - timedelta(days=num_days)
    
    dates = [base_date + timedelta(days=i) for i in range(num_days)]
    day_of_year = np.array([d.timetuple().tm_yday for d in dates])
    
    # 1. Seasonal Hydrology Cycle
    # Summer/Pre-monsoon (days 0-140): dry, low inflows, conservation (CLOSE / REDUCE)
    # Early Monsoon (days 141-210): steady rains, reservoir filling (HOLD)
    # Peak Monsoon Surge (days 211-260): flood surges, spillway releases (OPEN)
    # Post-monsoon / Winter (days 261-365): moderating inflows, balanced operations, breaks (HOLD / REDUCE / CLOSE / OPEN)
    
    rainfall = np.zeros(num_days)
    inflow = np.zeros(num_days)
    level = np.zeros(num_days)
    level[0] = 26.5
    
    for t in range(num_days):
        doy = day_of_year[t]
        
        # Determine seasonal regime
        if doy < 140:
            # Dry Season
            base_rain = np.random.exponential(scale=1.5) if np.random.rand() < 0.15 else 0.0
            base_inf = 1800 + np.random.normal(0, 400) + base_rain * 150
            target_rel = 1200 if level[t-1 if t>0 else 0] < 28.0 else 4500
        elif doy < 210:
            # Early Monsoon
            base_rain = 8.0 + np.random.exponential(scale=12.0) if np.random.rand() < 0.55 else np.random.uniform(0, 4)
            base_inf = 8500 + base_rain * 320 + np.random.normal(0, 1500)
            target_rel = 7500 if level[t-1 if t>0 else 0] < 38.0 else 14000
        elif doy < 270:
            # Peak Monsoon
            # Include intra-monsoon storm pulses and sunny breaks
            is_storm = (t % 14 < 6)
            if is_storm:
                base_rain = 35.0 + np.random.exponential(scale=25.0)
                base_inf = 26000 + base_rain * 380 + np.random.normal(0, 3500)
                target_rel = 28000
            else:
                base_rain = np.random.uniform(2.0, 12.0)
                base_inf = 9000 + np.random.normal(0, 1800)
                target_rel = 10000
        else:
            # Post-Monsoon / Autumn-Winter Transition
            # Periodic pulses and sunny dry spells
            cycle_phase = t % 10
            if cycle_phase < 3:
                # Easing rain
                base_rain = np.random.uniform(15.0, 42.0)
                base_inf = 18000 + base_rain * 300 + np.random.normal(0, 2000)
                target_rel = 18000
            elif cycle_phase < 7:
                # Steady moderate weather
                base_rain = np.random.uniform(2.0, 10.0)
                base_inf = 7500 + np.random.normal(0, 1200)
                target_rel = 6500
            else:
                # Dry interval (Storage rebuilding / CLOSE)
                base_rain = np.random.uniform(0.0, 3.0)
                base_inf = 2800 + np.random.normal(0, 600)
                target_rel = 1200
                
        rainfall[t] = np.round(np.clip(base_rain, 0, 140.0), 1)
        inflow[t] = np.round(np.clip(base_inf, 1000, 62000), 0)
        
    # Ensure the recent 30 days (days 335 to 365) reflect realistic operational diversity:
    # 6 days dry conservation (CLOSE), 8 days replenishment (HOLD), 8 days flood surge (OPEN), 6 days easing (REDUCE), 2 days current surge (OPEN)
    for t in range(num_days):
        days_from_end = num_days - 1 - t
        if days_from_end < 30:
            if 18 <= days_from_end <= 24:
                # Dry Spell Conservation Window -> CLOSE
                rainfall[t] = round(float(np.random.uniform(0.0, 3.0)), 1)
                inflow[t] = round(float(np.random.uniform(1800, 3400)), 0)
                level[t] = round(float(23.5 + (24 - days_from_end) * 0.4), 1)
            elif 10 <= days_from_end <= 17:
                # Steady Replenishment & Generation -> HOLD
                rainfall[t] = round(float(np.random.uniform(14.0, 28.0)), 1)
                inflow[t] = round(float(np.random.uniform(12000, 18500)), 0)
                level[t] = round(float(35.0 + (17 - days_from_end) * 0.6), 1)
            elif 4 <= days_from_end <= 9:
                # Easing Inflow -> REDUCE
                rainfall[t] = round(float(np.random.uniform(4.0, 12.0)), 1)
                inflow[t] = round(float(np.random.uniform(6500, 10500)), 0)
                level[t] = round(float(38.5 - (9 - days_from_end) * 0.3), 1)
            elif 2 <= days_from_end <= 3:
                # Recent Storm Surge -> OPEN
                rainfall[t] = round(float(np.random.uniform(32.0, 55.0)), 1)
                inflow[t] = round(float(np.random.uniform(27000, 34000)), 0)
                level[t] = round(float(42.0 + (3 - days_from_end) * 1.1), 1)
            elif days_from_end == 1:
                # Yesterday -> OPEN
                rainfall[t] = 38.5
                inflow[t] = 29400.0
                level[t] = 43.8
            elif days_from_end == 0:
                # Today -> OPEN
                rainfall[t] = 42.5
                inflow[t] = 28500.0
                level[t] = 44.3
    
    # 4. Storage in MCM (Full capacity = 1,200 MCM)
    storage_mcm = np.round((level / 50.0) * 1200.0, 1)
    
    # 5. Electricity Demand (MW)
    temp_base = 24.0 + 7.0 * np.cos((day_of_year - 120) / 365 * 2 * np.pi)
    temperature = np.round(np.clip(temp_base + np.random.normal(0, 1.2, size=num_days), 18.0, 36.0), 1)
    
    demand_base = 2150 + (temperature - 22.0) * 50.0
    demand_noise = np.random.normal(0, 100, size=num_days)
    electricity_demand = np.round(np.clip(demand_base + demand_noise, 1400, 3600), 0)
    
    # 6. Hydropower Potential (MW)
    hydropower_mw = np.round(np.clip((level / 50.0) * 180.0 * np.random.uniform(0.75, 1.0, size=num_days), 20.0, 240.0), 1)
    
    # 7. Flood Risk & Decision Logic
    flood_risk = []
    water_condition = []
    gate_decision = []
    recommended_opening = []
    water_release = []
    
    for t in range(num_days):
        lvl = level[t]
        inf = inflow[t]
        rain = rainfall[t]
        dem = electricity_demand[t]
        
        lvl_norm = min(1.0, lvl / 50.0)
        inf_norm = min(1.0, inf / 50000.0)
        rain_norm = min(1.0, rain / 100.0)
        risk_score = (lvl_norm * 0.45) + (inf_norm * 0.35) + (rain_norm * 0.20)
        
        if risk_score >= 0.70 or lvl >= 44.5 or (lvl >= 42.0 and inf >= 28000):
            risk = "CRITICAL" if (lvl >= 45.0 or risk_score >= 0.78) else "HIGH"
            cond = "RELEASE"
            dec = "OPEN"
            op = min(90, max(40, int(25 + (lvl - 35.0) * 3.5 + (inf / 2400))))
            rel = min(62000, max(22000, int(inf * 0.95 + 2500)))
        elif lvl >= 34.0 and (inf >= 11000 or rain >= 18.0):
            risk = "MODERATE"
            cond = "WATCH"
            dec = "HOLD"
            op = min(45, max(15, int(12 + (inf / 2000))))
            rel = int(inf * 0.75)
        elif lvl >= 30.0:
            risk = "LOW"
            cond = "NORMAL"
            if dem >= 2700:
                dec = "HOLD"
                op = 20
                rel = 11000
            else:
                dec = "REDUCE"
                op = 12
                rel = 6500
        else: # lvl < 30.0
            risk = "LOW"
            cond = "CONSERVE"
            if dem >= 3100 and lvl >= 25.0:
                dec = "REDUCE"
                op = 10
                rel = 5000
            else:
                dec = "CLOSE"
                op = 0
                rel = 1200  # Baseline environmental flow
                
        flood_risk.append(risk)
        water_condition.append(cond)
        gate_decision.append(dec)
        recommended_opening.append(op)
        water_release.append(rel)
        
    df = pd.DataFrame({
        "date": [d.strftime("%Y-%m-%d") for d in dates],
        "reservoir_level_m": level,
        "storage_mcm": storage_mcm,
        "inflow_cusecs": inflow,
        "rainfall_mm": rainfall,
        "electricity_demand_mw": electricity_demand,
        "hydropower_mw": hydropower_mw,
        "temperature_c": temperature,
        "flood_risk": flood_risk,
        "water_condition": water_condition,
        "gate_decision": gate_decision,
        "recommended_opening_pct": recommended_opening,
        "recommended_release_cusecs": water_release
    })
    
    return df

if __name__ == "__main__":
    df = generate_reservoir_alpha_dataset()
    df.to_csv("reservoir_alpha_365d.csv", index=False)
    print(f"Generated {len(df)} days of historical data for Reservoir Alpha.")
