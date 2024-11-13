-- Drop existing RLS policies
DROP POLICY IF EXISTS "Employees are viewable by organization members" ON public.employees;
DROP POLICY IF EXISTS "HR managers can create employees" ON public.employees;
DROP POLICY IF EXISTS "HR managers can update employees" ON public.employees;
DROP POLICY IF EXISTS "HR managers can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Employee types are viewable by organization members" ON public.employee_types;
DROP POLICY IF EXISTS "Employee status are viewable by organization members" ON public.employee_status;

-- Update RLS policies for employees table
CREATE POLICY "Users can view employees in their organization"
    ON public.employees
    FOR SELECT
    USING (
        employees.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Users with CREATE_EMPLOYEE permission can create employees"
    ON public.employees
    FOR INSERT
    WITH CHECK (
        -- Check if user has the CREATE_EMPLOYEE permission
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.organization_id = employees.organization_id
            AND r.permissions::jsonb ? 'CREATE_EMPLOYEE'
        )
        -- Ensure the organization_id matches the user's organization
        AND employees.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Users with UPDATE_EMPLOYEE permission can update employees"
    ON public.employees
    FOR UPDATE
    USING (
        -- Check if user has the UPDATE_EMPLOYEE permission
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.organization_id = employees.organization_id
            AND r.permissions::jsonb ? 'UPDATE_EMPLOYEE'
        )
        -- Ensure the organization_id matches the user's organization
        AND employees.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Users with DELETE_EMPLOYEE permission can delete employees"
    ON public.employees
    FOR DELETE
    USING (
        -- Check if user has the DELETE_EMPLOYEE permission
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.organization_id = employees.organization_id
            AND r.permissions::jsonb ? 'DELETE_EMPLOYEE'
        )
        -- Ensure the organization_id matches the user's organization
        AND employees.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

-- Update RLS policies for employee_types table
CREATE POLICY "Users can view and use employee types in their organization"
    ON public.employee_types
    FOR ALL
    USING (
        employee_types.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

-- Update RLS policies for employee_status table
CREATE POLICY "Users can view and use employee status in their organization"
    ON public.employee_status
    FOR ALL
    USING (
        employee_status.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.employee_types TO authenticated;
GRANT ALL ON public.employee_status TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_status ENABLE ROW LEVEL SECURITY;
