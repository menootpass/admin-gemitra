const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdmin() {
  try {
    console.log('=== Tambah Admin Baru ===\n');

    // Input nama
    const name = await new Promise((resolve) => {
      rl.question('Nama lengkap: ', resolve);
    });

    // Input email
    const email = await new Promise((resolve) => {
      rl.question('Email: ', resolve);
    });

    // Input password
    const password = await new Promise((resolve) => {
      rl.question('Password (minimal 6 karakter): ', resolve);
    });

    // Validasi
    if (!name || !email || !password) {
      console.log('\n❌ Semua field harus diisi!');
      rl.close();
      return;
    }

    if (password.length < 6) {
      console.log('\n❌ Password minimal 6 karakter!');
      rl.close();
      return;
    }

    // Cek email sudah ada
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingAdmin) {
      console.log('\n❌ Email sudah terdaftar!');
      rl.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Buat admin
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: 'admin'
      }
    });

    console.log('\n✅ Admin berhasil ditambahkan!');
    console.log(`ID: ${admin.id}`);
    console.log(`Nama: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Dibuat: ${admin.createdAt}`);

  } catch (error) {
    console.error('\n❌ Terjadi kesalahan:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin(); 
