-- Set password for postgres user (change 'yourpassword' to your desired password)
ALTER USER postgres WITH PASSWORD 'postgres123';

-- Create the attendance database
CREATE DATABASE attendance_db;

-- Connect to the new database
\c attendance_db

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')),
  manager_id INTEGER REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) NOT NULL,
  date DATE NOT NULL,
  punch_in TIMESTAMP,
  punch_out TIMESTAMP,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_meters DECIMAL(10, 2),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date)
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) NOT NULL,
  leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('CASUAL', 'SICK', 'WFH')),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'MANAGER_APPROVED', 'HR_APPROVED', 'REJECTED')),
  reviewed_by INTEGER REFERENCES employees(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create regularization_requests table
CREATE TABLE IF NOT EXISTS regularization_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) NOT NULL,
  attendance_date DATE NOT NULL,
  requested_punch_in TIMESTAMP,
  requested_punch_out TIMESTAMP,
  reason TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'MANAGER_APPROVED', 'HR_APPROVED', 'REJECTED')),
  reviewed_by INTEGER REFERENCES employees(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create office_settings table
CREATE TABLE IF NOT EXISTS office_settings (
  id SERIAL PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 60,
  office_public_ip VARCHAR(45) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_regularization_employee ON regularization_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_regularization_status ON regularization_requests(status);

-- Insert default office settings
INSERT INTO office_settings (latitude, longitude, radius_meters, office_public_ip)
VALUES (28.6139, 77.2090, 60, '203.0.113.1')
ON CONFLICT DO NOTHING;

-- Show success message
SELECT 'Database setup completed successfully!' AS status;

