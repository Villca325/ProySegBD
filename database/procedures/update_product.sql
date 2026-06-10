DELIMITER $$

-- Actualización de productos con validación
CREATE PROCEDURE sp_update_product(
    IN p_product_id INT,
    IN p_name VARCHAR(255),
    IN p_price DECIMAL(10,2),
    IN p_stock INT
)
BEGIN
    DECLARE v_provider_id INT;
    
    -- Validar permisos según rol
    IF @session_role = 'admin' THEN
        -- Admin puede editar cualquier producto
        UPDATE products 
        SET name = p_name, price = p_price, stock = p_stock, updated_at = NOW()
        WHERE id = p_product_id;
    ELSEIF @session_role = 'provider' THEN
        -- Provider solo puede editar sus propios productos
        SELECT provider_id INTO v_provider_id FROM products WHERE id = p_product_id;
        
        IF v_provider_id = @session_provider_id THEN
            UPDATE products 
            SET name = p_name, price = p_price, stock = p_stock, updated_at = NOW()
            WHERE id = p_product_id;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Access denied: You can only update your own products';
        END IF;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Access denied: Insufficient privileges';
    END IF;
END$$

DELIMITER ;
