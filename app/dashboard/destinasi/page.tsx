'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Komponen ImageSlider untuk menampilkan multiple gambar
const ImageSlider = ({ images, alt }: { images: string, alt: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  // Error boundary untuk ImageSlider
  if (hasError) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-gray-500">Gagal memuat gambar</p>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === parsedImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? parsedImages.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  // Parse images dari string array format dengan error handling yang lebih robust
  const parsedImages = (() => {
    try {
      // Jika images kosong atau tidak valid
      if (!images || images.trim() === '') {
        return [];
      }

      // Coba parse sebagai JSON array
      if (images.startsWith('[') && images.endsWith(']')) {
        try {
          return JSON.parse(images) as string[];
        } catch (e) {
          // Coba parse sebagai comma-separated string dengan berbagai format
          let urls: string[] = [];
          
          // Hapus bracket dan quotes
          const cleanString = images
            .replace(/^\[|\]$/g, '') // Hapus bracket
            .replace(/"/g, '') // Hapus quotes
            .replace(/'/g, ''); // Hapus single quotes
          
          // Split berdasarkan comma
          const urlParts = cleanString.split(',');
          
          // Clean dan filter URLs
          urls = urlParts
            .map(url => url.trim())
            .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));
          
          return urls;
        }
      }

      // Jika bukan array format, treat sebagai single image
      return [images];
    } catch (error) {
      setHasError(true);
      return [];
    }
  })();

  if (parsedImages.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
      {/* Gambar utama */}
      <Image
        src={parsedImages[currentIndex]}
        alt={`${alt} - Gambar ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        width={300}
        height={200}
        priority={currentIndex === 0} // Priority hanya untuk gambar pertama
        onError={() => setHasError(true)}
      />
      
      {/* Navigation buttons */}
      {parsedImages.length > 1 && (
        <>
          {/* Previous button */}
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Next button */}
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {parsedImages.map((_: string, index: number) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
          
          {/* Image counter */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {parsedImages.length}
          </div>
        </>
      )}
    </div>
  );
};

interface Destination {
  id: number;
  nama: string;
  lokasi: string;
  rating: number;
  kategori: string;
  img: string;
  deskripsi: string;
  fasilitas: string;
  harga?: number;
  komentar: string;
  dikunjungi: number;
}

interface ApiResponse {
  data: Destination[];
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const router = useRouter();

  useEffect(() => {
    // Cek apakah user sudah login
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    // Load destinations data (mock data for now)
    loadDestinations();
  }, [router]);

  const loadDestinations = async () => {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbxKHMKh5fs4l0QcYDq2wdO_Z0HoSvv1OwhHzVaE94m1-A1QgtakQ43xuA0S2Uums1xinA/exec?endpoint=destinations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch destinations');
      }
      
      const result: ApiResponse = await response.json();
      setDestinations(result.data || []);
    } catch {
      // silent
      // Fallback to mock data if API fails
      const mockDestinations: Destination[] = [
        {
          id: 1,
          nama: 'Bali',
          lokasi: 'Bali, Indonesia',
          rating: 4.5,
          kategori: 'Pantai',
          img: '["https://drive.google.com/uc?export=view&id=1ogOWNfqW7LmFF8kPhiXGGiTkuk8glTsl","https://drive.google.com/uc?export=view&id=1oe8R7nbiDAi2gu3-SP6HDCY_H73aYQaH"]',
          deskripsi: 'Pulau Dewata dengan pantai indah dan budaya yang kaya',
          fasilitas: 'Parkir, Toilet, Restoran, WiFi, Hotel',
          harga: 50000,
          komentar: 'Tempat yang sangat indah',
          dikunjungi: 1500
        },
        {
          id: 2,
          nama: 'Yogyakarta',
          lokasi: 'Yogyakarta, Indonesia',
          rating: 4.2,
          kategori: 'Budaya',
          img: '[https://drive.google.com/uc?export=view&id=1ogOWNfqW7LmFF8kPhiXGGiTkuk8glTsl, https://drive.google.com/uc?export=view&id=1oe8R7nbiDAi2gu3-SP6HDCY_H73aYQaH]',
          deskripsi: 'Kota budaya dengan candi-candi bersejarah',
          fasilitas: 'Parkir, Toilet, Restoran, Museum',
          harga: 30000,
          komentar: 'Budaya yang kaya',
          dikunjungi: 1200
        },
        {
          id: 3,
          nama: 'Lombok',
          lokasi: 'Lombok, Indonesia',
          rating: 4.0,
          kategori: 'Gunung',
          img: '["https://drive.google.com/uc?export=view&id=1oe8R7nbiDAi2gu3-SP6HDCY_H73aYQaH","https://drive.google.com/uc?export=view&id=1ogOWNfqW7LmFF8kPhiXGGiTkuk8glTsl"]',
          deskripsi: 'Pulau dengan pantai eksotis dan gunung Rinjani',
          fasilitas: 'Parkir, Toilet, Camping Area',
          harga: 75000,
          komentar: 'Alam yang eksotis',
          dikunjungi: 800
        }
      ];
      setDestinations(mockDestinations);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus destinasi ini?')) {
      try {
        const response = await fetch(`/api/destinasi/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setDestinations(prev => prev.filter(dest => dest.id !== id));
          alert('Destinasi berhasil dihapus!');
        } else {
          alert(result.error || 'Gagal menghapus destinasi');
        }
      } catch (error) {
        console.error('Error deleting destination:', error);
        alert('Gagal menghapus destinasi');
      }
    }
  };

  const filteredDestinations = destinations.filter(destination => {
    const matchesSearch = destination.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         destination.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || destination.kategori === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'Pantai', 'Gunung', 'Budaya', 'Kota', 'Pulau'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat destinasi...</p>
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
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Kelola Destinasi</h1>
            </div>
            <Link
              href="/dashboard/destinasi/tambah"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
            >
              Tambah Destinasi
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> Jumlah pengunjung akan bertambah secara otomatis saat ada yang checkout destinasi tersebut.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Cari Destinasi
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama atau lokasi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                id="category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Semua Kategori' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((destination) => (
            <div key={destination.id} className="bg-white rounded-lg shadow overflow-hidden">
              <ImageSlider images={destination.img} alt={destination.nama} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{destination.nama}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center text-sm text-yellow-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {destination.rating}
                    </span>
                    <span className="text-sm text-gray-500">({destination.dikunjungi} pengunjung)</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{destination.lokasi}</p>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{destination.deskripsi}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">{destination.kategori}</span>
                  {destination.fasilitas && (
                    <span className="text-xs text-gray-400">
                      {destination.fasilitas.split(', ').slice(0, 2).join(', ')}
                      {destination.fasilitas.split(', ').length > 2 && '...'}
                    </span>
                  )}
                </div>
                {destination.harga && destination.harga > 0 && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-green-600">
                      Rp {destination.harga.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">/tiket</span>
                  </div>
                )}
                <div className="flex space-x-2">
                                  <Link
                  href={`/dashboard/destinasi/edit/${destination.id.toString()}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Edit
                </Link>
                  <button
                    onClick={() => handleDelete(destination.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDestinations.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada destinasi</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterCategory !== 'all' 
                ? 'Coba ubah filter pencarian Anda.' 
                : 'Mulai dengan menambahkan destinasi pertama Anda.'}
            </p>
            {!searchTerm && filterCategory === 'all' && (
              <div className="mt-6">
                <Link
                  href="/dashboard/destinasi/tambah"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Tambah Destinasi
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 