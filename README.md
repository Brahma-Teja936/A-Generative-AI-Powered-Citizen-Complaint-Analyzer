# CivicAI — AI-Powered Multilingual Citizen Complaint Analyzer & Emergency Response System

> **Notice:** The training dataset included in this project (`dataset/training/civic_complaints.csv`) is synthetic and intended for development/research purposes. It does not represent real-world collected citizen data.

---

## 🏛️ Project Overview

**CivicAI** is an enterprise-grade, full-stack civic complaint management, multilingual analysis, and municipal emergency response system. It empowers citizens to report civic emergencies and infrastructure issues in **English**, **తెలుగు (Telugu)**, or **हिन्दी (Hindi)** using **voice** or **text**, automatically runs ML classification (TF-IDF + XGBoost) and Groq Generative AI, and routes them to municipal departments or the Emergency Command Center.

---

## 📐 System Architecture

```
React (Vite + Tailwind) [Port 3000]
            ↕ (REST + JWT + GeoJSON)
Flask Backend (REST API) [Port 5000]
            ↕
MongoDB Atlas / Local Mongo (13 Collections)
            ↕
TF-IDF + 6 XGBoost Models (Loaded once at startup)
            ↕
Groq Generative AI (LLM Contextual Enrichment with Offline Fallback)
            ↕
SMTP Email Service (DB-Enforced Idempotency)
```

---

## ⚡ Core Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v7, Axios, Recharts, Leaflet, React-Leaflet, Lucide Icons |
| **Backend** | Python 3.14+, Flask 3, Flask REST, Gunicorn |
| **Database** | MongoDB 7.0 / MongoDB Atlas, PyMongo, 2dsphere Geospatial Indexes |
| **Machine Learning** | Scikit-learn, TF-IDF Vectorizer, XGBoost (6 target multiclass models), Joblib |
| **Generative AI** | Groq API (`llama-3.3-70b-versatile`) with deterministic NLP fallback |
| **Authentication** | JWT (PyJWT HS256), bcrypt password hashing, RBAC, Permission Middleware |
| **DevOps** | Docker, Docker Compose, Gunicorn multi-worker |

---

## 🔒 Training Data Strict Isolation

Training complaints are **strictly isolated** from production workflows:
- Training complaints are stored in `dataset/training/` and the isolated `training_complaints` collection (`is_training_data: True`, `record_type: "TRAINING"`).
- All live complaint endpoints (`/api/admin/complaints`, `/api/department/complaints`, `/api/client/complaints`, `/api/admin/dashboard`, `/api/admin/analytics`) strictly query `{"is_training_data": False, "record_type": "LIVE"}`.
- Automated tests (`tests/test_isolation.py`) prove that synthetic/training records never leak into any live API response.

---

## 👥 User Roles & Hierarchy

```
SUPER_ADMIN (Full system governance, creates/manages administrators, audit logs)
     ↓
   ADMIN (Live complaint reviews, AI overrides, department assignment, Emergency Center)
     ↓
DEPARTMENT (Handles work orders assigned to their department, posts progress & evidence, resolves)
     ↓
  CLIENT (Citizens submit voice/text complaints, tracks live status, provides feedback)
```

### Granular Permissions for Administrators
- `VIEW_COMPLAINTS`, `REVIEW_AI`, `OVERRIDE_AI`, `ASSIGN_DEPARTMENT`, `REASSIGN_DEPARTMENT`
- `MANAGE_PROGRESS`, `RESOLVE_COMPLAINT`, `VIEW_ANALYTICS`, `VIEW_MAP`, `VIEW_CRITICAL`, `VIEW_URGENT`
- `EMERGENCY_RESPONSE`, `MANAGE_DEPARTMENTS`, `MANAGE_EMERGENCY_SERVICES`, `VIEW_AUDIT_LOGS`, `MANAGE_USERS`, `MANAGE_ADMINS`

---

## 🚨 Emergency Command Center Workflow

1. **AI Detection**: When severity is `CRITICAL` or urgency is `IMMEDIATE`, complaint status is flagged as emergency.
2. **Admin Command Center** (`/admin/emergency`): Authorized admins view the active incident on the **Emergency Map**.
3. **Geospatial Responders**: Real-time 2dsphere proximity search calculates nearest responders:
   - 🚑 Ambulance (e.g. 1.2 km)
   - 🚔 Police Patrol (e.g. 2.1 km)
   - 🚒 Fire & Rescue (e.g. 3.4 km)
   - 🏥 Hospital ER (e.g. 4.0 km)
4. **Authorized Confirmation**: Action requires admin confirmation modal before dispatch.
5. **Real-world Safety Compliance**: System creates audit logs and status updates without fictitious external phone calls.

---

## 📧 Email Idempotency & Notifications

Emails (`email_logs` collection) use a compound unique index on:
```
(complaint_id, email_type, event_id)
```
This strictly prevents duplicate email dispatches from browser refreshes, double-clicks, or automated retries. Resolution emails are sent **exactly once**.

---

## 🚀 Quickstart & Setup Guide

### 1. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your configuration:
- `MONGO_URI`: Your MongoDB Atlas URI or local `mongodb://localhost:27017/civicai_db`
- `GROQ_API_KEY`: Free key from [console.groq.com](https://console.groq.com)
- `SMTP_*`: Optional Gmail app password or SMTP server

### 2. Backend Setup & Model Training

```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Train models and generate synthetic dataset
python notebooks/generate_dataset_and_train.py

# 3. Start Flask Backend
python backend/run.py
```
Backend runs at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

### 4. Running with Docker Compose

```bash
docker-compose up --build
```

### 5. Running Automated Tests

```bash
python -m pytest tests/ -v
```

---

## 🔑 Default Initial Credentials

| Role | Identifier / Email | Default Password |
|---|---|---|
| **SUPER_ADMIN** | `****************` (or `****************`) | `**************` |
| **Citizen (Test)** | Auto-registers at `/register` | User chosen |
| **Department** | Created via `/admin/departments` | Admin allocated |
