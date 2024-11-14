-- Enable access to auth.users for role checking
grant usage on schema auth to authenticated;
grant select on auth.users to authenticated;

-- Create a function to update user roles
create or replace function public.handle_user_role()
returns trigger as $$
begin
  new.role = new.raw_user_meta_data->>'role';
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically update role
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_user_role();

-- Organizations/Tenants Table
CREATE TABLE public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    gstin TEXT,
    pan TEXT,
    settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Create profiles table extending Supabase auth.users
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id),
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roles Table
CREATE TABLE public.roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    is_system BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, name)
);

-- User Roles Junction Table
CREATE TABLE public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role_id, organization_id)
);

-- Employee Types Table
CREATE TABLE public.employee_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, name)
);

-- Employee Status Table
CREATE TABLE public.employee_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, name)
);

-- Employees Table
CREATE TABLE public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    user_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    official_email TEXT NOT NULL UNIQUE,
    mobile_number TEXT,
    gender TEXT CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    join_date DATE NOT NULL,
    employee_type_id UUID REFERENCES public.employee_types(id),
    status_id UUID REFERENCES public.employee_status(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Organizations are viewable by organization members"
    ON public.organizations
    FOR SELECT
    USING (true);  -- Initially allow all reads, we'll restrict at the application level

CREATE POLICY "Profiles are viewable by organization members"
    ON public.profiles
    FOR SELECT
    USING (true);  -- Initially allow all reads, we'll restrict at the application level

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (profiles.id = auth.uid());

CREATE POLICY "Roles are viewable by organization members"
    ON public.roles
    FOR SELECT
    USING (
        roles.organization_id IS NULL OR  -- Allow access to system roles
        roles.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "User roles are viewable by organization members"
    ON public.user_roles
    FOR SELECT
    USING (
        user_roles.user_id = auth.uid() OR  -- Users can see their own roles
        user_roles.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Employee types are viewable by organization members"
    ON public.employee_types
    FOR SELECT
    USING (
        employee_types.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Employee status are viewable by organization members"
    ON public.employee_status
    FOR SELECT
    USING (
        employee_status.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
        )
    );

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

CREATE POLICY "HR managers can create employees"
    ON public.employees
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.organization_id = employees.organization_id
            AND (r.name = 'HR_MANAGER' OR r.name = 'ADMIN' OR r.name = 'SUPER_ADMIN')
        )
    );

CREATE POLICY "HR managers can update employees"
    ON public.employees
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.organization_id = employees.organization_id
            AND (r.name = 'HR_MANAGER' OR r.name = 'ADMIN' OR r.name = 'SUPER_ADMIN')
        )
    );

CREATE POLICY "HR managers can delete employees"
    ON public.employees
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.organization_id = employees.organization_id
            AND (r.name = 'HR_MANAGER' OR r.name = 'ADMIN' OR r.name = 'SUPER_ADMIN')
        )
    );

-- Create Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language plpgsql;

-- Create Triggers
CREATE TRIGGER handle_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_employee_types_updated_at
    BEFORE UPDATE ON public.employee_types
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_employee_status_updated_at
    BEFORE UPDATE ON public.employee_status
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create Utility Functions
CREATE OR REPLACE FUNCTION public.get_current_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT profiles.organization_id
        FROM public.profiles
        WHERE profiles.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH RECURSIVE flattened_permissions AS (
        SELECT DISTINCT elem::text as permission
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        CROSS JOIN LATERAL jsonb_array_elements(r.permissions) as elem
        WHERE ur.user_id = p_user_id
        AND ur.organization_id = (
            SELECT profiles.organization_id
            FROM public.profiles
            WHERE profiles.id = p_user_id
        )
    )
    SELECT COALESCE(jsonb_agg(permission), '[]'::jsonb)
    INTO result
    FROM flattened_permissions;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND ur.organization_id = public.get_current_organization_id()
        AND (r.permissions ? required_permission OR r.permissions ? '*')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND ur.organization_id = public.get_current_organization_id()
        AND r.name = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.assign_role(
    p_user_id UUID,
    p_role_name TEXT
)
RETURNS void AS $$
DECLARE
    v_role_id UUID;
    v_org_id UUID;
BEGIN
    -- Get organization_id
    SELECT profiles.organization_id INTO v_org_id
    FROM public.profiles
    WHERE profiles.id = p_user_id;

    -- Get role_id
    SELECT roles.id INTO v_role_id
    FROM public.roles
    WHERE roles.name = p_role_name
    AND (roles.organization_id = v_org_id OR roles.organization_id IS NULL);

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role % not found', p_role_name;
    END IF;

    -- Insert user role
    INSERT INTO public.user_roles (user_id, role_id, organization_id)
    VALUES (p_user_id, v_role_id, v_org_id)
    ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_current_organization_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions TO authenticated;
