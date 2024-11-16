-- Add employee_code column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50);

-- Create unique index on employee_code and organization_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_code_org 
ON employees(employee_code, organization_id);

-- Add comment to describe the column
COMMENT ON COLUMN employees.employee_code IS 'Unique employee code in format ORG-EMP-XXX';
