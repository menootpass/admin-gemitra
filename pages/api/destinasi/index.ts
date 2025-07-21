// pages/api/destinasi/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3lxP14J__OOKLIiTQL1PLh0e2CMPAFzGbvKP8BiNT6LdfZ7EWmCIQSPx-JC9Ajl7ThQ/exec';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hanya izinkan metode POST
  if (req.method === 'POST') {
    try {
      // Teruskan body request langsung ke Google Apps Script
      // Apps Script akan menangani ini sebagai action 'create' secara default
      const gsRes = await fetch(APPSCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      const data = await gsRes.json();
      // Kirim balik response dari Apps Script ke client
      // Gunakan status 201 Created jika sukses
      res.status(gsRes.ok ? 201 : 500).json(data);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', detail: (err as Error).message });
    }
    return;
  }

  // Jika metode bukan POST, kembalikan 405
  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 