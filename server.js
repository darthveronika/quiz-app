import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  const rooms = new Map();

  function getOrCreateRoom(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        status: 'WAITING',
        currentQuestionIndex: -1,
        participants: []
      });
    }
    return rooms.get(roomId);
  }

  io.on('connection', (socket) => {
    console.log('Клиент подключился:', socket.id);

    socket.on('join_room', async ({ roomId, nickname, userId }) => {
      socket.join(roomId);
      const roomState = getOrCreateRoom(roomId);

      let participant = await prisma.participant.findFirst({
        where: { roomId, nickname }
      });

      if (!participant) {
        participant = await prisma.participant.create({
          data: { roomId, nickname, userId: userId || null, score: 0 }
        });
      }

      if (!roomState.participants.find(p => p.id === participant.id)) {
        roomState.participants.push({ id: participant.id, nickname, score: 0 });
        rooms.set(roomId, roomState);
      }

      io.to(roomId).emit('room_state_updated', roomState);
      socket.emit('joined_success', { participantId: participant.id });
    });

socket.on('start_quiz', async ({ roomId }) => {
  const roomState = getOrCreateRoom(roomId);
  roomState.status = 'ACTIVE';
  roomState.currentQuestionIndex = 0;
  rooms.set(roomId, roomState);

  await prisma.room.update({
    where: { id: roomId },
    data: { status: 'ACTIVE' }
  });

  io.to(roomId).emit('quiz_started');
  io.to(roomId).emit('room_state_updated', roomState);
});

    socket.on('next_question', async ({ roomId, question }) => {
      const roomState = getOrCreateRoom(roomId);
      roomState.status = 'ACTIVE';
      roomState.currentQuestionIndex += 1;
      rooms.set(roomId, roomState);

      io.to(roomId).emit('new_question', { 
        question, 
        timeLimit: question.timeLimit 
      });
      io.to(roomId).emit('room_state_updated', roomState);
    });

socket.on('finish_quiz', async ({ roomId }) => {
  const roomState = getOrCreateRoom(roomId);
  roomState.status = 'FINISHED';
  rooms.set(roomId, roomState);

  await prisma.room.update({
    where: { id: roomId },
    data: { status: 'FINISHED' }
  });

  const sortedParticipants = [...roomState.participants].sort((a, b) => b.score - a.score);
  io.to(roomId).emit('quiz_finished', { participants: sortedParticipants });
  io.to(roomId).emit('room_state_updated', roomState);
});

    socket.on('submit_answer', async ({ roomId, participantId, questionId, givenAnswer, timeTaken }) => {
      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question) return;
      
      let isCorrect = false;
      let points = 0;

      if (question.type === 'SINGLE' || question.type === 'TEXT') {
        isCorrect = JSON.stringify(question.correctAnswer) === JSON.stringify(givenAnswer);
      } else if (question.type === 'MULTIPLE') {
        const sortedGiven = [...givenAnswer].sort();
        const sortedCorrect = [...question.correctAnswer].sort();
        isCorrect = JSON.stringify(sortedGiven) === JSON.stringify(sortedCorrect);
      }

      if (isCorrect) {
        points = 100 + Math.max(0, question.timeLimit - timeTaken) * 2;
      }

      await prisma.answer.create({
        data: { participantId, questionId, givenAnswer, isCorrect, points, timeTaken }
      });

      const participant = await prisma.participant.update({
        where: { id: participantId },
        data: { score: { increment: points } }
      });

      const roomState = getOrCreateRoom(roomId);
      const pIndex = roomState.participants.findIndex(p => p.id === participantId);
      if (pIndex !== -1) {
        roomState.participants[pIndex].score = participant.score;
        roomState.participants.sort((a, b) => b.score - a.score);
        rooms.set(roomId, roomState);
      }

      io.to(roomId).emit('leaderboard_update', roomState.participants);
      io.to(roomId).emit('room_state_updated', roomState);
    });

    socket.on('disconnect', () => {
      console.log('Клиент отключился:', socket.id);
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Сервер готов: http://${hostname}:${port}`);
  });
});