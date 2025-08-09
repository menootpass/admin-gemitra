// pages/api/destinasi/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

const APPSCRIPT_URL = process.env.NEXT_PUBLIC_GEMITRA_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxKHMKh5fs4l0QcYDq2wdO_Z0HoSvv1OwhHzVaE94m1-A1QgtakQ43xuA0S2Uums1xinA/exec';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    // ... kode delete seperti sebelumnya ...
    try {
      const gsRes = await fetch(APPSCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: Number(id) }),
      });
      const data = await gsRes.json();
      res.status(gsRes.ok ? 200 : 500).json(data);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', detail: (err as Error).message });
    }
    return;
  }

  // Tambahkan handler untuk POST/PUT (update)
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const gsRes = await fetch(APPSCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          action: 'update',
          id: Number(id),
        }),
      });
      const data = await gsRes.json();
      res.status(gsRes.ok ? 200 : 500).json(data);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', detail: (err as Error).message });
    }
    return;
  }

  // Jika method tidak diizinkan
  res.setHeader('Allow', ['DELETE', 'POST', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}