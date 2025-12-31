-- PWA Enhancement Schema Updates
-- Run this script to add heartbeat tracking and OUT time/count tracking

-- Add columns to attendance table for heartbeat and OUT tracking
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP,
ADD COLUMN IF NOT EXISTS total_out_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS out_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'HALF_DAY', 'ABSENT', 'INCOMPLETE')),
ADD COLUMN IF NOT EXISTS is_auto_punched_out BOOLEAN DEFAULT false;

-- Create table to track individual OUT periods
CREATE TABLE IF NOT EXISTS attendance_out_periods (
  id SERIAL PRIMARY KEY,
  attendance_id INTEGER REFERENCES attendance(id) ON DELETE CASCADE,
  out_time TIMESTAMP NOT NULL,
  in_time TIMESTAMP,
  duration_minutes INTEGER,
  reason VARCHAR(50) DEFAULT 'AUTO' CHECK (reason IN ('AUTO', 'MANUAL', 'HEARTBEAT_TIMEOUT', 'GEO_FENCE_EXIT', 'IP_CHANGE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for heartbeat queries
CREATE INDEX IF NOT EXISTS idx_attendance_heartbeat ON attendance(employee_id, last_heartbeat) WHERE punch_in IS NOT NULL AND punch_out IS NULL;

-- Create index for OUT periods
CREATE INDEX IF NOT EXISTS idx_out_periods_attendance ON attendance_out_periods(attendance_id);

-- Function to calculate attendance status based on OUT time
CREATE OR REPLACE FUNCTION calculate_attendance_status(
  p_total_out_minutes INTEGER,
  p_punch_in TIMESTAMP,
  p_punch_out TIMESTAMP
) RETURNS VARCHAR(20) AS $$
DECLARE
  total_work_minutes INTEGER;
BEGIN
  -- If no punch in, return ABSENT
  IF p_punch_in IS NULL THEN
    RETURN 'ABSENT';
  END IF;
  
  -- If punch in but no punch out, check OUT time
  IF p_punch_out IS NULL THEN
    -- If OUT time > 240 minutes (4 hours), mark as ABSENT
    IF p_total_out_minutes > 240 THEN
      RETURN 'ABSENT';
    -- If OUT time > 120 minutes (2 hours), mark as HALF_DAY
    ELSIF p_total_out_minutes > 120 THEN
      RETURN 'HALF_DAY';
    -- Otherwise PRESENT
    ELSE
      RETURN 'PRESENT';
    END IF;
  END IF;
  
  -- If both punch in and punch out exist, calculate based on total work time
  total_work_minutes := EXTRACT(EPOCH FROM (p_punch_out - p_punch_in)) / 60 - COALESCE(p_total_out_minutes, 0);
  
  -- If total work time < 240 minutes (4 hours), mark as ABSENT
  IF total_work_minutes < 240 THEN
    RETURN 'ABSENT';
  -- If total work time < 480 minutes (8 hours), mark as HALF_DAY
  ELSIF total_work_minutes < 480 THEN
    RETURN 'HALF_DAY';
  -- Otherwise PRESENT
  ELSE
    RETURN 'PRESENT';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update existing attendance records to have status
UPDATE attendance 
SET status = calculate_attendance_status(
  COALESCE(total_out_time_minutes, 0),
  punch_in,
  punch_out
)
WHERE status IS NULL OR status = 'PRESENT';

