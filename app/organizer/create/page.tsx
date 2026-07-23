'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Общая');
  const [questions, setQuestions] = useState<any[]>([]);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('SINGLE');
  const [qOptions, setQOptions] = useState('');
  const [qCorrect, setQCorrect] = useState('');
  const [qTime, setQTime] = useState(15);
  const [qImageUrl, setQImageUrl] = useState('');

  const addQuestion = () => {
    if (!qText.trim()) {
      alert('Введите текст вопроса');
      return;
    }

    const newQuestion = {
      type: qType,
      text: qText,
      imageUrl: qImageUrl.trim() || null,
      options: qType === 'TEXT' ? [] : qOptions.split(',').map((s: string) => s.trim()),
      correctAnswer: qType === 'MULTIPLE' 
        ? qCorrect.split(',').map((s: string) => s.trim())
        : qCorrect,
      timeLimit: qTime,
    };

    setQuestions([...questions, newQuestion]);
    setQText('');
    setQOptions('');
    setQCorrect('');
    setQImageUrl('');
    setQTime(15);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const createQuiz = async () => {
    if (!title.trim()) {
      alert('Введите название квиза');
      return;
    }

    if (questions.length === 0) {
      alert('Добавьте хотя бы один вопрос');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          creatorId: user.id,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Квиз успешно создан!');
      router.push('/organizer/dashboard');
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-black mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Создание нового квиза
        </h1>

        <div className="card p-8 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Основная информация</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Название квиза</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full p-4 rounded-xl text-white placeholder-gray-500"
                placeholder="Например: Викторина о космосе"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full p-4 rounded-xl text-white"
              >
                <option value="Общая">Общая</option>
                <option value="Наука">Наука</option>
                <option value="История">История</option>
                <option value="Кино">Кино</option>
                <option value="Музыка">Музыка</option>
                <option value="Спорт">Спорт</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field w-full p-4 rounded-xl text-white placeholder-gray-500"
                rows={3}
                placeholder="Краткое описание квиза"
              />
            </div>
          </div>
        </div>

        <div className="card p-8 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Добавить вопрос</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Текст вопроса</label>
              <input
                type="text"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="input-field w-full p-4 rounded-xl text-white placeholder-gray-500"
                placeholder="Введите вопрос"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Тип вопроса</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value)}
                  className="input-field w-full p-4 rounded-xl text-white"
                >
                  <option value="SINGLE">Один правильный ответ</option>
                  <option value="MULTIPLE">Несколько правильных ответов</option>
                  <option value="TEXT">Текстовый ответ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Время на ответ (секунды)</label>
                <input
                  type="number"
                  value={qTime}
                  onChange={(e) => setQTime(parseInt(e.target.value))}
                  min="5"
                  max="60"
                  className="input-field w-full p-4 rounded-xl text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ссылка на изображение (необязательно)</label>
              <input
                type="text"
                value={qImageUrl}
                onChange={(e) => setQImageUrl(e.target.value)}
                className="input-field w-full p-4 rounded-xl text-white placeholder-gray-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {qType !== 'TEXT' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Варианты ответов (через запятую)
                </label>
                <input
                  type="text"
                  value={qOptions}
                  onChange={(e) => setQOptions(e.target.value)}
                  className="input-field w-full p-4 rounded-xl text-white placeholder-gray-500"
                  placeholder="Да, Нет, Не знаю"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Правильный ответ {qType === 'MULTIPLE' && '(через запятую)'}
              </label>
              <input
                type="text"
                value={qCorrect}
                onChange={(e) => setQCorrect(e.target.value)}
                className="input-field w-full p-4 rounded-xl text-white placeholder-gray-500"
                placeholder={qType === 'TEXT' ? 'Правильный ответ' : 'Например: Да'}
              />
            </div>

            <button
              onClick={addQuestion}
              className="btn-primary w-full py-4 rounded-xl font-bold text-lg"
            >
              Добавить вопрос
            </button>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="card p-8 rounded-2xl mb-8">
            <h2 className="text-2xl font-bold mb-6 text-white">
              Добавленные вопросы ({questions.length})
            </h2>
            <div className="space-y-3">
              {questions.map((q, index) => (
                <div key={index} className="bg-gray-800/50 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white">
                      {index + 1}. {q.text}
                    </p>
                    <p className="text-sm text-gray-400">
                      Тип: {q.type} | Время: {q.timeLimit}с {q.imageUrl && '| Есть изображение'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={createQuiz}
            className="btn-success flex-1 py-4 rounded-xl font-bold text-lg"
          >
            Создать квиз
          </button>
          <button
            onClick={() => router.push('/organizer/dashboard')}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-lg transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}