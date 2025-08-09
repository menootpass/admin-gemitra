'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Destination {
  id: number;
  nama: string;
  lokasi: string;
  rating: number;
  kategori: string;
  img: string;
  deskripsi: string;
  fasilitas: string;
  posisi: string;
  harga?: number;
  komentar: string;
  dikunjungi: number;
}

interface ApiResponse {
  data: Destination[];
}

export default function EditDestinationPage() {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [destination, setDestination] = useState<Destination | null>(null);
  const router = useRouter();
  const params = useParams();
  const destinationId = params?.id ? String(params.id) : '';

  const loadDestination = useCallback(async () => {
    if (!destinationId) return; // Jangan fetch jika id tidak ada

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbxKHMKh5fs4l0QcYDq2wdO_Z0HoSvv1OwhHzVaE94m1-A1QgtakQ43xuA0S2Uums1xinA/exec?endpoint=destinations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch destinations');
      }
      
      const result: ApiResponse = await response.json();
      const destination = result.data?.find(dest => dest.id === parseInt(destinationId));
      
      if (!destination) {
        throw new Error('Destination not found');
      }

      setDestination(destination);

      let altitude = '';
      let longitude = '';
      if (destination.posisi && destination.posisi.startsWith('[') && destination.posisi.endsWith(']')) {
        try {
          const [alt, lon] = JSON.parse(destination.posisi);
          altitude = String(alt);
          longitude = String(lon);
        } catch (e) {
          console.error('Failed to parse posisi:', e);
        }
      }

      // Parse image URLs from JSON array to Google Drive IDs
      let imgString = '';
      if (destination.img && typeof destination.img === 'string' && destination.img.startsWith('[') && destination.img.endsWith(']')) {
        try {
          const imgArray = JSON.parse(destination.img) as string[];
                  // Extract Google Drive IDs from full URLs
        imgString = imgArray
          .map((url: string) => {
            const match = url.match(/id=([^&]+)/);
            return match ? match[1] : url;
          })
          .join(', ');
        } catch (e) {
          console.error('Failed to parse img:', e);
          imgString = destination.img.replace(/^\[|\]$/g, ''); // Fallback if JSON parsing fails
        }
      } else if (typeof destination.img === 'string') {
        // Try to extract ID from single URL
        const match = destination.img.match(/id=([^&]+)/);
        imgString = match ? match[1] : destination.img;
      } else if (Array.isArray(destination.img)) {
        imgString = (destination.img as string[])
          .map((url: string) => {
            const match = url.match(/id=([^&]+)/);
            return match ? match[1] : url;
          })
          .join(', ');
      }

      setFormData({
        nama: destination.nama,
        lokasi: destination.lokasi,
        kategori: destination.kategori,
        img: imgString,
        deskripsi: destination.deskripsi,
        fasilitas: destination.fasilitas,
        altitude,
        longitude,
        harga: destination.harga != null ? String(destination.harga) : '',
      });
    } catch (error) {
      console.error('Error loading destination:', error);
      alert('Terjadi kesalahan saat memuat data destinasi');
    } finally {
      setIsLoading(false);
    }
  }, [destinationId]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    loadDestination();
  }, [router, loadDestination]);

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

    if (!destinationId) {
      alert('Error: Destination ID is missing.');
      return;
    }

    setIsSaving(true);

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

      const updateData = {
        nama: formData.nama,
        lokasi: formData.lokasi,
        rating: destination?.rating || 0, // Keep existing rating
        kategori: formData.kategori,
        img: JSON.stringify(imgArray),
        deskripsi: formData.deskripsi,
        fasilitas: formData.fasilitas,
        posisi: posisi,
        harga: parseFloat(formData.harga) || 0,
        komentar: destination?.komentar || '',
        dikunjungi: destination?.dikunjungi || 0,
      };

      const response = await fetch(`/api/destinasi/${destinationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Destinasi berhasil diperbarui!');
        router.push('/dashboard/destinasi');
      } else {
        throw new Error(result.error || 'Gagal memperbarui destinasi');
      }
    } catch (error) {
      console.error('Error updating destination:', error);
      alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = [
    'Alam',
    'Budaya & Sejarah',
    'Kreatif & Edukasi',
    'Kuliner Tersembunyi',
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data destinasi...</p>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Destinasi tidak ditemukan</h3>
          <p className="mt-1 text-sm text-gray-500">
            Destinasi yang Anda cari tidak ada atau telah dihapus.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/destinasi"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Kembali ke Daftar Destinasi
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-gray-900">Edit Destinasi</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Form Edit Destinasi</h2>
            <p className="mt-1 text-sm text-gray-500">
              Edit informasi destinasi &quot;{destination.nama}&quot;
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
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </div>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 