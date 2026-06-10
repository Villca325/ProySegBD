-- Vista de productos con filtro por rol
CREATE VIEW products_secure AS
SELECT 
    p.*,
    pr.business_name as provider_name
FROM products p
INNER JOIN providers pr ON p.provider_id = pr.id
WHERE 
    CASE 
        WHEN @session_role = 'admin' THEN 1=1
        WHEN @session_role = 'provider' THEN p.provider_id = @session_provider_id
        WHEN @session_role = 'customer' THEN p.status = 'active'
        ELSE 1=0
    END;
