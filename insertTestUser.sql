-- First, get the organization ID
DO $$ 
DECLARE
    v_org_id UUID;
    v_user_id UUID := '11111111-1111-1111-1111-111111111111'; -- Example UUID for test user
    v_admin_role_id UUID;
BEGIN
    -- Get the organization ID
    SELECT id INTO v_org_id 
    FROM public.organizations 
    WHERE slug = 'demo-org';

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Organization not found. Please run insertOrg.sql first.';
    END IF;

    -- Create a profile for the test user
    INSERT INTO public.profiles (
        id,
        organization_id,
        first_name,
        last_name,
        phone
    ) VALUES (
        v_user_id,
        v_org_id,
        'Test',
        'User',
        '1234567890'
    );

    -- Get the Admin role ID
    SELECT id INTO v_admin_role_id 
    FROM public.roles 
    WHERE name = 'ADMIN' 
    AND organization_id = v_org_id;

    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found. Please ensure insertOrg.sql was run successfully.';
    END IF;

    -- Assign Admin role to the user
    INSERT INTO public.user_roles (
        user_id,
        role_id,
        organization_id
    ) VALUES (
        v_user_id,
        v_admin_role_id,
        v_org_id
    );

    RAISE NOTICE 'Test user created successfully with organization ID: %', v_org_id;
    RAISE NOTICE 'Use this organization ID when signing up a new user in the application';
END $$;

-- After running this script, you can create a user in Supabase Authentication with:
-- Email: test@example.com
-- Password: Test123!
-- 
-- Note: Make sure to run insertOrg.sql first to create the organization and roles
