// Google Apps Script untuk API Transaksi
// File: transaksi.gs

// =================== KONFIGURASI ===================
const TRANSAKSI_SPREADSHEET_ID = '1KeDQC7cUBsn23K2n1gRP25MJ3844pRiVn67RU06vUdc';
const TRANSAKSI_SHEET_NAME = 'Transaksi';

// =================== ENDPOINT UTAMA ===================

/**
 * Menangani request GET untuk membaca semua data transaksi.
 * @param {object} e - Event parameter dari request.
 * @returns {ContentService.TextOutput} - Response JSON.
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(TRANSAKSI_SPREADSHEET_ID).getSheetByName(TRANSAKSI_SHEET_NAME);
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
    
    const response = { success: true, data: transactions };
    return createJsonResponse(response);

  } catch (error) {
    const errorResponse = { success: false, error: error.toString() };
    return createJsonResponse(errorResponse, 500);
  }
}

/**
 * Menangani request POST untuk menambah transaksi baru.
 * @param {object} e - Event parameter dari request.
 * @returns {ContentService.TextOutput} - Response JSON.
 */
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(TRANSAKSI_SPREADSHEET_ID).getSheetByName(TRANSAKSI_SHEET_NAME);
    const data = JSON.parse(e.postData.contents);
    
    // Generate ID baru (auto-increment)
    const lastRow = sheet.getLastRow();
    const newId = lastRow > 0 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    // Generate kode transaksi unik (contoh: INV-TIMESTAMP)
    const kodeTransaksi = `INV-${new Date().getTime()}`;
    
    // Dapatkan tanggal dan waktu saat ini
    const now = new Date();
    const tanggalTransaksi = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const waktuTransaksi = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');

    const newRow = [
      newId,
      data.nama || '',
      data.destinasi || '',
      data.penumpang || 0,
      data.tanggal_berangkat || '',
      data.waktu_berangkat || '',
      data.kendaraan || '',
      data.total || 0,
      data.status || 'pending', // Status default
      kodeTransaksi,
      waktuTransaksi,
      tanggalTransaksi
    ];
    
    sheet.appendRow(newRow);
    
    const response = { 
      success: true, 
      message: 'Transaksi berhasil ditambahkan',
      id: newId,
      kode: kodeTransaksi
    };
    return createJsonResponse(response, 201);

  } catch (error) {
    const errorResponse = { success: false, error: error.toString() };
    return createJsonResponse(errorResponse, 500);
  }
}

// =================== FUNGSI HELPERS ===================

/**
 * Membuat response JSON standar.
 * @param {object} data - Objek yang akan di-serialize ke JSON.
 * @param {number} statusCode - HTTP status code (default: 200).
 * @returns {ContentService.TextOutput} - Objek response.
 */
function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  // Meskipun tidak ada setStatusCode, ini adalah praktik yang baik
  return output; 
}


// =================== SETUP AWAL (Jalankan manual sekali) ===================

/**
 * Fungsi untuk setup header di spreadsheet jika kosong.
 */
function setupTransaksiSheet() {
  try {
    const sheet = SpreadsheetApp.openById(TRANSAKSI_SPREADSHEET_ID).getSheetByName(TRANSAKSI_SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      const headers = [
        'id', 'nama', 'destinasi', 'penumpang', 'tanggal_berangkat', 
        'waktu_berangkat', 'kendaraan', 'total', 'status', 'kode', 
        'waktu_transaksi', 'tanggal_transaksi'
      ];
      sheet.appendRow(headers);
      console.log('Sheet "Transaksi" berhasil disetup dengan header.');
    } else {
      console.log('Sheet "Transaksi" sudah memiliki data, tidak perlu setup.');
    }
  } catch(e) {
    console.error('Gagal setup sheet "Transaksi": ' + e.toString());
  }
}