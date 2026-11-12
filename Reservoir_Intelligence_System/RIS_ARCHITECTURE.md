# Reservoir Intelligence System (RIS)

## Architecture Document

**Document type:** High-Level Design (HLD) and Low-Level Design (LLD)
**System version:** Prototype 1.0
**Repository:** `Yeso05/RIS`
**Primary branch:** `feat/ui`

## 1. Purpose and Scope

The Reservoir Intelligence System (RIS) is a prototype decision-support application for a
configurable reservoir system. It combines simulated reservoir telemetry, transparent operational rules,
machine-learning model evaluation, and a React dashboard to help operators understand
current conditions and review recommended release actions.

RIS is advisory only. It does not connect to, command, or actuate physical reservoir gates.
Every operational recommendation is presented with an operator-approval disclaimer.

### 1.1 In scope

- Current reservoir condition monitoring
- Seven-day forecast-style prediction view
- Daily release recommendation
- Manual what-if simulation
- Thirty-day history and analytics
- Alert and model-performance views
- Explainable rule-based recommendations

### 1.2 Out of scope

- Direct SCADA, PLC, or physical gate control
- Production telemetry ingestion
- User authentication and authorization
- Persistent operational database
- Production-grade model registry or online retraining
- Guaranteed real-time or safety-certified decisions

## 2. Architectural Summary

RIS uses a browser-based single-page application backed by a Python API:

```text
+----------------------+       HTTP / JSON        +----------------------+
| React + Vite         |  /api/* proxy           | FastAPI + Uvicorn    |
| Dashboard SPA        +----------------------->+ Decision Support API |
| Port 3000            |                         | Port 8000            |
+----------+-----------+                         +----------+-----------+
           |                                                |
           | Local fallback data                             |
           v                                                v
  frontend/src/utils/                              Synthetic dataset,
  simulatedData.js                                 ML evaluation,
                                                   rules engine
```

The frontend is served by Vite during development. Requests beginning with `/api` are
proxied to `http://127.0.0.1:8000` as configured in
[vite.config.js](frontend/vite.config.js).

The backend initializes the synthetic 365-day dataset and trains the evaluation models at
application import time in [main.py](backend/main.py). The API then exposes read-only
monitoring and recommendation endpoints plus one simulation endpoint.

## 3. High-Level Design (HLD)

### 3.1 Logical components

| Component | Responsibility | Implementation |
|---|---|---|
| Presentation layer | Navigation, dashboards, charts, alerts, and operator acknowledgement UI | React components under `frontend/src` |
| Frontend application shell | Selects the active page and renders common navigation/footer | [App.jsx](frontend/src/App.jsx) |
| API client boundary | Browser `fetch` calls and fallback behavior | Page-level React effects |
| API layer | HTTP routing, request validation, CORS, and response shaping | FastAPI application in [main.py](backend/main.py) |
| Dataset generator | Creates deterministic synthetic historical reservoir data | [dataset_generator.py](backend/ml/dataset_generator.py) |
| Model evaluation layer | Trains and evaluates rainfall, inflow, demand, and flood models | [train_models.py](backend/ml/train_models.py) |
| Decision engine | Calculates risk, gate recommendation, release, expected level, and explanation | [decision_engine.py](backend/ml/decision_engine.py) |
| Data assets | CSV snapshots used by the prototype | `backend/*.csv` |

### 3.2 Runtime data flow

#### Application startup

1. Uvicorn imports `backend.main:app`.
2. `generate_reservoir_alpha_dataset(365)` creates an in-memory pandas DataFrame.
3. `train_and_evaluate_models()` loads or generates a CSV and trains four scikit-learn
   models.
4. FastAPI registers CORS middleware and endpoint handlers.
5. The frontend loads from Vite and initially renders local fallback values.

#### Dashboard load

1. `Dashboard` requests current conditions, today's decision, and predictions in parallel.
2. If all three requests succeed, live API values replace fallback values.
3. If any request fails, the page retains the values from
   [simulatedData.js](frontend/src/utils/simulatedData.js).

#### Daily decision

1. The API reads the latest row in the in-memory dataset.
2. The trained inference layer predicts short-term rainfall, inflow, demand, and flood risk.
3. A normalized risk score and transparent threshold rules select `OPEN`, `HOLD`,
   `REDUCE`, or `CLOSE`.
4. The API returns the action, release values, expected level, confidence, and reasons.
5. The UI displays the result as an advisory directive requiring operator approval.

#### Simulation

1. The operator submits four numeric inputs from the Gate Optimization page.
2. Pydantic validates the JSON request body.
3. The same decision engine evaluates the scenario without reading gate status.
4. The API returns the inputs and calculated assessment without changing server state.

### 3.3 Deployment topology

Current development topology:

```text
Developer machine
├── Vite dev server: 127.0.0.1:3000
│   └── Proxies /api/* to 127.0.0.1:8000
└── Uvicorn: 127.0.0.1:8000
    └── FastAPI application and in-memory dataset/models
```

The repository does not currently define a container image, production server, CI/CD
workflow, secrets manager, database, or external telemetry connector.

### 3.4 Technology stack

**Frontend**

- React 18
- Vite 5
- Tailwind CSS 3
- Recharts for time-series visualizations
- Lucide React for icons

**Backend**

- Python 3.10+
- FastAPI and Uvicorn
- Pydantic request validation
- pandas and NumPy for data processing
- scikit-learn for model training and evaluation

Dependencies are declared in [package.json](frontend/package.json) and
[requirements.txt](backend/requirements.txt).

## 4. API Contract

All endpoints are served from port 8000. The frontend calls them through the Vite `/api`
proxy during development.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | API identity, status, and safety disclaimer |
| `GET` | `/api/system-status` | System and decision-engine status |
| `GET` | `/api/reservoir-config` | Configurable reservoir metadata and operating limits |
| `GET` | `/api/current-conditions` | Latest reservoir and demand measurements |
| `GET` | `/api/decision/today` | Current recommendation and explanation |
| `GET` | `/api/predictions` | Seven-day forecast-style values |
| `POST` | `/api/simulation/assess` | Evaluate a user-provided scenario |
| `GET` | `/api/history/30-days` | Recent historical records and daily assessments |
| `GET` | `/api/analytics` | Time-series and gate-condition analytics |
| `GET` | `/api/dam-info` | Reservoir metadata retained for integrations |
| `GET` | `/api/alerts` | Derived operational alerts |
| `GET` | `/api/model-performance` | Model evaluation metrics |

### 4.1 Simulation request

```json
{
  "reservoir_level_m": 42.5,
  "inflow_cusecs": 24500,
  "rainfall_mm": 38.5,
  "electricity_demand_mw": 1850
}
```

All four fields are required numeric values. The response contains the original `inputs`
and an `assessment` object.

### 4.2 Decision response

The daily decision response is organized into:

- `inputs`: evaluated water level, inflow, rainfall, and electricity demand
- `assessment`: flood-risk and water-condition labels
- `recommendation`: action, opening percentage, release, expected level, hydropower, and confidence
- `paragraph_reason`: human-readable explanation
- `reasons`: structured explanation bullets
- `safety_disclaimer`: operator-approval warning

## 5. Low-Level Design (LLD)

### 5.1 Backend module design

#### `config.py`

[config.py](backend/config.py) is the single source of reservoir metadata. It supports
environment overrides such as `RIS_RESERVOIR_NAME`, `RIS_MAX_WATER_LEVEL_M`,
`RIS_FULL_STORAGE_CAPACITY_MCM`, and location/capacity variables. Frontend pages consume
the `/api/reservoir-config` response rather than embedding reservoir identity and limits.
Unset identity and geographic metadata remain unavailable: the UI uses a neutral
“Reservoir” label when no identity is configured. Geographic metadata remains available
through the backend contract for future integrations, but there is no map page in the
current frontend.

#### `main.py`

`main.py` is the composition root and HTTP adapter.

- Creates the FastAPI application.
- Enables permissive CORS for the prototype.
- Initializes `DATASET`, `MODEL_METRICS`, and `TRAINED_MODELS`.
- Defines the `SimulationInput` Pydantic model.
- Converts pandas/numpy values to JSON-compatible Python primitives.
- Exposes route handlers for dashboard and simulation use cases.

The trained model objects are retained in `TRAINED_MODELS` and are used by the forecast and
simulation inference paths. The safety decision remains a transparent rule engine that
consumes the model predictions.

#### `dataset_generator.py`

`generate_reservoir_alpha_dataset(num_days=365, seed=42)`:

1. Seeds NumPy for repeatable synthetic generation.
2. Generates dates and seasonal hydrology regimes.
3. Produces rainfall and inflow values for dry, monsoon, surge, and post-monsoon periods.
4. Overrides the most recent 30 days with representative operational scenarios.
5. Calculates storage, temperature, demand, and hydropower.
6. Derives flood risk and gate decisions using threshold rules.
7. Returns a pandas DataFrame with 13 operational columns.

Important fields:

| Field | Unit | Meaning |
|---|---:|---|
| `date` | ISO date | Observation date |
| `reservoir_level_m` | m | Reservoir water level |
| `storage_mcm` | MCM | Estimated stored volume |
| `inflow_cusecs` | cusecs | Upstream inflow |
| `rainfall_mm` | mm | Catchment rainfall |
| `electricity_demand_mw` | MW | Regional demand |
| `hydropower_mw` | MW | Estimated generation potential |
| `temperature_c` | °C | Temperature |
| `flood_risk` | label | `LOW`, `MODERATE`, `HIGH`, or `CRITICAL` |
| `water_condition` | label | `NORMAL`, `WATCH`, `RELEASE`, or `CONSERVE` |
| `gate_decision` | action | `OPEN`, `HOLD`, `REDUCE`, or `CLOSE` |
| `recommended_opening_pct` | % | Suggested gate aperture |
| `recommended_release_cusecs` | cusecs | Suggested release |

#### `train_models.py`

`train_and_evaluate_models()`:

- Loads `reservoir_alpha_365d.csv`, or generates it when the file is absent.
- Adds one-step lag features for rainfall, inflow, level, and demand.
- Uses `temperature_c` and lag features as model inputs.
- Splits data with an 80/20 random train/test split.
- Trains:
  - Random Forest Regressor for rainfall
  - Gradient Boosting Regressor for inflow
  - Random Forest Regressor for electricity demand
  - Random Forest Classifier for flood risk
- Returns metric metadata and fitted model objects.

Metrics include MAE, RMSE, and R² for regression models, plus accuracy and macro F1 for
the classifier.

#### `decision_engine.py`

`calculate_ris_assessment()` is a deterministic rule structure around short-term
stochastic estimates:

1. Estimate next rainfall, inflow, and demand.
2. Normalize current level, inflow, and rainfall.
3. Calculate:

   ```text
   risk_score =
       level_norm * 0.45
     + inflow_norm * 0.35
     + rainfall_norm * 0.20
   ```

4. Assign flood-risk and water-condition labels.
5. Select the gate action using level, inflow, rainfall, and demand thresholds.
6. Calculate recommended opening and release.
7. Estimate tomorrow's level using a cusecs-to-MCM conversion.
8. Return an explanation and confidence percentage.

The engine deliberately does not accept gate status as an input, preserving a clear
separation between recommendation and physical actuation.

### 5.2 Frontend design

#### Application shell and navigation

[App.jsx](frontend/src/App.jsx) owns the `activeTab` state and conditionally renders the
selected page. [Navbar.jsx](frontend/src/components/Navbar.jsx) changes the active tab.
There is no client-side router; navigation is state-based.

The current views are:

| Tab | Component | Backend dependency |
|---|---|---|
| Dashboard | `Dashboard` | Current conditions, decision, predictions |
| Decision | `TodaysDecision` | Today's decision |
| Predictions | `AIPredictions` | Predictions |
| Simulation | `GateOptimization` | Simulation assessment |
| History | `History30Days` | Thirty-day history |
| Analytics | `Analytics` | Analytics |
| Alerts | `Alerts` | Alerts |
| Model | `ModelPerformance` | Model metrics |

The `/api/dam-info` endpoint remains available for integrations that need configured
reservoir metadata. The current frontend intentionally does not expose a map page.

#### Data loading and fallback behavior

Most pages load API data in `useEffect()` and keep a local default state. This enables the
UI to render when the backend is unavailable. The dashboard requires all three initial
requests to succeed before switching its `isLiveApi` state to live data.

The fallback data is defined in
[simulatedData.js](frontend/src/utils/simulatedData.js). The fallback pattern is useful
for demonstrations but should be replaced or augmented with explicit loading and error
states before production use.

#### Reusable visual components

- `WaterLevelVisual`: level cross-section visualization and risk context.
- `FloodRiskGauge`: reusable risk gauge.
- `Navbar`: global tab navigation and alert indicator.

Charts are rendered with Recharts.

### 5.3 Persistence and state

There is no database or server-side user session:

- The dataset is held in the backend process memory.
- Model objects and metrics are held in memory.
- Simulation requests are stateless.
- Operator acknowledgement is local React state only and is not persisted or audited.
- Frontend fallback values are bundled JavaScript constants.

Restarting the backend regenerates/reloads the runtime state. Forecast inference is
deterministic for a given trained model and input dataset, but the system remains a
synthetic demonstration rather than a live telemetry platform.

## 6. Security, Safety, and Reliability

### Current controls

- Pydantic validates simulation request structure and types.
- The API does not expose a physical-control integration.
- UI copy repeatedly states that operator approval is required.
- Vite keeps API calls same-origin from the browser during development.
- Local environment files, virtual environments, and dependency folders are excluded by
  [.gitignore](../.gitignore).

### Current risks

- CORS allows all origins and credentials; this is unsuitable for production.
- There is no authentication, authorization, rate limiting, audit log, or request tracing.
- Synthetic data is not a valid operational telemetry source.
- Model metrics are evaluated on synthetic data and should not be treated as production
  accuracy.
- Randomized inference reduces repeatability and complicates incident investigation.
- API handlers broadly rely on process-level initialization; startup model training can
  delay readiness.
- The frontend catches some request errors and silently keeps fallback values, which can
  obscure stale data from operators.

## 7. Operational Runbook

### Backend

From the repository root:

```powershell
cd Reservoir_Intelligence_System\backend
..\..\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Frontend

From the repository root:

```powershell
cd Reservoir_Intelligence_System\frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:3000/`. FastAPI's interactive documentation is available at
`http://127.0.0.1:8000/docs`.

The repository also includes [check_servers.py](check_servers.py) for basic availability
checks.

## 8. Testing and Validation

The current backend smoke test is
[test_api.py](backend/test_api.py), which posts a low-water drought scenario to the
simulation endpoint and prints the response.

Recommended minimum validation for changes:

1. Start the backend and verify `/api/system-status`.
2. Run the simulation smoke test.
3. Run `npm run build` in the frontend.
4. Verify the dashboard, decision, simulation, history, analytics, alerts, and model pages.

The prototype does not currently define a formal automated frontend test suite or a
production integration test suite.

## 9. Evolution Plan

The following changes are recommended before production or safety-critical use:

1. Add a persistent telemetry adapter and validate sensor freshness and quality.
2. Introduce a database for historical observations, recommendations, and operator actions.
3. Separate model training from API startup and serve versioned model artifacts.
4. Add reproducible, versioned model artifacts and inference pipelines.
5. Add authentication, role-based authorization, audit logging, and secure CORS policy.
6. Add explicit frontend loading, stale-data, and API error states.
7. Add contract tests for every endpoint and component tests for critical UI states.
8. Add observability: structured logs, health/readiness endpoints, metrics, and alerts.
9. Establish safety review, simulation validation, and human-in-the-loop approval gates
   before any future control-system integration.
