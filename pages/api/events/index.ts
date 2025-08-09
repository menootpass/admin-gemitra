import { NextApiRequest, NextApiResponse } from 'next';

const APPSCRIPT_URL = process.env.NEXT_PUBLIC_GEMITRA_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxKHMKh5fs4l0QcYDq2wdO_Z0HoSvv1OwhHzVaE94m1-A1QgtakQ43xuA0S2Uums1xinA/exec';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Ambil data dari Apps Script dengan endpoint events
      const response = await fetch(`${APPSCRIPT_URL}?endpoint=events`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events from Apps Script');
      }
      
      const result = await response.json();
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch events',
        data: []
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, description, image, date, location, category, content, author, destinasi } = req.body;

      // Validasi input
      if (!title || !description || !image || !date || !location || !category || !content || !author) {
        return res.status(400).json({
          success: false,
          error: 'Semua field harus diisi'
        });
      }

      // Kirim data ke Apps Script
      const response = await fetch(APPSCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addEvent',
          title,
          description,
          image,
          date,
          location,
          category,
          content,
          author,
          destinasi
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Failed to add event'
        });
      }
    } catch (error) {
      console.error('Error adding event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add event'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 