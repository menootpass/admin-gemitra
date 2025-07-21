'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Transaction {
  id: number;
  nama: string;
  destinasi: string;
  penumpang: number;
  tanggal_berangkat: string;
  waktu_berangkat: string;
  kendaraan: string;
  total: number;
  status: string;
  kode: string;
  waktu_transaksi: string;
  tanggal_transaksi: string;
}

interface SummaryData {
  totalTransactions: number;
  totalRevenue: number;
  mostFrequentVehicle: string;
  busiestMonth: string;
  mostFrequentDestination: string;
}

export default function LaporanPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbzCAQWWkb6L86pffPllUQgacS8JPnLSkqmrr7ypFVA3dqT1ndYTk5YXLtUlu-HKrCsfLQ/exec');
        if (!response.ok) {
          throw new Error('Gagal mengambil data transaksi');
        }
        const result = await response.json();
        const transactions: Transaction[] = result.data || [];
        
        if (transactions.length === 0) {
          setSummary({
            totalTransactions: 0,
            totalRevenue: 0,
            mostFrequentVehicle: 'N/A',
            busiestMonth: 'N/A',
            mostFrequentDestination: 'N/A',
          });
          return;
        }

        // Calculate summaries
        const totalTransactions = transactions.length;
        const totalRevenue = transactions.reduce((acc, tx) => acc + (tx.total || 0), 0);
        
        const getFrequency = (arr: string[]) => arr.reduce((acc, value) => {
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const findMostFrequent = (freqMap: Record<string, number>) => {
            return Object.keys(freqMap).reduce((a, b) => freqMap[a] > freqMap[b] ? a : b, 'N/A');
        };

        // Most Frequent Vehicle
        const vehicles = transactions.map(tx => tx.kendaraan);
        const vehicleFreq = getFrequency(vehicles);
        const mostFrequentVehicle = findMostFrequent(vehicleFreq);

        // Busiest Month
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const months = transactions.map(tx => monthNames[new Date(tx.tanggal_transaksi).getMonth()]);
        const monthFreq = getFrequency(months);
        const busiestMonth = findMostFrequent(monthFreq);

        // Most Frequent Destination
        const allDestinations = transactions
            .flatMap(tx => tx.destinasi.split(','))
            .map(d => d.trim());
        const destinationFreq = getFrequency(allDestinations);
        const mostFrequentDestination = findMostFrequent(destinationFreq);
        
        setSummary({
          totalTransactions,
          totalRevenue,
          mostFrequentVehicle,
          busiestMonth,
          mostFrequentDestination,
        });

      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
             <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            <h1 className="text-xl font-bold text-gray-900">Laporan Transaksi</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Transaksi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Jumlah Transaksi</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.totalTransactions}</p>
          </div>
          
          {/* Pemasukan */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Pemasukan</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              Rp {summary?.totalRevenue.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Kendaraan Favorit */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Kendaraan Terlaris</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.mostFrequentVehicle}</p>
          </div>

          {/* Destinasi Favorit */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Destinasi Terlaris</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.mostFrequentDestination}</p>
          </div>
          
          {/* Bulan Tersibuk */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Bulan Paling Ramai</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.busiestMonth}</p>
          </div>
        </div>

        {/* Note about uniqueness of 'kode' */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> Kolom `destinasi` dapat berisi beberapa tujuan (dipisahkan koma) dan dihitung secara individual. Kolom `kode` pada setiap transaksi dibuat unik secara otomatis oleh sistem saat data ditambahkan.
            </p>
        </div>
      </main>
    </div>
  );
} 