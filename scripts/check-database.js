const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== Cek Database Admin ===\n');

    // Cek semua admin
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
        // Password tidak ditampilkan untuk keamanan
      }
    });

    if (admins.length === 0) {
      console.log('❌ Tidak ada admin di database');
      console.log('\nUntuk membuat admin pertama, gunakan:');
      console.log('1. npm run create-admin');
      console.log('2. Atau akses http://localhost:3000/setup');
    } else {
      console.log(`✅ Ditemukan ${admins.length} admin:\n`);
      
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Admin ${admin.id}:`);
        console.log(`   Nama: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Dibuat: ${admin.createdAt}`);
        console.log(`   Diupdate: ${admin.updatedAt}`);
        console.log('');
      });

      console.log('Untuk login, gunakan email dan password yang telah dibuat.');
    }

    // Cek struktur tabel
    console.log('=== Struktur Database ===');
    console.log('Tabel: admins');
    console.log('Fields: id, email, password (hashed), name, role, createdAt, updatedAt');
    console.log('Password di-hash menggunakan bcrypt untuk keamanan.');

  } catch (error) {
    console.error('\n❌ Terjadi kesalahan:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}


checkDatabase(); 
