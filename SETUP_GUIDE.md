# 🚀 Panduan Setup Google Apps Script untuk Admin Dashboard

## 📋 Prerequisites
- Google Account
- Google Sheets
- Google Apps Script

## 🔧 Langkah-langkah Setup

### 1. **Buat Google Spreadsheet**
1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru
3. Rename sheet pertama menjadi "Destinasi"
4. Copy ID spreadsheet dari URL (bagian antara /d/ dan /edit)

### 2. **Setup Google Apps Script**
1. Buka [Google Apps Script](https://script.google.com)
2. Buat project baru
3. Rename project menjadi "Destinasi API"
4. Copy kode dari file `appscript_code.gs`
5. Ganti `YOUR_SPREADSHEET_ID` dengan ID spreadsheet Anda
6. Save project

### 3. **Deploy API**
1. Klik tombol "Deploy" → "New deployment"
2. Pilih "Web app"
3. Set konfigurasi:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Klik "Deploy"
5. Copy URL deployment (akan digunakan di aplikasi)

### 4. **Setup Spreadsheet Headers**
1. Jalankan fungsi `setupSpreadsheet()` di Apps Script
2. Atau manual tambahkan header di sheet "Destinasi":
   ```
   id | nama | lokasi | rating | kategori | img | deskripsi | fasilitas | komentar | dikunjungi
   ```

### 5. **Update Aplikasi Admin**
1. Ganti URL API di file-file berikut:
   - `app/dashboard/destinasi/page.tsx`
   - `app/dashboard/destinasi/tambah/page.tsx`
   - `app/dashboard/destinasi/edit/[id]/page.tsx`

## 📊 Struktur Data Spreadsheet

| Kolom | Field | Tipe | Deskripsi |
|-------|-------|------|-----------|
| A | id | Number | ID unik (auto increment) |
| B | nama | String | Nama destinasi |
| C | lokasi | String | Lokasi destinasi |
| D | rating | Number | Rating (0-5) |
| E | kategori | String | Kategori destinasi |
| F | img | String | URL gambar |
| G | deskripsi | String | Deskripsi destinasi |
| H | fasilitas | String | Daftar fasilitas |
| I | komentar | String | Komentar/catatan |
| J | dikunjungi | Number | Jumlah pengunjung |

## 🔌 API Endpoints

### **GET** - Ambil semua data
```
GET https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### **POST** - Tambah destinasi baru
```
POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
Content-Type: application/json

{
  "nama": "Bali",
  "lokasi": "Bali, Indonesia",
  "rating": 4.5,
  "kategori": "Pantai",
  "img": "https://example.com/image.jpg",
  "deskripsi": "Pulau Dewata",
  "fasilitas": "Parkir, Toilet",
  "komentar": "Tempat indah"
}
```

### **PUT** - Update destinasi
```
PUT https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
Content-Type: application/json

{
  "id": 1,
  "nama": "Bali Updated",
  "lokasi": "Bali, Indonesia",
  "rating": 4.8,
  "kategori": "Pantai",
  "img": "https://example.com/image.jpg",
  "deskripsi": "Pulau Dewata Updated",
  "fasilitas": "Parkir, Toilet, WiFi",
  "komentar": "Tempat indah updated"
}
```

### **DELETE** - Hapus destinasi
```
DELETE https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?id=1
```

## 🛠️ Fungsi Tambahan

### **Increment Visitor Count**
Untuk menambah jumlah pengunjung saat checkout:
```javascript
// Panggil fungsi ini saat checkout
function incrementVisitor(id) {
  // Implementasi di Apps Script
}
```

## 🔒 Keamanan

### **CORS Setup**
Jika ada masalah CORS, tambahkan di Apps Script:
```javascript
function doGet(e) {
  const response = ContentService.createTextOutput(JSON.stringify(data));
  response.setMimeType(ContentService.MimeType.JSON);
  response.setHeader('Access-Control-Allow-Origin', '*');
  return response;
}
```

### **Authentication (Opsional)**
Untuk keamanan tambahan, bisa ditambahkan API key:
```javascript
function validateApiKey(e) {
  const apiKey = e.parameter.apiKey;
  const validKey = 'YOUR_API_KEY';
  return apiKey === validKey;
}
```

## 🐛 Troubleshooting

### **Error: "Spreadsheet not found"**
- Pastikan ID spreadsheet benar
- Pastikan sheet "Destinasi" ada
- Pastikan permission spreadsheet sudah benar

### **Error: "CORS policy"**
- Tambahkan header CORS di Apps Script
- Pastikan deployment sudah benar

### **Error: "Method not allowed"**
- Pastikan fungsi `doPost`, `doPut`, `doDelete` sudah ada
- Pastikan deployment sudah diupdate

### **Data tidak muncul**
- Cek console browser untuk error
- Cek Apps Script logs
- Pastikan struktur data sesuai

## 📝 Testing

### **Test API dengan Postman/curl**
```bash
# Test GET
curl https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Test POST
curl -X POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec \
  -H "Content-Type: application/json" \
  -d '{"nama":"Test","lokasi":"Test","rating":4.0,"kategori":"Test"}'
```

## 🎯 Fitur Lengkap

✅ **CRUD Operations**: Create, Read, Update, Delete  
✅ **Auto Increment ID**: ID otomatis bertambah  
✅ **Error Handling**: Handling error yang baik  
✅ **Visitor Counter**: Auto increment pengunjung  
✅ **Data Validation**: Validasi input data  
✅ **JSON Response**: Response format JSON  
✅ **CORS Support**: Support untuk web app  

## 📞 Support

Jika ada masalah, cek:
1. Apps Script logs
2. Browser console
3. Network tab di browser
4. Spreadsheet permissions 