const DEFAULT_BRANCHES = [
  {
    name: 'Салбар 1',
    manager_name: 'Одгэрэл / Дүгэрсүрэн',
    phone: '010-8138-4849 / 010-8460-5703',
    standard_price: 1800,
    express_price: 2500,
    service_area: 'Пусан(부산), Кимхэ(김해), Янсан(양산), Пухан(포항), Улсан(울산), Дэжон(대전), Чонан(천안), Андун(안동), Ёнжу(영주), Чанвон(창원)'
  },
  {
    name: 'Салбар 2',
    manager_name: 'Оргил / Бооб',
    phone: '010-8256-2953 / 010-8174-5995',
    standard_price: 2000,
    express_price: 3000,
    service_area: 'Мугпу(목포), Гуанжу, Сүнчон(순천), Чонжу'
  },
  {
    name: 'Салбар 3',
    manager_name: 'Пүүжээ',
    phone: '010-5850-6206',
    standard_price: 1800,
    express_price: 2500,
    service_area: 'Тэгү(대구), Күмин(구민), Ёнчан, Кёнсан'
  }
];

async function ensureTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS branches (
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
    )
  `).run();

  const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM branches').first();
  if (Number(count?.count || 0) === 0) {
    await env.DB.batch(DEFAULT_BRANCHES.map((branch, index) =>
      env.DB.prepare(`
        INSERT INTO branches
          (name, manager_name, phone, standard_price, express_price, service_area, sort_order, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(
        branch.name,
        branch.manager_name,
        branch.phone,
        branch.standard_price,
        branch.express_price,
        branch.service_area,
        index + 1
      )
    ));
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function normalize(body) {
  return {
    name: String(body.name || '').trim(),
    managerName: String(body.managerName || '').trim(),
    phone: String(body.phone || '').trim(),
    standardPrice: Math.max(0, Math.round(Number(body.standardPrice) || 0)),
    expressPrice: Math.max(0, Math.round(Number(body.expressPrice) || 0)),
    serviceArea: String(body.serviceArea || '').trim(),
    sortOrder: Math.max(0, Math.round(Number(body.sortOrder) || 0)),
    active: body.active === false || body.active === 0 ? 0 : 1
  };
}

async function isAdminRequest(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const [issuedAt, signatureText] = token.split('.');
  if (!issuedAt || !signatureText || Date.now() - Number(issuedAt) > 12 * 60 * 60 * 1000) return false;

  const secret = env.ADMIN_PASSWORD;
  if (!secret) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const padded = signatureText.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - signatureText.length % 4) % 4);
  const signature = Uint8Array.from(atob(padded), char => char.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(issuedAt));
}

export async function onRequest({ request, env }) {
  try {
    await ensureTable(env);
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const admin = url.searchParams.get('admin') === '1' && await isAdminRequest(request, env);
      const query = admin
        ? 'SELECT * FROM branches ORDER BY sort_order ASC, id ASC'
        : 'SELECT * FROM branches WHERE active = 1 ORDER BY sort_order ASC, id ASC';
      const { results } = await env.DB.prepare(query).all();
      return json(results);
    }

    if (!await isAdminRequest(request, env)) {
      return json({ error: 'Админ эрх шаардлагатай.' }, 401);
    }

    if (request.method === 'POST') {
      const branch = normalize(await request.json());
      if (!branch.name || !branch.managerName || !branch.phone) {
        return json({ error: 'Салбарын нэр, хариуцагч болон утасны дугаарыг оруулна уу.' }, 400);
      }
      const result = await env.DB.prepare(`
        INSERT INTO branches
          (name, manager_name, phone, standard_price, express_price, service_area, sort_order, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        branch.name, branch.managerName, branch.phone, branch.standardPrice,
        branch.expressPrice, branch.serviceArea, branch.sortOrder, branch.active
      ).run();
      return json({ success: true, id: result.meta.last_row_id }, 201);
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      const id = Number(body.id);
      const branch = normalize(body);
      if (!id || !branch.name || !branch.managerName || !branch.phone) {
        return json({ error: '필수 입력값 또는 지점 ID가 없습니다.' }, 400);
      }
      await env.DB.prepare(`
        UPDATE branches SET
          name = ?, manager_name = ?, phone = ?, standard_price = ?,
          express_price = ?, service_area = ?, sort_order = ?, active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        branch.name, branch.managerName, branch.phone, branch.standardPrice,
        branch.expressPrice, branch.serviceArea, branch.sortOrder, branch.active, id
      ).run();
      return json({ success: true });
    }

    if (request.method === 'DELETE') {
      const id = Number(url.searchParams.get('id'));
      if (!id) return json({ error: 'Missing id' }, 400);
      await env.DB.prepare('DELETE FROM branches WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
