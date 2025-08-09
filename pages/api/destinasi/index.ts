// pages/api/destinasi/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const APPSCRIPT_URL = process.env.GEMITRA_MAIN_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxKHMKh5fs4l0QcYDq2wdO_Z0HoSvv1OwhHzVaE94m1-A1QgtakQ43xuA0S2Uums1xinA/exec';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: daftar destinasi
  if (req.method === 'GET') {
    try {
      const gsRes = await fetch(`${APPSCRIPT_URL}?endpoint=destinations`);
      if (!gsRes.ok) throw new Error('Failed to fetch destinations from Apps Script');
      const data = await gsRes.json();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to fetch destinations' });
    }
    return;
  }

  // POST: create destinasi
  if (req.method === 'POST') {
    try {
      // Teruskan body request dengan action 'createDestination' ke Google Apps Script
      const gsRes = await fetch(APPSCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...req.body,
          action: 'createDestination'
        }),
      });

      const data = await gsRes.json();
      // Kirim balik response dari Apps Script ke client
      // Gunakan status 201 Created jika sukses
      res.status(gsRes.ok ? 201 : 500).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', detail: (error as Error).message });
    }
    return;
  }

  // Jika metode bukan POST, kembalikan 405
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 