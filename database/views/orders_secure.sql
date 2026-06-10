-- Vista de órdenes con filtro por rol
CREATE VIEW orders_secure AS
SELECT 
    o.*,
    u.name as customer_name,
    u.email as customer_email
FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE 
    CASE 
        WHEN @session_role = 'admin' THEN 1=1
        WHEN @session_role = 'provider' THEN EXISTS (
            SELECT 1 FROM order_details od
            INNER JOIN products p ON od.product_id = p.id
            WHERE od.order_id = o.id AND p.provider_id = @session_provider_id
        )
        WHEN @session_role = 'customer' THEN o.user_id = @session_user_id
        ELSE 1=0
    END;
