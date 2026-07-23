import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { title, description, category, creatorId, questions } = await req.json();

    if (!title || !creatorId || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Необходимы название, создатель и вопросы' },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || '',
        category: category || 'Общая',
        creatorId,
        questions: {
          create: questions.map((q: any, index: number) => ({
            type: q.type,
            text: q.text,
            imageUrl: q.imageUrl || null,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            timeLimit: q.timeLimit || 15,
            order: index,
          })),
        },
      },
      include: {
        questions: true,
        rooms: true,
      },
    });

    return NextResponse.json(
      { message: 'Квиз успешно создан', quiz },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ошибка создания квиза:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при создании квиза' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');

    const quizzes = await prisma.quiz.findMany({
      where: creatorId ? { creatorId } : {},
      include: { 
        questions: true,
        rooms: true 
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Ошибка получения квизов:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении квизов' },
      { status: 500 }
    );
  }
}