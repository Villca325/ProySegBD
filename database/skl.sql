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

INSERT INTO sucursales (nombre, ciudad, direccion, telefono) VALUES
('Sucursal Centro', 'La Paz', 'Av. 16 de Julio #123', '2-123456'),
('Sucursal Sur', 'La Paz', 'Calle 21 #456', '2-789012'),
('Sucursal Norte', 'El Alto', 'Av. Juan Pablo II #789', '2-345678');

-- Password: 'password123' en bcrypt
INSERT INTO usuarios (nombre_completo, email, password, rol, sucursal_id, activo) VALUES
('Carlos Cliente', 'cliente1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Maria Cliente', 'cliente2@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', NULL, TRUE),
('Pedro Vendedor', 'vendedor1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 1, TRUE),
('Ana Vendedora', 'vendedor2@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 2, TRUE),
('Luis Gerente', 'gerente1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gerente', 1, TRUE),
('Sofia Auditora', 'auditor1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'auditor', NULL, TRUE),
('Admin Global', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NULL, TRUE);

INSERT INTO categorias (nombre, descripcion) VALUES
('Electrónicos', 'Productos electrónicos y gadgets'),
('Ropa', 'Prendas de vestir'),
('Hogar', 'Artículos para el hogar'),
('Deportes', 'Equipo deportivo');

INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, vendedor_id, sucursal_id, activo) VALUES
('Laptop HP', 'Laptop HP 15.6 pulgadas, 8GB RAM', 4500.00, 10, 1, 3, 1, TRUE),
('Mouse Inalámbrico', 'Mouse Logitech Bluetooth', 150.00, 50, 1, 3, 1, TRUE),
('Teclado Mecánico', 'Teclado RGB mecánico', 350.00, 30, 1, 3, 1, TRUE),
('Camiseta Deportiva', 'Camiseta de algodón', 80.00, 100, 2, 4, 2, TRUE),
('Pantalón Jean', 'Jean azul tallas 30-36', 200.00, 60, 2, 4, 2, TRUE),
('Zapatillas Running', 'Zapatillas Nike Air', 550.00, 25, 4, 4, 2, TRUE);

INSERT INTO ventas (cliente_id, total, estado) VALUES
(1, 4650.00, 'entregado'),
(2, 630.00, 'enviado');

INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 4500.00, 4500.00),
(1, 2, 1, 150.00, 150.00),
(2, 6, 1, 550.00, 550.00),
(2, 4, 1, 80.00, 80.00);

-- =====================================================
-- 9. VERIFICACIÓN DE DATOS (pruebas)
-- =====================================================

-- SET @app_user_id = 3, @app_user_role = 'vendedor', @app_user_sucursal_id = 1;
-- SELECT * FROM vista_productos;

-- SET @app_user_id = 4, @app_user_role = 'vendedor', @app_user_sucursal_id = 2;
-- SELECT * FROM vista_productos;

-- SET @app_user_id = 1, @app_user_role = 'cliente';
-- SELECT * FROM vista_productos;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================