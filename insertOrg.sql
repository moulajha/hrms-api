-- Cleanup commands for the relevant tables using TRUNCATE
-- Truncate roles
TRUNCATE TABLE public.roles RESTART IDENTITY CASCADE;

-- Truncate employee_status
TRUNCATE TABLE public.employee_status RESTART IDENTITY CASCADE;

-- Truncate employee_types
TRUNCATE TABLE public.employee_types RESTART IDENTITY CASCADE;

-- Truncate organizations
TRUNCATE TABLE public.organizations RESTART IDENTITY CASCADE;

-- Insert organization and store its ID
DO $$ 
DECLARE
    v_org_id UUID;
BEGIN
    -- Insert and get the organization ID
    INSERT INTO public.organizations (name, slug, settings, status)
    VALUES (
        'Demo Organization',
        'demo-org',
        '{
            "theme": {
                "primary_color": "#007bff",
                "secondary_color": "#6c757d"
            },
            "features": {
                "attendance": true,
                "payroll": true,
                "leave_management": true
            }
        }'::jsonb,
        'active'
    )
    RETURNING id INTO v_org_id;

    -- Insert default employee types for this organization
    INSERT INTO public.employee_types (name, description, organization_id)
    VALUES 
        ('FULL_TIME', 'Full-time employee', v_org_id),
        ('PART_TIME', 'Part-time employee', v_org_id),
        ('CONTRACT', 'Contract employee', v_org_id),
        ('INTERN', 'Intern', v_org_id);

    -- Insert default employee status for this organization
    INSERT INTO public.employee_status (name, description, organization_id)
    VALUES 
        ('ACTIVE', 'Active employee', v_org_id),
        ('INACTIVE', 'Inactive employee', v_org_id),
        ('ON_LEAVE', 'Employee on leave', v_org_id),
        ('TERMINATED', 'Terminated employee', v_org_id);

    -- Insert organization-specific roles with comprehensive permissions
    INSERT INTO public.roles (name, description, organization_id, is_system, permissions)
    VALUES 
        ('SUPER_ADMIN', 'Super Administrator', NULL, true, '[
            "CREATE_EMPLOYEE", "READ_EMPLOYEE", "UPDATE_EMPLOYEE", "DELETE_EMPLOYEE",
            "MANAGE_LEAVE", "APPROVE_LEAVE", "REQUEST_LEAVE",
            "MANAGE_ATTENDANCE", "MARK_ATTENDANCE", "VIEW_ATTENDANCE",
            "MANAGE_PAYROLL", "VIEW_PAYROLL",
            "MANAGE_DOCUMENTS", "VIEW_DOCUMENTS",
            "MANAGE_SETTINGS", "VIEW_SETTINGS"
        ]'),
        ('ADMIN', 'Administrator', v_org_id, true, '[
            "CREATE_EMPLOYEE", "READ_EMPLOYEE", "UPDATE_EMPLOYEE", "DELETE_EMPLOYEE",
            "MANAGE_LEAVE", "APPROVE_LEAVE",
            "MANAGE_ATTENDANCE", "VIEW_ATTENDANCE",
            "MANAGE_PAYROLL", "VIEW_PAYROLL",
            "MANAGE_DOCUMENTS", "VIEW_DOCUMENTS",
            "MANAGE_SETTINGS", "VIEW_SETTINGS"
        ]'),
        ('HR_MANAGER', 'HR Manager', v_org_id, true, '[
            "CREATE_EMPLOYEE", "READ_EMPLOYEE", "UPDATE_EMPLOYEE",
            "MANAGE_LEAVE", "APPROVE_LEAVE", "REQUEST_LEAVE",
            "MANAGE_ATTENDANCE", "VIEW_ATTENDANCE",
            "MANAGE_PAYROLL", "VIEW_PAYROLL",
            "MANAGE_DOCUMENTS", "VIEW_DOCUMENTS",
            "VIEW_SETTINGS"
        ]'),
        ('HR_EXECUTIVE', 'HR Executive', v_org_id, true, '[
            "READ_EMPLOYEE",
            "MANAGE_LEAVE", "REQUEST_LEAVE",
            "VIEW_ATTENDANCE",
            "VIEW_PAYROLL",
            "VIEW_DOCUMENTS",
            "VIEW_SETTINGS"
        ]'),
        ('EMPLOYEE', 'Regular Employee', v_org_id, true, '[
            "READ_EMPLOYEE",
            "REQUEST_LEAVE",
            "MARK_ATTENDANCE", "VIEW_ATTENDANCE",
            "VIEW_PAYROLL",
            "VIEW_DOCUMENTS"
        ]');

    RAISE NOTICE 'Organization created with ID: %', v_org_id;
END $$;
