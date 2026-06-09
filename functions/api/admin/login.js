function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function verifyToken(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const [issuedAt, signatureText] = token.split('.');
  const issuedAtNumber = Number(issuedAt);

  if (!issuedAtNumber || !signatureText || Date.now() - issuedAtNumber > 12 * 60 * 60 * 1000) {
    return false;
  }

  const secret = env.ADMIN_PASSWORD;
  if (!secret) return false;

  try {
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
  } catch {
    return false;
  }
}

export async function onRequestGet({ request, env }) {
  const valid = await verifyToken(request, env);
  return json({ valid }, valid ? 200 : 401);
}

export async function onRequestPost({ request, env }) {
  try {
    const { id, password } = await request.json();

    if (!id || !password) {
      return json({ success: false, error: 'ID болон нууц үгээ оруулна уу.' }, 400);
    }

    const correctId = env.ADMIN_ID;
    const correctPass = env.ADMIN_PASSWORD;

    if (!correctId || !correctPass) {
      return json({ success: false, error: 'Админ нэвтрэх тохиргоо хийгдээгүй байна.' }, 500);
    }

    if (id === correctId && password === correctPass) {
       const issuedAt = Date.now().toString();
       const key = await crypto.subtle.importKey(
         'raw',
         new TextEncoder().encode(correctPass),
         { name: 'HMAC', hash: 'SHA-256' },
         false,
         ['sign']
       );
       const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(issuedAt));
       const signatureText = btoa(String.fromCharCode(...new Uint8Array(signature)))
         .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

       return json({
           success: true, 
           token: `${issuedAt}.${signatureText}`,
           message: 'Амжилттай нэвтэрлээ' 
       });
    }

    return json({ success: false, error: 'ID эсвэл нууц үг буруу байна.' }, 401);

  } catch (error) {
    return json({ success: false, error: error.message }, 500);
  }
}
