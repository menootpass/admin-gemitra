import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, dan nama harus diisi' },
        { status: 400 }
      );
    }

    const adminCount = await prisma.admin.count();
    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Admin sudah ada, tidak bisa membuat admin baru' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: 'admin'
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _adminPassword, ...adminWithoutPassword } = admin;

    return NextResponse.json({
      success: true,
      admin: adminWithoutPassword,
      message: 'Admin berhasil dibuat'
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat admin' },
      { status: 500 }
    );
  }
} 
