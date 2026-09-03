-- ==========================================================
-- CivicAI - PostgreSQL Database Schema
-- Automated Civic Complaint Management System
-- ==========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'citizen',
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    email VARCHAR(150) NOT NULL,
    description TEXT
);

-- 3. Create Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    image_path VARCHAR(300),
    department VARCHAR(120) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    summary TEXT,
    confidence_department DOUBLE PRECISION DEFAULT 0.0,
    confidence_severity DOUBLE PRECISION DEFAULT 0.0,
    confidence_priority DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_severity ON complaints(severity);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);

-- 4. Create Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    recipient VARCHAR(150) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_logs_complaint_id ON email_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- 5. Seed Default Official Departments
INSERT INTO departments (name, email, description) VALUES
('Roads & Infrastructure', 'roads@city.gov', 'Responsible for municipal roads, pavements, bridges, potholes, and highway infrastructure.'),
('Water Supply', 'water@city.gov', 'Manages potable drinking water supply, pipeline networks, pressure distribution, and water contamination concerns.'),
('Electricity', 'electricity@city.gov', 'Oversees power distribution lines, electrical substations, public transformers, and outage resolution.'),
('Sanitation', 'sanitation@city.gov', 'Handles public hygiene, municipal restrooms, sewage cleanliness, and open sanitation issues.'),
('Waste Management', 'waste@city.gov', 'Manages domestic garbage collection, municipal disposal bins, hazardous waste, and recycling operations.'),
('Drainage', 'drainage@city.gov', 'Maintains underground sewers, stormwater drains, culverts, and flood prevention systems.'),
('Public Safety', 'publicsafety@city.gov', 'Addresses structural hazards, feral animal threats, civic emergency conditions, and pedestrian safety.'),
('Street Lighting', 'streetlights@city.gov', 'Maintains public illumination, streetlight fixtures, dark stretch remediation, and high-mast towers.'),
('Traffic', 'traffic@city.gov', 'Oversees traffic flow controls, signaling systems, road signage, and junction congestion issues.'),
('Public Health', 'health@city.gov', 'Controls vector-borne disease outbreaks, pest eradication, public clinic hygiene, and epidemiological hazards.'),
('Parks & Environment', 'parks@city.gov', 'Maintains public gardens, community parks, lake bodies, urban tree covers, and environmental conservation.'),
('Other', 'general@city.gov', 'General civic grievances, administrative requests, public information kiosks, and municipal services.')
ON CONFLICT (name) DO NOTHING;
