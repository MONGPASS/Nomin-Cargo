export async function onRequest(context) {
  // DB binding is available at context.env.DB
  
  const schema = `
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS containers;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS banners;
    DROP TABLE IF EXISTS branches;
    DROP TABLE IF EXISTS users;

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
        container_id TEXT,
        
        sender_name TEXT,
        sender_phone TEXT,
        sender_address TEXT,
        
        receiver_name TEXT,
        receiver_phone TEXT,
        receiver_address TEXT,
        
        item_category TEXT,
        item_quantity TEXT
    );

    CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
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
  `;

  try {
    const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    const batch = statements.map(s => context.env.DB.prepare(s));
    
    await context.env.DB.batch(batch);
    
    return new Response(JSON.stringify({ success: true, message: "Database tables initialized successfully" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
