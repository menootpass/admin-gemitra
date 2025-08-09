// Google Apps Script untuk API Event
// Menangani request untuk data event dari tab "Event"

function doGet(e) {
  try {
    // Cek apakah ada parameter action
    const action = e.parameter.action;
    const id = e.parameter.id;
    
    if (action === 'getEventById' && id) {
      const event = getEventById(id);
      if (event) {
        return ContentService
          .createTextOutput(JSON.stringify(event))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: "Event tidak ditemukan"
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Ambil data dari spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: "Sheet 'Event' tidak ditemukan"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Ambil semua data dari sheet
    const data = sheet.getDataRange().getValues();
    
    // Jika tidak ada data
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          data: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Ambil header (baris pertama)
    const headers = data[0];
    
         // Cari indeks kolom berdasarkan nama
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

     // Validasi apakah semua kolom yang diperlukan ada
     const requiredColumns = [
       { name: "id", index: idIndex },
       { name: "title", index: titleIndex },
       { name: "description", index: descriptionIndex },
       { name: "image", index: imageIndex },
       { name: "date", index: dateIndex },
       { name: "location", index: locationIndex },
       { name: "category", index: categoryIndex },
       { name: "totalPembaca", index: totalPembacaIndex },
       { name: "content", index: contentIndex },
       { name: "author", index: authorIndex },
       { name: "slug", index: slugIndex }
     ];

    const missingColumns = requiredColumns.filter(col => col.index === -1);
    if (missingColumns.length > 0) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: `Kolom yang diperlukan tidak ditemukan: ${missingColumns.map(col => col.name).join(", ")}`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Proses data (mulai dari baris kedua)
    const events = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip baris kosong
      if (!row[idIndex] || row[idIndex].toString().trim() === "") {
        continue;
      }

      // Parse totalPembaca sebagai number
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
            formattedDate = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
          }
        } catch (e) {
          // Jika gagal parse tanggal, gunakan string asli
          formattedDate = row[dateIndex].toString();
        }
      }

      // Process image data (handle array or single URL)
      let imageData = null;
      if (row[imageIndex]) {
        const imgValue = row[imageIndex];
        if (typeof imgValue === 'string') {
          // Try to parse as JSON array first
          try {
            const parsed = JSON.parse(imgValue);
            if (Array.isArray(parsed) && parsed.length > 0) {
              imageData = parsed;
            } else {
              imageData = [imgValue];
            }
          } catch (e) {
            // If JSON parsing fails, check if it's a single URL
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
        slug: row[slugIndex] ? row[slugIndex].toString() : ""
      };

      events.push(event);
    }

    // Return response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: events,
        total: events.length
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Terjadi kesalahan: " + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function untuk menangani POST requests (CRUD operations)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case 'addEvent':
        return handleAddEvent(data.data);
      case 'updateEvent':
        return handleUpdateEvent(data.id, data.data);
      case 'deleteEvent':
        return handleDeleteEvent(data.id);
      case 'incrementPembaca':
        return handleIncrementPembaca(data.id);
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: "Action tidak valid"
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Terjadi kesalahan: " + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function untuk menambah event baru
function handleAddEvent(eventData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: "Sheet 'Event' tidak ditemukan"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Generate slug dari title
    let baseSlug = generateSlug(eventData.title);
    let finalSlug = baseSlug;
    let counter = 1;

    // Cek apakah slug sudah ada
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
      eventData.title,
      eventData.description,
      eventData.image,
      eventData.date,
      eventData.location,
      eventData.category,
      0, // totalPembaca default 0
      eventData.content,
      eventData.author,
      finalSlug
    ];

    // Tambahkan ke sheet
    sheet.appendRow(newRow);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: {
          id: newId,
          title: eventData.title,
          description: eventData.description,
          image: eventData.image,
          date: eventData.date,
          location: eventData.location,
          category: eventData.category,
          totalPembaca: 0,
          content: eventData.content,
          author: eventData.author,
          slug: finalSlug
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Terjadi kesalahan: " + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function untuk update event
function handleUpdateEvent(eventId, eventData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: "Sheet 'Event' tidak ditemukan"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
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

    // Cari baris dengan ID yang sesuai
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[idIndex] && row[idIndex].toString() === eventId.toString()) {
        
        // Generate slug baru jika title berubah
        let newSlug = row[slugIndex];
        if (row[titleIndex] !== eventData.title) {
          let baseSlug = generateSlug(eventData.title);
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
          newSlug = finalSlug;
        }

        // Update data
        sheet.getRange(i + 1, titleIndex + 1).setValue(eventData.title);
        sheet.getRange(i + 1, descriptionIndex + 1).setValue(eventData.description);
        sheet.getRange(i + 1, imageIndex + 1).setValue(eventData.image);
        sheet.getRange(i + 1, dateIndex + 1).setValue(eventData.date);
        sheet.getRange(i + 1, locationIndex + 1).setValue(eventData.location);
        sheet.getRange(i + 1, categoryIndex + 1).setValue(eventData.category);
        sheet.getRange(i + 1, contentIndex + 1).setValue(eventData.content);
        sheet.getRange(i + 1, authorIndex + 1).setValue(eventData.author);
        sheet.getRange(i + 1, slugIndex + 1).setValue(newSlug);

        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: "Event berhasil diperbarui"
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Event tidak ditemukan"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Terjadi kesalahan: " + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function untuk delete event
function handleDeleteEvent(eventId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: "Sheet 'Event' tidak ditemukan"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("id");

    // Cari baris dengan ID yang sesuai
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[idIndex] && row[idIndex].toString() === eventId.toString()) {
        // Hapus baris
        sheet.deleteRow(i + 1);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: "Event berhasil dihapus"
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Event tidak ditemukan"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Terjadi kesalahan: " + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function untuk increment total pembaca
function handleIncrementPembaca(eventId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Event");
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: "Sheet 'Event' tidak ditemukan"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const totalPembacaIndex = headers.indexOf("totalPembaca");

    if (idIndex === -1 || totalPembacaIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: "Kolom yang diperlukan tidak ditemukan"
        }))
        .setMimeType(ContentService.MimeType.JSON);
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
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: "Total pembaca berhasil diperbarui",
            newTotal: newTotal
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Event tidak ditemukan"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: "Terjadi kesalahan: " + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
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
          slug: row[slugIndex] ? row[slugIndex].toString() : ""
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Function untuk mendapatkan event berdasarkan kategori
function getEventsByCategory(category) {
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
          slug: row[slugIndex] ? row[slugIndex].toString() : ""
        };

        events.push(event);
      }
    }

    return events;
  } catch (error) {
    return [];
  }
}

// Function untuk generate slug dari title
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

// Function untuk mendapatkan event berdasarkan slug
function getEventBySlug(slug) {
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
          slug: row[slugIndex] ? row[slugIndex].toString() : ""
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Function untuk menambahkan event baru dengan slug otomatis
function addNewEvent(title, description, image, date, location, category, content, author) {
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
      finalSlug
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
        slug: finalSlug
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
