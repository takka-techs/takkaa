-- 1. Check table structure for app_settings
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'app_settings' AND table_schema = 'public';

-- 2. Check for triggers on app_settings
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'app_settings';
