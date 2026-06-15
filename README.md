# Tata Steel AI Maintenance Wizard System

An AI-powered maintenance command system for steel plant reliability operations. The platform combines a React operations console, FastAPI backend, MongoDB seeded plant data, live sensor simulation, role-based workflows, AI diagnostic chat, inventory risk optimization, reports, and scheduling.

The app now starts with a cinematic launch layer. Users first see the reliability platform landing screen, then click **Launch Console** to hydrate the system and enter the Maintenance Wizard dashboard.

## Project Highlights

- Branded launch screen with boot/loading transition into the console.
- Plant dashboard for fleet health, live telemetry, critical attention, and KPI tracking.
- AI Maintenance Chat powered by FORGEOPS Sentinel with asset-aware context.
- Local AI fallback response when Gemini/Groq cloud providers are unavailable.
- Equipment fleet with 30 seeded assets across steel plant sectors.
- Equipment detail pages with live WebSocket sensor streaming.
- Role-based access control for engineer, supervisor, and admin flows.
- Alerts module with filtering, acknowledgment, and critical-count sidebar badge.
- Scheduler with 7-day work planning.
- Inventory/spares optimizer with purchase gating.
- Knowledge center for SOP/manual search.
- Analytics, ROI, reports, and PDF export support.

## Tech Stack

### Frontend

- React 19
- React Router
- Tailwind CSS
- CRACO
- Axios
- Recharts
- jsPDF
- lucide-react
- React Markdown
- Three.js dependencies available for 3D/digital twin experiences

### Backend

- FastAPI
- Motor / MongoDB
- Pydantic
- WebSockets
- Google GenAI
- Groq
- Uvicorn

### Database

- MongoDB
- Seeded plant data in `backend/seed_data.py`

## Repository Structure

```text
.
+-- backend/
|   +-- server.py              # FastAPI API, AI chat, RBAC, WebSocket stream
|   +-- seed_data.py           # Seed assets, alerts, logbook, knowledge data
|   +-- requirements.txt       # Python dependencies
|   +-- Dockerfile
|   +-- tests/
+-- frontend/
|   +-- src/
|   |   +-- App.js
|   |   +-- components/
|   |   |   +-- LaunchScreen.jsx
|   |   |   +-- Layout.jsx
|   |   +-- pages/
|   |   +-- lib/
|   +-- package.json
|   +-- public/
+-- Dockerfile
+-- memory/
|   +-- PRD.md
+-- README.md
```

## Launch Flow

1. User opens the app.
2. `LaunchScreen.jsx` renders the landing layer.
3. User clicks **Launch Console**.
4. A short boot screen shows database hydration / console connection.
5. The main Maintenance Wizard console starts.

This behavior is controlled in `frontend/src/App.js`.

## Local Setup

### Prerequisites

- Node.js
- npm
- Python 3.10+
- MongoDB running locally
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Donot-rush/Tata_Steel_AI_Maintaence_Wizzard_System.git
cd Tata_Steel_AI_Maintaence_Wizzard_System
```

### 2. Backend Environment

Create `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=maintenance_wizard
CORS_ORIGINS=*
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
GEMINI_MODEL=gemini-2.5-flash
GROQ_MODEL=llama-3.1-8b-instant
```

Do not commit real `.env` files or API keys.

Install backend dependencies:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Start the backend:

```bash
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```

Backend health check:

```text
http://127.0.0.1:8001/api/
```

### 3. Frontend Environment

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://127.0.0.1:8001
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the frontend:

```bash
npm start
```

Frontend URL:

```text
http://localhost:3000
```

## Main API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/` | Backend health check |
| GET | `/api/dashboard/overview` | Dashboard KPIs, assets, recent alerts |
| GET | `/api/assets` | List all assets |
| GET | `/api/assets/{asset_id}` | Asset detail with sensors, alerts, logs, knowledge |
| GET | `/api/assets/{asset_id}/sensors` | Sensor series snapshot |
| WS | `/api/ws/sensors/{asset_id}` | Live sensor tick stream |
| GET | `/api/alerts` | List/filter alerts |
| POST | `/api/alerts/acknowledge` | Acknowledge alert with role check |
| GET | `/api/logbook` | List logbook entries |
| POST | `/api/logbook` | Create logbook entry |
| GET | `/api/knowledge` | Search/list knowledge records |
| GET | `/api/risk-matrix` | Asset severity/urgency matrix |
| GET | `/api/recommendations/{asset_id}` | Rule-based recommendations |
| GET | `/api/reports/{asset_id}` | Report data for PDF export |
| POST | `/api/wizard/sessions` | Start AI chat session |
| GET | `/api/wizard/sessions` | List chat sessions |
| POST | `/api/wizard/chat/stream` | Stream AI diagnostic response |
| POST | `/api/wizard/feedback` | Save response feedback |
| GET | `/api/inventory` | Spare inventory and risk exposure |
| POST | `/api/inventory/purchase/{part_id}` | Create purchase order with role check |
| GET | `/api/scheduler` | 7-day maintenance schedule |
| GET | `/api/analytics` | Analytics and ROI data |
| POST | `/api/simulate/anomaly` | Create demo anomaly alert |
| GET | `/api/auth/permissions` | Current role permissions |

## AI Chat Behavior

The AI chat uses the `forgeops-sentinel` model option by default.

Provider routing:

- `forgeops-sentinel` and `claude-sonnet-4-5-20250929` route through Gemini.
- `gpt-5.2` routes through Groq.

If the provider is unavailable or returns high-demand/503 text, the backend generates a deterministic local fallback response from MongoDB plant data. This keeps the operator workflow usable even when the cloud model is busy.

## Role-Based Access

The frontend sends the selected role as an `X-Role` header.

Default roles:

- `engineer`: view, acknowledge alerts, create logs
- `supervisor`: engineer permissions plus dispatch and purchase
- `admin`: all supervisor permissions plus admin/expedite actions

Role permissions are defined in `backend/server.py`.

## Seeded Demo Data

The database seeds on backend startup if the asset count does not match the expected seed data count.

Seed data includes:

- 30 assets
- 13 alerts
- Logbook entries
- Knowledge documents and SOP/manual excerpts
- Spare parts inventory
- Sensor series and live tick simulation

## Available Frontend Pages

- Dashboard
- AI Chat
- Equipment
- Analytics
- Scheduler
- Inventory
- Alerts
- Logbook
- Knowledge Center
- Reports
- Credits

## Build Commands

Frontend production build:

```bash
cd frontend
npm run build
```

Backend import check:

```bash
cd backend
python -c "import server; print('server import ok')"
```

Backend tests:

```bash
cd backend
python -m pytest tests
```

## Deployment Notes

- The root `Dockerfile` is intended for deployment packaging.
- The backend can serve the frontend build if `frontend/build` exists.
- Set production environment variables for MongoDB, CORS, Gemini, and Groq keys.
- Never expose real API keys in GitHub commits.

## Recent Updates

- Added full launch landing screen and boot transition.
- Replaced the small sidebar logo with a cleaner Tata Steel style SVG badge.
- Added AI fallback behavior for model provider outages.
- Updated the console UI styling and module pages.
- Verified local backend health and AI fallback streaming on port `8001`.

## Author

Built by **Smruti Gujar**.

Signature: `AGENT - MAESTRO v1.0 - Built by Smruti Gujar`
