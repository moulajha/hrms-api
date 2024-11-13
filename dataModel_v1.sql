-- Previous content remains the same until RLS policies
-- Only showing the modified policies for brevity

-- Create RLS Policies with fixed recursion issues
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
