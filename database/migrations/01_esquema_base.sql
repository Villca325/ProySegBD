 -- =============================================
-- 1. TABLAS PRINCIPALES
-- =============================================

-- Usuarios (hereda de Laravel's default users)
ALTER TABLE users ADD COLUMN role ENUM('admin', 'provider', 'customer') DEFAULT 'customer';
ALTER TABLE users ADD COLUMN provider_id INT NULL;
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN photo VARCHAR(255);
ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_code VARCHAR(6);
ALTER TABLE users ADD COLUMN two_factor_expires_at TIMESTAMP;

-- Tabla de proveedores
CREATE TABLE providers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    business_name VARCHAR(255),
    nit VARCHAR(50),
    business_address TEXT,
    ci VARCHAR(20),
    ci_front_photo VARCHAR(255),
    ci_back_photo VARCHAR(255),
    nit_photo VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Productos
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    stock INT,
    category ENUM('technology', 'clothing', 'appliances', 'boardgames', 'toys'),
    brand VARCHAR(100),
    specifications JSON,
    images JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    INDEX idx_provider_category (provider_id, category)
);

-- Órdenes
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    order_code VARCHAR(50) UNIQUE,
    total DECIMAL(10,2),
    status ENUM('processing', 'ready_for_pickup', 'invoiced', 'cancelled') DEFAULT 'processing',
    shipping_address TEXT,
    payment_method ENUM('qr', 'debit_card', 'bank_transfer'),
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_created_at (created_at)
);

-- Detalles de orden
CREATE TABLE order_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Carrito de compras
CREATE TABLE carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT,
    product_id INT,
    quantity INT,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY uk_cart_product (cart_id, product_id)
);

-- =============================================
-- 2. TABLA DE AUDITORÍA
-- =============================================
CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(100),
    operation ENUM('INSERT', 'UPDATE', 'DELETE'),
    record_id INT,
    user_id INT,
    real_user_email VARCHAR(255),
    changed_data JSON,
    operation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user_time (user_id, operation_timestamp),
    INDEX idx_timestamp (operation_timestamp)
);
