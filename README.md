# HealX

HealX is an AI-powered hospital appointment and queue management system. It provides real-time queue tracking, automated department recommendations based on patient symptoms, and an administrative portal for hospital staff to manage patient flow.

## Architecture Overview

The system is built with a decoupled client-server architecture:

- **Frontend**: React 19 single-page application built with Vite and styled using TailwindCSS.
- **Backend**: Python Flask REST API with WebSocket support for real-time updates.
- **Database**: MongoDB (Atlas) for persistent storage of patients, hospitals, queues, and appointments.
- **AI Integration**: Custom NLP service utilizing spaCy for keyword extraction and Anthropic's Claude API for advanced triage and symptom analysis.
- **Real-time Engine**: Flask-SocketIO enables atomic, bi-directional queue updates pushed to connected clients instantly.

## Repository Structure

```text
.
├── backend/                  # Flask server application
│   ├── app/
│   │   ├── models/           # MongoDB data models and schema definitions
│   │   ├── routes/           # REST API endpoints
│   │   └── services/         # Core business logic (AI, Queue management)
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # WSGI entry point
└── frontend/                 # React client application
    ├── src/
    │   ├── components/       # Reusable UI components
    │   └── pages/            # View components (Auth, Dashboard, Admin)
    ├── package.json          # Node dependencies
    └── vite.config.js        # Vite bundler configuration
```

## Prerequisites

- Node.js (v18 or higher)
- Python (3.10 or higher)
- MongoDB instance (local or Atlas cluster)

## Environment Configuration

Create a `.env` file in the `backend/` directory. The application requires the following environment variables:

```env
# Database Configuration
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=healX

# Security
SECRET_KEY=your_secure_random_string

# External Services (Optional)
ANTHROPIC_API_KEY=your_anthropic_api_key
TWILIO_SID=your_twilio_account_sid
TWILIO_AUTH=your_twilio_auth_token
TWILIO_PHONE=your_twilio_phone_number
REDIS_URL=redis://localhost:6379/0
```
*Note: The application falls back to keyword-based routing and in-memory message queues if external service keys are omitted.*

## Local Development Setup

### 1. Backend Initialization

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On Unix/macOS:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
The Flask API will start on `http://localhost:5000`.

### 2. Frontend Initialization

```bash
cd frontend
npm install
npm run dev
```
The Vite development server will start on `http://localhost:5173`.

## Core Services

### Real-Time Queue Management
The system utilizes WebSockets (`Flask-SocketIO`) to broadcast queue state changes. When an administrator advances the queue, the server computes the delta (patients ahead, estimated wait time) and emits a `queue_update` event. Clients recalculate their specific wait times without requiring an HTTP poll.

### AI Triage System
The AI service (`ai_service.py`) processes raw symptom descriptions. It maps natural language inputs to specific hospital departments (e.g., Cardiology, Neurology). If the Anthropic API is unavailable, the service degrades gracefully to a localized spaCy/keyword-matching heuristic.

## API Documentation

Authentication is handled via JWT (JSON Web Tokens). Endpoints requiring authorization expect an `Authorization: Bearer <token>` header.

| Domain | Endpoint | Method | Description | Auth Required |
|--------|----------|--------|-------------|---------------|
| Auth | `/api/auth/signup` | POST | Register a new patient account | No |
| Auth | `/api/auth/login` | POST | Authenticate and retrieve JWT | No |
| Patient | `/api/patient/profile` | GET | Retrieve authenticated user profile | Yes |
| Patient | `/api/patient/book` | POST | Create a new appointment | Yes |
| Patient | `/api/patient/active-appointment`| GET | Fetch active queue status | Yes |
| Hospital| `/api/hospital/list` | GET | Retrieve all registered hospitals | No |
| Admin | `/api/admin/queue/serve` | POST | Advance the active patient queue | No |

## Administrative Access

The admin dashboard is accessible via `/admin` on the client application. It provides capabilities to:
- Monitor live queues across all departments.
- Manually trigger queue advancements (which broadcasts updates to connected clients).
- Export appointment and operational telemetry to CSV.

## License

This project is proprietary and intended for personal/internal use.
