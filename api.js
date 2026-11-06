/* API da Gestão de Serviços (Netlify Function + Neon).
   Variáveis de ambiente (Netlify > Site configuration > Environment variables):
     DATABASE_URL  endereço de conexão do Neon
     AUTH_SECRET   texto longo e aleatório (assina o login)
     ADMIN_KEY     chave para criar/trocar senha de usuários (admin.html)            */
const crypto = require('crypto');

const COLS = ['farms','breeders','tanks','movs','meas','products','pmovs','lotes','fichas'];
const DIAS = 30;
let _sql = null;
const sql = (...a) => {
  if (!_sql) { const { neon } = require('@neondatabase/serverless'); _sql = neon(process.env.DATABASE_URL); }
  return _sql(...a);
};

const reply = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(obj) });
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function sign(p) {
  const body = Buffer.from(JSON.stringify(p)).toString('base64url');
  const sig = crypto.createHmac('sha256', process.env.AUTH_SECRET).update(body).digest('base64url');
  return body + '.' + sig;
}
function verify(t) {
  if (!t || typeof t !== 'string' || !process.env.AUTH_SECRET) return null;
  const [body, sig] = t.split('.');
  if (!body || !sig) return null;
  const ok = crypto.createHmac('sha256', process.env.AUTH_SECRET).update(body).digest('base64url');
  if (!eq(sig, ok)) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch (e) { return null; }
}
const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) => 'scrypt$' + salt + '$' + crypto.scryptSync(pw, salt, 64).toString('hex');
const check = (pw, h) => { const [, salt] = String(h).split('$'); return salt && eq(hash(pw, salt), h); };
const asObj = d => (typeof d === 'string' ? JSON.parse(d) : d);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { erro: 'método' });
  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { erro: 'json' }); }
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const user = verify(auth.replace(/^Bearer\s+/i, ''));
  try {
    switch (b.action) {
      case 'login': {
        const email = String(b.email || '').trim().toLowerCase();
        const r = await sql`select email, nome, senha from usuarios where email = ${email}`;
        if (!r.length || !check(String(b.password || ''), r[0].senha)) return reply(401, { erro: 'credenciais' });
        return reply(200, { token: sign({ sub: r[0].email, nome: r[0].nome, exp: Date.now() + DIAS * 864e5 }), nome: r[0].nome });
      }
      case 'createUser': {
        if (!process.env.ADMIN_KEY || !eq(b.adminKey || '', process.env.ADMIN_KEY)) return reply(403, { erro: 'chave' });
        const email = String(b.email || '').trim().toLowerCase(), nome = String(b.nome || '').trim(), pw = String(b.password || '');
        if (!/^\S+@\S+\.\S+$/.test(email) || !nome || pw.length < 6) return reply(400, { erro: 'dados' });
        await sql`insert into usuarios (email, nome, senha) values (${email}, ${nome}, ${hash(pw)})
                  on conflict (email) do update set nome = excluded.nome, senha = excluded.senha`;
        return reply(200, { ok: true });
      }
    }
    if (!user) return reply(401, { erro: 'login' });
    switch (b.action) {
      case 'me': return reply(200, { ok: true, nome: user.nome });
      case 'all': {
        const rows = await sql`select collection, data from docs`;
        const out = {}; COLS.forEach(c => out[c] = []);
        rows.forEach(r => { if (out[r.collection]) out[r.collection].push(asObj(r.data)); });
        return reply(200, out);
      }
      case 'set': {
        if (!COLS.includes(b.collection) || typeof b.id !== 'string' || !b.id || b.id.length > 80 || !b.data || typeof b.data !== 'object') return reply(400, { erro: 'dados' });
        const json = JSON.stringify(b.data);
        if (json.length > 500000) return reply(413, { erro: 'grande' });
        await sql`insert into docs (collection, id, data, updated_at) values (${b.collection}, ${b.id}, ${json}::jsonb, now())
                  on conflict (collection, id) do update set data = excluded.data, updated_at = now()`;
        return reply(200, { ok: true });
      }
      case 'del': {
        if (!COLS.includes(b.collection) || typeof b.id !== 'string') return reply(400, { erro: 'dados' });
        await sql`delete from docs where collection = ${b.collection} and id = ${b.id}`;
        return reply(200, { ok: true });
      }
    }
    return reply(400, { erro: 'ação' });
  } catch (e) {
    console.error(e);
    return reply(500, { erro: 'servidor' });
  }
};
exports._setSql = f => { _sql = f; };
