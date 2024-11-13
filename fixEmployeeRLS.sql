-- First ensure tables are owned by postgres
ALTER TABLE public.employees OWNER TO postgres;
ALTER TABLE public.employee_types OWNER TO postgres;
ALTER TABLE public.employee_status OWNER TO postgres;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view employees in their organization" ON public.employees;
DROP POLICY IF EXISTS "Users with CREATE_EMPLOYEE permission can create employees" ON public.employees;
DROP POLICY IF EXISTS "Users with UPDATE_EMPLOYEE permission can update employees" ON public.employees;
DROP POLICY IF EXISTS "Users with DELETE_EMPLOYEE permission can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view and use employee types in their organization" ON public.employee_types;
DROP POLICY IF EXISTS "Users can view and use employee status in their organization" ON public.employee_status;
DROP POLICY IF EXISTS "service_role_bypass" ON public.employees;
DROP POLICY IF EXISTS "authenticated_user_access" ON public.employees;
DROP POLICY IF EXISTS "service_role_bypass" ON public.employee_types;
DROP POLICY IF EXISTS "authenticated_user_access" ON public.employee_types;
DROP POLICY IF EXISTS "service_role_bypass" ON public.employee_status;
DROP POLICY IF EXISTS "authenticated_user_access" ON public.employee_status;

-- Grant necessary permissions
GRANT ALL ON public.employees TO postgres;
GRANT ALL ON public.employee_types TO postgres;
GRANT ALL ON public.employee_status TO postgres;
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.employee_types TO authenticated;
GRANT ALL ON public.employee_status TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create simplified RLS policies
CREATE POLICY "tenant_isolation_policy" ON public.employees
    FOR ALL
    USING (
        -- Allow service role full access
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'role' = 'service_role')
        OR
        -- For authenticated users, check organization_id
        (
            organization_id IN (
                SELECT organization_id 
                FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    )
    WITH CHECK (
        -- Allow service role full access
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'role' = 'service_role')
        OR
        -- For authenticated users, check organization_id
        (
            organization_id IN (
                SELECT organization_id 
                FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "tenant_isolation_policy" ON public.employee_types
    FOR ALL
    USING (
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'role' = 'service_role')
        OR
        (
            organization_id IN (
                SELECT organization_id 
                FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "tenant_isolation_policy" ON public.employee_status
    FOR ALL
    USING (
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'role' = 'service_role')
        OR
        (
            organization_id IN (
                SELECT organization_id 
                FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_status ENABLE ROW LEVEL SECURITY;

-- Allow postgres role to bypass RLS
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employee_types FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employee_status FORCE ROW LEVEL SECURITY;
