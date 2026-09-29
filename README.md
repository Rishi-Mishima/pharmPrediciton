# PharmaML

PharmaML is a pharmaceutical demand forecasting and inventory intelligence platform. It combines a machine-learning forecasting pipeline, a FastAPI service, PostgreSQL persistence, and a React operations dashboard.

![PharmaML dashboard](docs/images/pharmaml-dashboard.png)

## Features

- Pharmaceutical demand forecasting from historical demand data
- Lag, rolling-window, and cyclical calendar features
- Linear Regression and XGBoost model comparison
- Time-series cross-validation and saved-model inference
- Drug, demand history, and inventory APIs
- Inventory risk classification and replenishment recommendations
- Responsive React dashboard with KPI cards, demand trends, filters, and product details

## How It Works

The application has three runtime layers:

1. The React frontend runs on port `5173` and requests operational data from FastAPI.
2. FastAPI runs on port `8000`, loads the trained Joblib model, serves forecasts, and reads or writes application data.
3. PostgreSQL runs on port `5432` and stores drugs, demand history, and inventory records.

When the dashboard opens, it checks `/health`, loads drugs and inventory, fetches the primary drug's demand history, and requests its next forecast. Inventory statuses are calculated from current stock and safety stock:

- **Critical:** current stock is at or below 50% of safety stock
- **Low Stock:** current stock is at or below safety stock
- **Healthy:** current stock is above safety stock

If the API is unavailable, the dashboard keeps a local sample demand series for the chart, but it does not invent live drug or inventory records. The header displays `API offline` until FastAPI is reachable.

## Tech Stack

### Backend

- Python and FastAPI
- PostgreSQL and SQLAlchemy
- pandas and scikit-learn
- Joblib model persistence
- Docker Compose

### Frontend

- React and TypeScript
- Vite and Tailwind CSS
- Recharts
- Axios
- Lucide React

## Model

The forecasting model uses:

- Lag features: 1, 7, 14, and 28 days
- Rolling means: 7 and 28 days
- Day-of-week, monthly, and annual seasonality
- Weekend indicator

Linear Regression was selected as the final model based on time-series cross-validation performance.

| Metric | Result |
|---|---:|
| Cross-validation MAE | 9.229 |
| Test MAE | 9.456 |
| Test RMSE | 12.299 |
| Test WAPE | 30.86% |

## Run Locally

### Prerequisites

- Docker Desktop
- Node.js 20 or newer
- npm

The Python virtual environment is not required for the recommended Docker workflow.

### 1. Start Docker Desktop

Make sure Docker Desktop is running before starting the backend. On macOS, you can launch it with:

```bash
open -a Docker
```

Verify that the Docker engine is ready:

```bash
docker info
```

### 2. Start PostgreSQL and FastAPI

From the project root:

```bash
docker compose up --build -d
```

Check the running services:

```bash
docker compose ps
```

The backend is now available at:

- API: <http://localhost:8000>
- Interactive API documentation: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/health>

### 3. Import the Sample Demand History

Run the seed script once on a fresh database:

```bash
docker compose exec api python scripts/seed_database.py
```

This creates the `N02BE` Paracetamol drug and imports its historical demand data. The current seed script is not idempotent, so running it repeatedly will duplicate demand-history rows.

### 4. Add an Inventory Record

The seed script imports demand history but does not create inventory. First inspect the drug ID:

```bash
curl http://localhost:8000/drugs
```

Then create inventory, replacing `drug_id` if necessary:

```bash
curl -X POST http://localhost:8000/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "drug_id": 1,
    "current_stock": 500,
    "safety_stock": 200,
    "lead_time_days": 7
  }'
```

### 5. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the dashboard at <http://localhost:5173>.

The frontend uses `http://localhost:8000` by default. To use another API URL, update `VITE_API_BASE_URL` in `frontend/.env`.

### Stop the Application

Stop the frontend with `Ctrl+C`. Then stop the backend and database from the project root:

```bash
docker compose down
```

The PostgreSQL volume is preserved, so imported data remains available the next time the application starts.

## API

Main endpoints include:

- `GET /health` - API and model health
- `GET /model/info` - model metadata and evaluation metrics
- `POST /predict` - feature-based demand prediction
- `GET /drugs` - list drugs
- `POST /drugs` - create a drug
- `GET /drugs/{drug_id}/demand-history` - retrieve demand history
- `POST /drugs/{drug_id}/forecast` - forecast the next demand value
- `GET /inventory` - list inventory records
- `POST /inventory` - create an inventory record
- `GET /inventory/{drug_id}/risk` - forecast-based inventory risk

## Development Checks

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend tests inside Docker:

```bash
docker compose exec api pytest
```

## Project Structure

```text
PharmaML/
|-- app/                    # FastAPI routes, schemas, database, and model loader
|-- data/                   # Raw and processed demand data
|-- docs/images/            # README screenshots
|-- frontend/               # React and TypeScript dashboard
|-- models/                 # Saved forecasting model and metadata
|-- scripts/                # Database seed utilities
|-- src/                    # Training and feature-engineering code
|-- tests/                  # Backend tests
|-- docker-compose.yml      # API and PostgreSQL services
|-- Dockerfile              # FastAPI container image
|-- requirements.txt        # Python dependencies
`-- README.md
```

## Troubleshooting

### Docker socket is unavailable

If `docker compose` reports that it cannot connect to `docker.sock`, start Docker Desktop and wait until `docker info` succeeds.

### The dashboard shows `API offline`

Check the containers and backend logs:

```bash
docker compose ps
docker compose logs api
```

Confirm that <http://localhost:8000/health> returns a healthy response, then refresh the dashboard.
