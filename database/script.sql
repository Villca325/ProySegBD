-- =====================================================
-- PROYECTO APLICADO DE SEGURIDAD EN BASES DE DATOS
-- ECOMMERCE CON CONTROL DE ACCESO GRANULAR (FGAC/RLS)
-- BASE DE DATOS: MySQL / MariaDB
-- VERSIÓN CORREGIDA - CON FUNCIONES PARA VISTAS
-- =====================================================

-- =====================================================
-- 1. CREACIÓN DE LA BASE DE DATOS
-- =====================================================

DROP DATABASE IF EXISTS ecommerce_seguro;
CREATE DATABASE ecommerce_seguro;
USE ecommerce_seguro;

-- =====================================================
-- 2. TABLAS PRINCIPALES
-- =====================================================

-- Tabla de sucursales (para aislamiento horizontal)
CREATE TABLE sucursales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios (clientes, vendedores, gerentes, auditores, admins)
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'vendedor', 'gerente', 'auditor', 'admin') NOT NULL,
    sucursal_id INT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL
);

-- Tabla de categorías de productos
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- Tabla de productos
CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    categoria_id INT,
    vendedor_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
);

-- Tabla de ventas
CREATE TABLE ventas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL,
    estado ENUM('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
);

-- Tabla de detalles de venta
CREATE TABLE ventas_detalle (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de solicitudes de vendedores
CREATE TABLE solicitudes_vendedores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    sucursal_sugerida_id INT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    tipo_sucursal ENUM('nueva', 'existente') NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP NULL,
    admin_id INT NULL,
    comentarios TEXT,
    FOREIGN KEY (sucursal_sugerida_id) REFERENCES sucursales(id),
    FOREIGN KEY (admin_id) REFERENCES usuarios(id)
);

-- =====================================================
-- 3. TABLA DE AUDITORÍA
-- =====================================================

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tabla_afectada VARCHAR(100) NOT NULL,
    operacion VARCHAR(20) NOT NULL,
    usuario_real_id INT NOT NULL,
    usuario_tecnico VARCHAR(100),
    ip_address VARCHAR(45),
    datos_antes JSON,
    datos_despues JSON,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario_real (usuario_real_id),
    INDEX idx_tabla_operacion (tabla_afectada, operacion),
    INDEX idx_fecha (fecha)
);

-- =====================================================
-- 4. VARIABLES DE SESIÓN Y FUNCIONES PARA VISTAS
-- =====================================================

-- Las variables se inyectan desde Laravel al iniciar sesión
-- SET @app_user_id = ?;
-- SET @app_user_role = ?;
-- SET @app_user_sucursal_id = ?;

-- Función para obtener el ID del usuario autenticado
CREATE FUNCTION get_app_user_id()
RETURNS INT
DETERMINISTIC
RETURN @app_user_id;

-- Función para obtener el rol del usuario autenticado
CREATE FUNCTION get_app_user_role()
RETURNS VARCHAR(20)
DETERMINISTIC
RETURN @app_user_role;

-- Función para obtener la sucursal del usuario autenticado
CREATE FUNCTION get_app_user_sucursal_id()
RETURNS INT
DETERMINISTIC
RETURN @app_user_sucursal_id;

-- =====================================================
-- 5. VISTAS PARA FILTRADO HORIZONTAL (FGAC/RLS)
-- =====================================================

-- Vista de productos con filtrado por rol usando funciones
CREATE VIEW vista_productos AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.stock,
    p.categoria_id,
    c.nombre AS categoria_nombre,
    p.vendedor_id,
    u.nombre_completo AS vendedor_nombre,
    p.sucursal_id,
    s.nombre AS sucursal_nombre,
    s.ciudad AS sucursal_ciudad,
    p.activo,
    p.created_at,
    p.updated_at
FROM productos p
INNER JOIN sucursales s ON p.sucursal_id = s.id
INNER JOIN usuarios u ON p.vendedor_id = u.id
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE 
    (get_app_user_role() = 'cliente' AND p.activo = TRUE)
    OR
    (get_app_user_role() = 'vendedor' AND p.vendedor_id = get_app_user_id())
    OR
    (get_app_user_role() = 'gerente' AND p.sucursal_id = get_app_user_sucursal_id())
    OR
    (get_app_user_role() = 'admin')
    OR
    (get_app_user_role() = 'auditor');

-- Vista de ventas para clientes (solo sus propias compras)
CREATE VIEW vista_mis_compras AS
SELECT 
    v.id,
    v.fecha,
    v.total,
    v.estado,
    vd.producto_id,
    p.nombre AS producto_nombre,
    vd.cantidad,
    vd.precio_unitario,
    vd.subtotal
FROM ventas v
INNER JOIN ventas_detalle vd ON v.id = vd.venta_id
INNER JOIN productos p ON vd.producto_id = p.id
WHERE v.cliente_id = get_app_user_id()
  AND get_app_user_role() = 'cliente';

-- Vista de ventas para vendedores (ventas de sus productos)
CREATE VIEW vista_mis_ventas AS
SELECT 
    v.id AS venta_id,
    v.fecha,
    v.total AS venta_total,
    v.estado,
    v.cliente_id,
    c.nombre_completo AS cliente_nombre,
    vd.producto_id,
    p.nombre AS producto_nombre,
    vd.cantidad,
    vd.precio_unitario,
    vd.subtotal,
    p.sucursal_id
FROM ventas v
INNER JOIN ventas_detalle vd ON v.id = vd.venta_id
INNER JOIN productos p ON vd.producto_id = p.id
INNER JOIN usuarios c ON v.cliente_id = c.id
WHERE p.vendedor_id = get_app_user_id()
  AND get_app_user_role() = 'vendedor';

-- Vista de ventas para gerentes (ventas de productos de su sucursal)
CREATE VIEW vista_ventas_sucursal AS
SELECT 
    v.id AS venta_id,
    v.fecha,
    v.total AS venta_total,
    v.estado,
    v.cliente_id,
    c.nombre_completo AS cliente_nombre,
    vd.producto_id,
    p.nombre AS producto_nombre,
    vd.cantidad,
    vd.precio_unitario,
    vd.subtotal,
    p.sucursal_id,
    s.nombre AS sucursal_nombre,
    p.vendedor_id,
    vend.nombre_completo AS vendedor_nombre
FROM ventas v
INNER JOIN ventas_detalle vd ON v.id = vd.venta_id
INNER JOIN productos p ON vd.producto_id = p.id
INNER JOIN usuarios c ON v.cliente_id = c.id
INNER JOIN sucursales s ON p.sucursal_id = s.id
INNER JOIN usuarios vend ON p.vendedor_id = vend.id
WHERE p.sucursal_id = get_app_user_sucursal_id()
  AND get_app_user_role() = 'gerente';

-- Vista para auditoría
CREATE VIEW vista_audit_logs AS
SELECT 
    al.id,
    al.tabla_afectada,
    al.operacion,
    al.usuario_real_id,
    u.nombre_completo AS usuario_nombre,
    al.ip_address,
    al.datos_antes,
    al.datos_despues,
    al.fecha
FROM audit_logs al
INNER JOIN usuarios u ON al.usuario_real_id = u.id
WHERE get_app_user_role() = 'auditor' OR get_app_user_role() = 'admin';

-- =====================================================
-- VISTA PARA SOLICITUDES DE VENDEDORES CON FGAC/RLS
-- Solo Admin y Gerente pueden ver las solicitudes
-- =====================================================

-- Eliminar vista si existe
DROP VIEW IF EXISTS vista_solicitudes_vendedores;

-- Crear vista con filtrado por rol
CREATE VIEW vista_solicitudes_vendedores AS
SELECT 
    sv.id,
    sv.nombre_completo,
    sv.email,
    sv.tipo_sucursal,
    sv.estado,
    sv.sucursal_sugerida_id,
    s.nombre AS sucursal_nombre,
    s.ciudad AS sucursal_ciudad,
    s.direccion AS sucursal_direccion,
    s.telefono AS sucursal_telefono,
    s.activa AS sucursal_activa,
    sv.fecha_solicitud,
    sv.fecha_resolucion,
    sv.admin_id,
    u.nombre_completo AS admin_nombre,
    sv.comentarios,
    -- Tiempo transcurrido desde la solicitud
    DATEDIFF(NOW(), sv.fecha_solicitud) AS dias_pendiente,
    -- Indicador si es nueva o existente
    CASE 
        WHEN sv.tipo_sucursal = 'nueva' THEN 'Creará nueva sucursal'
        WHEN sv.tipo_sucursal = 'existente' THEN 'Se unirá a sucursal existente'
        ELSE 'No especificado'
    END AS tipo_sucursal_descripcion,
    -- Estado en español
    CASE 
        WHEN sv.estado = 'pendiente' THEN 'Pendiente de revisión'
        WHEN sv.estado = 'aprobada' THEN 'Aprobada'
        WHEN sv.estado = 'rechazada' THEN 'Rechazada'
        ELSE 'Desconocido'
    END AS estado_descripcion,
    -- Información de la sucursal a crear (si es nueva, mostrar datos de la sucursal creada)
    CASE 
        WHEN sv.tipo_sucursal = 'nueva' THEN s.nombre
        ELSE NULL
    END AS nueva_sucursal_nombre,
    CASE 
        WHEN sv.tipo_sucursal = 'nueva' THEN s.ciudad
        ELSE NULL
    END AS nueva_sucursal_ciudad
FROM solicitudes_vendedores sv
LEFT JOIN sucursales s ON sv.sucursal_sugerida_id = s.id
LEFT JOIN usuarios u ON sv.admin_id = u.id
WHERE 
    -- Solo admin y gerente pueden ver las solicitudes
    (get_app_user_role() = 'admin' OR get_app_user_role() = 'gerente')
    -- Si es gerente, solo ve solicitudes de su sucursal
    AND (get_app_user_role() = 'admin' OR 
         (get_app_user_role() = 'gerente' AND 
          (s.id = get_app_user_sucursal_id() OR sv.sucursal_sugerida_id = get_app_user_sucursal_id())));

-- =====================================================
-- VISTA PARA SOLICITUDES PENDIENTES (solo admin)
-- =====================================================

DROP VIEW IF EXISTS vista_solicitudes_pendientes;

CREATE VIEW vista_solicitudes_pendientes AS
SELECT 
    sv.id,
    sv.nombre_completo,
    sv.email,
    sv.tipo_sucursal,
    sv.sucursal_sugerida_id,
    s.nombre AS sucursal_nombre,
    s.ciudad AS sucursal_ciudad,
    sv.fecha_solicitud,
    DATEDIFF(NOW(), sv.fecha_solicitud) AS dias_pendiente,
    CASE 
        WHEN sv.tipo_sucursal = 'nueva' THEN 'Nueva sucursal: ' || COALESCE(s.nombre, 'Pendiente de creación')
        ELSE 'Sucursal existente: ' || COALESCE(s.nombre, 'No especificada')
    END AS sucursal_destino
FROM solicitudes_vendedores sv
LEFT JOIN sucursales s ON sv.sucursal_sugerida_id = s.id
WHERE sv.estado = 'pendiente'
  AND (get_app_user_role() = 'admin' OR 
       (get_app_user_role() = 'gerente' AND 
        (s.id = get_app_user_sucursal_id() OR sv.sucursal_sugerida_id = get_app_user_sucursal_id())))
ORDER BY sv.fecha_solicitud ASC;

-- =====================================================
-- VISTA PARA EL PROPIO VENDEDOR VER SU SOLICITUD
-- =====================================================

DROP VIEW IF EXISTS vista_mi_solicitud;

CREATE VIEW vista_mi_solicitud AS
SELECT 
    sv.id,
    sv.nombre_completo,
    sv.email,
    sv.tipo_sucursal,
    sv.estado,
    CASE 
        WHEN sv.estado = 'pendiente' THEN 'Pendiente de revisión'
        WHEN sv.estado = 'aprobada' THEN 'Aprobada'
        WHEN sv.estado = 'rechazada' THEN 'Rechazada'
    END AS estado_descripcion,
    sv.sucursal_sugerida_id,
    s.nombre AS sucursal_nombre,
    s.ciudad AS sucursal_ciudad,
    sv.fecha_solicitud,
    sv.fecha_resolucion,
    sv.comentarios,
    CASE 
        WHEN sv.estado = 'pendiente' THEN 'Tu solicitud está siendo revisada por un administrador'
        WHEN sv.estado = 'aprobada' THEN '¡Felicidades! Tu solicitud fue aprobada. Ya puedes iniciar sesión como vendedor.'
        WHEN sv.estado = 'rechazada' THEN CONCAT('Tu solicitud fue rechazada. Motivo: ', COALESCE(sv.comentarios, 'No especificado'))
        ELSE 'Estado desconocido'
    END AS mensaje_estado
FROM solicitudes_vendedores sv
LEFT JOIN sucursales s ON sv.sucursal_sugerida_id = s.id
WHERE sv.email = (SELECT email FROM usuarios WHERE id = get_app_user_id());

-- =====================================================
-- 6. PROCEDIMIENTOS ALMACENADOS
-- =====================================================

DELIMITER //

-- Procedimiento: Insertar producto
CREATE PROCEDURE sp_insertar_producto(
    IN p_nombre VARCHAR(200),
    IN p_descripcion TEXT,
    IN p_precio DECIMAL(10,2),
    IN p_stock INT,
    IN p_categoria_id INT
)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_usuario_rol VARCHAR(20);
    DECLARE v_sucursal_id INT;
    
    SET v_usuario_id = get_app_user_id();
    SET v_usuario_rol = get_app_user_role();
    SET v_sucursal_id = get_app_user_sucursal_id();
    
    IF v_usuario_rol != 'vendedor' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: solo vendedores pueden agregar productos';
    END IF;
    
    IF v_sucursal_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: el vendedor no tiene una sucursal asignada';
    END IF;
    
    INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, vendedor_id, sucursal_id, activo)
    VALUES (p_nombre, p_descripcion, p_precio, p_stock, p_categoria_id, v_usuario_id, v_sucursal_id, TRUE);
    
    SELECT LAST_INSERT_ID() AS producto_id;
END //

-- Procedimiento: Actualizar producto
CREATE PROCEDURE sp_actualizar_producto(
    IN p_producto_id INT,
    IN p_nombre VARCHAR(200),
    IN p_descripcion TEXT,
    IN p_precio DECIMAL(10,2),
    IN p_stock INT,
    IN p_categoria_id INT,
    IN p_activo BOOLEAN
)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_usuario_rol VARCHAR(20);
    DECLARE v_propietario_id INT;
    
    SET v_usuario_id = get_app_user_id();
    SET v_usuario_rol = get_app_user_role();
    
    SELECT vendedor_id INTO v_propietario_id FROM productos WHERE id = p_producto_id;
    
    IF v_usuario_rol = 'vendedor' AND v_propietario_id != v_usuario_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: solo puedes modificar tus propios productos';
    ELSEIF v_usuario_rol NOT IN ('vendedor', 'admin') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: no tienes permiso para modificar productos';
    END IF;
    
    UPDATE productos 
    SET nombre = p_nombre,
        descripcion = p_descripcion,
        precio = p_precio,
        stock = p_stock,
        categoria_id = p_categoria_id,
        activo = p_activo,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_producto_id;
    
    SELECT ROW_COUNT() AS filas_afectadas;
END //

-- Procedimiento: Realizar compra
CREATE PROCEDURE sp_realizar_compra(
    IN p_producto_id INT,
    IN p_cantidad INT
)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_usuario_rol VARCHAR(20);
    DECLARE v_precio DECIMAL(10,2);
    DECLARE v_stock_actual INT;
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_venta_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    SET v_usuario_id = get_app_user_id();
    SET v_usuario_rol = get_app_user_role();
    
    IF v_usuario_rol != 'cliente' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: solo clientes pueden realizar compras';
    END IF;
    
    SELECT precio, stock INTO v_precio, v_stock_actual 
    FROM productos WHERE id = p_producto_id AND activo = TRUE;
    
    IF v_stock_actual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Producto no disponible';
    END IF;
    
    IF v_stock_actual < p_cantidad THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente';
    END IF;
    
    SET v_subtotal = v_precio * p_cantidad;
    
    START TRANSACTION;
    
    INSERT INTO ventas (cliente_id, total, estado) 
    VALUES (v_usuario_id, v_subtotal, 'pendiente');
    
    SET v_venta_id = LAST_INSERT_ID();
    
    INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    VALUES (v_venta_id, p_producto_id, p_cantidad, v_precio, v_subtotal);
    
    UPDATE productos SET stock = stock - p_cantidad WHERE id = p_producto_id;
    
    COMMIT;
    
    SELECT v_venta_id AS venta_id, v_subtotal AS total;
END //

-- Procedimiento: Cambiar estado de venta
CREATE PROCEDURE sp_actualizar_estado_venta(
    IN p_venta_id INT,
    IN p_nuevo_estado VARCHAR(20)
)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_usuario_rol VARCHAR(20);
    DECLARE v_sucursal_id INT;
    DECLARE v_venta_sucursal_id INT;
    
    SET v_usuario_id = get_app_user_id();
    SET v_usuario_rol = get_app_user_role();
    SET v_sucursal_id = get_app_user_sucursal_id();
    
    IF v_usuario_rol = 'vendedor' THEN
        SELECT DISTINCT p.sucursal_id INTO v_venta_sucursal_id
        FROM ventas_detalle vd
        INNER JOIN productos p ON vd.producto_id = p.id
        WHERE vd.venta_id = p_venta_id AND p.vendedor_id = v_usuario_id;
        
        IF v_venta_sucursal_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: no puedes modificar esta venta';
        END IF;
    ELSEIF v_usuario_rol = 'gerente' THEN
        SELECT DISTINCT p.sucursal_id INTO v_venta_sucursal_id
        FROM ventas_detalle vd
        INNER JOIN productos p ON vd.producto_id = p.id
        WHERE vd.venta_id = p_venta_id;
        
        IF v_venta_sucursal_id != v_sucursal_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: la venta no pertenece a tu sucursal';
        END IF;
    ELSEIF v_usuario_rol NOT IN ('admin', 'gerente', 'vendedor') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: no tienes permiso para modificar ventas';
    END IF;
    
    UPDATE ventas SET estado = p_nuevo_estado WHERE id = p_venta_id;
    
    SELECT ROW_COUNT() AS filas_afectadas;
END //

-- Procedimiento: Eliminar producto (soft delete)
CREATE PROCEDURE sp_eliminar_producto(
    IN p_producto_id INT
)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_usuario_rol VARCHAR(20);
    DECLARE v_propietario_id INT;
    
    SET v_usuario_id = get_app_user_id();
    SET v_usuario_rol = get_app_user_role();
    
    SELECT vendedor_id INTO v_propietario_id FROM productos WHERE id = p_producto_id;
    
    IF v_usuario_rol = 'vendedor' AND v_propietario_id != v_usuario_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: solo puedes eliminar tus propios productos';
    ELSEIF v_usuario_rol NOT IN ('vendedor', 'admin') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado';
    END IF;
    
    UPDATE productos SET activo = FALSE WHERE id = p_producto_id;
    
    SELECT ROW_COUNT() AS filas_afectadas;
END //

DELIMITER ;

-- =====================================================
-- 7. TRIGGERS DE AUDITORÍA
-- =====================================================

DELIMITER //

CREATE TRIGGER trg_audit_productos_insert
AFTER INSERT ON productos
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, datos_despues)
    VALUES (
        'productos',
        'INSERT',
        COALESCE(get_app_user_id(), 0),
        CURRENT_USER(),
        JSON_OBJECT(
            'id', NEW.id,
            'nombre', NEW.nombre,
            'precio', NEW.precio,
            'stock', NEW.stock,
            'vendedor_id', NEW.vendedor_id,
            'sucursal_id', NEW.sucursal_id
        )
    );
END //

CREATE TRIGGER trg_audit_productos_update
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, datos_antes, datos_despues)
    VALUES (
        'productos',
        'UPDATE',
        COALESCE(get_app_user_id(), 0),
        CURRENT_USER(),
        JSON_OBJECT(
            'id', OLD.id,
            'nombre', OLD.nombre,
            'precio', OLD.precio,
            'stock', OLD.stock,
            'activo', OLD.activo
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'nombre', NEW.nombre,
            'precio', NEW.precio,
            'stock', NEW.stock,
            'activo', NEW.activo
        )
    );
END //

CREATE TRIGGER trg_audit_productos_delete
AFTER DELETE ON productos
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, datos_antes)
    VALUES (
        'productos',
        'DELETE',
        COALESCE(get_app_user_id(), 0),
        CURRENT_USER(),
        JSON_OBJECT(
            'id', OLD.id,
            'nombre', OLD.nombre,
            'precio', OLD.precio,
            'vendedor_id', OLD.vendedor_id
        )
    );
END //

CREATE TRIGGER trg_audit_ventas_insert
AFTER INSERT ON ventas
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, datos_despues)
    VALUES (
        'ventas',
        'INSERT',
        COALESCE(get_app_user_id(), 0),
        CURRENT_USER(),
        JSON_OBJECT(
            'id', NEW.id,
            'cliente_id', NEW.cliente_id,
            'total', NEW.total,
            'estado', NEW.estado
        )
    );
END //

CREATE TRIGGER trg_audit_ventas_update
AFTER UPDATE ON ventas
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, datos_antes, datos_despues)
    VALUES (
        'ventas',
        'UPDATE',
        COALESCE(get_app_user_id(), 0),
        CURRENT_USER(),
        JSON_OBJECT('id', OLD.id, 'estado', OLD.estado),
        JSON_OBJECT('id', NEW.id, 'estado', NEW.estado)
    );
END //

CREATE TRIGGER trg_audit_usuarios_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF OLD.rol != NEW.rol OR OLD.activo != NEW.activo OR COALESCE(OLD.sucursal_id, 0) != COALESCE(NEW.sucursal_id, 0) THEN
        INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, datos_antes, datos_despues)
        VALUES (
            'usuarios',
            'UPDATE',
            COALESCE(get_app_user_id(), 0),
            CURRENT_USER(),
            JSON_OBJECT('id', OLD.id, 'rol', OLD.rol, 'activo', OLD.activo, 'sucursal_id', OLD.sucursal_id),
            JSON_OBJECT('id', NEW.id, 'rol', NEW.rol, 'activo', NEW.activo, 'sucursal_id', NEW.sucursal_id)
        );
    END IF;
END //

DELIMITER ;

-- =====================================================
-- 8. DATOS DE PRUEBA
-- =====================================================

-- Insertar  sucursales
INSERT INTO sucursales (nombre, ciudad, direccion, telefono, activa) VALUES
('Sucursal Centro', 'La Paz', 'Av. 16 de Julio #123', '2-123456', TRUE),
('Sucursal Sur', 'La Paz', 'Calle 21 #456', '2-789012', TRUE),
('Sucursal Norte', 'El Alto', 'Av. Juan Pablo II #789', '2-345678', TRUE),
('Sucursal Este', 'Santa Cruz', 'Av. San Martín #456', '3-123456', TRUE),
('Sucursal Oeste', 'Cochabamba', 'Av. América #789', '4-123456', TRUE),
('Sucursal Central', 'Sucre', 'Calle España #123', '5-123456', TRUE),
('Sucursal Norte', 'Tarija', 'Av. Las Américas #456', '6-123456', FALSE),
('Sucursal Sur', 'Potosí', 'Calle Bolívar #789', '7-123456', TRUE);

-- Insertar  clientes (todos con contraseña 'password')
INSERT INTO usuarios (nombre_completo, email, password, rol, sucursal_id, activo) VALUES
('Carlos Cliente', 'cliente1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Maria Cliente', 'cliente2@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Juan Pérez', 'juan.perez@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Ana García', 'ana.garcia@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Roberto López', 'roberto.lopez@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Laura Martínez', 'laura.martinez@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Diego Rodríguez', 'diego.rodriguez@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Fernanda Sánchez', 'fernanda.sanchez@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Pablo Fernández', 'pablo.fernandez@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Carolina Mendoza', 'carolina.mendoza@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE);


-- Insertar vendedores (todos con contraseña 'password')
INSERT INTO usuarios (nombre_completo, email, password, rol, sucursal_id, activo) VALUES
('Pedro Vendedor', 'vendedor1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 1, TRUE),
('Ana Vendedora', 'vendedor2@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 2, TRUE),
('Carlos Vendedor', 'vendedor3@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 3, TRUE),
('Marta Vendedora', 'vendedor4@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 4, TRUE),
('Javier Vendedor', 'vendedor5@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 5, TRUE),
('Elena Vendedora', 'vendedor6@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 6, TRUE),
('Ricardo Vendedor', 'vendedor7@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 7, FALSE),  -- Inactivo
('Patricia Vendedora', 'vendedor8@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 8, TRUE);


-- Insertar gerentes
INSERT INTO usuarios (nombre_completo, email, password, rol, sucursal_id, activo) VALUES
('Luis Gerente', 'gerente1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gerente', 1, TRUE),
('Andrea Gerente', 'gerente2@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gerente', 2, TRUE),
('Roberto Gerente', 'gerente3@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gerente', 3, TRUE),
('Silvia Gerente', 'gerente4@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gerente', 4, TRUE),
('Fernando Gerente', 'gerente5@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gerente', 5, TRUE);

INSERT INTO usuarios (nombre_completo, email, password, rol, sucursal_id, activo) VALUES
('Sofia Auditora', 'auditor1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'auditor', NULL, TRUE),
('Admin Global', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NULL, TRUE);

-- Insertar categorías
INSERT INTO categorias (nombre, descripcion) VALUES
('Electrónicos', 'Productos electrónicos y gadgets'),
('Ropa', 'Prendas de vestir y accesorios'),
('Hogar', 'Artículos para el hogar'),
('Deportes', 'Equipo deportivo'),
('Tecnología', 'Dispositivos tecnológicos'),
('Hogar', 'Artículos para el hogar'),
('Jardinería', 'Productos de jardinería'),
('Juguetes', 'Juguetes y entretenimiento');

-- Insertar productos
INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, vendedor_id, sucursal_id, activo) VALUES

('Laptop HP', 'Laptop HP 15.6 pulgadas, 8GB RAM, 256GB SSD', 4500.00, 10, 1, 3, 1, TRUE),
('Mouse Inalámbrico', 'Mouse Logitech Bluetooth, 3 botones', 150.00, 50, 1, 3, 1, TRUE),
('Teclado Mecánico', 'Teclado RGB mecánico con switches azules', 350.00, 30, 1, 3, 1, TRUE),
('Monitor 24"', 'Monitor LED 24 pulgadas Full HD', 1200.00, 15, 1, 3, 1, TRUE),
('Disco SSD 512GB', 'Disco sólido Kingston NVMe', 450.00, 40, 1, 3, 1, TRUE),

('Camiseta Deportiva', 'Camiseta de algodón 100%, varios colores', 80.00, 100, 2, 4, 2, TRUE),
('Pantalón Jean', 'Jean azul tallas 30-36, corte recto', 200.00, 60, 2, 4, 2, TRUE),
('Zapatillas Running', 'Zapatillas Nike Air para correr', 550.00, 25, 4, 4, 2, TRUE),
('Chaqueta Impermeable', 'Chaqueta para lluvia, varios tallas', 350.00, 30, 2, 4, 2, TRUE),
('Gorra Deportiva', 'Gorra con diseño deportivo', 45.00, 80, 2, 4, 2, TRUE),

('Smart TV 50"', 'Televisor LED 4K con Android TV', 2800.00, 8, 1, 9, 3, TRUE),
('Soundbar', 'Barra de sonido Bluetooth', 650.00, 12, 1, 9, 3, TRUE),
('Microondas', 'Horno microondas 25L', 450.00, 20, 3, 9, 3, TRUE),
('Licuadora', 'Licuadora 5 velocidades', 250.00, 35, 3, 9, 3, TRUE),
('Plancha Eléctrica', 'Plancha de vapor antiadherente', 180.00, 40, 3, 9, 3, TRUE),

('Set de Toallas', 'Set 3 toallas de algodón', 120.00, 50, 3, 10, 4, TRUE),
('Juego de Sábanas', 'Sábanas queen size', 200.00, 30, 3, 10, 4, TRUE),
('Almohadas', 'Par de almohadas hipoalergénicas', 90.00, 60, 3, 10, 4, TRUE),
('Mesa de Noche', 'Mesa de noche moderna', 350.00, 15, 3, 10, 4, TRUE),
('Lámpara LED', 'Lámpara de escritorio regulable', 85.00, 45, 3, 10, 4, TRUE),

('Bicicleta MTB', 'Bicicleta de montaña 21 cambios', 1800.00, 10, 4, 11, 5, TRUE),
('Pelota de Fútbol', 'Pelota oficial tamaño 5', 120.00, 50, 4, 11, 5, TRUE),
('Raqueta de Tenis', 'Raqueta profesional', 350.00, 20, 4, 11, 5, TRUE),
('Guantes de Boxeo', 'Guantes de entrenamiento', 200.00, 30, 4, 11, 5, TRUE),
('Mancuernas 10kg', 'Set de mancuernas 2x10kg', 280.00, 25, 4, 11, 5, TRUE),

('Cafetera', 'Cafetera eléctrica', 320.00, 20, 3, 12, 6, TRUE),
('Tetera Eléctrica', 'Tetera 1.7L', 150.00, 35, 3, 12, 6, TRUE),
('Tostadora', 'Tostadora 2 rebanadas', 180.00, 25, 3, 12, 6, TRUE),
('Procesador de Alimentos', 'Procesador 3 en 1', 450.00, 12, 3, 12, 6, TRUE),
('Batidora', 'Batidora de mano', 220.00, 30, 3, 12, 6, TRUE),

('Mochila Escolar', 'Mochila impermeable', 80.00, 100, 2, 14, 8, TRUE),
('Cuaderno', 'Cuaderno universitario 100 hojas', 15.00, 500, 2, 14, 8, TRUE),
('Lapiceros', 'Pack 12 lapiceros', 25.00, 200, 2, 14, 8, TRUE),
('Mochila de Viaje', 'Mochila 40L para viajes', 180.00, 40, 2, 14, 8, TRUE),
('Cartuchera', 'Cartuchera multicolor', 20.00, 150, 2, 14, 8, TRUE);


-- Insertar ventas
INSERT INTO ventas (cliente_id, total, estado) VALUES
(1, 4650.00, 'entregado'),
(2, 630.00, 'enviado'),
(3, 1200.00, 'entregado'),      -- Juan Pérez
(3, 350.00, 'pagado'),           -- Juan Pérez
(4, 2800.00, 'entregado'),       -- Ana García
(5, 650.00, 'enviado'),          -- Roberto López
(5, 450.00, 'pagado'),           -- Roberto López
(6, 200.00, 'entregado'),        -- Laura Martínez
(7, 1800.00, 'entregado'),       -- Diego Rodríguez
(8, 320.00, 'enviado'),          -- Fernanda Sánchez
(8, 150.00, 'pagado'),           -- Fernanda Sánchez
(9, 350.00, 'entregado'),        -- Pablo Fernández
(10, 450.00, 'cancelado'),       -- Carolina Mendoza
(10, 180.00, 'entregado');       -- Carolina Mendoza

-- Insertar detalles de ventas
INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 4500.00, 4500.00),
(1, 2, 1, 150.00, 150.00),
(2, 6, 1, 550.00, 550.00),
(2, 4, 1, 80.00, 80.00),
(3, 10, 1, 1200.00, 1200.00),
(4, 3, 1, 350.00, 350.00),
(5, 16, 1, 2800.00, 2800.00),
(6, 17, 1, 650.00, 650.00),
(7, 11, 1, 450.00, 450.00),
(8, 21, 1, 200.00, 200.00),
(9, 26, 1, 1800.00, 1800.00),
(10, 31, 1, 320.00, 320.00);


-- Inserciones de productos
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_despues, fecha) VALUES
('productos', 'INSERT', 3, 'app_ecommerce@localhost', '192.168.1.100', 
 JSON_OBJECT('id', 7, 'nombre', 'iPhone 15 Pro', 'precio', 1200.00, 'stock', 15, 'vendedor_id', 3, 'sucursal_id', 1),
 '2024-06-10 10:30:00'),
('productos', 'INSERT', 3, 'app_ecommerce@localhost', '192.168.1.100', 
 JSON_OBJECT('id', 8, 'nombre', 'Samsung Galaxy S24', 'precio', 1100.00, 'stock', 10, 'vendedor_id', 3, 'sucursal_id', 1),
 '2024-06-11 14:20:00'),
('productos', 'INSERT', 4, 'app_ecommerce@localhost', '192.168.1.101', 
 JSON_OBJECT('id', 9, 'nombre', 'MacBook Pro', 'precio', 2500.00, 'stock', 5, 'vendedor_id', 4, 'sucursal_id', 2),
 '2024-06-12 09:15:00');

-- Actualizaciones de productos
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_antes, datos_despues, fecha) VALUES
('productos', 'UPDATE', 3, 'app_ecommerce@localhost', '192.168.1.100',
 JSON_OBJECT('id', 7, 'nombre', 'iPhone 15 Pro', 'precio', 1200.00, 'stock', 15),
 JSON_OBJECT('id', 7, 'nombre', 'iPhone 15 Pro', 'precio', 1150.00, 'stock', 12),
 '2024-06-13 11:45:00'),
('productos', 'UPDATE', 4, 'app_ecommerce@localhost', '192.168.1.101',
 JSON_OBJECT('id', 9, 'nombre', 'MacBook Pro', 'precio', 2500.00, 'stock', 5),
 JSON_OBJECT('id', 9, 'nombre', 'MacBook Pro M3', 'precio', 2600.00, 'stock', 8),
 '2024-06-14 15:30:00'),
('productos', 'UPDATE', 5, 'app_ecommerce@localhost', '192.168.1.102',
 JSON_OBJECT('id', 1, 'nombre', 'Laptop HP', 'precio', 4500.00, 'stock', 10),
 JSON_OBJECT('id', 1, 'nombre', 'Laptop HP', 'precio', 4300.00, 'stock', 7),
 '2024-06-15 09:00:00');

-- Eliminaciones de productos (soft delete)
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_antes, fecha) VALUES
('productos', 'DELETE', 3, 'app_ecommerce@localhost', '192.168.1.100',
 JSON_OBJECT('id', 8, 'nombre', 'Samsung Galaxy S24', 'vendedor_id', 3),
 '2024-06-16 16:20:00'),
('productos', 'DELETE', 4, 'app_ecommerce@localhost', '192.168.1.101',
 JSON_OBJECT('id', 9, 'nombre', 'MacBook Pro M3', 'vendedor_id', 4),
 '2024-06-17 10:45:00');


-- Insertar logs para el contenido reproducible 

-- =====================================================
-- LOGS DE VENTAS
-- =====================================================

-- Inserciones de ventas
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_despues, fecha) VALUES
('ventas', 'INSERT', 1, 'app_ecommerce@localhost', '192.168.1.50',
 JSON_OBJECT('id', 3, 'cliente_id', 1, 'total', 1150.00, 'estado', 'pendiente'),
 '2024-06-10 12:00:00'),
('ventas', 'INSERT', 2, 'app_ecommerce@localhost', '192.168.1.51',
 JSON_OBJECT('id', 4, 'cliente_id', 2, 'total', 2600.00, 'estado', 'pendiente'),
 '2024-06-12 14:30:00'),
('ventas', 'INSERT', 1, 'app_ecommerce@localhost', '192.168.1.50',
 JSON_OBJECT('id', 5, 'cliente_id', 1, 'total', 550.00, 'estado', 'pendiente'),
 '2024-06-15 11:00:00');

-- Actualizaciones de ventas (cambios de estado)
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_antes, datos_despues, fecha) VALUES
('ventas', 'UPDATE', 3, 'app_ecommerce@localhost', '192.168.1.100',
 JSON_OBJECT('id', 3, 'estado', 'pendiente'),
 JSON_OBJECT('id', 3, 'estado', 'pagado'),
 '2024-06-10 12:05:00'),
('ventas', 'UPDATE', 3, 'app_ecommerce@localhost', '192.168.1.100',
 JSON_OBJECT('id', 3, 'estado', 'pagado'),
 JSON_OBJECT('id', 3, 'estado', 'enviado'),
 '2024-06-11 09:30:00'),
('ventas', 'UPDATE', 5, 'app_ecommerce@localhost', '192.168.1.102',
 JSON_OBJECT('id', 3, 'estado', 'enviado'),
 JSON_OBJECT('id', 3, 'estado', 'entregado'),
 '2024-06-12 16:00:00'),
('ventas', 'UPDATE', 4, 'app_ecommerce@localhost', '192.168.1.101',
 JSON_OBJECT('id', 4, 'estado', 'pendiente'),
 JSON_OBJECT('id', 4, 'estado', 'pagado'),
 '2024-06-13 10:00:00'),
('ventas', 'UPDATE', 4, 'app_ecommerce@localhost', '192.168.1.101',
 JSON_OBJECT('id', 4, 'estado', 'pagado'),
 JSON_OBJECT('id', 4, 'estado', 'cancelado'),
 '2024-06-14 14:00:00');

-- =====================================================
-- LOGS DE USUARIOS
-- =====================================================

-- Inserciones de usuarios
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_despues, fecha) VALUES
('usuarios', 'INSERT', 7, 'app_ecommerce@localhost', '192.168.1.200',
 JSON_OBJECT('id', 8, 'nombre', 'Nuevo Cliente', 'email', 'nuevo@cliente.com', 'rol', 'cliente'),
 '2024-06-10 08:00:00'),
('usuarios', 'INSERT', 7, 'app_ecommerce@localhost', '192.168.1.200',
 JSON_OBJECT('id', 9, 'nombre', 'Nuevo Vendedor', 'email', 'nuevo@vendedor.com', 'rol', 'vendedor'),
 '2024-06-11 09:00:00');

-- Actualizaciones de usuarios
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_antes, datos_despues, fecha) VALUES
('usuarios', 'UPDATE', 7, 'app_ecommerce@localhost', '192.168.1.200',
 JSON_OBJECT('id', 3, 'rol', 'vendedor', 'activo', true, 'sucursal_id', 1),
 JSON_OBJECT('id', 3, 'rol', 'vendedor', 'activo', false, 'sucursal_id', 1),
 '2024-06-12 10:00:00'),
('usuarios', 'UPDATE', 7, 'app_ecommerce@localhost', '192.168.1.200',
 JSON_OBJECT('id', 3, 'rol', 'vendedor', 'activo', false, 'sucursal_id', 1),
 JSON_OBJECT('id', 3, 'rol', 'vendedor', 'activo', true, 'sucursal_id', 1),
 '2024-06-13 11:30:00');

-- =====================================================
-- LOGS DE SUCURSALES
-- =====================================================

-- Inserciones de sucursales
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_despues, fecha) VALUES
('sucursales', 'INSERT', 7, 'app_ecommerce@localhost', '192.168.1.200',
 JSON_OBJECT('id', 4, 'nombre', 'Sucursal Este', 'ciudad', 'Santa Cruz', 'activa', true),
 '2024-06-14 14:00:00'),
('sucursales', 'INSERT', 7, 'app_ecommerce@localhost', '192.168.1.200',
 JSON_OBJECT('id', 5, 'nombre', 'Sucursal Oeste', 'ciudad', 'La Paz', 'activa', false),
 '2024-06-15 09:30:00');

-- Actualizaciones de sucursales
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_antes, datos_despues, fecha) VALUES
('sucursales', 'UPDATE', 7, 'app_ecommerce@localhost', '192.168.1.200',
 JSON_OBJECT('id', 4, 'nombre', 'Sucursal Este', 'ciudad', 'Santa Cruz', 'activa', true),
 JSON_OBJECT('id', 4, 'nombre', 'Sucursal Este', 'ciudad', 'Santa Cruz de la Sierra', 'activa', true),
 '2024-06-16 15:00:00'),
('sucursales', 'UPDATE', 7, 'app_ecommerce@localhost', '192.168.1.200',
 JSON_OBJECT('id', 5, 'activa', false),
 JSON_OBJECT('id', 5, 'activa', true),
 '2024-06-17 10:00:00');

-- =====================================================
-- LOGS DE SOLICITUDES DE VENDEDORES
-- =====================================================

INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_despues, fecha) VALUES
('solicitudes_vendedores', 'INSERT', 5, 'app_ecommerce@localhost', '192.168.1.102',
 JSON_OBJECT('id', 1, 'nombre_completo', 'Solicitante Test', 'email', 'test@test.com', 'estado', 'pendiente'),
 '2024-06-18 08:00:00');

-- =====================================================
-- LOGS ADICIONALES PARA DEMOSTRAR ACTIVIDAD
-- =====================================================

-- Más logs de productos recientes
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_despues, fecha) VALUES
('productos', 'INSERT', 3, 'app_ecommerce@localhost', '192.168.1.100', 
 JSON_OBJECT('id', 10, 'nombre', 'Teclado Mecánico RGB', 'precio', 180.00, 'stock', 25, 'vendedor_id', 3, 'sucursal_id', 1),
 DATE_SUB(NOW(), INTERVAL 2 DAY)),
('productos', 'INSERT', 4, 'app_ecommerce@localhost', '192.168.1.101', 
 JSON_OBJECT('id', 11, 'nombre', 'Mouse Gaming', 'precio', 85.00, 'stock', 40, 'vendedor_id', 4, 'sucursal_id', 2),
 DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Actualizaciones recientes
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_antes, datos_despues, fecha) VALUES
('productos', 'UPDATE', 3, 'app_ecommerce@localhost', '192.168.1.100',
 JSON_OBJECT('id', 10, 'precio', 180.00, 'stock', 25),
 JSON_OBJECT('id', 10, 'precio', 160.00, 'stock', 22),
 DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Ventas recientes
INSERT INTO audit_logs (tabla_afectada, operacion, usuario_real_id, usuario_tecnico, ip_address, datos_despues, fecha) VALUES
('ventas', 'INSERT', 1, 'app_ecommerce@localhost', '192.168.1.50',
 JSON_OBJECT('id', 6, 'cliente_id', 1, 'total', 160.00, 'estado', 'pendiente'),
 NOW());