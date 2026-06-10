DELIMITER $$

CREATE TRIGGER audit_orders_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, user_id, real_user_email, changed_data)
    VALUES ('orders', 'INSERT', NEW.id, @session_user_id, @session_email, 
            JSON_OBJECT('order_code', NEW.order_code, 'total', NEW.total, 'status', NEW.status));
END$$

CREATE TRIGGER audit_orders_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, user_id, real_user_email, changed_data)
    VALUES ('orders', 'UPDATE', NEW.id, @session_user_id, @session_email,
            JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status, 'old_total', OLD.total, 'new_total', NEW.total));
END$$

DELIMITER ;