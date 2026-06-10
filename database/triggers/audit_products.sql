DELIMITER $$

CREATE TRIGGER audit_products_insert
AFTER INSERT ON products
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, user_id, real_user_email, changed_data)
    VALUES ('products', 'INSERT', NEW.id, @session_user_id, @session_email,
            JSON_OBJECT('name', NEW.name, 'price', NEW.price, 'provider_id', NEW.provider_id));
END$$

CREATE TRIGGER audit_products_update
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, user_id, real_user_email, changed_data)
    VALUES ('products', 'UPDATE', NEW.id, @session_user_id, @session_email,
            JSON_OBJECT('old_price', OLD.price, 'new_price', NEW.price, 'old_stock', OLD.stock, 'new_stock', NEW.stock));
END$$

DELIMITER ;
