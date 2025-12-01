
import React, { useState } from 'react';
import { MessageCircle, Brain, BookOpen, PieChart, Gamepad2, ArrowRight, Sparkles, Users, X, Award } from 'lucide-react';
import { UserProfile, AppScreen } from '../types';

interface DashboardProps {
  user: UserProfile;
  setScreen: (screen: AppScreen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setScreen }) => {
  const [showTeamModal, setShowTeamModal] = useState(false);

  const cards = [
    {
        id: 'learn',
        title: 'Materi Pembelajaran',
        desc: 'Akses modul lengkap tentang Keamanan Jaringan & UU ITE.',
        icon: BookOpen,
        color: 'emerald', // Updated to emerald
        action: () => setScreen(AppScreen.LEARN),
        colSpan: ''
    },
    {
        id: 'chat',
        title: 'Tanya AI Tutor',
        desc: 'Ngobrol interaktif dengan AI.',
        icon: MessageCircle,
        color: 'blue',
        action: () => setScreen(AppScreen.CHAT),
        colSpan: ''
    },
    {
        id: 'quiz',
        title: 'Latihan Kuis',
        desc: 'Uji pemahamanmu dengan soal.',
        icon: Brain,
        color: 'purple',
        action: () => setScreen(AppScreen.QUIZ),
        colSpan: ''
    },
    {
        id: 'report',
        title: 'Rapor Belajar',
        desc: 'Lihat evaluasi personal.',
        icon: PieChart,
        color: 'cyan',
        action: () => setScreen(AppScreen.REPORT),
        colSpan: ''
    },
    {
        id: 'game_center',
        title: 'Game Center',
        desc: 'Mainkan berbagai simulasi: Cyber Defense, Net Defense, & SOC Simulator.',
        icon: Gamepad2,
        color: 'amber', // Updated to amber
        dark: true,
        action: () => setScreen(AppScreen.GAME_CENTER),
        colSpan: 'md:col-span-2'
    }
  ];

  const teamMembers = [
    { name: "Mohamad Lukman Nurhasyim, S.Kom." },
    { name: "Mohammad Munir, S.Kom." },
    { name: "Shafira Viski Izabal, S.Kom." },
    { name: "Ferdian Nada" },
    { name: "Alim Sujito" }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Tim Penyusun Button */}
      <div className="flex justify-end mb-2 animate-fade-in-up">
        <button
          onClick={() => setShowTeamModal(true)}
          className="group flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-full text-emerald-700 font-semibold text-xs sm:text-sm shadow-sm hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
        >
          <div className="p-1 bg-emerald-100 rounded-full group-hover:bg-white/20 group-hover:text-white transition-colors">
            <Users className="w-3 h-3" />
          </div>
          <span>Tim Penyusun</span>
        </button>
      </div>

      <div className="mb-8 text-center sm:text-left animate-fade-in-up">
        <div className="inline-flex items-center gap-2 p-1 px-3 bg-white/60 backdrop-blur-sm border border-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide mb-3 shadow-sm">
            <Sparkles className="w-3 h-3 text-yellow-500" />
            Selamat Datang
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-1 sm:mb-2 tracking-tight">
            Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-yellow-500">{user.name}</span>! 👋
        </h2>
        <p className="text-sm sm:text-base text-gray-500 font-medium">Siap untuk menjadi ahli keamanan jaringan hari ini?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {cards.map((card, index) => {
            const isDark = card.dark;
            
            return (
                <div 
                  key={card.id}
                  onClick={card.action}
                  className={`
                    group relative rounded-3xl p-6 shadow-sm border transition-all cursor-pointer overflow-hidden active:scale-[0.98] animate-fade-in-up
                    ${card.colSpan}
                    ${isDark 
                        ? 'bg-slate-900 border-slate-700 hover:shadow-emerald-500/20 hover:border-emerald-500/50 hover:shadow-2xl' 
                        : 'bg-white/80 backdrop-blur-md border-white/50 hover:border-emerald-200 hover:bg-white hover:shadow-xl'
                    }
                  `}
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                >
                   {/* Background Decorations */}
                   {isDark ? (
                       <>
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
                        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 bg-${card.color}-500/20 group-hover:bg-${card.color}-500/30`}></div>
                       </>
                   ) : (
                       <>
                        <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700 bg-${card.color}-400 blur-2xl`}></div>
                        <div className={`absolute -left-6 -top-6 w-24 h-24 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700 bg-${card.color}-300 blur-2xl`}></div>
                       </>
                   )}

                   <div className="relative z-10 flex flex-col h-full justify-between">
                     <div>
                       <div className={`
                         w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                         ${isDark ? `bg-${card.color}-500/20 text-${card.color}-400` : `bg-${card.color}-100 text-${card.color}-600`}
                       `}>
                          <card.icon className="w-6 h-6" />
                       </div>
                       
                       <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                         {card.title}
                       </h3>
                       <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                         {card.desc}
                       </p>
                     </div>

                     <div className={`
                       mt-6 flex items-center text-sm font-bold transition-all duration-300 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
                       ${isDark ? 'text-white' : 'text-emerald-600'}
                     `}>
                       Masuk <ArrowRight className="w-4 h-4 ml-2" />
                     </div>
                   </div>
                </div>
            );
        })}
      </div>

      {/* Team Modal Popup */}
      {showTeamModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setShowTeamModal(false)}
          ></div>
          
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm sm:max-w-md relative z-10 animate-fade-in-up overflow-hidden flex flex-col max-h-[85vh] transform transition-all scale-100">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 p-8 pb-10 text-white text-center relative shrink-0">
              <div className="absolute inset-0 bg-grid-pattern opacity-20 mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
              
              <button 
                onClick={() => setShowTeamModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/30 rounded-full transition-all hover:rotate-90"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="inline-flex p-4 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl mb-4 shadow-lg ring-4 ring-white/20 animate-pulse-slow">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-extrabold mb-1 tracking-tight">Tim Penyusun</h3>
              <p className="text-emerald-100 text-sm font-medium opacity-90">SMK AL-AZHAR SEMPU</p>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 -mt-6 rounded-t-[2rem] relative z-20 px-6 pt-8 pb-6">
              <div className="space-y-3">
                {teamMembers.map((member, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group cursor-default animate-fade-in-up"
                    style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-inner text-white bg-gradient-to-br ${
                       idx === 0 ? 'from-amber-400 to-orange-500' :
                       idx % 2 === 0 ? 'from-emerald-400 to-green-500' : 
                       'from-teal-400 to-emerald-500'
                    }`}>
                      {getInitials(member.name)}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex items-center">
                       <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate group-hover:text-emerald-700 transition-colors">
                         {member.name}
                       </h4>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                 <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">Developed By</p>
                 <p className="text-xs text-emerald-600 font-semibold">SMK AL-AZHAR SEMPU © 2025</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
