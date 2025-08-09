// =================================================================
// ============== KONFIGURASI GLOBAL ===============================
// =================================================================

const SPREADSHEET_ID = '1KeDQC7cUBsn23K2n1gRP25MJ3844pRiVn67RU06vUdc'; // Ganti dengan ID Spreadsheet Anda

// Nama-nama Sheet
const DESTINASI_SHEET_NAME = 'Destinasi';
const EVENT_SHEET_NAME = 'Event';
const TRANSAKSI_SHEET_NAME = 'Transaksi';
const FEEDBACK_SHEET_NAME = 'Feedback';
const VISITORS_SHEET_NAME = 'Visitors';


// =================================================================
// ============== ROUTER UTAMA (DO GET & DO POST) ==================
// =================================================================

/**
 * Menangani semua request GET. Bertindak sebagai router.
 * Gunakan parameter 'endpoint' untuk memilih data.
 * Contoh: ?endpoint=destinations, ?endpoint=events, ?endpoint=transactions, ?endpoint=feedback
 */
function doGet(e) {
  // TAMBAHKAN INI: Cek 'e' untuk menghindari error saat dijalankan manual
  if (!e || !e.parameter) {
    // Berikan response default jika dijalankan dari editor
    return createJsonResponse({ 
      success: false, 
      error: "Fungsi ini harus dipanggil melalui URL Web App, bukan dijalankan langsung dari editor.",
      info: "Coba akses URL deployment Anda dan tambahkan parameter, contoh: ?endpoint=destinations"
    });
  }
  
  const params = e.parameter || {};
  const endpoint = params.endpoint || 'destinations'; // Default ke destinations

  try {
    switch (endpoint) {
      case 'destinations':
        return handleGetDestinations(e);
      case 'events':
        return handleGetEvents(e);
      case 'transactions':
        return handleGetTransactions(e);
      case 'feedback':
        return handleGetFeedback(e);
      default:
        return createJsonResponse({ success: false, error: "Endpoint tidak valid" }, 404);
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() }, 500);
  }
}

/**
 * Menangani semua request POST, PATCH, PUT. Bertindak sebagai router.
 * Gunakan properti 'action' dalam body JSON untuk memilih operasi.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const actionOriginal = data.action;
    const action = (actionOriginal || '').toString().toLowerCase();

    if (!action) {
      return createJsonResponse({ success: false, error: "Properti 'action' tidak ditemukan dalam request body" }, 400);
    }

    let result;
    switch (action) {
      // Actions for Destinations (lowercase + aliases)
      case 'createdestination':
      case 'create':
        result = createDestination(data);
        break;
      case 'updatedestination':
      case 'update':
        result = updateDestination(data);
        break;
      case 'updatecomment':
        result = updateDestinationComment(data);
        break;
      case 'deletedestination':
      case 'delete':
        result = deleteDestination(data);
        break;
      case 'incrementvisitor':
        result = handleVisitorUpdate(data);
        break;

      // Actions for Events (lowercase + aliases)
      case 'addevent':
      case 'createevent':
        result = addNewEvent(data.title, data.description, data.image, data.date, data.location, data.category, data.content, data.author, data.destinasi);
        break;
      case 'updateevent':
        result = updateEventById(data.id, data.title, data.description, data.image, data.date, data.location, data.category, data.content, data.author, data.destinasi);
        break;
      case 'deleteevent':
        result = deleteEventById(data.id);
        break;
      case 'incrementpembaca':
        result = incrementTotalPembaca(data.id);
        break;

      // Actions for Transactions
      case 'createtransaction':
        result = handleTransaction(data);
        break;

      // Actions for Feedback
      case 'createfeedback':
        result = createFeedback(data);
        break;

      // Actions for Visitor Tracking
      case 'trackvisitor':
        return trackVisitor(); // Fungsi ini punya return sendiri

      default:
        result = { success: false, error: `Action '${actionOriginal}' tidak dikenal` };
    }
    return createJsonResponse(result);

  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() }, 500);
  }
}

// Handler untuk PATCH & PUT (diarahkan ke doPost)
function doPatch(e) { return doPost(e); }
function doPut(e) { return doPost(e); }

// =================================================================
// ============== KUMPULAN FUNGSI HELPER ===========================
// =================================================================

/**
 * Membuat response JSON standar.
 * @param {object} data - Objek yang akan di-serialize ke JSON.
 * @returns {ContentService.TextOutput} - Objek response.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Normalizes various image input formats into a JSON string array of URLs.
 * Accepts:
 * - Array of URLs -> returns JSON string
 * - JSON string array -> returns JSON string
 * - Comma/newline separated URLs -> returns JSON string
 * - Comma/newline separated Google Drive IDs -> converts to view URLs and returns JSON string
 * - Single URL string -> returns the same string
 */
function normalizeImageInput(imgInput) {
  if (!imgInput && imgInput !== 0) return '';

  // If already an array
  if (Array.isArray(imgInput)) {
    return JSON.stringify(imgInput);
  }

  if (typeof imgInput === 'string') {
    var trimmed = imgInput.trim();

    // If looks like a JSON array string, try parse then stringify cleanly
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('\"[') && trimmed.endsWith(']\"'))) {
      try {
        var parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return JSON.stringify(parsed);
        }
      } catch (e) {
        // fallthrough to tokenization
      }
    }

    // Tokenize by comma or newline, strip surrounding quotes
    var rawTokens = trimmed.split(/\n|,/).map(function(t){ return t.trim(); }).filter(function(t){ return t.length > 0; });
    // If only one token and it's a single URL, return as-is (backend expects string in some places)
    if (rawTokens.length === 1) {
      var t = rawTokens[0].replace(/^"|"$/g, '');
      // If contains http(s), it's a URL
      if (t.indexOf('http://') === 0 || t.indexOf('https://') === 0) {
        return t;
      }
      // Otherwise treat as single ID
      return JSON.stringify(["https://drive.google.com/uc?export=view&id=" + t]);
    }

    // Map tokens: if token is URL, keep; if ID, convert
    var urls = rawTokens.map(function(token){
      var clean = token.replace(/^"|"$/g, '');
      // Extract ID from common Drive URL shapes
      var byQuery = clean.match(/id=([^&\"]+)/);
      if (byQuery && byQuery[1]) return "https://drive.google.com/uc?export=view&id=" + byQuery[1];
      var byPath = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (byPath && byPath[1]) return "https://drive.google.com/uc?export=view&id=" + byPath[1];
      // If token already looks like URL, keep
      if (clean.indexOf('http://') === 0 || clean.indexOf('https://') === 0) return clean;
      // Fallback: treat as ID
      return "https://drive.google.com/uc?export=view&id=" + clean;
    });

    return JSON.stringify(urls);
  }

  return '';
}

/**
 * Menghasilkan slug yang unik dari sebuah string (judul).
 * @param {string} title - Judul yang akan diubah menjadi slug.
 * @param {string[]} existingSlugs - Array dari slug yang sudah ada untuk pengecekan.
 * @returns {string} - Slug yang unik.
 */
function generateUniqueSlug(title, existingSlugs) {
  if (!title) return "";
  const baseSlug = title.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, '') // Hapus karakter spesial
    .replace(/[\s_-]+/g, '-') // Ganti spasi & underscore dengan strip
    .replace(/^-+|-+$/g, ''); // Hapus strip di awal/akhir

  let finalSlug = baseSlug;
  let counter = 1;
  while (existingSlugs.includes(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return finalSlug;
}

// =================================================================
// ============== FUNGSI-FUNGSI UNTUK DESTINASI ====================
// =================================================================

function handleGetDestinations(e) {
  const slug = e.parameter.slug;
  if (slug) {
    return createJsonResponse(getDestinationBySlug(slug));
  }
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
  const destinations = rows.map(row => {
    let destination = {};
      headers.forEach((header, i) => {
        destination[header] = row[i];
      });
      return destination;
    });
  return createJsonResponse({ success: true, data: destinations });
}

function getDestinationBySlug(slug) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
  const dataRange = sheet.getDataRange().getValues();
  const headers = dataRange[0];
  const slugIndex = headers.indexOf('slug');

  if (slugIndex === -1) return { success: false, error: 'Kolom slug tidak ditemukan' };
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][slugIndex] === slug) {
      let destination = {};
      headers.forEach((header, index) => {
        destination[header] = dataRange[i][index];
      });
      return { success: true, data: destination };
    }
  }
  return { success: false, error: 'Destinasi tidak ditemukan' };
}

function updateDestinationComment(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    const idIndex = dataRange[0].indexOf('id');
    const commentIndex = dataRange[0].indexOf('komentar');

    if (idIndex === -1 || commentIndex === -1) return { success: false, error: "Kolom 'id' atau 'komentar' tidak ditemukan." };

    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][idIndex] == data.destinationId) {
        sheet.getRange(i + 1, commentIndex + 1).setValue(data.komentar);
        return { success: true, message: 'Komentar berhasil diperbarui', destinationId: data.destinationId };
      }
    }
    return { success: false, error: 'Destinasi tidak ditemukan' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Fungsi untuk membuat destinasi baru
function createDestination(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    const headers = dataRange[0];
    const namaIndex = headers.indexOf('nama');
    const slugIndex = headers.indexOf('slug');

    // --- VALIDASI NAMA DUPLIKAT DIMULAI DI SINI ---
    const newName = data.nama || '';
    if (!newName) {
      return { success: false, error: "Nama destinasi tidak boleh kosong." };
    }

    // Ambil semua nama yang sudah ada dan ubah ke huruf kecil untuk perbandingan
    const existingNames = dataRange.slice(1).map(row => row[namaIndex].toString().trim().toLowerCase());
    
    // Cek apakah nama baru sudah ada
    if (existingNames.includes(newName.trim().toLowerCase())) {
      return { success: false, error: `Nama destinasi "${newName}" sudah ada. Harap gunakan nama lain.` };
    }
    // --- VALIDASI SELESAI ---

    // Generate ID baru (auto-increment)
    const lastRow = sheet.getLastRow();
    const newId = lastRow > 0 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    // Generate slug yang unik dari nama destinasi
    const existingSlugs = dataRange.slice(1).map(row => row[slugIndex]).filter(slug => slug && slug.trim() !== '');
    const uniqueSlug = generateUniqueSlug(newName, existingSlugs);
    
    // Normalize image input (IDs/URLs) to clean JSON array string of URLs
    var imgData = normalizeImageInput(data.img);
    
    // Siapkan data untuk baris baru
    const newData = [
      newId,
      newName,
      data.lokasi || '',
      data.rating || 0,
      data.kategori || '',
      imgData,
      data.deskripsi || '',
      data.fasilitas || '',
      '[]', // Komentar default dalam bentuk string JSON array kosong
      data.dikunjungi || 0,
      data.posisi || '',
      data.harga || 0,
      uniqueSlug,
    ];
    
    // Tambahkan baris baru ke sheet
    sheet.appendRow(newData);
    
    return { 
      success: true, 
      message: 'Destinasi berhasil ditambahkan',
      id: newId,
      slug: uniqueSlug
    };
  } catch (error) {
    Logger.log(error.toString()); // Log error untuk debugging
    return { success: false, error: error.toString() };
  }
}

// Fungsi untuk mengupdate destinasi
function updateDestination(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    // Cari row berdasarkan ID
    let rowIndex = -1;
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0] == data.id) {
        rowIndex = i + 1; // +1 karena sheet dimulai dari 1
        break;
      }
    }
    if (rowIndex === -1) {
      return { error: 'Destinasi tidak ditemukan' };
    }
    // Generate new slug if nama changed
    let slug = data.slug || '';
    if (data.nama && data.nama !== dataRange[rowIndex - 1][1]) { // If nama changed
      const existingSlugs = getAllExistingSlugs();
      slug = generateUniqueSlug(data.nama, existingSlugs);
    }
    
    // Normalize image input (IDs/URLs) to clean JSON array string of URLs
    var imgData = normalizeImageInput(data.img);
    
    // Update data
    const updateData = [
      data.id,
      data.nama || '',
      data.lokasi || '',
      data.rating || 0,
      data.kategori || '',
      imgData,
      data.deskripsi || '',
      data.fasilitas || '',
      data.komentar || '',
      data.dikunjungi || 0,
      data.posisi || '',
      data.harga || 0,
      slug,
    ];
    // Update row
    const range = sheet.getRange(rowIndex, 1, 1, updateData.length);
    range.setValues([updateData]);
    return { 
      success: true, 
      message: 'Destinasi berhasil diperbarui' 
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

// Fungsi untuk menghapus destinasi
function deleteDestination(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    // Cari row berdasarkan ID
    let rowIndex = -1;
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0] == data.id) {
        rowIndex = i + 1; // +1 karena sheet dimulai dari 1
        break;
      }
    }
    if (rowIndex === -1) {
      return { error: 'Destinasi tidak ditemukan' };
    }
    // Hapus row
    sheet.deleteRow(rowIndex);
    return { 
      success: true, 
      message: 'Destinasi berhasil dihapus' 
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

// Fungsi untuk menambah jumlah pengunjung berdasarkan ID (untuk checkout)
function incrementVisitor(id) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    // Cari row berdasarkan ID
    let rowIndex = -1;
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0] == id) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) {
      return { error: 'Destinasi tidak ditemukan' };
    }
    // Ambil jumlah pengunjung saat ini
    const currentVisitors = sheet.getRange(rowIndex, 10).getValue(); // Kolom 10 = dikunjungi
    const newVisitors = currentVisitors + 1;
    // Update jumlah pengunjung
    sheet.getRange(rowIndex, 10).setValue(newVisitors);
    return { success: true, newCount: newVisitors };
  } catch (error) {
    return { error: error.toString() };
  }
}

// Fungsi untuk menangani update visitor
function handleVisitorUpdate(data) {
  try {
    if (data.destinasi) {
      const destinasiNames = data.destinasi.split(',').map(name => name.trim());
      return incrementDestinationVisitors(destinasiNames);
    }
    return { success: false, error: 'Destinasi tidak ditemukan' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Fungsi untuk menambah jumlah pengunjung berdasarkan nama destinasi
function incrementVisitorByName(destinasiName) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    const headers = dataRange[0];
    const rows = dataRange.slice(1);
    
    // Find nama column index
    const namaIndex = headers.indexOf('nama');
    const dikunjungiIndex = headers.indexOf('dikunjungi');
    
    if (namaIndex === -1 || dikunjungiIndex === -1) {
      return { error: 'Required columns not found' };
    }
    
    // Find destination by name (case-insensitive)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sheetDestinasiName = row[namaIndex];
      
      if (sheetDestinasiName && sheetDestinasiName.toString().toLowerCase() === destinasiName.toLowerCase()) {
        // Get current visitor count
        const currentVisitors = parseInt(row[dikunjungiIndex]) || 0;
        const newVisitors = currentVisitors + 1;
        
        // Update the visitor count in the sheet
        sheet.getRange(i + 2, dikunjungiIndex + 1).setValue(newVisitors);
        
        return { 
          success: true, 
          destinasi: destinasiName,
          oldCount: currentVisitors,
          newCount: newVisitors 
        };
      }
    }
    
    return { error: `Destinasi "${destinasiName}" tidak ditemukan` };
  } catch (error) {
    return { error: error.toString() };
  }
}

// Fungsi untuk mendapatkan semua slug yang ada
function getAllExistingSlugs() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    const headers = dataRange[0];
    const rows = dataRange.slice(1);
    
    const slugIndex = headers.indexOf('slug');
    if (slugIndex === -1) return [];
    
    return rows
      .map(row => row[slugIndex])
      .filter(slug => slug && slug.trim() !== '');
  } catch (error) {
    console.error('Error getting existing slugs:', error);
    return [];
  }
}

// Fungsi untuk mengisi slug yang kosong (jalankan sekali)
function fillEmptySlugs() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    const headers = dataRange[0];
    const rows = dataRange.slice(1);
    
    const slugIndex = headers.indexOf('slug');
    const namaIndex = headers.indexOf('nama');
    
    if (slugIndex === -1 || namaIndex === -1) {
      console.log('Slug atau nama column tidak ditemukan');
      return;
    }
    
    let updatedCount = 0;
    const existingSlugs = getAllExistingSlugs();
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const currentSlug = row[slugIndex];
      const nama = row[namaIndex];
      
      // Jika slug kosong atau tidak ada, generate slug baru
      if (!currentSlug || currentSlug.trim() === '') {
        const newSlug = generateUniqueSlug(nama, existingSlugs);
        sheet.getRange(i + 2, slugIndex + 1).setValue(newSlug);
        existingSlugs.push(newSlug);
        updatedCount++;
      }
    }
    
    console.log(`Berhasil mengisi ${updatedCount} slug yang kosong`);
  } catch (error) {
    console.error('Error filling empty slugs:', error);
  }
}

// ... Tambahkan fungsi CRUD lain untuk Destinasi jika diperlukan ...

// =================================================================
// ============== FUNGSI-FUNGSI UNTUK EVENT ========================
// =================================================================

function handleGetEvents(e) {
  const params = e.parameter || {};
  if (params.slug) return createJsonResponse(getEventBySlug(params.slug));
  if (params.category) return createJsonResponse({ success: true, data: getEventsByCategory(params.category) });
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EVENT_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const events = data.slice(1).map(row => {
    let event = {};
    headers.forEach((header, i) => {
      event[header] = row[i];
    });
    return event;
  });

  return createJsonResponse({ success: true, data: events });
}

function getEventBySlug(slug) {
  // ... (Logika dari event.gs)
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return null;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return null;
    }

    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const titleIndex = headers.indexOf("title");
    const descriptionIndex = headers.indexOf("description");
    const imageIndex = headers.indexOf("image");
    const dateIndex = headers.indexOf("date");
    const locationIndex = headers.indexOf("location");
    const categoryIndex = headers.indexOf("category");
    const totalPembacaIndex = headers.indexOf("totalPembaca");
    const contentIndex = headers.indexOf("content");
    const authorIndex = headers.indexOf("author");
    const slugIndex = headers.indexOf("slug");
    const destinasiIndex = headers.indexOf("destinasi");

    // Cari event dengan slug yang sesuai
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[slugIndex] && row[slugIndex].toString().toLowerCase() === slug.toLowerCase()) {
        
        // Parse totalPembaca
        let totalPembaca = 0;
        if (row[totalPembacaIndex]) {
          const pembacaValue = row[totalPembacaIndex];
          if (typeof pembacaValue === 'number') {
            totalPembaca = pembacaValue;
          } else if (typeof pembacaValue === 'string') {
            totalPembaca = parseInt(pembacaValue) || 0;
          }
        }

        // Format tanggal
        let formattedDate = "";
        if (row[dateIndex]) {
          try {
            const date = new Date(row[dateIndex]);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            formattedDate = row[dateIndex].toString();
          }
        }

        // Process image data
        let imageData = null;
        if (row[imageIndex]) {
          const imgValue = row[imageIndex];
          if (typeof imgValue === 'string') {
            try {
              const parsed = JSON.parse(imgValue);
              if (Array.isArray(parsed) && parsed.length > 0) {
                imageData = parsed;
              } else {
                imageData = [imgValue];
              }
            } catch (e) {
              if (imgValue.startsWith('http://') || imgValue.startsWith('https://')) {
                imageData = [imgValue];
              } else if (imgValue.includes('drive.google.com')) {
                imageData = [imgValue];
              } else {
                imageData = [imgValue];
              }
            }
          } else if (Array.isArray(imgValue)) {
            imageData = imgValue;
          }
        }

        // Process destinasi data
        let destinasiData = [];
        const actualDestinasiIndex = destinasiIndex !== -1 ? destinasiIndex : 
          (() => {
            const alternatives = ["Destinasi", "destinasi", "DESTINASI", "destinations", "Destinations"];
            for (const altName of alternatives) {
              const index = headers.indexOf(altName);
              if (index !== -1) return index;
            }
            return -1;
          })();
        
        if (actualDestinasiIndex !== -1 && row[actualDestinasiIndex]) {
          const destinasiValue = row[actualDestinasiIndex];
          if (typeof destinasiValue === 'string') {
            destinasiData = destinasiValue.split(',').map(dest => dest.trim()).filter(dest => dest.length > 0);
          } else if (Array.isArray(destinasiValue)) {
            destinasiData = destinasiValue;
          }
        }

        return {
          id: row[idIndex].toString(),
          title: row[titleIndex] ? row[titleIndex].toString() : "",
          description: row[descriptionIndex] ? row[descriptionIndex].toString() : "",
          image: imageData,
          date: formattedDate,
          location: row[locationIndex] ? row[locationIndex].toString() : "",
          category: row[categoryIndex] ? row[categoryIndex].toString() : "",
          totalPembaca: totalPembaca,
          content: row[contentIndex] ? row[contentIndex].toString() : "",
          author: row[authorIndex] ? row[authorIndex].toString() : "",
          slug: row[slugIndex] ? row[slugIndex].toString() : "",
          destinasi: destinasiData
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

function getEventsByCategory(category) {
  // ... (Logika dari event.gs)
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }

    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const titleIndex = headers.indexOf("title");
    const descriptionIndex = headers.indexOf("description");
    const imageIndex = headers.indexOf("image");
    const dateIndex = headers.indexOf("date");
    const locationIndex = headers.indexOf("location");
    const categoryIndex = headers.indexOf("category");
    const totalPembacaIndex = headers.indexOf("totalPembaca");
    const contentIndex = headers.indexOf("content");
    const authorIndex = headers.indexOf("author");
    const slugIndex = headers.indexOf("slug");
    const destinasiIndex = headers.indexOf("destinasi");

    const events = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip baris kosong
      if (!row[idIndex] || row[idIndex].toString().trim() === "") {
        continue;
      }

      // Filter berdasarkan kategori
      if (row[categoryIndex] && row[categoryIndex].toString().toLowerCase() === category.toLowerCase()) {
        
        // Parse totalPembaca
        let totalPembaca = 0;
        if (row[totalPembacaIndex]) {
          const pembacaValue = row[totalPembacaIndex];
          if (typeof pembacaValue === 'number') {
            totalPembaca = pembacaValue;
          } else if (typeof pembacaValue === 'string') {
            totalPembaca = parseInt(pembacaValue) || 0;
          }
        }

        // Format tanggal
        let formattedDate = "";
        if (row[dateIndex]) {
          try {
            const date = new Date(row[dateIndex]);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            formattedDate = row[dateIndex].toString();
          }
        }

        // Process image data
        let imageData = null;
        if (row[imageIndex]) {
          const imgValue = row[imageIndex];
          if (typeof imgValue === 'string') {
            try {
              const parsed = JSON.parse(imgValue);
              if (Array.isArray(parsed) && parsed.length > 0) {
                imageData = parsed;
              } else {
                imageData = [imgValue];
              }
            } catch (e) {
              if (imgValue.startsWith('http://') || imgValue.startsWith('https://')) {
                imageData = [imgValue];
              } else if (imgValue.includes('drive.google.com')) {
                imageData = [imgValue];
              } else {
                imageData = [imgValue];
              }
            }
          } else if (Array.isArray(imgValue)) {
            imageData = imgValue;
          }
        }

        // Process destinasi data
        let destinasiData = [];
        const actualDestinasiIndex = destinasiIndex !== -1 ? destinasiIndex : 
          (() => {
            const alternatives = ["Destinasi", "destinasi", "DESTINASI", "destinations", "Destinations"];
            for (const altName of alternatives) {
              const index = headers.indexOf(altName);
              if (index !== -1) return index;
            }
            return -1;
          })();
        
        if (actualDestinasiIndex !== -1 && row[actualDestinasiIndex]) {
          const destinasiValue = row[actualDestinasiIndex];
          if (typeof destinasiValue === 'string') {
            destinasiData = destinasiValue.split(',').map(dest => dest.trim()).filter(dest => dest.length > 0);
          } else if (Array.isArray(destinasiValue)) {
            destinasiData = destinasiValue;
          }
        }

        const event = {
          id: row[idIndex].toString(),
          title: row[titleIndex] ? row[titleIndex].toString() : "",
          description: row[descriptionIndex] ? row[descriptionIndex].toString() : "",
          image: imageData,
          date: formattedDate,
          location: row[locationIndex] ? row[locationIndex].toString() : "",
          category: row[categoryIndex] ? row[categoryIndex].toString() : "",
          totalPembaca: totalPembaca,
          content: row[contentIndex] ? row[contentIndex].toString() : "",
          author: row[authorIndex] ? row[authorIndex].toString() : "",
          slug: row[slugIndex] ? row[slugIndex].toString() : "",
          destinasi: destinasiData
        };

        events.push(event);
      }
    }

    return events;
  } catch (error) {
    return [];
  }
}

// Fungsi untuk update event berdasarkan ID
function updateEventById(eventId, title, description, image, date, location, category, content, author, destinasi) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return { success: false, error: "Sheet 'Event' tidak ditemukan" };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, error: "Tidak ada data event" };
    }

    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const titleIndex = headers.indexOf("title");
    const descriptionIndex = headers.indexOf("description");
    const imageIndex = headers.indexOf("image");
    const dateIndex = headers.indexOf("date");
    const locationIndex = headers.indexOf("location");
    const categoryIndex = headers.indexOf("category");
    const contentIndex = headers.indexOf("content");
    const authorIndex = headers.indexOf("author");
    const slugIndex = headers.indexOf("slug");
    const destinasiIndex = headers.indexOf("destinasi");

    // Cari baris dengan ID yang sesuai
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[idIndex] && row[idIndex].toString() === eventId.toString()) {
        
        // Generate slug baru jika title berubah
        let finalSlug = row[slugIndex] || '';
        if (title && title !== row[titleIndex]) {
          const existingSlugs = data.slice(1).map((r, idx) => ({
            slug: r[slugIndex],
            index: idx + 1
          })).filter(item => item.slug && item.index !== i);
          
          let baseSlug = generateSlug(title);
          let counter = 1;
          while (existingSlugs.some(item => item.slug === baseSlug)) {
            baseSlug = `${generateSlug(title)}-${counter}`;
            counter++;
          }
          finalSlug = baseSlug;
        }

        // Update data
        const updateData = [
          eventId,
          title || row[titleIndex],
          description || row[descriptionIndex],
          image || row[imageIndex],
          date || row[dateIndex],
          location || row[locationIndex],
          category || row[categoryIndex],
          row[headers.indexOf("totalPembaca")] || 0,
          content || row[contentIndex],
          author || row[authorIndex],
          finalSlug,
          destinasi || row[destinasiIndex] || ""
        ];

        // Update row
        const range = sheet.getRange(i + 1, 1, 1, updateData.length);
        range.setValues([updateData]);

        return {
          success: true,
          message: 'Event berhasil diperbarui',
          data: {
            id: eventId,
            title: title || row[titleIndex],
            description: description || row[descriptionIndex],
            image: image || row[imageIndex],
            date: date || row[dateIndex],
            location: location || row[locationIndex],
            category: category || row[categoryIndex],
            content: content || row[contentIndex],
            author: author || row[authorIndex],
            slug: finalSlug,
            destinasi: destinasi ? destinasi.split(',').map(dest => dest.trim()).filter(dest => dest.length > 0) : []
          }
        };
      }
    }

    return { success: false, error: "Event tidak ditemukan" };
  } catch (error) {
    return { success: false, error: "Terjadi kesalahan: " + error.toString() };
  }
}

// Fungsi untuk delete event berdasarkan ID
function deleteEventById(eventId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return { success: false, error: "Sheet 'Event' tidak ditemukan" };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, error: "Tidak ada data event" };
    }

    const headers = data[0];
    const idIndex = headers.indexOf("id");

    // Cari baris dengan ID yang sesuai
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[idIndex] && row[idIndex].toString() === eventId.toString()) {
        // Hapus baris
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Event berhasil dihapus' };
      }
    }

    return { success: false, error: "Event tidak ditemukan" };
  } catch (error) {
    return { success: false, error: "Terjadi kesalahan: " + error.toString() };
  }
}

function incrementTotalPembaca(eventId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return { success: false, error: "Sheet 'Event' tidak ditemukan" };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, error: "Tidak ada data event" };
    }

    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const totalPembacaIndex = headers.indexOf("totalPembaca");

    if (idIndex === -1 || totalPembacaIndex === -1) {
      return { success: false, error: "Kolom 'id' atau 'totalPembaca' tidak ditemukan" };
    }

    // Cari baris dengan ID yang sesuai
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[idIndex] && row[idIndex].toString() === eventId.toString()) {
        
        // Ambil nilai total pembaca saat ini
        let currentTotal = 0;
        if (row[totalPembacaIndex]) {
          const pembacaValue = row[totalPembacaIndex];
          if (typeof pembacaValue === 'number') {
            currentTotal = pembacaValue;
          } else if (typeof pembacaValue === 'string') {
            currentTotal = parseInt(pembacaValue) || 0;
          }
        }

        // Increment total pembaca
        const newTotal = currentTotal + 1;
        
        // Update nilai di spreadsheet
        sheet.getRange(i + 1, totalPembacaIndex + 1).setValue(newTotal);
        
        return { success: true, message: 'Total pembaca berhasil ditambah', newTotal: newTotal };
      }
    }

    return { success: false, error: "Event tidak ditemukan" };
  } catch (error) {
    return { success: false, error: "Terjadi kesalahan: " + error.toString() };
  }
}

function generateSlug(title) {
  if (!title) return "";
  
  return title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

function addNewEvent(title, description, image, date, location, category, content, author, destinasi) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return { success: false, error: "Sheet 'Event' tidak ditemukan" };
    }

    // Generate slug dari title
    let baseSlug = generateSlug(title);
    let finalSlug = baseSlug;
    let counter = 1;

    // Cek apakah slug sudah ada, jika ada tambahkan angka
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const slugIndex = headers.indexOf("slug");
    
    if (slugIndex !== -1) {
      const existingSlugs = data.slice(1).map(row => row[slugIndex]).filter(slug => slug);
      
      while (existingSlugs.includes(finalSlug)) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Generate ID baru
    const idIndex = headers.indexOf("id");
    let newId = 1;
    if (idIndex !== -1) {
      const existingIds = data.slice(1).map(row => parseInt(row[idIndex])).filter(id => !isNaN(id));
      if (existingIds.length > 0) {
        newId = Math.max(...existingIds) + 1;
      }
    }

    // Siapkan data untuk ditambahkan
    const newRow = [
      newId,
      title,
      description,
      image,
      date,
      location,
      category,
      0, // totalPembaca default 0
      content,
      author,
      finalSlug,
      destinasi || "" // destinasi column
    ];

    // Tambahkan ke sheet
    sheet.appendRow(newRow);

    return {
      success: true,
      data: {
        id: newId,
        title: title,
        description: description,
        image: image,
        date: date,
        location: location,
        category: category,
        totalPembaca: 0,
        content: content,
        author: author,
        slug: finalSlug,
        destinasi: destinasi ? destinasi.split(',').map(dest => dest.trim()).filter(dest => dest.length > 0) : []
      }
    };

  } catch (error) {
    return { success: false, error: "Terjadi kesalahan: " + error.toString() };
  }
}

// Function untuk update slug jika title berubah
function updateSlugForEvent(eventId, newTitle) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return false;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return false;
    }

    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const titleIndex = headers.indexOf("title");
    const slugIndex = headers.indexOf("slug");

    if (idIndex === -1 || titleIndex === -1 || slugIndex === -1) {
      return false;
    }

    // Cari baris dengan ID yang sesuai
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[idIndex] && row[idIndex].toString() === eventId.toString()) {
        
        // Generate slug baru
        let baseSlug = generateSlug(newTitle);
        let finalSlug = baseSlug;
        let counter = 1;

        // Cek apakah slug sudah ada (kecuali untuk event ini sendiri)
        const existingSlugs = data.slice(1).map((r, idx) => ({
          slug: r[slugIndex],
          index: idx + 1
        })).filter(item => item.slug && item.index !== i);

        while (existingSlugs.some(item => item.slug === finalSlug)) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Update title dan slug
        sheet.getRange(i + 1, titleIndex + 1).setValue(newTitle);
        sheet.getRange(i + 1, slugIndex + 1).setValue(finalSlug);
        
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

// Function untuk mendapatkan event berdasarkan ID
function getEventById(eventId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return null;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return null;
    }

    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const titleIndex = headers.indexOf("title");
    const descriptionIndex = headers.indexOf("description");
    const imageIndex = headers.indexOf("image");
    const dateIndex = headers.indexOf("date");
    const locationIndex = headers.indexOf("location");
    const categoryIndex = headers.indexOf("category");
    const totalPembacaIndex = headers.indexOf("totalPembaca");
    const contentIndex = headers.indexOf("content");
    const authorIndex = headers.indexOf("author");
    const slugIndex = headers.indexOf("slug");
    const destinasiIndex = headers.indexOf("destinasi");

    // Cari event dengan ID yang sesuai
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[idIndex] && row[idIndex].toString() === eventId.toString()) {
        
        // Parse totalPembaca
        let totalPembaca = 0;
        if (row[totalPembacaIndex]) {
          const pembacaValue = row[totalPembacaIndex];
          if (typeof pembacaValue === 'number') {
            totalPembaca = pembacaValue;
          } else if (typeof pembacaValue === 'string') {
            totalPembaca = parseInt(pembacaValue) || 0;
          }
        }

        // Format tanggal
        let formattedDate = "";
        if (row[dateIndex]) {
          try {
            const date = new Date(row[dateIndex]);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            formattedDate = row[dateIndex].toString();
          }
        }

        // Process image data
        let imageData = null;
        if (row[imageIndex]) {
          const imgValue = row[imageIndex];
          if (typeof imgValue === 'string') {
            try {
              const parsed = JSON.parse(imgValue);
              if (Array.isArray(parsed) && parsed.length > 0) {
                imageData = parsed;
              } else {
                imageData = [imgValue];
              }
            } catch (e) {
              if (imgValue.startsWith('http://') || imgValue.startsWith('https://')) {
                imageData = [imgValue];
              } else if (imgValue.includes('drive.google.com')) {
                imageData = [imgValue];
              } else {
                imageData = [imgValue];
              }
            }
          } else if (Array.isArray(imgValue)) {
            imageData = imgValue;
          }
        }

        // Process destinasi data
        let destinasiData = [];
        const actualDestinasiIndex = destinasiIndex !== -1 ? destinasiIndex : 
          (() => {
            const alternatives = ["Destinasi", "destinasi", "DESTINASI", "destinations", "Destinations"];
            for (const altName of alternatives) {
              const index = headers.indexOf(altName);
              if (index !== -1) return index;
            }
            return -1;
          })();
        
        if (actualDestinasiIndex !== -1 && row[actualDestinasiIndex]) {
          const destinasiValue = row[actualDestinasiIndex];
          if (typeof destinasiValue === 'string') {
            destinasiData = destinasiValue.split(',').map(dest => dest.trim()).filter(dest => dest.length > 0);
          } else if (Array.isArray(destinasiValue)) {
            destinasiData = destinasiValue;
          }
        }

        return {
          id: row[idIndex].toString(),
          title: row[titleIndex] ? row[titleIndex].toString() : "",
          description: row[descriptionIndex] ? row[descriptionIndex].toString() : "",
          image: imageData,
          date: formattedDate,
          location: row[locationIndex] ? row[locationIndex].toString() : "",
          category: row[categoryIndex] ? row[categoryIndex].toString() : "",
          totalPembaca: totalPembaca,
          content: row[contentIndex] ? row[contentIndex].toString() : "",
          author: row[authorIndex] ? row[authorIndex].toString() : "",
          slug: row[slugIndex] ? row[slugIndex].toString() : "",
          destinasi: destinasiData
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}


function handleGetEvents(e) {
  const params = e.parameter || {};
  const action = (params.action || '').toString().toLowerCase();

  // Routing berdasarkan parameter
  if ((action === 'slug' || params.slug) && params.slug) {
    const bySlug = getEventBySlug(params.slug);
    return createJsonResponse({ success: true, data: bySlug });
  }

  if ((action === 'id' || params.id) && params.id) {
    const byId = getEventById(params.id);
    return createJsonResponse({ success: true, data: byId });
  }

  if (action === 'category' && params.category) {
    const byCategory = getEventsByCategory(params.category);
    return createJsonResponse({ success: true, data: byCategory });
  }

  // Jika tidak ada parameter, kembalikan semua event
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EVENT_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const events = data.slice(1).map(row => {
    let event = {};
    headers.forEach((header, i) => {
      event[header] = row[i];
    });
    return event;
  });

  return createJsonResponse({ success: true, data: events });
}


// =================================================================
// ============== FUNGSI-FUNGSI UNTUK TRANSAKSI ====================
// =================================================================

function handleGetTransactions(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TRANSAKSI_SHEET_NAME);
  const dataRange = sheet.getDataRange().getValues();
  const headers = dataRange[0];
  const rows = dataRange.slice(1);
    
  const transactions = rows.map(row => {
    const transaction = {};
    headers.forEach((header, i) => {
      transaction[header] = row[i];
    });
    return transaction;
  });
  return createJsonResponse({ success: true, data: transactions });
}

function handleTransaction(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TRANSAKSI_SHEET_NAME);
    const newId = getNextTransactionId();
    const kodeTransaksi = `INV-${new Date().getTime()}`;
    const now = new Date();
    const tanggalTransaksi = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const waktuTransaksi = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    
    const newRow = [
      newId, data.nama || '', data.destinasi || '', data.penumpang || 0,
      data.tanggal_berangkat || '', data.waktu_berangkat || '',
      data.kendaraan || '', data.total || 0, 'pending', kodeTransaksi,
      waktuTransaksi, tanggalTransaksi
    ];
    
    sheet.appendRow(newRow);
    
    if (data.destinasi) {
      const destinasiNames = data.destinasi.split(',').map(name => name.trim());
      incrementDestinationVisitors(destinasiNames);
    }
    
    return { success: true, message: 'Transaksi berhasil ditambahkan', id: newId, kode: kodeTransaksi };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getNextTransactionId() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TRANSAKSI_SHEET_NAME);
  if (!sheet) return 1;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return (typeof lastId === 'number' && !isNaN(lastId)) ? lastId + 1 : lastRow;
}

function incrementDestinationVisitors(destinasiNames) {
  const destinasiSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DESTINASI_SHEET_NAME);
  if (!destinasiSheet) return;

  const destinasiData = destinasiSheet.getDataRange().getValues();
  const headers = destinasiData[0];
  const namaIndex = headers.indexOf('nama');
  const dikunjungiIndex = headers.indexOf('dikunjungi');
  if (namaIndex === -1 || dikunjungiIndex === -1) return;

  const rows = destinasiData.slice(1);
  destinasiNames.forEach(destinasiName => {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][namaIndex] && rows[i][namaIndex].toString().toLowerCase() === destinasiName.toLowerCase()) {
        const currentVisitors = parseInt(rows[i][dikunjungiIndex]) || 0;
        destinasiSheet.getRange(i + 2, dikunjungiIndex + 1).setValue(currentVisitors + 1);
        break;
      }
    }
  });
}


// =================================================================
// ============== FUNGSI-FUNGSI UNTUK FEEDBACK =====================
// =================================================================

function handleGetFeedback(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(FEEDBACK_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  const feedbacks = rows.map(row => {
    let feedback = {};
    headers.forEach((header, i) => { feedback[header] = row[i]; });
    return feedback;
  });
  return createJsonResponse({ success: true, data: feedbacks });
}

function createFeedback(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(FEEDBACK_SHEET_NAME);
    const lastRow = sheet.getLastRow();
    const newId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    const newData = [
      newId, data.nama || '', data.email || '', data.telepon || '',
      data.kategori || 'umum', data.rating || 0, data.pesan || '',
      'pending', new Date().toISOString()
    ];
    
    sheet.appendRow(newData);
    return { success: true, message: 'Feedback berhasil dikirim', id: newId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Fungsi untuk mengupdate feedback
function updateFeedback(data) {
  try {
    const sheet = SpreadsheetApp.openById(FEEDBACK_SPREADSHEET_ID).getSheetByName(FEEDBACK_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    
    // Cari row berdasarkan ID
    let rowIndex = -1;
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0] == data.id) {
        rowIndex = i + 1; // +1 karena sheet dimulai dari 1
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { error: 'Feedback tidak ditemukan' };
    }
    
    // Update data
    const updateData = [
      data.id,
      data.nama || '',
      data.email || '',
      data.telepon || '',
      data.kategori || '',
      data.rating || 0,
      data.pesan || '',
      data.status || 'pending',
      data.timestamp || new Date().toISOString(),
    ];
    
    // Update row
    const range = sheet.getRange(rowIndex, 1, 1, updateData.length);
    range.setValues([updateData]);
    
    return { 
      success: true, 
      message: 'Feedback berhasil diperbarui' 
    };
  } catch (error) {
    console.error('Error in updateFeedback:', error);
    return { 
      error: error.toString(),
      message: 'Gagal mengupdate feedback'
    };
  }
}

// Fungsi untuk menghapus feedback
function deleteFeedback(data) {
  try {
    const sheet = SpreadsheetApp.openById(FEEDBACK_SPREADSHEET_ID).getSheetByName(FEEDBACK_SHEET_NAME);
    const dataRange = sheet.getDataRange().getValues();
    
    // Cari row berdasarkan ID
    let rowIndex = -1;
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0] == data.id) {
        rowIndex = i + 1; // +1 karena sheet dimulai dari 1
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { error: 'Feedback tidak ditemukan' };
    }
    
    // Hapus row
    sheet.deleteRow(rowIndex);
    
    return { 
      success: true, 
      message: 'Feedback berhasil dihapus' 
    };
  } catch (error) {
    console.error('Error in deleteFeedback:', error);
    return { 
      error: error.toString(),
      message: 'Gagal menghapus feedback'
    };
  }
}

// ... (Tambahkan fungsi update & delete feedback jika diperlukan) ...


// =================================================================
// ============== FUNGSI UNTUK VISITOR TRACKING ====================
// =================================================================

function trackVisitor() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(VISITORS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(VISITORS_SHEET_NAME);
    sheet.appendRow(['Timestamp', 'User', 'Info']);
  }
  var now = new Date();
  var user = Session.getActiveUser().getEmail() || 'anonymous';
  sheet.appendRow([now, user, 'unknown']);
  return createJsonResponse({ success: true });
}


// =================================================================
// ============== FUNGSI SETUP (Jalankan Manual) ===================
// =================================================================

/**
 * Menjalankan setup untuk semua sheet yang diperlukan oleh aplikasi.
 * Cukup jalankan fungsi ini sekali dari editor Apps Script.
 */
function setupSheets() {
  Logger.log("🚀 Memulai proses setup...");

  // 1. Setup Sheet Destinasi
  const destinasiHeaders = [
    'id', 'nama', 'lokasi', 'rating', 'kategori', 'img', 
    'deskripsi', 'fasilitas', 'komentar', 'dikunjungi', 
    'posisi', 'harga', 'slug'
  ];
  setupSheet(DESTINASI_SHEET_NAME, destinasiHeaders);

  // 2. Setup Sheet Event
  const eventHeaders = [
    'id', 'title', 'description', 'image', 'date', 'location', 
    'category', 'totalPembaca', 'content', 'author', 'slug', 'destinasi'
  ];
  setupSheet(EVENT_SHEET_NAME, eventHeaders);
  
  // 3. Setup Sheet Transaksi
  const transaksiHeaders = [
    'id', 'nama', 'destinasi', 'penumpang', 'tanggal_berangkat', 
    'waktu_berangkat', 'kendaraan', 'total', 'status', 'kode', 
    'waktu_transaksi', 'tanggal_transaksi'
  ];
  setupSheet(TRANSAKSI_SHEET_NAME, transaksiHeaders);
  
  // 4. Setup Sheet Feedback
  const feedbackHeaders = [
    'id', 'nama', 'email', 'telepon', 'kategori', 'rating', 
    'pesan', 'status', 'timestamp'
  ];
  setupSheet(FEEDBACK_SHEET_NAME, feedbackHeaders);

  // 5. Setup Sheet Visitors
  const visitorsHeaders = ['Timestamp', 'User', 'Info'];
  setupSheet(VISITORS_SHEET_NAME, visitorsHeaders);

  Logger.log("✅ Semua sheet berhasil disetup!");
}

/**
 * Fungsi helper untuk membuat sheet baru jika belum ada,
 * dan menambahkan header jika sheet tersebut kosong.
 * @param {string} sheetName - Nama sheet yang akan disetup.
 * @param {string[]} headers - Array berisi judul-judul kolom.
 */
function setupSheet(sheetName, headers) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`Sheet "${sheetName}" tidak ditemukan, berhasil membuat yang baru.`);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      Logger.log(`Sheet "${sheetName}" berhasil disetup dengan header.`);
    } else {
      Logger.log(`Sheet "${sheetName}" sudah memiliki data, tidak perlu setup header.`);
    }
  } catch(e) {
    Logger.log(`Gagal setup sheet "${sheetName}": ${e.toString()}`);
  }
} 