'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OrganizerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    const userData = JSON.parse(storedUser);
    
    if (userData.role !== 'ORGANIZER') {
      alert('Доступ только для организаторов!');
      router.push('/auth');
      return;
    }
    
    setUser(userData);
    loadQuizzes(userData.id);
  }, [router]);

  const loadQuizzes = async (userId: string) => {
    try {
      const res = await fetch(`/api/quizzes?creatorId=${userId}`);
      const data = await res.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Ошибка загрузки квизов:', error);
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
    </div>
  );

  const totalGames = quizzes.reduce((acc, quiz) => {
    return acc + (quiz.rooms?.filter((r: any) => r.status === 'FINISHED').length || 0);
  }, 0);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Дашборд организатора
            </h1>
            <p className="text-gray-400 text-lg">Привет, {user.name}!</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/auth');
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-all hover:scale-105"
          >
            Выйти
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card p-6 rounded-2xl">
            <h3 className="text-gray-400 text-sm mb-2">Всего квизов</h3>
            <p className="text-4xl font-black text-white">{quizzes.length}</p>
          </div>
          <div className="card p-6 rounded-2xl">
            <h3 className="text-gray-400 text-sm mb-2">Проведено игр</h3>
            <p className="text-4xl font-black text-purple-400">{totalGames}</p>
          </div>
          <div className="card p-6 rounded-2xl flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 cursor-pointer hover:scale-105 transition-transform" onClick={() => router.push('/organizer/create')}>
            <span className="text-2xl font-bold text-white">Создать новый квиз</span>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-6 text-white">Мои квизы и история</h2>
        
        {quizzes.length === 0 ? (
          <div className="card p-12 rounded-2xl text-center">
            <p className="text-gray-400 text-xl mb-4">У вас пока нет квизов</p>
            <p className="text-gray-500">Создайте свой первый квиз и начните проводить игры!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const finishedGames = quiz.rooms?.filter((r: any) => r.status === 'FINISHED').length || 0;
              return (
                <div key={quiz.id} className="card p-6 rounded-2xl hover:scale-105 transition-transform">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white">{quiz.title}</h3>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full font-semibold">
                      {quiz.category || 'Общая'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {quiz.description || 'Нет описания'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-2">
                      {quiz.questions?.length || 0} вопросов
                    </span>
                    <span className="flex items-center gap-2 text-green-400">
                      Игр проведено: {finishedGames}
                    </span>
                  </div>
                  <Link
                    href={`/organizer/quiz/${quiz.id}`}
                    className="btn-primary inline-block w-full text-center py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                  >
                    Управление
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}