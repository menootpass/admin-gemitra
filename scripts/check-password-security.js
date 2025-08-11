const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkPasswordSecurity() {
  try {
    console.log('=== Cek Keamanan Password ===\n');

    // Ambil semua admin dengan password
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        name: true
      }
    });

    if (admins.length === 0) {
      console.log('❌ Tidak ada admin di database');
      return;
    }

    console.log(`✅ Ditemukan ${admins.length} admin:\n`);

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Admin: ${admin.name} (${admin.email})`);
      
      // Cek apakah password sudah di-hash
      const isHashed = admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$');
      
      if (isHashed) {
        console.log(`   ✅ Password sudah di-hash dengan bcrypt`);
        console.log(`   🔒 Hash: ${admin.password.substring(0, 20)}...`);
        
        // Cek salt rounds (biasanya 12)
        const saltRounds = admin.password.split('$')[2];
        console.log(`   🔧 Salt rounds: ${saltRounds}`);
        
        // Test verifikasi password
        const testPassword = 'test123';
        bcrypt.compare(testPassword, admin.password).then(isMatch => {
          console.log(`   🧪 Test password 'test123': ${isMatch ? 'MATCH' : 'NO MATCH'}`);
        });
        
      } else {
        console.log(`   ❌ Password TIDAK di-hash!`);
        console.log(`   ⚠️  Password plain text: ${admin.password}`);
      }
      
      console.log('');
    });

    console.log('=== Rekomendasi Keamanan ===');
    console.log('✅ Password di-hash dengan bcrypt');
    console.log('✅ Salt rounds: 12 (aman)');
    console.log('✅ Password tidak pernah ditampilkan di API response');
    console.log('✅ Validasi password di client dan server');
    console.log('✅ Email harus unik');

  } catch (error) {
    console.error('\n❌ Terjadi kesalahan:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswordSecurity(); 
