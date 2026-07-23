'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client';

export default function QuizControlPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/auth'); return; }
    
    const user = JSON.parse(userStr);
    fetch(`/api/quizzes?creatorId=${user.id}`)
      .then(res => res.json())
      .then(quizzes => {
        const found = quizzes.find((q: any) => q.id === quizId);
        setQuiz(found);
      });

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [quizId]);

  const createRoom = async () => {
    setLoading(true);
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    });
    const data = await res.json();
    if (res.ok) setRoom(data.room);
    setLoading(false);
  };

  const startQuiz = () => {
    if (!socket || !room || !quiz || quiz.questions.length === 0) return;
    const firstQuestion = quiz.questions[0];
    socket.emit('next_question', { roomId: room.id, question: firstQuestion });
    setRoom({ ...room, status: 'ACTIVE', currentQuestionIndex: 0 });
  };

  const nextQuestion = () => {
    if (!socket || !room || !quiz) return;
    const nextIdx = room.currentQuestionIndex + 1;
    if (nextIdx < quiz.questions.length) {
      socket.emit('next_question', { roomId: room.id, question: quiz.questions[nextIdx] });
      setRoom({ ...room, currentQuestionIndex: nextIdx });
    } else {
      alert('Квиз завершен! Все вопросы показаны.');
    }
  };

  const finishQuiz = () => {
    if (!socket || !room) return;
    socket.emit('finish_quiz', { roomId: room.id });
    setRoom({ ...room, status: 'FINISHED' });
  };

  if (!quiz) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <button 
            onClick={() => router.push('/organizer/dashboard')} 
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
          >
            ← Назад
          </button>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {quiz.title}
          </h1>
          <div className="w-24"></div>
        </div>

        <div className="card p-8 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Информация о квизе</h2>
          <p className="text-gray-400 mb-2">Описание: {quiz.description || 'Нет описания'}</p>
          <p className="text-gray-400">Вопросов: <span className="text-purple-400 font-bold">{quiz.questions?.length || 0}</span></p>
        </div>

        {!room ? (
          <div className="card p-12 rounded-2xl text-center">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-2xl font-bold mb-4 text-white">Создать комнату</h2>
            <p className="text-gray-400 mb-6">Создайте комнату, чтобы получить 6-значный код для участников</p>
            <button
              onClick={createRoom}
              disabled={loading}
              className="btn-primary px-10 py-4 rounded-xl font-bold text-xl disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать комнату'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-10 rounded-2xl text-center">
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-3">Код комнаты для участников:</p>
                <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 p-8 rounded-2xl shadow-2xl">
                  <p className="text-6xl font-black text-white tracking-widest">{room.code}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-lg">
                <span className="text-gray-400">Статус:</span>
                <span className={`px-4 py-2 rounded-full font-bold ${
                  room.status === 'WAITING' ? 'bg-yellow-500/20 text-yellow-400' :
                  room.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {room.status === 'WAITING' ? 'Ожидание участников' :
                   room.status === 'ACTIVE' ? 'Квиз активен' :
                   'Завершён'}
                </span>
              </div>
            </div>

            <div className="card p-8 rounded-2xl">
              <h2 className="text-xl font-bold mb-6 text-white">Управление игрой</h2>
              
              <div className="flex gap-4 mb-6">
                {room.status === 'WAITING' ? (
                  <button 
                    onClick={startQuiz} 
                    className="btn-success flex-1 py-5 rounded-xl font-bold text-xl hover:scale-105 transition-transform"
                  >
                    Запустить квиз
                  </button>
                ) : room.status === 'FINISHED' ? (
                  <div className="flex-1 py-5 bg-gray-700 rounded-xl text-center font-bold text-xl text-gray-400">
                    Квиз завершён
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={nextQuestion} 
                      className="btn-primary flex-1 py-5 rounded-xl font-bold text-xl hover:scale-105 transition-transform"
                    >
                      Следующий вопрос
                    </button>
                    <button 
                      onClick={finishQuiz} 
                      className="px-8 py-5 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xl transition-colors hover:scale-105"
                    >
                      Завершить
                    </button>
                  </>
                )}
              </div>

              {room.status === 'ACTIVE' && quiz.questions[room.currentQuestionIndex] && (
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-xl border-2 border-purple-500/30">
                  <p className="text-purple-400 text-sm mb-2 font-semibold">Сейчас на экране участников:</p>
                  <p className="text-white font-bold text-lg">
                    Вопрос {room.currentQuestionIndex + 1} из {quiz.questions.length}: 
                    <span className="text-gray-300 block mt-1">{quiz.questions[room.currentQuestionIndex].text}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}