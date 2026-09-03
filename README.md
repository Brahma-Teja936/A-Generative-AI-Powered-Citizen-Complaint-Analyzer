# CivicAI — Automated AI-Based Civic Complaint Analyzer & Municipal Triage System

CivicAI is a production-grade, full-stack civic complaint management platform designed to empower citizens to report municipal grievances and enable city administrations to rapidly classify, triage, and resolve issues using Machine Learning and automated workflows.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [Folder Structure](#folder-structure)
5. [Prerequisites & System Requirements](#prerequisites--system-requirements)
6. [PostgreSQL Database Setup](#postgresql-database-setup)
7. [Backend Setup & Python Environment](#backend-setup--python-environment)
8. [Machine Learning Pipeline & Training](#machine-learning-pipeline--training)
9. [Frontend Setup & Installation](#frontend-setup--installation)
10. [Configuration & Environment Variables](#configuration--environment-variables)
11. [SMTP Email Notification Configuration](#smtp-email-notification-configuration)
12. [Database Seeding & Demo Credentials](#database-seeding--demo-credentials)
13. [Running the Application](#running-the-application)
14. [API Reference Documentation](#api-reference-documentation)
15. [Automated Testing & Verification](#automated-testing--verification)
16. [Troubleshooting](#troubleshooting)

---

## 1. Project Overview

CivicAI bridges the gap between citizens and municipal authorities:
- **For Citizens**: Report civic issues using natural language text or photo uploads. The ML pipeline immediately analyzes the description, infers the responsible department, computes severity and urgency scores, synthesizes a concise executive summary, and enables citizen review before formal submission.
- **For Administrators**: A dedicated municipal console with real-time analytics, distribution charts (Recharts), customizable filters, automated department email notifications, and instant triage controls.

---

## 2. Key Features

- **End-to-End Machine Learning**:
  - Consistent text preprocessing (token cleaning, punctuation removal, stopword filtering).
  - TF-IDF Vectorization (`ngram_range=(1, 2)`, `max_features=5000`).
  - 3 Dedicated **XGBoost Classifiers**:
    - **Department** (12 classes: *Roads & Infrastructure, Water Supply, Electricity, Sanitation, Waste Management, Drainage, Public Safety, Street Lighting, Traffic, Public Health, Parks & Environment, Other*)
    - **Severity** (*LOW, MEDIUM, HIGH, CRITICAL*)
    - **Priority** (*LOW, MEDIUM, HIGH, URGENT*)
  - Real probability-based confidence scores (`predict_proba`).
  - Business-rule safety validation layer for urgent safety keywords.
- **Dual Complaint Submission Interface**:
  - Text Complaint card with real-time character counter.
  - Image Complaint card supporting JPG, JPEG, PNG, WEBP with preview and file validation.
  - Animated multi-step AI analysis progress modal.
  - Pre-submission AI review screen with confidence progress bars.
- **Visual Status Lifecycle Tracking**:
  - Visual 5-step timeline: `Submitted` → `AI Analyzed` → `Assigned` → `In Progress` → `Resolved`.
- **PostgreSQL Database Storage**:
  - Structured schemas for Users, Complaints, Departments, and Email Logs.
  - Foreign keys, indexes, and automated fallback handling.
- **Automated SMTP Department Notifications**:
  - Formats and sends an official complaint email to the designated department inbox upon submission.
  - Tracks dispatch status (`SENT` / `FAILED`) in database email audit logs without interrupting complaint creation.
- **Executive Admin Analytics & Control Panel**:
  - Recharts dashboard displaying live metrics: Department breakdown, Severity breakdown, Priority breakdown, Inflow over time, and Status distribution.
  - Interactive triage to reassign departments, adjust severity/priority, and update status.
  - Complete email dispatch log inspection.
  - Department email management directory.

---

## 3. Architecture & Technology Stack

```
[Citizen / Admin Browser]
           │
      HTTP / REST (Axios)
           ▼
[Vite + React 19 Frontend]
  ├── React Router v7 (Client Routing)
  ├── Lucide React Icons
  └── Recharts (Data Visualizations)
           │
      JSON API / JWT Auth
           ▼
[Flask Backend (Python 3.12 / 3.14)]
  ├── Flask-CORS (Cross-Origin Resource Sharing)
  ├── PyJWT (Role-Based JWT Authorization)
  ├── Werkzeug (Secure Password Hashing)
  ├── SQLAlchemy ORM
  │        ▼
  │    [PostgreSQL / SQLite Database]
  │        ├── users
  │        ├── departments
  │        ├── complaints
  │        └── email_logs
  │
  ├── [ML Pipeline Service]
  │    ├── Preprocessing & Stopword Filter
  │    ├── TF-IDF Vectorizer (scikit-learn)
  │    └── 3x XGBoost Classifiers (Department, Severity, Priority)
  │
  ├── [Summary Service]
  │    ├── Groq LLM API (llama-3.3-70b-versatile)
  │    └── Deterministic Algorithmic Fallback Generator
  │
  └── [Email Service]
       ├── Python SMTP / TLS Transport
       └── Audit Logging to Database
```

---

## 4. Folder Structure

```
Complaint_Analyzer_Backup/
│
├── backend/
│   ├── app.py                     # Flask application factory & route registration
│   ├── config.py                  # Environment-driven configuration
│   ├── extensions.py              # SQLAlchemy database initialization
│   ├── models.py                  # User, Department, Complaint, EmailLog models
│   ├── seed_database.py           # Database seeder with demo accounts & complaints
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Local environment variables
│   ├── .env.example               # Example template
│   │
│   ├── routes/
│   │   ├── auth.py                # Citizen & Admin authentication endpoints
│   │   ├── complaints.py          # Analyze, Submit, List, Detail endpoints
│   │   ├── admin.py               # Dashboard metrics & triage controls
│   │   ├── departments.py         # Department CRUD endpoints
│   │   └── email_logs.py          # Email notification audit logs
│   │
│   ├── services/
│   │   ├── classification_service.py # TF-IDF + XGBoost inference & business rules
│   │   ├── summary_service.py     # Groq LLM / Algorithmic summary generation
│   │   ├── email_service.py       # SMTP notification dispatcher & logger
│   │   └── auth_helper.py         # JWT token issuance & decorator guards
│   │
│   ├── ml/
│   │   ├── model_wrapper.py       # Standalone XGBoostModelWrapper class
│   │   ├── preprocessing.py       # Text cleaning & stopword handling
│   │   ├── train_model.py         # Dataset loading, training, evaluation script
│   │   ├── predict.py             # CLI prediction testing script
│   │   ├── dataset/
│   │   │   ├── complaints.csv     # 631 varied civic complaint records
│   │   │   └── generate_dataset.py# Synthetic dataset generator
│   │   └── models/
│   │       ├── tfidf_vectorizer.pkl
│   │       ├── department_model.pkl
│   │       ├── severity_model.pkl
│   │       └── priority_model.pkl
│   └── uploads/                   # Stored complaint image files
│
├── database/
│   └── schema.sql                 # PostgreSQL DDL table definitions & seed inserts
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state, login/logout, role hooks
│   │   ├── services/
│   │   │   └── api.js             # Axios client with JWT interceptor
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Citizen top navigation bar
│   │   │   ├── AdminNavbar.jsx    # Administrator top navigation bar
│   │   │   ├── Badges.jsx         # Severity, Priority, Status color badges
│   │   │   ├── ConfidenceBar.jsx  # Animated confidence percentage bar
│   │   │   ├── StatusTimeline.jsx # 5-step visual resolution lifecycle
│   │   │   ├── LoadingAnalysis.jsx# Multi-step animated AI analysis modal
│   │   │   └── ProtectedRoute.jsx # Citizen and Admin route guards
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Citizen sign-in
│   │   │   ├── Register.jsx       # Citizen registration
│   │   │   ├── CitizenDashboard.jsx# Citizen metrics & recent complaints
│   │   │   ├── SubmitComplaint.jsx# Dual card submission & AI review
│   │   │   ├── ComplaintHistory.jsx# Searchable complaint list
│   │   │   ├── ComplaintDetails.jsx# Detailed view & tracking
│   │   │   ├── Profile.jsx        # Citizen account profile
│   │   │   ├── AdminLogin.jsx     # Admin portal sign-in
│   │   │   ├── AdminDashboard.jsx # 6 metrics cards + 5 Recharts visualizations
│   │   │   ├── AdminComplaints.jsx# Filterable complaints table
│   │   │   ├── AdminComplaintDetail.jsx # Interactive triage & status update
│   │   │   ├── AdminAnalytics.jsx # Resolution velocity & workload metrics
│   │   │   ├── AdminEmailLogs.jsx # Automated email audit trail
│   │   │   └── AdminDepartments.jsx # Department routing directory
│   │   ├── App.jsx                # Router & layout orchestration
│   │   ├── App.css                # Government-Tech design system styles
│   │   ├── main.jsx               # React entrypoint
│   │   └── index.css              # Reset & typography
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 5. Prerequisites & System Requirements

- **Operating System**: Windows, Linux, or macOS
- **Python**: 3.12 or 3.14 (with `pip`)
- **Node.js**: v18+ (with `npm`)
- **PostgreSQL** (Optional for local testing; SQLite fallback is automatically engaged if PostgreSQL server is not active)

---

## 6. PostgreSQL Database Setup

1. **Install PostgreSQL** (if not already installed):
   - Windows: Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Linux: `sudo apt-get install postgresql postgresql-contrib`
2. **Create Database**:
   ```sql
   CREATE DATABASE civicai;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE civicai TO postgres;
   ```
3. **Execute Schema**:
   ```bash
   psql -U postgres -d civicai -f database/schema.sql
   ```
4. Configure connection string in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civicai
   ```
*(Note: If `psycopg2` or a live PostgreSQL instance is not detected, CivicAI gracefully switches to `sqlite:///instance/civicai.db` so you can develop without blocking).*

---

## 7. Backend Setup & Python Environment

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install Flask flask-cors Flask-SQLAlchemy pyjwt scikit-learn xgboost pandas numpy joblib python-dotenv groq
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

---

## 8. Machine Learning Pipeline & Training

CivicAI trains 3 separate multi-class XGBoost models:
- To run the full model training and evaluation pipeline:
  ```bash
  python backend/ml/train_model.py
  ```
- **What this does**:
  1. Loads `backend/ml/dataset/complaints.csv` (631 realistic civic records).
  2. Applies `preprocess_text()` (lowercasing, punctuation stripping, stopword removal).
  3. Stratified 80/20 train/test split.
  4. Fits `TfidfVectorizer(max_features=5000, ngram_range=(1,2), min_df=2)`.
  5. Trains `department_model.pkl` (12 classes).
  6. Trains `severity_model.pkl` (4 classes: LOW, MEDIUM, HIGH, CRITICAL).
  7. Trains `priority_model.pkl` (4 classes: LOW, MEDIUM, HIGH, URGENT).
  8. Evaluates and prints actual Accuracy, Precision, Recall, and F1 metrics.
  9. Saves models in `backend/ml/models/`.

To run a quick CLI prediction test:
```bash
python backend/ml/predict.py
```

---

## 9. Frontend Setup & Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Ensure required packages are present:
   ```bash
   npm install react-router-dom lucide-react recharts axios
   ```

---

## 10. Configuration & Environment Variables

Create `backend/.env` (or copy from `backend/.env.example`):

```env
# Database URL (PostgreSQL default)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civicai

# Security Secrets
JWT_SECRET_KEY=civicai-jwt-super-secret-key-2026-production
SECRET_KEY=civicai-session-super-secret-key-2026

# SMTP Server Settings (for department notification emails)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=civicai-notifications@city.gov

# Optional External AI API Key for Summaries
GROQ_API_KEY=
```

---

## 11. SMTP Email Notification Configuration

When a citizen submits a complaint, CivicAI automatically triggers an email to the responsible department:
1. Subject: `[CivicAI] <PRIORITY> Priority Complaint #<ID> - <DEPARTMENT>`
2. Recipient: The official department email looked up from the `departments` table (e.g. `roads@city.gov`, `drainage@city.gov`).
3. If SMTP is unconfigured or encounters an error:
   - The complaint is **safely stored in the database** (never rolled back).
   - An audit record with status `FAILED` and error diagnostics is logged in `email_logs`.
   - Administrators can view all email logs at `/admin/email-logs`.

---

## 12. Database Seeding & Demo Credentials

To initialize database tables, seed the 12 official municipal departments, create demo users, and populate sample complaints:

```bash
python backend/seed_database.py
```

### Demo Credentials (DEVELOPMENT ONLY):

| Portal | Role | Email | Password |
|---|---|---|---|
| **Citizen Portal** (`/login`) | `citizen` | `citizen@civicai.gov` | `citizen123` |
| **Admin Portal** (`/admin/login`) | `admin` | `admin@civicai.gov` | `admin123` |

Both login pages include quick one-click **"Autofill Demo Credentials"** buttons for instant testing.

---

## 13. Running the Application

### Start Backend (Port 5000):
```bash
python backend/app.py
```
*Backend URL*: `http://127.0.0.1:5000`

### Start Frontend (Port 5173):
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
*Frontend URL*: `http://127.0.0.1:5173`

---

## 14. API Reference Documentation

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` — Registers a citizen user.
- `POST /api/auth/login` — Citizen / general sign-in returning JWT token.
- `POST /api/auth/admin-login` — Verifies administrator credentials and role.
- `GET /api/auth/me` — Returns authenticated user profile (`Bearer <token>`).

### Complaint Routes (`/api/complaints`)
- `POST /api/complaints/analyze` — Runs ML classification pipeline and returns predicted Department, Severity, Priority, Confidence scores, and AI Summary without saving to DB.
- `POST /api/complaints` — Saves reviewed complaint (accepts JSON or `multipart/form-data` with photo) into PostgreSQL, sends department notification email, logs result.
- `GET /api/complaints` — Returns complaints submitted by the authenticated user (or all if admin).
- `GET /api/complaints/<id>` — Returns single complaint with citizen details and email status.
- `GET /api/complaints/uploads/<filename>` — Serves uploaded photo evidence.

### Admin Routes (`/api/admin`) - *Requires `role == 'admin'`*
- `GET /api/admin/dashboard` — Returns 6 core metrics, Recharts distribution charts, time series, and department workload.
- `GET /api/admin/complaints` — Multi-filter search, sort, and pagination.
- `GET /api/admin/complaints/<id>` — Comprehensive inspection view.
- `PUT /api/admin/complaints/<id>` — Triage controls: change Department, Severity, Priority, or Status (`Pending`, `Assigned`, `In Progress`, `Resolved`, `Rejected`).

### Department & Email Log Routes
- `GET /api/departments` — List official departments and routing emails.
- `POST /api/departments` — Add new department (*Admin only*).
- `PUT /api/departments/<id>` — Update department email (*Admin only*).
- `DELETE /api/departments/<id>` — Delete department (*Admin only*).
- `GET /api/email-logs` — List automated notification dispatch logs (*Admin only*).

---

## 15. Automated Testing & Verification

Run these verification tests:

```bash
# 1. Test Prediction API
curl -X POST http://127.0.0.1:5000/api/complaints/analyze \
  -H "Content-Type: application/json" \
  -d '{"complaint_text": "There is a huge pothole near the college entrance and vehicles are almost falling."}'

# 2. Test Citizen Login
curl -X POST http://127.0.0.1:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "citizen@civicai.gov", "password": "citizen123"}'

# 3. Test Admin Protected Dashboard
curl -X GET http://127.0.0.1:5000/api/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

---

## 16. Troubleshooting

- **`psycopg2` not found**: CivicAI automatically falls back to local SQLite in `backend/instance/civicai.db` so the system remains operable. To use PostgreSQL, run `pip install psycopg2-binary`.
- **CORS issues**: CORS is pre-configured on all `/api/*` endpoints in `backend/app.py`.
- **Port 5000 in use**: Specify a custom port via `PORT=5001 python backend/app.py` and update `VITE_API_URL` in `frontend/.env`.
- **Email dispatch failed**: Check `email_logs` table via `/admin/email-logs`. The application will log the SMTP failure without failing the citizen's complaint submission.
