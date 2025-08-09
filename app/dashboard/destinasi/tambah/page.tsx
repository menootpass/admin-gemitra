'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddDestinationPage() {
  const [formData, setFormData] = useState({
    nama: '',
    lokasi: '',
    kategori: '',
    img: '',
    deskripsi: '',
    fasilitas: '',
    altitude: '',
    longitude: '',
    harga: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    // Cek apakah user sudah login
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama destinasi wajib diisi';
    }

    if (!formData.deskripsi.trim()) {
      newErrors.deskripsi = 'Deskripsi wajib diisi';
    }

    if (!formData.lokasi.trim()) {
      newErrors.lokasi = 'Lokasi wajib diisi';
    }

    if (!formData.kategori) {
      newErrors.kategori = 'Kategori wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const posisi = `[${formData.altitude || "0"}, ${formData.longitude || "0"}]`;
      // Convert comma-separated Google Drive IDs to full URLs and JSON array
      let imgArray: string[] = [];
      if (formData.img.trim()) {
        imgArray = formData.img
          .split(',')
          .map(id => id.trim())
          .filter(id => id.length > 0)
          .map(id => `https://drive.google.com/uc?export=view&id=${id}`);
      }

      const destinationData = {
        nama: formData.nama,
        lokasi: formData.lokasi,
        rating: 0, // Default rating
        kategori: formData.kategori,
        img: JSON.stringify(imgArray),
        deskripsi: formData.deskripsi,
        fasilitas: formData.fasilitas,
        posisi: posisi,
        harga: parseFloat(formData.harga) || 0,
        komentar: '[]',
        dikunjungi: 0,
      };

      const response = await fetch('/api/destinasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(destinationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Destinasi berhasil ditambahkan!');
        router.push('/dashboard/destinasi');
      } else {
        throw new Error(result.error || 'Gagal menambahkan destinasi');
      }
    } catch (error) {
      console.error('Error adding destination:', error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    'Alam',
    'Budaya & Sejarah',
    'Kreatif & Edukasi',
    'Kuliner Tersembunyi',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard/destinasi" className="text-gray-500 hover:text-gray-700 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Tambah Destinasi Baru</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Form Destinasi</h2>
            <p className="mt-1 text-sm text-gray-500">
              Isi informasi lengkap destinasi yang akan ditambahkan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Destinasi */}
              <div className="md:col-span-2">
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Destinasi *
                </label>
                <input
                  type="text"
                  id="nama"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nama ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: Bali, Yogyakarta, Lombok"
                />
                {errors.nama && (
                  <p className="mt-1 text-sm text-red-600">{errors.nama}</p>
                )}
              </div>

              {/* Lokasi */}
              <div className="md:col-span-2">
                <label htmlFor="lokasi" className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasi *
                </label>
                <input
                  type="text"
                  id="lokasi"
                  name="lokasi"
                  value={formData.lokasi}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.lokasi ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: Bali, Indonesia"
                />
                {errors.lokasi && (
                  <p className="mt-1 text-sm text-red-600">{errors.lokasi}</p>
                )}
              </div>

              {/* Altitude & Longitude */}
              <div>
                <label htmlFor="altitude" className="block text-sm font-medium text-gray-700 mb-2">
                  Altitude
                </label>
                <input
                  type="text"
                  id="altitude"
                  name="altitude"
                  value={formData.altitude}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: -7.659567"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 110.351433"
                />
              </div>



              {/* Kategori */}
              <div>
                <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <select
                  id="kategori"
                  name="kategori"
                  value={formData.kategori}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.kategori ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih kategori</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.kategori && (
                  <p className="mt-1 text-sm text-red-600">{errors.kategori}</p>
                )}
              </div>

              {/* Google Drive Image IDs */}
              <div className="md:col-span-2">
                <label htmlFor="img" className="block text-sm font-medium text-gray-700 mb-2">
                  ID Gambar Google Drive (Pisahkan dengan koma)
                </label>
                <textarea
                  id="img"
                  name="img"
                  value={formData.img}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1ogOWNfqW7LmFF8kPhiXGGiTkuk8glTsl, 1oe8R7nbiDAi2gu3-SP6HDCY_H73aYQaH, 1abc123def456ghi789"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Masukkan ID gambar dari Google Drive, pisahkan dengan koma (opsional)
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  💡 Cara dapat ID: Upload gambar ke Google Drive → Klik kanan → &quot;Get link&quot; → Copy ID dari URL
                </p>
              </div>

              {/* Deskripsi */}
              <div className="md:col-span-2">
                <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi *
                </label>
                <textarea
                  id="deskripsi"
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.deskripsi ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Jelaskan detail destinasi, keunikan, dan hal menarik lainnya..."
                />
                {errors.deskripsi && (
                  <p className="mt-1 text-sm text-red-600">{errors.deskripsi}</p>
                )}
              </div>

                            {/* Fasilitas */}
              <div className="md:col-span-2">
                <label htmlFor="fasilitas" className="block text-sm font-medium text-gray-700 mb-2">
                  Fasilitas
                </label>
                <textarea
                  id="fasilitas"
                  name="fasilitas"
                  value={formData.fasilitas}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Parkir, Toilet, Restoran, WiFi, dll..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Daftar fasilitas yang tersedia di destinasi (opsional)
                </p>
              </div>

              {/* Harga */}
              <div>
                <label htmlFor="harga" className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Tiket (Rp)
                </label>
                <input
                  type="number"
                  id="harga"
                  name="harga"
                  value={formData.harga}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 50000"
                  min="0"
                  step="1000"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Harga tiket masuk destinasi (opsional)
                </p>
              </div>

 
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/dashboard/destinasi"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </div>
                ) : (
                  'Simpan Destinasi'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 