'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/rooms?code=${code.toUpperCase()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Комната не найдена');
      }

      const sessionData = {
        roomId: data.room.id,
        quizId: data.room.quizId,
        nickname: nickname.trim(),
      };
      localStorage.setItem('participantSession', JSON.stringify(sessionData));

      router.push(`/participant/room/${code.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-10 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4"></div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Присоединиться
          </h1>
          <p className="text-gray-400">Введите код комнаты и ваше имя</p>
        </div>
        
        <form onSubmit={handleJoin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Код комнаты</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input-field w-full p-5 rounded-xl text-white text-center text-3xl font-bold tracking-widest placeholder-gray-600"
              placeholder="ABC123"
              maxLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ваше имя</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-field w-full p-4 rounded-xl text-white placeholder-gray-500"
              placeholder="Как к вам обращаться?"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6 || !nickname.trim()}
            className="btn-primary w-full p-5 rounded-xl font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Проверка...' : 'Войти в комнату'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← На главную
          </button>
        </div>
      </div>
    </div>
  );
}