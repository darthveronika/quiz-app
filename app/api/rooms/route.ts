import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: Request) {
  try {
    const { quizId } = await req.json();

    let code = generateRoomCode();
    let existingRoom = await prisma.room.findUnique({ where: { code } });
    
    while (existingRoom) {
      code = generateRoomCode();
      existingRoom = await prisma.room.findUnique({ where: { code } });
    }

    const room = await prisma.room.create({
      data: {
        quizId,
        code,
        status: 'WAITING',
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания комнаты:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при создании комнаты' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Код комнаты не указан' }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        quiz: {
          include: { questions: true },
        },
        participants: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Комната не найдена' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Ошибка получения комнаты:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}