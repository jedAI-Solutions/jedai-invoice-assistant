-- Remove viewer role from database completely
-- First check current role constraint on profiles table
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles' 
AND tc.constraint_type = 'CHECK'
AND cc.check_clause LIKE '%role%';