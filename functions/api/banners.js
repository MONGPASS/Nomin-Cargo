function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}

async function ensureSchema(env) {
    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS banners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            subtitle TEXT,
            type TEXT,
            imageUrl TEXT NOT NULL,
            linkUrl TEXT,
            buttonText TEXT DEFAULT 'Дэлгэрэнгүй',
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    const columns = await env.DB.prepare('PRAGMA table_info(banners)').all();
    if (!columns.results.some(column => column.name === 'buttonText')) {
        await env.DB.prepare("ALTER TABLE banners ADD COLUMN buttonText TEXT DEFAULT 'Дэлгэрэнгүй'").run();
    }
}

async function isAdmin(request, env) {
    const authorization = request.headers.get('Authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const [issuedAt, signatureText] = token.split('.');
    if (!issuedAt || !signatureText || Date.now() - Number(issuedAt) > 12 * 60 * 60 * 1000 || !env.ADMIN_PASSWORD) return false;
    try {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ADMIN_PASSWORD), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const padded = signatureText.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - signatureText.length % 4) % 4);
        const signature = Uint8Array.from(atob(padded), char => char.charCodeAt(0));
        return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(issuedAt));
    } catch {
        return false;
    }
}

export async function onRequest({ request, env }) {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));

    try {
        await ensureSchema(env);

        if (request.method === 'GET') {
            const { results } = await env.DB.prepare('SELECT * FROM banners ORDER BY created_at DESC').all();
            return json(results);
        }

        if (!await isAdmin(request, env)) return json({ error: 'Админ эрх шаардлагатай.' }, 401);

        if (request.method === 'POST') {
            const body = await request.json();
            const active = body.active === false || body.active === 0 ? 0 : 1;
            if (body.type === 'popup' && active) {
                await env.DB.prepare("UPDATE banners SET active = 0 WHERE type = 'popup'").run();
            }
            const result = await env.DB.prepare(`
                INSERT INTO banners (title, subtitle, type, imageUrl, linkUrl, buttonText, active)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                body.title || '', body.subtitle || '', body.type || 'custom',
                body.imageUrl || '', body.linkUrl || '', body.buttonText || 'Дэлгэрэнгүй', active
            ).run();
            return json({ success: true, id: result.meta.last_row_id }, 201);
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            if (!body.id) return json({ error: 'Missing id' }, 400);
            const active = body.active === false || body.active === 0 ? 0 : 1;
            if (body.type === 'popup' && active) {
                await env.DB.prepare("UPDATE banners SET active = 0 WHERE type = 'popup' AND id != ?").bind(body.id).run();
            }
            await env.DB.prepare(`
                UPDATE banners SET title = ?, subtitle = ?, type = ?, imageUrl = ?,
                linkUrl = ?, buttonText = ?, active = ? WHERE id = ?
            `).bind(
                body.title || '', body.subtitle || '', body.type || 'custom',
                body.imageUrl || '', body.linkUrl || '', body.buttonText || 'Дэлгэрэнгүй', active, body.id
            ).run();
            return json({ success: true });
        }

        if (request.method === 'DELETE') {
            if (!id) return json({ error: 'Missing id' }, 400);
            await env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(id).run();
            return json({ success: true });
        }

        return json({ error: 'Method not allowed' }, 405);
    } catch (error) {
        return json({ error: error.message }, 500);
    }
}
