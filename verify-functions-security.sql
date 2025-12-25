-- Script per verificare se le funzioni hanno SECURITY DEFINER
-- Eseguire questo script nel database per vedere lo stato attuale

SELECT 
  p.proname AS function_name,
  CASE 
    WHEN p.prosecdef THEN 'YES'
    ELSE 'NO'
  END AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_staff', 'is_paziente')
ORDER BY p.proname;



