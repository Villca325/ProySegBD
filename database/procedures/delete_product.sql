DELIMITER $$

-- Eliminación de productos (soft delete mediante status)
CREATE PROCEDURE sp_delete_product(IN p_product_id INT)
BEGIN
    DECLARE v_provider_id INT;
    
    IF @session_role IN ('admin', 'provider') THEN
        IF @session_role = 'provider' THEN
            SELECT provider_id INTO v_provider_id FROM products WHERE id = p_product_id;
            IF v_provider_id != @session_provider_id THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Access denied: You can only delete your own products';
            END IF;
        END IF;
        
        UPDATE products SET status = 'inactive' WHERE id = p_product_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Access denied: Insufficient privileges';
    END IF;
END$$

DELIMITER ;
