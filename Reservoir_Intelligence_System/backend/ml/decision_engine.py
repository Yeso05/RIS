import numpy as np
from config import RESERVOIR_CONFIG, ReservoirConfig

def calculate_ris_assessment(
    reservoir_level_m,
    inflow_cusecs,
    rainfall_mm,
    electricity_demand_mw,
    config: ReservoirConfig = RESERVOIR_CONFIG,
    predictions: dict | None = None,
):
    """
    Transparent Safety & Decision Engine for a configurable reservoir prototype.
    
    INPUTS ONLY (No gate status!):
    - reservoir_level_m (meters, configured maximum level)
    - inflow_cusecs (cusecs)
    - rainfall_mm (mm)
    - electricity_demand_mw (MW)
    """
    # 1. Model predictions are supplied by the trained inference layer.
    model_predictions = predictions or {
        "rainfall_mm": max(0.0, round(rainfall_mm * 1.05, 1)),
        "inflow_cusecs": max(1000.0, round(inflow_cusecs * 0.95 + rainfall_mm * 260, 0)),
        "demand_mw": round(electricity_demand_mw, 0),
    }
    predicted_rainfall = model_predictions["rainfall_mm"]
    predicted_inflow = model_predictions["inflow_cusecs"]
    predicted_demand = model_predictions["demand_mw"]
    
    # 2. Risk Scoring Normalized
    level_norm = min(1.0, reservoir_level_m / config.max_water_level_m)
    inflow_norm = min(1.0, inflow_cusecs / 50000.0)
    rain_norm = min(1.0, rainfall_mm / 100.0)
    
    risk_score = (level_norm * 0.45) + (inflow_norm * 0.35) + (rain_norm * 0.20)
    
    if risk_score >= 0.72 or reservoir_level_m >= config.safety_threshold_m:
        flood_risk = "CRITICAL"
        water_condition = "RELEASE"
    elif (
        risk_score >= 0.52
        or reservoir_level_m >= config.safety_threshold_m * 0.8
        or inflow_cusecs >= 25000
    ):
        flood_risk = "HIGH"
        water_condition = "RELEASE"
    elif risk_score >= 0.35 or reservoir_level_m >= 30.0:
        flood_risk = "MODERATE"
        water_condition = "WATCH"
    else:
        flood_risk = "LOW"
        water_condition = "CONSERVE" if reservoir_level_m < 25.0 else "NORMAL"
        
    # 3. Transparent Rules Engine
    reasons = []
    
    if (
        reservoir_level_m >= config.safety_threshold_m * 0.956
        or (
            reservoir_level_m >= config.safety_threshold_m * 0.844
            and inflow_cusecs > 25000
        )
        or flood_risk in ["CRITICAL", "HIGH"]
    ):
        gate_decision = "OPEN"
        paragraph_reason = (
            f"Reservoir level is high ({reservoir_level_m:.1f} m) and predicted inflow is increasing ({inflow_cusecs:,.0f} cusecs) "
            f"due to the catchment rainfall forecast ({rainfall_mm:.1f} mm). Flood risk is elevated. A controlled release is recommended "
            f"to protect infrastructure while maintaining sufficient storage for hydropower demand."
        )
        reasons.append(
            f"Reservoir level ({reservoir_level_m:.1f} m) is near defined safety limit "
            f"({config.safety_threshold_m:.1f} m)"
        )
        reasons.append(f"Surge inflow rate recorded ({inflow_cusecs:,.0f} cusecs)")
        if rainfall_mm > 20.0:
            reasons.append(f"Substantial rainfall forecast ({rainfall_mm:.1f} mm in catchment)")
        reasons.append("Safety release overrides electricity generation preference")
        
        opening_pct = int(min(90, max(30, 25 + (reservoir_level_m - 35.0) * 3.5 + (inflow_cusecs / 2400))))
        recommended_release = int(min(65000, max(22000, inflow_cusecs * 0.95 + 2500)))
        
    elif reservoir_level_m >= config.minimum_operating_level_m + 17.0:
        if inflow_cusecs >= 12000 or rainfall_mm >= 20.0:
            gate_decision = "HOLD"
            paragraph_reason = (
                f"Reservoir level is in optimal operational range ({reservoir_level_m:.1f} m) with moderate incoming inflow ({inflow_cusecs:,.0f} cusecs). "
                f"Holding current release maintains balanced buffer storage for irrigation and hydro generation."
            )
            reasons.append(f"Reservoir level ({reservoir_level_m:.1f} m) is within normal operating zone")
            reasons.append(f"Moderate water inflow ({inflow_cusecs:,.0f} cusecs)")
            reasons.append("Balanced release maintains buffer storage for regional grid demand")
            opening_pct = int(min(45, max(15, 10 + (inflow_cusecs / 1800))))
            recommended_release = int(inflow_cusecs * 0.75)
        else:
            if electricity_demand_mw >= 2800:
                gate_decision = "HOLD"
                paragraph_reason = (
                    f"High grid electricity demand ({electricity_demand_mw:,.0f} MW) permits sustained hydro generation release "
                    f"supported by adequate reservoir storage ({reservoir_level_m:.1f} m)."
                )
                reasons.append(f"Elevated grid demand ({electricity_demand_mw:,.0f} MW) supports hydropower release")
                reasons.append(f"Sufficient water availability ({reservoir_level_m:.1f} m)")
                opening_pct = 25
                recommended_release = 12500
            else:
                gate_decision = "REDUCE"
                paragraph_reason = (
                    f"Inflow is easing ({inflow_cusecs:,.0f} cusecs) and weather is clear. Reducing release conserves storage "
                    f"while meeting baseline grid requirements."
                )
                reasons.append("Inflow easing and weather clear; conserving storage")
                reasons.append(f"Electricity demand moderate ({electricity_demand_mw:,.0f} MW)")
                opening_pct = 15
                recommended_release = 7500
                
    else:
        if electricity_demand_mw >= 3000 and reservoir_level_m > 22.0:
            gate_decision = "REDUCE"
            paragraph_reason = (
                f"Reservoir storage is low ({reservoir_level_m:.1f} m). Restricted release is recommended to conserve storage "
                f"while providing essential baseline hydro generation for grid demand."
            )
            reasons.append(f"Low reservoir storage ({reservoir_level_m:.1f} m) requires conservation")
            reasons.append(f"High power demand ({electricity_demand_mw:,.0f} MW) permits restricted release")
            opening_pct = 12
            recommended_release = 6000
        else:
            gate_decision = "CLOSE"
            paragraph_reason = (
                f"Reservoir level ({reservoir_level_m:.1f} m) and inflow ({inflow_cusecs:,.0f} cusecs) are low. "
                f"Closing spillway gates is required to rebuild reserve storage."
            )
            reasons.append(f"Reservoir level low ({reservoir_level_m:.1f} m) below preferred reserve")
            reasons.append(f"Low incoming inflow ({inflow_cusecs:,.0f} cusecs)")
            reasons.append("Spillway gates closed to rebuild storage reserve")
            opening_pct = 0
            recommended_release = 1200  # Minimum riparian flow
            
    # 4. Expected Level Tomorrow Calculation
    net_cusecs_day = predicted_inflow - recommended_release
    # 1 cusec = 0.002447 MCM/day
    delta_mcm = net_cusecs_day * 0.002447
    delta_m = (
        delta_mcm / config.full_storage_capacity_mcm
    ) * config.max_water_level_m
    
    expected_level_tomorrow = round(
        np.clip(
            reservoir_level_m + delta_m,
            config.minimum_operating_level_m,
            config.max_water_level_m * 0.996,
        ),
        1,
    )
    
    confidence = int(
        min(96, max(82, 93 - abs(rainfall_mm - predicted_rainfall) * 0.4))
    )
    
    return {
        "flood_risk": flood_risk,
        "water_condition": water_condition,
        "risk_score_pct": int(risk_score * 100),
        "gate_decision": gate_decision,
        "recommended_opening_pct": opening_pct,
        "recommended_release_cusecs": recommended_release,
        "expected_level_tomorrow_m": expected_level_tomorrow,
        "expected_inflow_tomorrow_cusecs": predicted_inflow,
        "expected_rainfall_tomorrow_mm": predicted_rainfall,
        "expected_demand_tomorrow_mw": predicted_demand,
        "hydropower_estimate_mw": round(recommended_release * 0.008, 1),
        "ai_confidence_pct": confidence,
        "paragraph_reason": paragraph_reason,
        "reasons": reasons
    }

if __name__ == "__main__":
    res = calculate_ris_assessment(42.5, 24500, 38.5, 1850)
    print("Decision:", res['gate_decision'], res['flood_risk'], res['paragraph_reason'])
