
import React, { useEffect, useState } from 'react';
import { AppScreen, UserProfile } from '../types';
import { Gamepad2, Key, MousePointer, Shield, ChevronLeft, Trophy, Sparkles, Crosshair, Search } from 'lucide-react';

interface GameCenterProps {
  user: UserProfile;
  setScreen: (screen: AppScreen) => void;
}

const GameCenter: React.FC<GameCenterProps> = ({ user, setScreen }) => {
  const [totalAchievements, setTotalAchievements] = useState(0);

  useEffect(() => {
    const keys = ['achievements_crypto', 'achievements_datahunter', 'achievements_cyber', 'achievements_soc', 'achievements_kc7', 'achievements_redteam'];
    let total = 0;
    keys.forEach(k => {
        const list = JSON.parse(localStorage.getItem(k) || '[]');
        total += list.length;
    });
    setTotalAchievements(total);
  }, []);

  // Ordered from Easiest to Hardest
  const games = [
    {
      id: 'crypto_cracker',
      title: 'Crypto Cracker',
      desc: 'Mini-game tebak istilah enkripsi dan jaringan. Pecahkan kode sebelum waktu habis.',
      icon: Key,
      screen: AppScreen.GAME_WORD,
      color: 'indigo',
      difficulty: 'Easy'
    },
    {
      id: 'data_hunter',
      title: 'Net Defense (Tower Defense)',
      desc: 'Pertahanan Menara Strategis (10 Menit). Lindungi server dari serangan Malware, Ransomware Boss, dan APT Final Boss.',
      icon: MousePointer,
      screen: AppScreen.GAME_DATA_HUNTER,
      color: 'pink',
      difficulty: 'Hard'
    },
    {
      id: 'cyber_defense',
      title: 'Cyber Defense',
      desc: 'Simulasi RPG menjadi Admin Jaringan menghadapi serangan siber nyata.',
      icon: Gamepad2,
      screen: AppScreen.GAME,
      color: 'emerald',
      difficulty: 'Hard'
    },
    {
      id: 'soc_simulator',
      title: 'SOC Simulator',
      desc: 'Jadilah Security Analyst. Analisis alert trafik dan tentukan ancaman nyata.',
      icon: Shield,
      screen: AppScreen.GAME_LETS_DEFEND,
      color: 'blue',
      difficulty: 'Expert'
    },
    {
      id: 'kc7',
      title: 'KC7 Detective',
      desc: 'Blue Team Investigation. Analisis log server dan temukan jejak serangan peretas.',
      icon: Search,
      screen: AppScreen.GAME_KC7,
      color: 'cyan',
      difficulty: 'Expert'
    },
    {
      id: 'red_team_ops',
      title: 'Red Team Ops',
      desc: 'Simulator Ethical Hacking. Scan network target dan eksploitasi celah keamanan.',
      icon: Crosshair,
      screen: AppScreen.GAME_RED_TEAM,
      color: 'red',
      difficulty: 'Expert'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
          <button 
            onClick={() => setScreen(AppScreen.DASHBOARD)}
            className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <ChevronLeft className="w-6 h-6 text-slate-300" />
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              GAME CENTER
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">Pilih tantangan keamanan siber kamu hari ini.</p>
          </div>
        </div>

        {/* High Score Banner (Hall of Fame) */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700 mb-8 relative overflow-hidden animate-fade-in-up shadow-xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
           <div className="relative z-10 flex items-center justify-between">
              <div>
                 <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2">
                    <Trophy className="w-6 h-6" />
                    <span className="tracking-widest">HALL OF FAME</span>
                 </div>
                 <div className="text-4xl font-bold text-white mb-2">{totalAchievements} <span className="text-lg font-normal text-slate-400">Achievements Unlocked</span></div>
                 <p className="text-slate-400 text-sm">Terus bermain untuk membuka lebih banyak lencana!</p>
              </div>
              <div className="hidden sm:block">
                 <Sparkles className="w-16 h-16 text-yellow-500 opacity-80 animate-pulse" />
              </div>
           </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game, index) => (
            <button
              key={game.id}
              onClick={() => setScreen(game.screen)}
              className="group relative bg-slate-900 border border-slate-700 rounded-3xl p-6 text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              {/* Hover Glow */}
              <div className={`absolute -right-20 -top-20 w-64 h-64 bg-${game.color}-500/10 rounded-full blur-3xl group-hover:bg-${game.color}-500/20 transition-all duration-500`}></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-800 border border-slate-700 group-hover:border-${game.color}-500/50 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                      <game.icon className={`w-7 h-7 text-${game.color}-400`} />
                   </div>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-${game.color}-400`}>
                      {game.difficulty}
                   </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {game.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow">
                  {game.desc}
                </p>

                <div className="flex items-center text-sm font-bold text-slate-500 group-hover:text-white transition-colors">
                   MAIN SEKARANG <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameCenter;
