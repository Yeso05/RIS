// Realistic simulated prototype dataset with human-friendly terminology and reasoning

export const DEFAULT_RESERVOIR_CONFIG = {
  name: "Reservoir",
  description: null,
  location: { latitude: null, longitude: null },
  max_water_level_m: 50.0,
  full_storage_capacity_mcm: 1200.0,
  safety_threshold_m: 45.0,
  minimum_operating_level_m: 15.0,
  spillway_gates_count: 12,
  hydroelectric_capacity_mw: 240.0,
  data_source: "Synthetic data",
  physical_gate_control: "Not Connected"
};

export const DEFAULT_CURRENT_CONDITIONS = {
  reservoir_name: DEFAULT_RESERVOIR_CONFIG.name,
  timestamp_ist: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + " • " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + " IST",
  reservoir_level_m: 42.5,
  max_reservoir_level_m: DEFAULT_RESERVOIR_CONFIG.max_water_level_m,
  storage_mcm: 1020.0,
  max_storage_mcm: DEFAULT_RESERVOIR_CONFIG.full_storage_capacity_mcm,
  inflow_cusecs: 28500,
  outflow_cusecs: 29575,
  rainfall_mm: 42.5,
  electricity_demand_mw: 2450,
  hydropower_mw: 185.0,
  temperature_c: 28.5,
  water_condition: "WATCH",
  data_source: DEFAULT_RESERVOIR_CONFIG.data_source
};

export function computeDecision(level_m, inflow_cusecs, rainfall_mm, demand_mw) {
  const levelNorm = Math.min(1.0, level_m / DEFAULT_RESERVOIR_CONFIG.max_water_level_m);
  const inflowNorm = Math.min(1.0, inflow_cusecs / 50000.0);
  const rainNorm = Math.min(1.0, rainfall_mm / 100.0);
  
  const riskScore = (levelNorm * 0.45) + (inflowNorm * 0.35) + (rainNorm * 0.20);
  
  let floodRisk = "LOW";
  let waterCondition = "NORMAL";
  
  if (riskScore >= 0.70 || level_m >= 45.0) {
    floodRisk = "CRITICAL";
    waterCondition = "RELEASE";
  } else if (riskScore >= 0.50 || level_m >= 40.0 || inflow_cusecs >= 25000) {
    floodRisk = "HIGH";
    waterCondition = "RELEASE";
  } else if (riskScore >= 0.32 || level_m >= 30.0) {
    floodRisk = "MODERATE";
    waterCondition = "WATCH";
  } else {
    floodRisk = "LOW";
    waterCondition = level_m < 25.0 ? "CONSERVE" : "NORMAL";
  }
  
  let action = "HOLD";
  let openingPct = 20;
  let releaseCusecs = 12500;
  let paragraphReason = "";
  const reasons = [];
  
  if (level_m >= 43.0 || (level_m >= 38.0 && inflow_cusecs > 25000) || floodRisk === "CRITICAL" || floodRisk === "HIGH") {
    action = "OPEN";
    openingPct = Math.min(90, Math.max(35, Math.round(25 + (level_m - 35.0) * 3.5 + (inflow_cusecs / 2400))));
    releaseCusecs = Math.min(65000, Math.max(22000, Math.round(inflow_cusecs * 0.95 + 2500)));
    
    paragraphReason = `Water level is already high (${level_m.toFixed(1)} m), incoming water is substantial (${inflow_cusecs.toLocaleString()} cusecs), and more rain is expected (${rainfall_mm.toFixed(1)} mm). The system recommends a controlled release to reduce flood risk while maintaining sufficient water for power generation.`;
    
    reasons.push(`Water level (${level_m.toFixed(1)} m) is near the defined 45.0 m safety threshold`);
    reasons.push(`High incoming flow (${inflow_cusecs.toLocaleString()} cusecs entering the reservoir)`);
    if (rainfall_mm > 20.0) reasons.push(`Rain forecast indicates ${rainfall_mm.toFixed(1)} mm in the catchment area`);
    reasons.push("Flood safety takes strict priority over water conservation");
  } else if (level_m >= 32.0) {
    if (inflow_cusecs >= 12000 || rainfall_mm >= 20.0) {
      action = "HOLD";
      openingPct = Math.min(45, Math.max(15, Math.round(10 + (inflow_cusecs / 1800))));
      releaseCusecs = Math.round(inflow_cusecs * 0.75);
      
      paragraphReason = `Water storage is in an optimal zone (${level_m.toFixed(1)} m) with moderate incoming water (${inflow_cusecs.toLocaleString()} cusecs). Holding the current setting preserves safe buffer capacity while steadily feeding power turbines.`;
      
      reasons.push(`Water level (${level_m.toFixed(1)} m) is in the safe operating zone`);
      reasons.push(`Incoming water (${inflow_cusecs.toLocaleString()} cusecs) matches regular release`);
      reasons.push("Steady release satisfies regional electricity and irrigation needs");
    } else {
      if (demand_mw >= 2800) {
        action = "HOLD";
        openingPct = 25;
        releaseCusecs = 12500;
        paragraphReason = `High regional power demand (${demand_mw.toLocaleString()} MW) is supported by available water reserves (${level_m.toFixed(1)} m). Gates are held steady for hydroelectric power production.`;
        reasons.push(`Higher electricity requirement (${demand_mw.toLocaleString()} MW)`);
        reasons.push(`Sufficient water reserves available (${level_m.toFixed(1)} m)`);
      } else {
        action = "REDUCE";
        openingPct = 15;
        releaseCusecs = 7500;
        paragraphReason = `Incoming water is easing (${inflow_cusecs.toLocaleString()} cusecs) and weather is clear. Reducing release conserves storage for future dry periods.`;
        reasons.push("Incoming water easing with clear weather forecast");
        reasons.push("Conserving reservoir storage for seasonal reserves");
      }
    }
  } else {
    if (demand_mw >= 3000 && level_m > 22.0) {
      action = "REDUCE";
      openingPct = 12;
      releaseCusecs = 6000;
      paragraphReason = `Water storage is low (${level_m.toFixed(1)} m). A restricted release is recommended to prioritize water conservation while supplying minimum essential power.`;
      reasons.push(`Low reservoir level (${level_m.toFixed(1)} m) requires conservation`);
      reasons.push(`Restricted flow allocated to essential power grid support`);
    } else {
      action = "CLOSE";
      openingPct = 0;
      releaseCusecs = 1200;
      paragraphReason = `Water level (${level_m.toFixed(1)} m) and incoming water (${inflow_cusecs.toLocaleString()} cusecs) are low. Spillway gates should remain closed to rebuild storage reserves.`;
      reasons.push(`Water level is low (${level_m.toFixed(1)} m) below preferred reserve`);
      reasons.push(`Low incoming water (${inflow_cusecs.toLocaleString()} cusecs)`);
      reasons.push("Spillway gates closed; maintaining only baseline environmental river flow");
    }
  }
  
  const predictedRainfall = Math.max(0.0, Math.round((rainfall_mm * 1.05) * 10) / 10);
  const predictedInflow = Math.max(1000, Math.round(inflow_cusecs * 0.95 + predictedRainfall * 250));
  const expectedLevelTomorrow = Math.min(49.8, Math.max(15.0, Math.round((level_m + (predictedInflow - releaseCusecs) / 16000.0) * 10) / 10));
  
  return {
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    reservoir_name: DEFAULT_RESERVOIR_CONFIG.name,
    inputs: {
      reservoir_level_m: level_m,
      inflow_cusecs: inflow_cusecs,
      rainfall_mm: rainfall_mm,
      electricity_demand_mw: demand_mw
    },
    assessment: {
      flood_risk: floodRisk,
      water_condition: waterCondition,
      risk_score_pct: Math.round(riskScore * 100)
    },
    recommendation: {
      action: action,
      recommended_opening_pct: openingPct,
      recommended_release_cusecs: releaseCusecs,
      expected_level_tomorrow_m: expectedLevelTomorrow,
      hydropower_estimate_mw: Math.round(releaseCusecs * 0.008 * 10) / 10,
      ai_confidence_pct: 92
    },
    paragraph_reason: paragraphReason,
    reasons: reasons,
    safety_disclaimer: "AI DECISION SUPPORT — OPERATOR APPROVAL REQUIRED"
  };
}

export const DEFAULT_TODAYS_DECISION = computeDecision(42.5, 28500, 42.5, 2450);

export const DEFAULT_PREDICTIONS = [
  { day: "Day +1", date: "Tomorrow", predicted_rainfall_mm: 44.2, predicted_inflow_cusecs: 30100, predicted_level_m: 42.8, predicted_demand_mw: 2480, predicted_flood_risk: "HIGH" },
  { day: "Day +2", date: "+2 Days", predicted_rainfall_mm: 51.0, predicted_inflow_cusecs: 34500, predicted_level_m: 43.4, predicted_demand_mw: 2520, predicted_flood_risk: "HIGH" },
  { day: "Day +3", date: "+3 Days", predicted_rainfall_mm: 38.5, predicted_inflow_cusecs: 27800, predicted_level_m: 43.1, predicted_demand_mw: 2460, predicted_flood_risk: "MODERATE" },
  { day: "Day +4", date: "+4 Days", predicted_rainfall_mm: 22.0, predicted_inflow_cusecs: 21000, predicted_level_m: 42.6, predicted_demand_mw: 2390, predicted_flood_risk: "MODERATE" },
  { day: "Day +5", date: "+5 Days", predicted_rainfall_mm: 14.5, predicted_inflow_cusecs: 16500, predicted_level_m: 42.1, predicted_demand_mw: 2350, predicted_flood_risk: "LOW" },
  { day: "Day +6", date: "+6 Days", predicted_rainfall_mm: 8.0, predicted_inflow_cusecs: 12800, predicted_level_m: 41.7, predicted_demand_mw: 2310, predicted_flood_risk: "LOW" },
  { day: "Day +7", date: "+7 Days", predicted_rainfall_mm: 5.2, predicted_inflow_cusecs: 10400, predicted_level_m: 41.4, predicted_demand_mw: 2280, predicted_flood_risk: "LOW" }
];

export const DEFAULT_HISTORY_30 = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  
  // Create natural varied seasonal cycle over 30 days
  // Days 0-4: Recent flood surge (OPEN)
  // Days 5-11: Moderating post-monsoon (HOLD / REDUCE)
  // Days 12-18: Steady dry spell / low storage (CLOSE)
  // Days 19-24: Early seasonal rains & replenishment (HOLD)
  // Days 25-29: High inflow storm events (OPEN)
  let level_m, inflow_cusecs, rainfall_mm, demand_mw;
  
  if (i >= 12 && i <= 17) {
    // Dry / Low level conservation spell (CLOSE)
    level_m = Math.round((24.2 + (i % 3) * 0.8) * 10) / 10;
    inflow_cusecs = Math.round(2100 + (i % 4) * 450);
    rainfall_mm = Math.round((1.0 + (i % 2) * 1.5) * 10) / 10;
    demand_mw = Math.round(2300 + (i % 3) * 120);
  } else if (i >= 5 && i <= 11) {
    // Easing post-rain / moderate holding (REDUCE / HOLD)
    level_m = Math.round((33.5 + Math.sin(i) * 2.2) * 10) / 10;
    inflow_cusecs = Math.round(7500 + (12 - i) * 850);
    rainfall_mm = Math.round((6.0 + (i % 3) * 3.5) * 10) / 10;
    demand_mw = Math.round(2250 + (i % 4) * 140);
  } else if (i >= 18 && i <= 24) {
    // Balanced operating conditions (HOLD)
    level_m = Math.round((38.2 + Math.cos(i) * 1.8) * 10) / 10;
    inflow_cusecs = Math.round(14500 + (i % 5) * 1200);
    rainfall_mm = Math.round((18.0 + (i % 4) * 6.0) * 10) / 10;
    demand_mw = Math.round(2420 + (i % 3) * 110);
  } else {
    // Flood / heavy inflow periods (OPEN)
    level_m = Math.round((43.8 + (i % 3) * 0.7) * 10) / 10;
    inflow_cusecs = Math.round(28000 + (i % 4) * 2800);
    rainfall_mm = Math.round((38.0 + (i % 5) * 8.5) * 10) / 10;
    demand_mw = Math.round(2520 + (i % 3) * 160);
  }
  
  const dec = computeDecision(level_m, inflow_cusecs, rainfall_mm, demand_mw);
  
  return {
    date: dateStr,
    full_date: d.toISOString().split('T')[0],
    reservoir_level_m: level_m,
    storage_mcm: Math.round((level_m / DEFAULT_RESERVOIR_CONFIG.max_water_level_m) * DEFAULT_RESERVOIR_CONFIG.full_storage_capacity_mcm * 10) / 10,
    inflow_cusecs: inflow_cusecs,
    rainfall_mm: rainfall_mm,
    electricity_demand_mw: demand_mw,
    flood_risk: dec.assessment.flood_risk,
    ai_decision: dec.recommendation.action,
    recommended_opening_pct: dec.recommendation.recommended_opening_pct,
    recommended_release_cusecs: dec.recommendation.recommended_release_cusecs,
    paragraph_reason: dec.paragraph_reason,
    reasons: dec.reasons
  };
});

export const DEFAULT_ALERTS = [
  {
    id: "ALT-001",
    severity: "HIGH",
    title: "ELEVATED WATER RELEASE ADVISORY",
    timestamp: "10 mins ago",
    message: "Incoming water and rainfall are elevated. Controlled release is active to maintain safety margins."
  },
  {
    id: "ALT-002",
    severity: "INFO",
    title: "POWER GRID GENERATION ACTIVE",
    timestamp: "35 mins ago",
    message: "Regional electricity demand (2,450 MW) is being supported by steady turbine flow."
  },
  {
    id: "ALT-003",
    severity: "INFO",
    title: "SYSTEM IN SIMULATION MODE",
    timestamp: "Just now",
    message: "AI decision support system running in verified prototype simulation mode."
  }
];

export const DEFAULT_MODEL_METRICS = {
  disclaimer: "Prototype evaluation using synthetic data",
  rainfall_model: {
    model_type: "Random Forest Regressor",
    purpose: "Catchment Rainfall Forecast",
    metrics: { mae: 7.6, rmse: 9.87, r2: 0.671 }
  },
  inflow_model: {
    model_type: "Gradient Boosting Regressor",
    purpose: "Incoming Water Flow Prediction",
    metrics: { mae: 4168.37, rmse: 5574.53, r2: 0.775 }
  },
  electricity_demand_model: {
    model_type: "Random Forest Regressor",
    purpose: "Regional Power Need Forecast",
    metrics: { mae: 102.39, rmse: 127.73, r2: 0.754 }
  },
  flood_risk_model: {
    model_type: "Random Forest Classifier",
    purpose: "Flood Safety Level Scoring",
    metrics: { accuracy: 0.88, f1_score: 0.86 }
  }
};
