-- Add employee_code column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS employee_code TEXT;

-- Create unique index on employee_code and organization_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_code_org 
ON public.employees(employee_code, organization_id);

-- Add comment to describe the column
COMMENT ON COLUMN public.employees.employee_code IS 'Unique employee code in format ORG-EMP-XXX';

-- Update RLS policy to include employee_code in the SELECT policy
DROP POLICY IF EXISTS "Employees are viewable by organization members" ON public.employees;
CREATE POLICY "Employees are viewable by organization members"
    ON public.employees
    FOR SELECT
    USING (
        employees.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

-- Refresh schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
