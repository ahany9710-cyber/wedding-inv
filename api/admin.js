import { list, del } from '@vercel/blob';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  const key = req.query.key;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return res.status(401).send('Unauthorized');

  if (req.method === 'POST' && req.query.remove) {
    await del(String(req.query.remove));
    res.setHeader('Location', `/api/admin?key=${encodeURIComponent(key)}`);
    return res.status(303).end();
  }

  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix: 'wishes/', cursor, limit: 1000 });
    blobs.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  const rows = (await Promise.all(blobs.map(b => fetch(b.url).then(r => r.json()).then(w => ({ ...w, url: b.url })).catch(() => null))))
    .filter(Boolean).sort((a, b) => b.at.localeCompare(a.at));

  if (req.query.format === 'csv') {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="wishes.csv"');
    return res.send('﻿Name,Wish,Sent\n' + rows.map(r => [r.name, r.message, r.at].map(q).join(',')).join('\n'));
  }

  const fmt = iso => new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' });
  const k = encodeURIComponent(key);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wishes · Israa & Ragaey</title>
<style>body{font-family:Georgia,serif;background:#f3e9d6;color:#3a2a1c;margin:0;padding:24px 16px;max-width:760px;margin:auto}h1{font-weight:400;font-style:italic;color:#6e1d1d}
.w{background:#fffaf0;border:1px solid #d9c49a;padding:14px 16px;margin:12px 0}.m{font-style:italic;white-space:pre-wrap}.n{color:#6e1d1d;margin-top:6px}.t{font-size:13px;color:#6e5841}
button{font:inherit;background:none;border:1px solid #6e1d1d;color:#6e1d1d;padding:4px 10px;cursor:pointer;margin-top:8px}a{color:#6e1d1d}</style>
<h1>Wishes (${rows.length})</h1><p><a href="?key=${k}&format=csv">Download as spreadsheet</a></p>
${rows.map(r => `<div class="w"><div class="m">${esc(r.message)}</div><div class="n">— ${esc(r.name)}</div><div class="t">${fmt(r.at)}</div>
<form method="post" action="/api/admin?key=${k}&remove=${encodeURIComponent(r.url)}" onsubmit="return confirm('Remove this wish from the page?')"><button>Remove</button></form></div>`).join('')}`);
}
