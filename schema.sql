DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS containers;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS pre_alert_configs;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS branches;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE containers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    order_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    branch TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    container_id TEXT REFERENCES containers(id),
    
    sender_name TEXT,
    sender_phone TEXT,
    sender_address TEXT,
    
    receiver_name TEXT,
    receiver_phone TEXT,
    receiver_address TEXT,
    
    item_category TEXT,
    item_quantity TEXT,
    images TEXT
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pre_alert_configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE tracking_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    images TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(order_id)
);

CREATE TABLE branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    standard_price INTEGER NOT NULL DEFAULT 0,
    express_price INTEGER NOT NULL DEFAULT 0,
    service_area TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    subtitle TEXT,
    type TEXT,
    imageUrl TEXT NOT NULL,
    linkUrl TEXT,
    buttonText TEXT DEFAULT 'Дэлгэрэнгүй',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
