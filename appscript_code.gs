// Google Apps Script untuk API Destinasi
// Mendukung operasi CRUD lengkap

// Konfigurasi
const SPREADSHEET_ID = '1KeDQC7cUBsn23K2n1gRP25MJ3844pRiVn67RU06vUdc'; // Ganti dengan ID spreadsheet Anda
const SHEET_NAME = 'Destinasi'; // Nama sheet

// Fungsi utama untuk menangani semua request
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'create';
    let result;
    switch(action) {
      case 'create':
        result = createDestination(data);
        break;
      case 'update':
        result = updateDestination(data);
        break;
      case 'delete':
        result = deleteDestination(data);
        break;
      default:
        result = createDestination(data);
    }
    var output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    var output = ContentService.createTextOutput(JSON.stringify({ error: error.toString() }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

// Fungsi untuk menangani PUT request (update)
function doPut(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = updateDestination(data);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// Fungsi untuk menangani DELETE request
function doDelete(e) {
  try {
    const id = Number(e.parameter.id);
    const result = deleteDestination({ id });
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// Fungsi untuk membaca semua data (GET)
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const destinations = rows.map((row, index) => {
      const destination = {};
      headers.forEach((header, i) => {
        destination[header] = row[i];
      });
      return destination;
    });
    var output = ContentService.createTextOutput(JSON.stringify({ data: destinations }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    var output = ContentService.createTextOutput(JSON.stringify({ error: error.toString() }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

// Fungsi untuk membuat destinasi baru
function createDestination(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    // Generate ID baru (auto increment)
    const lastRow = sheet.getLastRow();
    const newId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    // Siapkan data untuk insert
    const newData = [
      newId,
      data.nama || '',
      data.lokasi || '',
      data.rating || 0,
      data.kategori || '',
      data.img || '',
      data.deskripsi || '',
      data.fasilitas || '',
      data.komentar || '',
      data.dikunjungi || 0,
      data.posisi || ''
    ];
    // Insert data baru
    sheet.appendRow(newData);
    return { 
      success: true, 
      message: 'Destinasi berhasil ditambahkan',
      id: newId 
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

// Fungsi untuk mengupdate destinasi
function updateDestination(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
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
    // Update data
    const updateData = [
      data.id,
      data.nama || '',
      data.lokasi || '',
      data.rating || 0,
      data.kategori || '',
      data.img || '',
      data.deskripsi || '',
      data.fasilitas || '',
      data.komentar || '',
      data.dikunjungi || 0,
      data.posisi || ''
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
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
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

// Fungsi untuk menambah jumlah pengunjung (untuk checkout)
function incrementVisitor(id) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
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

// Fungsi untuk setup spreadsheet (jalankan sekali)
function setupSpreadsheet() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    // Set header jika sheet kosong
    if (sheet.getLastRow() === 0) {
      const headers = [
        'id',
        'nama', 
        'lokasi',
        'rating',
        'kategori',
        'img',
        'deskripsi',
        'fasilitas',
        'komentar',
        'dikunjungi',
        'posisi' // <--- Tambahkan posisi di sini
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    console.log('Spreadsheet berhasil disetup!');
  } catch (error) {
    console.error('Error setup spreadsheet:', error);
  }
} 