USE ecommerce_seguro;

-- Crear usuario exclusivo para el enlace federado
CREATE USER IF NOT EXISTS 'auditor_federado'@'%' 
IDENTIFIED BY 'ClaveSegura123';

-- Otorgar SOLO los permisos necesarios para auditoría
-- Ver tablas de auditoría
GRANT SELECT ON ecommerce_seguro.audit_logs TO 'auditor_federado'@'%';
GRANT SELECT ON ecommerce_seguro.audit_seguridad TO 'auditor_federado'@'%';
GRANT SELECT ON ecommerce_seguro.vista_audit_logs TO 'auditor_federado'@'%';

-- Ver información básica de usuarios (sin datos sensibles)
GRANT SELECT (id, nombre_completo, email, rol, activo, created_at) 
ON ecommerce_seguro.usuarios TO 'auditor_federado'@'%';

-- Ver estadísticas de ventas (sin datos de pago)
GRANT SELECT ON ecommerce_seguro.ventas TO 'auditor_federado'@'%';
GRANT SELECT ON ecommerce_seguro.productos TO 'auditor_federado'@'%';
GRANT SELECT ON ecommerce_seguro.sucursales TO 'auditor_federado'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;
-- Crear usuario con SSL obligatorio
ALTER USER IF NOT EXISTS 'auditor_federado_ssl'@'%' 
IDENTIFIED BY 'ClaveSegura123'
REQUIRE SSL;

-- Otorgar los mismos permisos
GRANT SELECT ON ecommerce_seguro.audit_logs TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.audit_seguridad TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.vista_audit_logs TO 'auditor_federado_ssl'@'%';
GRANT SELECT (id, nombre_completo, email, rol, activo, created_at) 
ON ecommerce_seguro.usuarios TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.ventas TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.productos TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.sucursales TO 'auditor_federado_ssl'@'%';

FLUSH PRIVILEGES;

-- Crear usuario con SSL obligatorio
CREATE USER IF NOT EXISTS 'auditor_federado_ssl'@'%' 
IDENTIFIED BY 'ClaveSegura123!'
REQUIRE SSL;

-- Otorgar los mismos permisos
GRANT SELECT ON ecommerce_seguro.audit_logs TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.audit_seguridad TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.vista_audit_logs TO 'auditor_federado_ssl'@'%';
GRANT SELECT (id, nombre_completo, email, rol, activo, created_at) 
ON ecommerce_seguro.usuarios TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.ventas TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.productos TO 'auditor_federado_ssl'@'%';
GRANT SELECT ON ecommerce_seguro.sucursales TO 'auditor_federado_ssl'@'%';

FLUSH PRIVILEGES;

-- Verificar si SSL está habilitado
SHOW VARIABLES LIKE 'have_ssl';
-- Debe mostrar 'YES'

-- Verificar configuración SSL
SHOW VARIABLES LIKE 'ssl%';


-- trigger para auditar accesos
CREATE TABLE IF NOT EXISTS audit_acceso_federado (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    usuario VARCHAR(100),
    ip_address VARCHAR(45),
    tabla_accedida VARCHAR(100),
    fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear procedimiento para registrar accesos
DELIMITER //
CREATE PROCEDURE sp_registrar_acceso_federado(
    IN p_tabla VARCHAR(100)
)
BEGIN
    INSERT INTO audit_acceso_federado (usuario, ip_address, tabla_accedida)
    VALUES (CURRENT_USER(), @app_ip_address, p_tabla);
END //
DELIMITER ;

-- Crear evento que deshabilite el usuario fuera de horario laboral
-- Nota: Esto requiere el Event Scheduler habilitado

-- Habilitar event scheduler
SET GLOBAL event_scheduler = ON;

-- Crear evento para deshabilitar acceso nocturno
CREATE EVENT IF NOT EXISTS deshabilitar_auditor_nocturno
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 22:00:00'
DO
BEGIN
    -- Deshabilitar el usuario del auditor
    ALTER USER 'auditor_federado'@'%' ACCOUNT LOCK;
END;

-- Crear evento para habilitar acceso diurno
CREATE EVENT IF NOT EXISTS habilitar_auditor_diurno
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 08:00:00'
DO
BEGIN
    -- Habilitar el usuario del auditor
    ALTER USER 'auditor_federado'@'%' ACCOUNT UNLOCK;
END;

-- Ver conexiones activas del auditor
SELECT 
    id,
    user,
    host,
    db,
    command,
    time,
    state,
    info
FROM information_schema.processlist
WHERE user LIKE 'auditor_federado%';

-- Usando Performance Schema
SELECT 
    t.processlist_id,
    t.processlist_user,
    t.processlist_host,
    t.processlist_db,
    t.processlist_command,
    t.processlist_time,
    t.processlist_info
FROM performance_schema.threads t
WHERE t.processlist_user LIKE 'auditor_federado%';