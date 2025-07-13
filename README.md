# Gemitra Admin Panel

Panel administrasi khusus untuk sistem Gemitra dengan sistem autentikasi yang aman.

## Fitur

- 🔐 **Sistem Login Khusus Admin**: Hanya untuk admin Gemitra
- 🛡️ **Middleware Protection**: Dashboard dilindungi dengan middleware
- 📱 **Responsive Design**: Tampilan yang responsif untuk semua perangkat
- 🎨 **Modern UI**: Interface yang modern dan user-friendly
- 📊 **Dashboard Analytics**: Panel dashboard dengan statistik dan aktivitas

## Struktur Proyek

```
gemitra-admin/
├── app/
│   ├── login/           # Halaman login admin
│   ├── dashboard/       # Dashboard yang dilindungi
│   ├── layout.tsx       # Layout utama
│   └── page.tsx         # Halaman utama (redirect ke login)
├── middleware.ts        # Middleware untuk proteksi rute
└── package.json
```

## Cara Menjalankan

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Jalankan development server:**
   ```bash
   npm run dev
   ```

3. **Buka browser:**
   ```
   http://localhost:3000
   ```

## Kredensial Login

Untuk testing, gunakan kredensial berikut:
- **Username:** `admin`
- **Password:** `gemitra2024`

## Sistem Keamanan

### Middleware Protection
- Semua rute `/dashboard/*` dilindungi oleh middleware
- User yang belum login akan diarahkan ke `/login`
- Token disimpan dalam cookie untuk akses middleware

### Autentikasi
- Login menggunakan localStorage dan cookie
- Logout akan menghapus semua data autentikasi
- Redirect otomatis ke login jika token tidak valid

## Halaman yang Tersedia

### 1. Halaman Login (`/login`)
- Form login dengan validasi
- Loading state saat proses login
- Error handling untuk kredensial salah
- Design modern dengan gradient background

### 2. Dashboard (`/dashboard`)
- **Header**: Menampilkan nama admin dan tombol logout
- **Sidebar**: Menu navigasi (Dashboard, Pengguna, Laporan, Pengaturan)
- **Main Content**: 
  - Welcome card
  - Statistik cards (Total Pengguna, Aktivitas Hari Ini, Pertumbuhan)
  - Aktivitas terbaru

## Teknologi yang Digunakan

- **Next.js 15**: Framework React dengan App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling framework
- **React Hooks**: State management

## Pengembangan

### Menambah Halaman Baru
1. Buat folder baru di `app/`
2. Buat `page.tsx` di dalam folder tersebut
3. Jika perlu proteksi, tambahkan path ke `protectedPaths` di `middleware.ts`

### Mengubah Kredensial
Edit file `app/login/page.tsx` dan ubah kondisi login:
```typescript
if (credentials.username === 'admin' && credentials.password === 'gemitra2024')
```

### Menambah Fitur
- Gunakan komponen yang sudah ada sebagai template
- Ikuti pola design yang konsisten
- Tambahkan validasi dan error handling

## Deployment

Proyek ini siap untuk di-deploy ke platform seperti:
- Vercel (recommended)
- Netlify
- Railway

Pastikan environment variables sudah dikonfigurasi dengan benar untuk production.
