import { put, list } from '@vercel/blob';

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const blobs = [];
    let cursor;
    do {
      const r = await list({ prefix: 'wishes/', cursor, limit: 1000 });
      blobs.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    const wishes = (await Promise.all(blobs.map(b => fetch(b.url).then(r => r.json()).catch(() => null))))
      .filter(w => w && !w.hidden)
      .sort((a, b) => b.at.localeCompare(a.at))
      .map(({ name, message, at }) => ({ name, message, at }));
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');
    return res.status(200).json({ wishes });
  }

  if (req.method === 'POST') {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (b.website) return res.status(200).json({ ok: true }); // honeypot for bots
    const name = clean(b.name, 60);
    const message = clean(b.message, 500);
    if (name.length < 2 || message.length < 2) return res.status(400).json({ error: 'Name and message are required' });
    const wish = { name, message, at: new Date().toISOString() };
    await put(`wishes/${Date.now()}.json`, JSON.stringify(wish), { access: 'public', addRandomSuffix: true, contentType: 'application/json' });
    return res.status(200).json({ ok: true, wish });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
