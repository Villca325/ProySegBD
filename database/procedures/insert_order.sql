DELIMITER $$

-- Inserción de órdenes con validación
CREATE PROCEDURE sp_insert_order(
    IN p_user_id INT,
    IN p_shipping_address TEXT,
    IN p_payment_method VARCHAR(50),
    IN p_items JSON
)
BEGIN
    DECLARE v_order_id INT;
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_product_id INT;
    DECLARE v_quantity INT;
    DECLARE v_unit_price DECIMAL(10,2);
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_item_cursor CURSOR FOR 
        SELECT product_id, quantity FROM JSON_TABLE(
            p_items, '$[*]' COLUMNS(
                product_id INT PATH '$.product_id',
                quantity INT PATH '$.quantity'
            )
        ) AS items;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    -- Validar rol (solo clientes pueden crear órdenes)
    IF @session_role != 'customer' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Access denied: Only customers can create orders';
    END IF;
    
    -- Validar que el usuario autenticado sea el que crea la orden
    IF @session_user_id != p_user_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Access denied: User mismatch';
    END IF;
    
    START TRANSACTION;
    
    -- Calcular total y validar stock (PROCEDIMIENTO de Json)
    OPEN v_item_cursor;
    read_loop: LOOP
        FETCH v_item_cursor INTO v_product_id, v_quantity;
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        
        SELECT price INTO v_unit_price FROM products WHERE id = v_product_id;
        SET v_total = v_total + (v_unit_price * v_quantity);
    END LOOP;
    CLOSE v_item_cursor;
    
    -- Crear orden
    INSERT INTO orders (user_id, order_code, total, shipping_address, payment_method, status)
    VALUES (p_user_id, CONCAT('ORD-', UNIX_TIMESTAMP()), v_total, p_shipping_address, p_payment_method, 'processing');
    
    SET v_order_id = LAST_INSERT_ID();
    
    -- Insertar detalles
    OPEN v_item_cursor;
    SET v_done = FALSE;
    detail_loop: LOOP
        FETCH v_item_cursor INTO v_product_id, v_quantity;
        IF v_done THEN
            LEAVE detail_loop;
        END IF;
        
        SELECT price INTO v_unit_price FROM products WHERE id = v_product_id;
        
        INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal)
        VALUES (v_order_id, v_product_id, v_quantity, v_unit_price, v_unit_price * v_quantity);
        
        -- Actualizar stock
        UPDATE products SET stock = stock - v_quantity WHERE id = v_product_id;
    END LOOP;
    CLOSE v_item_cursor;
    
    -- Limpiar carrito
    DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = p_user_id);
    
    COMMIT;
    
    SELECT v_order_id as order_id;
END$$

DELIMITER ;
