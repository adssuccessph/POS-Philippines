const STATUS_OPTIONS = ['New Inquiry','Reviewing Requirements','Quotation Prepared','Waiting for Customer','Approved / Scheduled','Completed','Cancelled'];
const REVIEW_STATUS = ['pending','approved','rejected'];
const PBKDF2_ITERATIONS = 10000;
const SESSION_DAYS = 7;

export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '') || '/';

      if (request.method === 'GET' && path.startsWith('/media/')) return serveMedia(path.slice('/media/'.length), env, request);
      if (request.method === 'GET' && path === '/api/health') return json({ ok: true, service: 'POS Philippines API' }, 200, request, env);
      if (request.method === 'GET' && path === '/api/public/bootstrap') return publicBootstrap(env, request);
      if (request.method === 'POST' && path === '/api/inquiries') return createInquiry(request, env);
      if (request.method === 'POST' && path === '/api/inquiries/track') return trackInquiry(request, env);
      if (request.method === 'POST' && path === '/api/public/review-upload') return publicReviewUpload(request, env);
      if (request.method === 'POST' && path === '/api/reviews') return createReview(request, env);

      if (request.method === 'POST' && path === '/api/auth/login') return login(request, env);
      if (request.method === 'GET' && path === '/api/auth/me') return authMe(request, env);
      if (request.method === 'POST' && path === '/api/auth/change-password') return changePassword(request, env);
      if (request.method === 'POST' && path === '/api/auth/logout') return logout(request, env);

      const auth = await requireAdmin(request, env);
      if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);

      if (request.method === 'GET' && path === '/api/admin/dashboard') return dashboard(env, request);
      if (path === '/api/admin/settings') {
        if (request.method === 'GET') return adminSettings(env, request);
        if (request.method === 'PUT') return updateSettings(request, env);
      }
      if (request.method === 'POST' && path === '/api/admin/upload') return adminUpload(request, env);

      const categoryMatch = path.match(/^\/api\/admin\/categories(?:\/([^/]+))?$/);
      if (categoryMatch) return entityRoute('categories', categoryMatch[1], request, env);
      const brandMatch = path.match(/^\/api\/admin\/brands(?:\/([^/]+))?$/);
      if (brandMatch) return entityRoute('brands', brandMatch[1], request, env);
      const productMatch = path.match(/^\/api\/admin\/products(?:\/([^/]+))?$/);
      if (productMatch) return entityRoute('products', productMatch[1], request, env);
      const packageMatch = path.match(/^\/api\/admin\/packages(?:\/([^/]+))?$/);
      if (packageMatch) return entityRoute('packages', packageMatch[1], request, env);

      const inquiryMatch = path.match(/^\/api\/admin\/inquiries(?:\/([^/]+))?$/);
      if (inquiryMatch) return adminInquiryRoute(inquiryMatch[1], request, env);
      const reviewStatusMatch = path.match(/^\/api\/admin\/reviews\/([^/]+)\/status$/);
      if (reviewStatusMatch && request.method === 'PUT') return updateReviewStatus(reviewStatusMatch[1], request, env);
      const reviewMatch = path.match(/^\/api\/admin\/reviews(?:\/([^/]+))?$/);
      if (reviewMatch) return adminReviewRoute(reviewMatch[1], request, env);

      return json({ error: 'Route not found.' }, 404, request, env);
    } catch (error) {
      console.error(error);
      return json({ error: error?.message || 'Internal server error.' }, 500, request, env);
    }
  }
};

function corsHeaders(request, env) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  });
  const origin = request.headers.get('Origin');
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  if (origin && (allowed.includes(origin) || allowed.includes('*'))) {
    headers.set('Access-Control-Allow-Origin', allowed.includes('*') ? '*' : origin);
  }
  return headers;
}
function json(data, status, request, env, extra = {}) {
  const headers = corsHeaders(request, env);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  Object.entries(extra).forEach(([k, v]) => headers.set(k, v));
  return new Response(JSON.stringify(data), { status, headers });
}
async function readJson(request) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.includes('application/json')) throw new Error('Expected JSON request body.');
  return request.json();
}
function required(body, fields) {
  for (const field of fields) if (!String(body[field] ?? '').trim()) throw new Error(`${field.replaceAll('_', ' ')} is required.`);
}
function boolInt(value) { return value === true || value === 1 || value === '1' || value === 'true' || value === 'on' ? 1 : 0; }
function cleanText(value, max = 5000) { return String(value ?? '').trim().slice(0, max); }
function id(prefix) { return `${prefix}-${crypto.randomUUID()}`; }
function randomToken(bytes = 32) { const a = new Uint8Array(bytes); crypto.getRandomValues(a); return base64(a); }
function base64(bytes) { let out = ''; for (const b of bytes) out += String.fromCharCode(b); return btoa(out); }
function fromBase64(value) { const s = atob(value); return Uint8Array.from(s, c => c.charCodeAt(0)); }
async function sha256(value) { const bytes = new TextEncoder().encode(value); const digest = await crypto.subtle.digest('SHA-256', bytes); return base64(new Uint8Array(digest)); }
async function hashPassword(password, saltBase64) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(saltBase64), iterations: PBKDF2_ITERATIONS }, key, 256);
  return base64(new Uint8Array(bits));
}
function safeEqual(a, b) { if (a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }
function packageRow(row) { return { ...row, inclusions: parseJsonArray(row.inclusions_json), is_featured: Number(row.is_featured), is_active: Number(row.is_active) }; }
function parseJsonArray(value) { try { const v = JSON.parse(value || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
function originUrl(request, key) { return `${new URL(request.url).origin}/media/${encodeURIComponent(key).replaceAll('%2F', '/')}`; }

async function serveMedia(key, env, request) {
  const object = await env.MEDIA.get(decodeURIComponent(key));
  if (!object) return new Response('Not found', { status: 404, headers: corsHeaders(request, env) });
  const headers = corsHeaders(request, env);
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

async function publicBootstrap(env, request) {
  const [settings, categories, brands, products, packages, reviews] = await Promise.all([
    env.DB.prepare('SELECT * FROM settings WHERE id=1').first(),
    env.DB.prepare('SELECT * FROM categories WHERE is_active=1 ORDER BY display_order,name').all(),
    env.DB.prepare('SELECT * FROM brands WHERE is_active=1 ORDER BY category_id,display_order,name').all(),
    env.DB.prepare('SELECT * FROM products WHERE is_available=1 ORDER BY is_featured DESC,name').all(),
    env.DB.prepare('SELECT * FROM packages WHERE is_active=1 ORDER BY display_order,name').all(),
    env.DB.prepare("SELECT id,tracking,name,business,rating,message,image_url,created_at FROM reviews WHERE status='approved' ORDER BY created_at DESC LIMIT 30").all()
  ]);
  return json({ settings: settings || {}, categories: categories.results, brands: brands.results, products: products.results, packages: packages.results.map(packageRow), reviews: reviews.results }, 200, request, env);
}

async function createInquiry(request, env) {
  const body = await readJson(request);
  required(body, ['name','email','phone','category_id','message']);
  const inquiryId = id('inq');
  const tracking = makeTracking();
  const values = {
    id: inquiryId, tracking, name: cleanText(body.name, 150), business: cleanText(body.business, 150), email: cleanText(body.email, 200).toLowerCase(), phone: cleanText(body.phone, 50),
    category_id: cleanText(body.category_id, 100) || null, brand_id: cleanText(body.brand_id, 100) || null, product_id: cleanText(body.product_id, 100) || null,
    sales_representative: cleanText(body.sales_representative, 150), message: cleanText(body.message, 5000)
  };
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO inquiries (id,tracking,name,business,email,phone,category_id,brand_id,product_id,sales_representative,message) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(values.id, values.tracking, values.name, values.business, values.email, values.phone, values.category_id, values.brand_id, values.product_id, values.sales_representative, values.message),
    env.DB.prepare('INSERT INTO inquiry_history (id,inquiry_id,status,note) VALUES (?,?,?,?)').bind(id('hist'), inquiryId, 'New Inquiry', 'Inquiry successfully submitted.')
  ]);
  return json({ ok: true, tracking }, 201, request, env);
}
function makeTracking() { const d = new Date(); const date = `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`; return `INQ-${date}-${crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase()}`; }
async function trackInquiry(request, env) {
  const body = await readJson(request); required(body, ['tracking','contact']);
  const tracking = cleanText(body.tracking, 80), contact = cleanText(body.contact, 200).toLowerCase(), phone = contact.replace(/\s+/g, '');
  const row = await env.DB.prepare(`SELECT * FROM inquiries WHERE LOWER(tracking)=LOWER(?) AND (LOWER(email)=? OR REPLACE(phone,' ','')=?)`).bind(tracking, contact, phone).first();
  if (!row) return json({ error: 'Inquiry not found. Check the tracking number and registered contact.' }, 404, request, env);
  const history = await env.DB.prepare('SELECT status,note,created_at FROM inquiry_history WHERE inquiry_id=? ORDER BY created_at').bind(row.id).all();
  return json({ tracking: row.tracking, status: row.status, public_note: row.public_note, updated_at: row.updated_at, history: history.results }, 200, request, env);
}
async function completedInquiry(env, tracking, contact) {
  const c = cleanText(contact, 200).toLowerCase(), phone = c.replace(/\s+/g, '');
  return env.DB.prepare(`SELECT id,tracking FROM inquiries WHERE LOWER(tracking)=LOWER(?) AND status='Completed' AND (LOWER(email)=? OR REPLACE(phone,' ','')=?)`).bind(cleanText(tracking,80), c, phone).first();
}
async function publicReviewUpload(request, env) {
  const form = await request.formData();
  const inquiry = await completedInquiry(env, form.get('tracking'), form.get('contact'));
  if (!inquiry) return json({ error: 'A completed inquiry with matching contact details is required.' }, 403, request, env);
  const file = form.get('file');
  return uploadFile(file, 'reviews', request, env, 2 * 1024 * 1024);
}
async function createReview(request, env) {
  const body = await readJson(request); required(body, ['tracking','contact','name','rating','message']);
  const inquiry = await completedInquiry(env, body.tracking, body.contact);
  if (!inquiry) return json({ error: 'A completed inquiry with matching contact details is required.' }, 403, request, env);
  const existing = await env.DB.prepare('SELECT id FROM reviews WHERE inquiry_id=?').bind(inquiry.id).first();
  if (existing) return json({ error: 'A review has already been submitted for this inquiry.' }, 409, request, env);
  const rating = Number(body.rating); if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'Rating must be between 1 and 5.' }, 400, request, env);
  await env.DB.prepare(`INSERT INTO reviews (id,inquiry_id,tracking,name,business,rating,message,image_url,status) VALUES (?,?,?,?,?,?,?,?, 'pending')`).bind(id('rev'), inquiry.id, inquiry.tracking, cleanText(body.name,150), cleanText(body.business,150), rating, cleanText(body.message,3000), cleanText(body.image_url,1000)).run();
  return json({ ok: true }, 201, request, env);
}

async function login(request, env) {
  const body = await readJson(request); required(body, ['username','password']);
  const admin = await env.DB.prepare('SELECT * FROM admins WHERE LOWER(username)=LOWER(?)').bind(cleanText(body.username,100)).first();
  if (!admin) return json({ error: 'Incorrect username or password.' }, 401, request, env);
  const candidate = await hashPassword(String(body.password), admin.password_salt);
  if (!safeEqual(candidate, admin.password_hash)) return json({ error: 'Incorrect username or password.' }, 401, request, env);
  const token = randomToken(); const tokenHash = await sha256(token); const expires = new Date(Date.now()+SESSION_DAYS*86400000).toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE datetime(expires_at) <= datetime('now')"),
    env.DB.prepare('INSERT INTO sessions (token_hash,admin_id,expires_at) VALUES (?,?,?)').bind(tokenHash, admin.id, expires)
  ]);
  return json({ token, expires_at: expires, must_change_password: Boolean(admin.must_change_password) }, 200, request, env);
}
async function getSession(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  const raw = header.slice(7).trim(); if (!raw) return null;
  const hash = await sha256(raw);
  return env.DB.prepare(`SELECT a.id,a.username,a.must_change_password,s.token_hash,s.expires_at FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND datetime(s.expires_at)>datetime('now')`).bind(hash).first();
}
async function requireAdmin(request, env, allowMustChange=false) {
  const session = await getSession(request, env);
  if (!session) return { ok:false, status:401, error:'Unauthorized.' };
  if (session.must_change_password && !allowMustChange) return { ok:false, status:403, error:'Password change required.' };
  return { ok:true, session };
}
async function authMe(request, env) {
  const auth = await requireAdmin(request, env, true); if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
  return json({ username: auth.session.username, must_change_password: Boolean(auth.session.must_change_password) }, 200, request, env);
}
async function changePassword(request, env) {
  const auth = await requireAdmin(request, env, true); if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
  const body = await readJson(request); required(body, ['current_password','new_password']);
  if (String(body.new_password).length < 8) return json({ error: 'New password must contain at least 8 characters.' }, 400, request, env);
  const admin = await env.DB.prepare('SELECT * FROM admins WHERE id=?').bind(auth.session.id).first();
  const currentHash = await hashPassword(String(body.current_password), admin.password_salt);
  if (!safeEqual(currentHash, admin.password_hash)) return json({ error: 'Current password is incorrect.' }, 400, request, env);
  const salt = randomToken(16); const passwordHash = await hashPassword(String(body.new_password), salt);
  await env.DB.batch([
    env.DB.prepare("UPDATE admins SET password_hash=?,password_salt=?,must_change_password=0,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(passwordHash, salt, admin.id),
    env.DB.prepare('DELETE FROM sessions WHERE admin_id=?').bind(admin.id)
  ]);
  return json({ ok:true }, 200, request, env);
}
async function logout(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (header.startsWith('Bearer ')) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(header.slice(7).trim())).run();
  return json({ ok:true }, 200, request, env);
}

async function dashboard(env, request) {
  const [products,active,completed,pending] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) count FROM products').first(),
    env.DB.prepare("SELECT COUNT(*) count FROM inquiries WHERE status NOT IN ('Completed','Cancelled')").first(),
    env.DB.prepare("SELECT COUNT(*) count FROM inquiries WHERE status='Completed'").first(),
    env.DB.prepare("SELECT COUNT(*) count FROM reviews WHERE status='pending'").first()
  ]);
  return json({ products:products.count, active_inquiries:active.count, completed_inquiries:completed.count, pending_reviews:pending.count }, 200, request, env);
}
async function adminSettings(env, request) { return json((await env.DB.prepare('SELECT * FROM settings WHERE id=1').first()) || {}, 200, request, env); }
async function updateSettings(request, env) {
  const b = await readJson(request); required(b,['business_name']);
  await env.DB.prepare(`UPDATE settings SET business_name=?,tagline=?,hero_title=?,hero_subtitle=?,email=?,phone=?,facebook_name=?,facebook_url=?,address=?,logo_url=?,hero_image_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=1`).bind(cleanText(b.business_name,200),cleanText(b.tagline,300),cleanText(b.hero_title,300),cleanText(b.hero_subtitle,2000),cleanText(b.email,200),cleanText(b.phone,60),cleanText(b.facebook_name,200),cleanText(b.facebook_url,1000),cleanText(b.address,500),cleanText(b.logo_url,1000),cleanText(b.hero_image_url,1000)).run();
  return adminSettings(env, request);
}
async function uploadFile(file, folder, request, env, maxBytes=5*1024*1024) {
  if (!(file instanceof File) || !file.size) return json({ error:'Image file is required.' }, 400, request, env);
  if (!file.type.startsWith('image/')) return json({ error:'Only image files are allowed.' }, 400, request, env);
  if (file.size > maxBytes) return json({ error:`Image must be ${(maxBytes/1024/1024).toFixed(0)} MB or smaller.` }, 400, request, env);
  const ext = (file.name.split('.').pop() || file.type.split('/').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g,'').slice(0,8).toLowerCase();
  const key = `${folder}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata:{ contentType:file.type, cacheControl:'public, max-age=31536000' }, customMetadata:{ originalName:file.name.slice(0,200) } });
  return json({ key, url:originUrl(request,key) }, 201, request, env);
}
async function adminUpload(request, env) { const form=await request.formData(); return uploadFile(form.get('file'),'website',request,env); }

async function entityRoute(type, entityId, request, env) {
  if (request.method === 'GET' && !entityId) return listEntities(type, env, request);
  if (request.method === 'POST' && !entityId) return createEntity(type, request, env);
  if (request.method === 'PUT' && entityId) return updateEntity(type, entityId, request, env);
  if (request.method === 'DELETE' && entityId) return deleteEntity(type, entityId, request, env);
  return json({ error:'Method not allowed.' }, 405, request, env);
}
async function listEntities(type, env, request) {
  const sql = { categories:'SELECT * FROM categories ORDER BY display_order,name', brands:'SELECT * FROM brands ORDER BY category_id,display_order,name', products:'SELECT * FROM products ORDER BY created_at DESC', packages:'SELECT * FROM packages ORDER BY display_order,name' }[type];
  const rows = (await env.DB.prepare(sql).all()).results;
  return json(type==='packages'?rows.map(packageRow):rows,200,request,env);
}
async function createEntity(type, request, env) {
  const b=await readJson(request), entityId=id(type.slice(0,-1));
  if(type==='categories'){required(b,['name']);await env.DB.prepare('INSERT INTO categories (id,name,image_url,display_order,is_active) VALUES (?,?,?,?,?)').bind(entityId,cleanText(b.name,200),cleanText(b.image_url,1000),Number(b.display_order)||0,boolInt(b.is_active)).run();}
  if(type==='brands'){required(b,['category_id','name']);await env.DB.prepare('INSERT INTO brands (id,category_id,name,logo_url,display_order,is_active) VALUES (?,?,?,?,?,?)').bind(entityId,cleanText(b.category_id,100),cleanText(b.name,200),cleanText(b.logo_url,1000),Number(b.display_order)||0,boolInt(b.is_active)).run();}
  if(type==='products'){required(b,['category_id','name']);await env.DB.prepare(`INSERT INTO products (id,category_id,brand_id,name,price,image_url,short_description,description,is_featured,is_available) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(entityId,cleanText(b.category_id,100),cleanText(b.brand_id,100)||null,cleanText(b.name,250),Number(b.price)||0,cleanText(b.image_url,1000),cleanText(b.short_description,1000),cleanText(b.description,5000),boolInt(b.is_featured),boolInt(b.is_available)).run();}
  if(type==='packages'){required(b,['name']);await env.DB.prepare(`INSERT INTO packages (id,name,subtitle,price,image_url,inclusions_json,display_order,is_featured,is_active) VALUES (?,?,?,?,?,?,?,?,?)`).bind(entityId,cleanText(b.name,250),cleanText(b.subtitle,500),Number(b.price)||0,cleanText(b.image_url,1000),JSON.stringify(Array.isArray(b.inclusions)?b.inclusions:[]),Number(b.display_order)||0,boolInt(b.is_featured),boolInt(b.is_active)).run();}
  return getEntity(type,entityId,env,request,201);
}
async function updateEntity(type, entityId, request, env) {
  const b=await readJson(request);
  if(type==='categories'){required(b,['name']);await env.DB.prepare('UPDATE categories SET name=?,image_url=?,display_order=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(cleanText(b.name,200),cleanText(b.image_url,1000),Number(b.display_order)||0,boolInt(b.is_active),entityId).run();}
  if(type==='brands'){required(b,['category_id','name']);await env.DB.prepare('UPDATE brands SET category_id=?,name=?,logo_url=?,display_order=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(cleanText(b.category_id,100),cleanText(b.name,200),cleanText(b.logo_url,1000),Number(b.display_order)||0,boolInt(b.is_active),entityId).run();}
  if(type==='products'){required(b,['category_id','name']);await env.DB.prepare(`UPDATE products SET category_id=?,brand_id=?,name=?,price=?,image_url=?,short_description=?,description=?,is_featured=?,is_available=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(cleanText(b.category_id,100),cleanText(b.brand_id,100)||null,cleanText(b.name,250),Number(b.price)||0,cleanText(b.image_url,1000),cleanText(b.short_description,1000),cleanText(b.description,5000),boolInt(b.is_featured),boolInt(b.is_available),entityId).run();}
  if(type==='packages'){required(b,['name']);await env.DB.prepare(`UPDATE packages SET name=?,subtitle=?,price=?,image_url=?,inclusions_json=?,display_order=?,is_featured=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(cleanText(b.name,250),cleanText(b.subtitle,500),Number(b.price)||0,cleanText(b.image_url,1000),JSON.stringify(Array.isArray(b.inclusions)?b.inclusions:[]),Number(b.display_order)||0,boolInt(b.is_featured),boolInt(b.is_active),entityId).run();}
  return getEntity(type,entityId,env,request);
}
async function getEntity(type, entityId, env, request, status=200) {
  const row=await env.DB.prepare(`SELECT * FROM ${type} WHERE id=?`).bind(entityId).first();
  if(!row)return json({error:'Record not found.'},404,request,env);
  return json(type==='packages'?packageRow(row):row,status,request,env);
}
async function deleteEntity(type, entityId, request, env) {
  try { await env.DB.prepare(`DELETE FROM ${type} WHERE id=?`).bind(entityId).run(); return json({ok:true},200,request,env); }
  catch(e){ if(String(e.message).includes('FOREIGN KEY')) return json({error:'This record is still used by another product or brand. Move or delete the linked records first.'},409,request,env); throw e; }
}

async function adminInquiryRoute(inquiryId, request, env) {
  if(request.method==='GET'&&!inquiryId){const rows=await env.DB.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();return json(rows.results,200,request,env);}
  if(request.method==='GET'&&inquiryId){const row=await env.DB.prepare('SELECT * FROM inquiries WHERE id=?').bind(inquiryId).first();if(!row)return json({error:'Inquiry not found.'},404,request,env);const h=await env.DB.prepare('SELECT status,note,created_at FROM inquiry_history WHERE inquiry_id=? ORDER BY created_at').bind(inquiryId).all();return json({...row,history:h.results},200,request,env);}
  if(request.method==='PUT'&&inquiryId){const b=await readJson(request);if(!STATUS_OPTIONS.includes(b.status))return json({error:'Invalid inquiry status.'},400,request,env);const current=await env.DB.prepare('SELECT * FROM inquiries WHERE id=?').bind(inquiryId).first();if(!current)return json({error:'Inquiry not found.'},404,request,env);const changed=current.status!==b.status;const statements=[env.DB.prepare(`UPDATE inquiries SET status=?,public_note=?,internal_note=?,followup_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(b.status,cleanText(b.public_note,3000),cleanText(b.internal_note,5000),cleanText(b.followup_date,30),inquiryId)];if(changed)statements.push(env.DB.prepare('INSERT INTO inquiry_history (id,inquiry_id,status,note) VALUES (?,?,?,?)').bind(id('hist'),inquiryId,b.status,cleanText(b.public_note,3000)||'Status updated by admin.'));await env.DB.batch(statements);return json(await env.DB.prepare('SELECT * FROM inquiries WHERE id=?').bind(inquiryId).first(),200,request,env);}
  return json({error:'Method not allowed.'},405,request,env);
}
async function adminReviewRoute(reviewId, request, env) {
  if(request.method==='GET'&&!reviewId){const rows=await env.DB.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();return json(rows.results,200,request,env);}
  if(request.method==='DELETE'&&reviewId){await env.DB.prepare('DELETE FROM reviews WHERE id=?').bind(reviewId).run();return json({ok:true},200,request,env);}
  return json({error:'Method not allowed.'},405,request,env);
}
async function updateReviewStatus(reviewId, request, env) {
  const b=await readJson(request);if(!REVIEW_STATUS.includes(b.status))return json({error:'Invalid review status.'},400,request,env);await env.DB.prepare('UPDATE reviews SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.status,reviewId).run();const row=await env.DB.prepare('SELECT * FROM reviews WHERE id=?').bind(reviewId).first();if(!row)return json({error:'Review not found.'},404,request,env);return json(row,200,request,env);
}
