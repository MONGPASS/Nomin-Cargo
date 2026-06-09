export async function onRequestPost({ request, env }) {
  try {
    const { id, password } = await request.json();

    if (!id || !password) {
      return new Response(JSON.stringify({ success: false, error: 'ID болон нууц үгээ оруулна уу.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const correctId = env.ADMIN_ID;
    const correctPass = env.ADMIN_PASSWORD;

    if (!correctId || !correctPass) {
      return new Response(JSON.stringify({ success: false, error: 'Админ нэвтрэх тохиргоо хийгдээгүй байна.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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

       return new Response(JSON.stringify({ 
           success: true, 
           token: `${issuedAt}.${signatureText}`,
           message: 'Амжилттай нэвтэрлээ' 
       }), {
           status: 200,
           headers: { 'Content-Type': 'application/json' },
       });
    }

    return new Response(JSON.stringify({ success: false, error: 'ID эсвэл нууц үг буруу байна.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
