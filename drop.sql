-- Drop all functions first
DROP FUNCTION IF EXISTS public.handle_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_organization_id() CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.assign_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_permissions(UUID) CASCADE;

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_organizations_updated_at ON public.organizations;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS handle_roles_updated_at ON public.roles;
DROP TRIGGER IF EXISTS handle_user_roles_updated_at ON public.user_roles;
DROP TRIGGER IF EXISTS handle_employee_types_updated_at ON public.employee_types;
DROP TRIGGER IF EXISTS handle_employee_status_updated_at ON public.employee_status;
DROP TRIGGER IF EXISTS handle_employees_updated_at ON public.employees;

-- Drop all policies
DROP POLICY IF EXISTS "Organizations are viewable by organization members" ON public.organizations;
DROP POLICY IF EXISTS "Profiles are viewable by organization members" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Roles are viewable by organization members" ON public.roles;
DROP POLICY IF EXISTS "User roles are viewable by organization members" ON public.user_roles;
DROP POLICY IF EXISTS "Employee types are viewable by organization members" ON public.employee_types;
DROP POLICY IF EXISTS "Employee status are viewable by organization members" ON public.employee_status;
DROP POLICY IF EXISTS "Employees are viewable by organization members" ON public.employees;
DROP POLICY IF EXISTS "HR managers can create employees" ON public.employees;
DROP POLICY IF EXISTS "HR managers can update employees" ON public.employees;
DROP POLICY IF EXISTS "HR managers can delete employees" ON public.employees;

-- Drop all tables in reverse order of dependencies
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.employee_status CASCADE;
DROP TABLE IF EXISTS public.employee_types CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
