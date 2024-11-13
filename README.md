# HRMS Setup Instructions

## Database Setup

Follow these steps in order to set up the database and test user:

1. Clean the database:
```sql
-- Run drop.sql to remove all existing objects
```

2. Create the schema with system roles:
```sql
-- Run dataModel_v1.sql to create tables, functions, policies, and system roles
```

3. Insert demo organization:
```sql
-- Run insertOrg.sql to create the demo organization and default settings
```

4. Set up test user:
```sql
-- Run insertTestUser.sql to create the test user profile and roles
```

5. Create Authentication User:
   - Go to Supabase Dashboard
   - Navigate to Authentication > Users
   - Click "Add User"
   - Use these credentials:
     - Email: test@example.com
     - Password: Test123!
   - The user will be automatically linked to the profile created in step 4

## Key Changes in v1

The main differences in dataModel_v1.sql compared to the original schema:
1. System roles are inserted before enabling RLS
2. All organization_id references are properly qualified
3. RLS policies are optimized for better performance

## Testing Signin

You can now test signin with:
- Email: test@example.com
- Password: Test123!

The user will have:
- Organization: Demo Organization
- Role: HR Manager
- Permissions: manage_employees, manage_attendance, manage_payroll, view_reports

## Troubleshooting

If you encounter signin issues:

1. Verify the organization exists:
```sql
SELECT * FROM organizations WHERE slug = 'demo-org';
```

2. Check user profile:
```sql
SELECT * FROM profiles WHERE id = '[user-id]';
```

3. Verify user roles:
```sql
SELECT r.name 
FROM user_roles ur 
JOIN roles r ON r.id = ur.role_id 
WHERE ur.user_id = '[user-id]';
```

4. Check system roles exist:
```sql
SELECT * FROM roles WHERE organization_id IS NULL;
```

5. Check RLS policies are active:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'profiles', 'roles', 'user_roles');
