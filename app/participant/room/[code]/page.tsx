'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function ParticipantRoomPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeIsUp, setTimeIsUp] = useState(false);

  const [finalLeaderboard, setFinalLeaderboard] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('participantSession');
    if (!session) {
      router.push('/participant/join');
      return;
    }
    const { roomId, nickname } = JSON.parse(session);

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_room', { roomId, nickname });
    });

    newSocket.on('joined_success', (data) => {
      setParticipantId(data.participantId);
    });

    newSocket.on('room_state_updated', (state) => {
      setRoomState(state);
    });

newSocket.on('new_question', (data) => {
  setCurrentQuestion(data.question);
  setTimeLeft(data.timeLimit);
  setHasAnswered(false);
  setSelectedAnswer(null);
  setTimeIsUp(false);

  if (timerRef.current) clearInterval(timerRef.current);
  timerRef.current = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(timerRef.current!);
        if (!hasAnswered) {
          setTimeIsUp(true);
          setHasAnswered(true);
        }
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
});

    newSocket.on('quiz_finished', (data) => {
      setFinalLeaderboard(data.participants);
      setIsFinished(true);
      setHasAnswered(false);
      setCurrentQuestion(null);
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      newSocket.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmitAnswer = (answer: any, timeTaken: number) => {
    if (hasAnswered || !socket || !participantId || !currentQuestion) return;
    
    setHasAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    socket.emit('submit_answer', {
      roomId: roomState?.id,
      participantId,
      questionId: currentQuestion.id,
      givenAnswer: answer,
      timeTaken,
    });
  };

  if (!roomState) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
    </div>
  );

  if (roomState.status === 'WAITING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-8xl mb-6 animate-float"></div>
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Ожидание начала
        </h1>
        <p className="text-gray-400 text-xl text-center">Организатор скоро запустит квиз.<br/>Приготовьтесь!</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-7xl mb-4"></div>
            <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Квиз завершён!
            </h1>
          </div>
          
          <div className="card p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-8 text-center text-white">Финальный лидерборд</h2>
            <div className="space-y-3">
              {finalLeaderboard.map((p, index) => (
                <div 
                  key={p.id} 
                  className={`grid grid-cols-[80px_1fr_150px] items-center p-5 rounded-xl ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-600/30 to-yellow-500/20 border-2 border-yellow-500' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400/30 to-gray-300/20 border-2 border-gray-400' :
                    index === 2 ? 'bg-gradient-to-r from-orange-600/30 to-orange-500/20 border-2 border-orange-500' :
                    'bg-gray-800/50'
                  }`}
                >
                  <div className="text-4xl font-black text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div className="text-2xl font-semibold text-center text-white">{p.nickname}</div>
                  <div className="text-2xl font-bold text-purple-400 text-right">{p.score} очков</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

if (hasAnswered) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-8xl mb-6">{timeIsUp ? '' : ''}</div>
      <h2 className="text-4xl font-black mb-4 text-center ${timeIsUp ? 'text-red-400' : 'text-green-400'}">
        {timeIsUp ? 'Время вышло!' : 'Ответ отправлен!'}
      </h2>
      <p className="text-gray-400 text-xl text-center">
        {timeIsUp 
          ? 'Вы не успели ответить.\nОжидайте следующий вопрос.' 
          : 'Ожидайте следующий вопрос от организатора.'}
      </p>
    </div>
  );
}

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span className="font-semibold">Время на ответ</span>
            <span className="font-bold text-2xl">{timeLeft} сек</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${timeLeft < 5 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
              style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="card p-10 rounded-2xl mb-8">
          {currentQuestion.imageUrl && (
            <img 
              src={currentQuestion.imageUrl} 
              alt="Question image" 
              className="w-full max-h-64 object-contain rounded-xl mb-6 border border-gray-700 bg-gray-800"
            />
          )}
          <h2 className="text-3xl font-bold mb-8 text-center text-white leading-tight">
            {currentQuestion.text}
          </h2>

          {currentQuestion.type === 'TEXT' ? (
            <div className="space-y-5">
              <input
                type="text"
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="input-field w-full p-6 rounded-xl text-white text-center text-2xl placeholder-gray-500"
                placeholder="Введите ваш ответ..."
              />
              <button
                onClick={() => handleSubmitAnswer(selectedAnswer, currentQuestion.timeLimit - timeLeft)}
                disabled={!selectedAnswer}
                className="btn-primary w-full p-5 rounded-xl font-bold text-xl disabled:opacity-50"
              >
                Отправить ответ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option: string, idx: number) => {
                const isSelected = selectedAnswer === option || (Array.isArray(selectedAnswer) && selectedAnswer.includes(option));
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (currentQuestion.type === 'MULTIPLE') {
                        const newSelection = isSelected 
                          ? selectedAnswer.filter((a: string) => a !== option)
                          : [...(selectedAnswer || []), option];
                        setSelectedAnswer(newSelection);
                      } else {
                        setSelectedAnswer(option);
                      }
                    }}
                    className={`p-6 rounded-xl text-left font-semibold text-xl transition-all border-2 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-xl scale-105' 
                        : 'bg-gray-800/50 border-gray-700 hover:border-purple-500 hover:bg-gray-800'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
              <button
                onClick={() => handleSubmitAnswer(selectedAnswer, currentQuestion.timeLimit - timeLeft)}
                disabled={!selectedAnswer}
                className="btn-primary w-full mt-6 p-5 rounded-xl font-bold text-xl disabled:opacity-50"
              >
                Подтвердить ответ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}