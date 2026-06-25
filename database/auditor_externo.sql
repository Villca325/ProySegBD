-- Conectar a la base de datos del auditor
CREATE DATABASE IF NOT EXISTS auditoria_remota;
USE auditoria_remota;

CREATE SERVER IF NOT EXISTS ecommerce_principal
FOREIGN DATA WRAPPER mysql
OPTIONS (
    HOST '172.17.0.1',  
    PORT 3306,
    DATABASE 'ecommerce_seguro',
    USER 'auditor_federado_ssl'
);



-- Tabla federada: audit_logs
CREATE TABLE audit_logs (
    id BIGINT NOT NULL,
    tabla_afectada VARCHAR(100) NOT NULL,
    operacion VARCHAR(20) NOT NULL,
    usuario_real_id INT NOT NULL,
    usuario_tecnico VARCHAR(100),
    ip_address VARCHAR(45),
    datos_antes JSON,
    datos_despues JSON,
    fecha TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=FEDERATED
DEFAULT CHARSET=utf8mb4
CONNECTION='mysql://172.17.0.1:3306/ecommerce_seguro/audit_logs';

-- Tabla federada: audit_seguridad (eventos sensibles)
CREATE TABLE audit_seguridad (
    id BIGINT NOT NULL,
    tipo_evento ENUM('login', 'logout', 'cambio_password', 'cambio_rol', 'cambio_permisos', 'login_fallido') NOT NULL,
    usuario_id INT,
    usuario_email VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    resultado ENUM('exitoso', 'fallido') NOT NULL,
    detalles JSON,
    created_at TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=FEDERATED
DEFAULT CHARSET=utf8mb4
CONNECTION='mysql://172.17.0.1:3306/ecommerce_seguro/audit_seguridad';

-- Tabla federada: vista_audit_logs (vista resumida)
CREATE TABLE vista_audit_logs (
    id BIGINT NOT NULL,
    tabla_afectada VARCHAR(100) NOT NULL,
    operacion VARCHAR(20) NOT NULL,
    usuario_real_id INT NOT NULL,
    usuario_nombre VARCHAR(150),
    ip_address VARCHAR(45),
    datos_antes JSON,
    datos_despues JSON,
    fecha TIMESTAMP
) ENGINE=FEDERATED
DEFAULT CHARSET=utf8mb4
CONNECTION='mysql://172.17.0.1:3306/ecommerce_seguro/vista_audit_logs';

-- Tabla federada: usuarios (solo campos necesarios)
CREATE TABLE usuarios (
    id INT NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN,
    created_at TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=FEDERATED
DEFAULT CHARSET=utf8mb4
CONNECTION='mysql://172.17.0.1:3306/ecommerce_seguro/usuarios';

-- Tabla federada: estadísticas de ventas
CREATE TABLE ventas (
    id INT NOT NULL,
    cliente_id INT NOT NULL,
    fecha TIMESTAMP,
    total DECIMAL(10,2),
    estado VARCHAR(20),
    PRIMARY KEY (id)
) ENGINE=FEDERATED
DEFAULT CHARSET=utf8mb4
CONNECTION='mysql://172.17.0.1:3306/ecommerce_seguro/ventas';

-- Tabla federada: productos
CREATE TABLE productos (
    id INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    precio DECIMAL(10,2),
    stock INT,
    activo BOOLEAN,
    vendedor_id INT,
    sucursal_id INT,
    PRIMARY KEY (id)
) ENGINE=FEDERATED
DEFAULT CHARSET=utf8mb4
CONNECTION='mysql://172.17.0.1:3306/ecommerce_seguro/productos';

-- Tabla federada: sucursales
CREATE TABLE sucursales (
    id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100),
    activa BOOLEAN,
    PRIMARY KEY (id)
) ENGINE=FEDERATED
DEFAULT CHARSET=utf8mb4
CONNECTION='mysql://172.17.0.1:3306/ecommerce_seguro/sucursales';


-- Vista 1: Resumen de actividades sospechosas
CREATE VIEW vista_actividades_sospechosas AS
SELECT 
    als.id,
    als.tipo_evento,
    als.usuario_email,
    als.ip_address,
    als.resultado,
    als.detalles,
    als.created_at,
    al.tabla_afectada,
    al.operacion
FROM audit_seguridad als
LEFT JOIN audit_logs al ON als.usuario_id = al.usuario_real_id
WHERE als.resultado = 'fallido'
   OR al.operacion = 'DELETE'
ORDER BY als.created_at DESC
LIMIT 100;

-- Vista 2: Reporte de cambios de contraseña
CREATE VIEW vista_cambios_password AS
SELECT 
    id,
    tipo_evento,
    usuario_email,
    ip_address,
    detalles,
    created_at
FROM audit_seguridad
WHERE tipo_evento = 'cambio_password'
  AND resultado = 'exitoso'
ORDER BY created_at DESC
LIMIT 50;

-- Vista 3: Estadísticas diarias de actividad
CREATE VIEW vista_estadisticas_diarias AS
SELECT 
    DATE(fecha) as dia,
    COUNT(*) as total_eventos,
    SUM(CASE WHEN operacion = 'INSERT' THEN 1 ELSE 0 END) as inserciones,
    SUM(CASE WHEN operacion = 'UPDATE' THEN 1 ELSE 0 END) as actualizaciones,
    SUM(CASE WHEN operacion = 'DELETE' THEN 1 ELSE 0 END) as eliminaciones
FROM audit_logs
WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(fecha)
ORDER BY dia DESC;

-- Vista 4: Usuarios más activos
CREATE VIEW vista_usuarios_activos AS
SELECT 
    u.id,
    u.nombre_completo,
    u.email,
    u.rol,
    COUNT(al.id) as eventos_realizados
FROM usuarios u
LEFT JOIN audit_logs al ON u.id = al.usuario_real_id
WHERE al.fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY u.id, u.nombre_completo, u.email, u.rol
ORDER BY eventos_realizados DESC
LIMIT 20;


-- Desde la base de datos del auditor, probar la conexión

-- 1. Probar conexión básica
SELECT 1 as test_connection;

-- 2. Verificar que las tablas federadas existen
SHOW TABLES;

-- 3. Probar consulta a audit_logs
SELECT COUNT(*) as total_logs FROM audit_logs;

-- 4. Ver eventos de seguridad recientes
SELECT * FROM audit_seguridad 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY created_at DESC
LIMIT 10;

-- 5. Ver actividades sospechosas
SELECT * FROM vista_actividades_sospechosas;

-- 6. Ver cambios de contraseña recientes
SELECT * FROM vista_cambios_password;

-- 7. Ver estadísticas diarias
SELECT * FROM vista_estadisticas_diarias;

-- 8. Ver usuarios más activos
SELECT * FROM vista_usuarios_activos;

