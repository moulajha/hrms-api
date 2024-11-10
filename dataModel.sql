-- Enable access to auth.users for role checking
grant usage on schema auth to authenticated;
grant select on auth.users to authenticated;

-- Create a function to update user roles (optional, if you need RLS)
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


  -- 1. Create Base Tables
-- Organizations/Tenants Table
CREATE TABLE public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
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

-- 2. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Organizations Policies
CREATE POLICY "Organizations are viewable by organization members"
    ON public.organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Profiles Policies
CREATE POLICY "Profiles are viewable by organization members"
    ON public.profiles
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (id = auth.uid());

-- Roles Policies
CREATE POLICY "Roles are viewable by organization members"
    ON public.roles
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- User Roles Policies
CREATE POLICY "User roles are viewable by organization members"
    ON public.user_roles
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- 4. Insert Default System Roles
INSERT INTO public.roles (name, description, is_system, permissions) VALUES
    ('SUPER_ADMIN', 'Super Administrator', true, '["*"]'),
    ('ADMIN', 'Organization Administrator', true, '["manage_users", "manage_roles", "manage_organization", "view_reports"]'),
    ('HR_MANAGER', 'HR Manager', true, '["manage_employees", "manage_attendance", "manage_payroll", "view_reports"]'),
    ('MANAGER', 'Department Manager', true, '["view_employees", "manage_attendance", "view_reports"]'),
    ('EMPLOYEE', 'Regular Employee', true, '["view_profile", "view_attendance", "view_payroll"]');

-- 5. Create Updated At Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language plpgsql;

-- Apply updated_at trigger to all tables
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

    -- Function to get current user's organization_id
CREATE OR REPLACE FUNCTION public.get_current_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND ur.organization_id = get_current_organization_id()
        AND r.permissions ? required_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND ur.organization_id = get_current_organization_id()
        AND r.name = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign role to user
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
    SELECT organization_id INTO v_org_id
    FROM public.profiles
    WHERE id = p_user_id;

    -- Get role_id
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE name = p_role_name
    AND (organization_id = v_org_id OR organization_id IS NULL);

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role % not found', p_role_name;
    END IF;

    -- Insert user role
    INSERT INTO public.user_roles (user_id, role_id, organization_id)
    VALUES (p_user_id, v_role_id, v_org_id)
    ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT JSONB_AGG(DISTINCT jsonb_array_elements_text(r.permissions))
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = p_user_id
        AND ur.organization_id = (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = p_user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.get_current_organization_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions TO authenticated;