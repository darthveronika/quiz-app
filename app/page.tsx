import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-4xl">
        <div className="mb-8 animate-float">
          <h1 className="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            QUIZ APP
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
          Интерактивная платформа для проведения квизов<br />
          в реальном времени с друзьями и коллегами
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link 
            href="/auth" 
            className="btn-primary px-10 py-4 rounded-full font-bold text-xl text-white shadow-2xl hover:scale-105 transition-transform"
          >
             Я организатор
          </Link>
          
          <Link 
            href="/participant/join" 
            className="glass-effect px-10 py-4 rounded-full font-bold text-xl text-white hover:bg-white/10 transition-all"
          >
             Я участник
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="card p-6 rounded-2xl">
            <div className="text-4xl mb-3"></div>
            <h3 className="text-lg font-bold mb-2 text-purple-400">Создавай квизы</h3>
            <p className="text-gray-400 text-sm">Добавляй вопросы разных типов и проводи игры для друзей</p>
          </div>
          
          <div className="card p-6 rounded-2xl">
            <div className="text-4xl mb-3"></div>
            <h3 className="text-lg font-bold mb-2 text-pink-400">Играй в реальном времени</h3>
            <p className="text-gray-400 text-sm">Подключайся по коду комнаты и соревнуйся с другими</p>
          </div>
        </div>
      </div>
    </div>
  );
}