'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormData {
  title: string;
  description: string;
  image: string;
  date: string;
  location: string;
  category: string;
  content: string;
  author: string;
  destinasiIds: string[];
}

export default function TambahEventPage() {
  interface Destination { id: string | number; nama: string }
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    image: '',
    date: '',
    location: '',
    category: '',
    content: '',
    author: '',
    destinasiIds: []
  });
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const categories = ['Budaya', 'Workshop', 'Seminar', 'Konser', 'Pameran', 'Lainnya'];

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        // Menggunakan URL API yang benar ('/api/destinations')
        const res = await fetch('/api/destinations');
        if (!res.ok) throw new Error('Gagal memuat data destinasi');
        
        const payload = await res.json();
        const list = Array.isArray(payload.data) ? payload.data : [];

        // PERBAIKAN: Proses mapping dan filtering yang lebih aman secara tipe
        // PERBAIKAN: Mengganti 'any' dengan tipe yang lebih spesifik
        const normalized = list
          .map((d: { id: unknown; nama: unknown }) => { // <-- Tipe diubah dari 'any'
            if (typeof d !== 'object' || d === null) {
              return null;
            }
            
            const id = d.id !== null && d.id !== undefined ? String(d.id) : '';
            const nama = d.nama !== null && d.nama !== undefined ? String(d.nama) : '';

            if (id && nama) {
              return { id, nama };
            }
            return null;
          })
          .filter((d: Destination | null): d is Destination => d !== null);

        setDestinations(normalized);
      } catch (e) {
        console.error("Gagal memuat destinasi:", e);
      }
    };
    fetchDestinations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleDestinasi = (id: string) => {
    setFormData(prev => {
      const exists = prev.destinasiIds.includes(id);
      return {
        ...prev,
        destinasiIds: exists
          ? prev.destinasiIds.filter(x => x !== id)
          : [...prev.destinasiIds, id]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Konversi ID Google Drive (atau URL) menjadi URL penuh dan array JSON
      let imgArray: string[] = [];
      if (formData.image.trim()) {
        const tokens = formData.image
          .split(/\n|,/) // dukung koma atau baris baru
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0);

        const ids = tokens.map((token: string) => {
          // Coba ekstrak dari pola ?id=...
          const byQuery = token.match(/id=([^&]+)/);
          if (byQuery && byQuery[1]) return byQuery[1];
          // Coba ekstrak dari pola /d/<id>/
          const byPath = token.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (byPath && byPath[1]) return byPath[1];
          // Asumsikan token sudah berupa ID
          return token;
        });

        imgArray = ids.map((id: string) => `https://drive.google.com/uc?export=view&id=${id}`);
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        image: JSON.stringify(imgArray),
        date: formData.date,
        location: formData.location,
        category: formData.category,
        content: formData.content,
        author: formData.author,
        destinasi: formData.destinasiIds.join(',')
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Event berhasil ditambahkan!');
        router.push('/dashboard/events');
      } else {
        alert(result.error || 'Gagal menambahkan event');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Gagal menambahkan event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard/events" className="text-gray-500 hover:text-gray-700 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Tambah Event Baru</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Form Tambah Event</h2>
            <p className="mt-1 text-sm text-gray-500">
              Isi form di bawah untuk menambahkan event baru ke sistem.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Judul Event *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan judul event"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Singkat *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deskripsi singkat tentang event"
              />
            </div>

            {/* Google Drive Image IDs */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                ID Gambar Google Drive (Pisahkan dengan koma atau baris baru) *
              </label>
              <textarea
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={"1ogOWNfqW7LmFF8kPhiXGGiTkuk8glTsl, 1oe8R7nbiDAi2gu3-SP6HDCY_H73aYQaH\natau masukkan satu ID per baris"}
              />
              <p className="mt-1 text-xs text-gray-500">
                Masukkan ID gambar Google Drive. Sistem akan otomatis mengubahnya menjadi URL tampilan. Dukung koma atau baris baru.
              </p>
            </div>

            {/* Destinasi terkait (multi pilih) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destinasi terkait (boleh lebih dari satu)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto border rounded-md p-3">
                {destinations.length === 0 && (
                  <p className="text-sm text-gray-500">Tidak ada destinasi tersedia.</p>
                )}
                {destinations.map((d) => {
                  const id = d.id.toString();
                  const checked = formData.destinasiIds.includes(id);
                  return (
                    <label key={id} className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleDestinasi(id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{d.nama}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-gray-500">ID destinasi yang dipilih akan disimpan ke database (dipisah koma).</p>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Event *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi Event *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Jakarta, Indonesia"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih kategori</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Konten Lengkap *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Konten lengkap tentang event, termasuk detail, syarat, dan informasi penting lainnya..."
              />
            </div>

            {/* Author */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                Penulis *
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama penulis atau admin"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href="/dashboard/events"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 