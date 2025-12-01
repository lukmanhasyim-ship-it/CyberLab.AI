
import React, { useState, useEffect } from 'react';
import { UserProfile, KC7Case, Achievement } from '../types';
import { generateKC7Case } from '../services/geminiService';
import { Search, Terminal, CheckCircle, XCircle, Loader2, Database, Clock, Server, FileText, ChevronRight, Trophy, X, Star } from 'lucide-react';
import FormattedText from './FormattedText';

interface KC7ScreenProps {
  user: UserProfile;
}

const KC7_ACHIEVEMENTS: Achievement[] = [
    { id: 'kc7_rookie', title: 'Rookie Detective', description: 'Menyelesaikan 1 kasus', icon: '🔍', unlocked: false },
    { id: 'kc7_sherlock', title: 'Sherlock', description: 'Menyelesaikan 5 kasus', icon: '🕵️', unlocked: false },
    { id: 'kc7_sql', title: 'DB Protector', description: 'Menangani kasus SQL Injection', icon: '🗄️', unlocked: false },
    { id: 'kc7_auth', title: 'Auth Master', description: 'Menangani kasus Brute Force/Login', icon: '🔐', unlocked: false }
];

const KC7Screen: React.FC<KC7ScreenProps> = ({ user }) => {
  const [caseData, setCaseData] = useState<KC7Case | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'PLAYING' | 'WIN' | 'LOSE'>('PLAYING');
  const [unlockedList, setUnlockedList] = useState<string[]>([]);
  
  // Achievement UI
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{title: string, icon: string} | null>(null);

  // Load Achievements
  useEffect(() => {
     const saved = JSON.parse(localStorage.getItem('achievements_kc7') || '[]');
     setUnlockedList(saved);
  }, []);

  const unlock = (id: string) => {
     if (!unlockedList.includes(id)) {
        const newList = [...unlockedList, id];
        setUnlockedList(newList);
        localStorage.setItem('achievements_kc7', JSON.stringify(newList));
        
        const ach = KC7_ACHIEVEMENTS.find(a => a.id === id);
        if (ach) {
            setAchievementToast({ title: ach.title, icon: ach.icon });
            setTimeout(() => setAchievementToast(null), 3000);
        }
     }
  };

  const loadCase = async () => {
    setLoading(true);
    setGameState('PLAYING');
    setSelectedLogId(null);
    setCaseData(null);
    
    const newCase = await generateKC7Case(user);
    setCaseData(newCase);
    setLoading(false);
  };

  useEffect(() => {
    loadCase();
  }, []);

  const handleSubmit = () => {
    if (selectedLogId === null || !caseData) return;

    const selectedLog = caseData.logs.find(l => l.id === selectedLogId);
    if (selectedLog?.isSuspicious) {
      setGameState('WIN');
      const current = parseInt(localStorage.getItem('highscore_kc7_cases') || '0');
      const newScore = current + 1;
      localStorage.setItem('highscore_kc7_cases', newScore.toString());

      // Unlock Achievements
      unlock('kc7_rookie');
      if (newScore >= 5) unlock('kc7_sherlock');
      if (caseData.title.toLowerCase().includes('sql') || caseData.description.toLowerCase().includes('database')) unlock('kc7_sql');
      if (caseData.title.toLowerCase().includes('brute') || caseData.title.toLowerCase().includes('login')) unlock('kc7_auth');

    } else {
      setGameState('LOSE');
    }
  };

  const getLogIcon = (event: string) => {
    const e = event.toLowerCase();
    if (e.includes('login') || e.includes('auth')) return <Server className="w-4 h-4 text-blue-400" />;
    if (e.includes('error') || e.includes('fail')) return <XCircle className="w-4 h-4 text-red-400" />;
    if (e.includes('sql') || e.includes('db')) return <Database className="w-4 h-4 text-yellow-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-140px)] bg-slate-950 text-cyan-500 font-mono">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg tracking-widest font-bold">LOADING CASE...</p>
        <p className="text-xs text-slate-500 mt-2">Decrypting Server Logs...</p>
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="h-[calc(100dvh-140px)] md:h-[90vh] bg-slate-950 text-slate-300 font-sans flex flex-col overflow-hidden border-t border-slate-800 relative">
      
      {/* TOAST NOTIFICATION */}
      {achievementToast && (
          <div className="fixed top-24 right-4 z-[100] animate-fade-in-up">
              <div className="bg-emerald-600 rounded-full shadow-2xl border-4 border-emerald-500/50 p-2 pr-8 flex items-center gap-4 max-w-sm transform transition-all hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-inner border-2 border-white/50">
                      <span className="text-2xl drop-shadow-sm">{achievementToast.icon}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                      <h4 className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Yey, kamu mendapatkan Achievement</h4>
                      <span className="text-white font-black text-sm md:text-base leading-none drop-shadow-md">{achievementToast.title}</span>
                  </div>
              </div>
          </div>
      )}

      {/* ACHIEVEMENT MODAL */}
      {showAchievements && (
          <div className="absolute inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up">
                  <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-yellow-500 font-bold">
                          <Trophy className="w-5 h-5" /> ACHIEVEMENTS
                      </div>
                      <button onClick={() => setShowAchievements(false)} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                          <X className="w-5 h-5 text-slate-400" />
                      </button>
                  </div>
                  <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
                      {KC7_ACHIEVEMENTS.map((ach) => {
                          const isUnlocked = unlockedList.includes(ach.id);
                          return (
                              <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                  isUnlocked 
                                  ? 'bg-cyan-900/20 border-cyan-600/50 shadow-inner' 
                                  : 'bg-slate-950 border-slate-800 opacity-50 grayscale'
                              }`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                                      isUnlocked ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'
                                  }`}>
                                      {ach.icon}
                                  </div>
                                  <div>
                                      <div className={`font-bold text-sm ${isUnlocked ? 'text-cyan-400' : 'text-slate-500'}`}>{ach.title}</div>
                                      <div className="text-[10px] text-slate-400 leading-tight">{ach.description}</div>
                                  </div>
                                  {isUnlocked && <Star className="w-4 h-4 text-yellow-500 ml-auto" fill="currentColor" />}
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* HEADER - Compact on Mobile */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 shadow-lg z-20">
         <div className="flex justify-between items-start mb-2">
            <div>
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest mb-1">
                    <Search className="w-4 h-4" />
                    Cyber Detective
                </div>
                <h2 className="text-lg text-white font-bold leading-tight">{caseData.title}</h2>
            </div>
            <button 
                onClick={() => setShowAchievements(true)}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-yellow-500 hover:text-yellow-500 transition-colors"
                title="Achievements"
            >
                <Trophy className="w-5 h-5" />
            </button>
         </div>
         <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-xs text-slate-400">
             <span className="text-cyan-500 font-bold mr-1">MISI:</span>
             {caseData.queryQuestion}
         </div>
      </div>

      {/* LOG FEED (Mobile Friendly) */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-4 space-y-3 pb-24">
         <p className="text-xs text-slate-500 uppercase font-bold mb-2">Server Logs (Tap to Select)</p>
         
         {caseData.logs.map((log) => (
             <div 
                key={log.id}
                onClick={() => gameState === 'PLAYING' && setSelectedLogId(log.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedLogId === log.id 
                    ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                }`}
             >
                 {selectedLogId === log.id && (
                     <div className="absolute top-0 right-0 p-1 bg-cyan-500 rounded-bl-lg">
                         <CheckCircle className="w-4 h-4 text-black" />
                     </div>
                 )}

                 <div className="flex items-start justify-between mb-2">
                     <div className="flex items-center gap-2">
                         {getLogIcon(log.event)}
                         <span className="text-xs font-mono text-slate-500">{log.timestamp}</span>
                     </div>
                     <span className="text-xs text-yellow-500/80 font-mono">{log.source}</span>
                 </div>
                 
                 <h4 className="text-sm font-bold text-white mb-1">{log.event}</h4>
                 <div className="bg-black/30 p-2 rounded text-xs font-mono text-slate-400 break-all border border-slate-800/50">
                     {log.details}
                 </div>
             </div>
         ))}
      </div>

      {/* RESULT OVERLAY (Modal) */}
      {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex items-center justify-center p-6 animate-fade-in">
              <div className={`w-full max-w-md p-6 rounded-2xl border-2 shadow-2xl animate-fade-in-up ${
                  gameState === 'WIN' ? 'bg-slate-900 border-green-500' : 'bg-slate-900 border-red-500'
              }`}>
                  <div className="flex flex-col items-center text-center mb-6">
                      {gameState === 'WIN' ? (
                          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                             <CheckCircle className="w-8 h-8 text-green-500" />
                          </div>
                      ) : (
                          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                             <XCircle className="w-8 h-8 text-red-500" />
                          </div>
                      )}
                      <h2 className={`text-2xl font-black uppercase ${gameState === 'WIN' ? 'text-green-500' : 'text-red-500'}`}>
                          {gameState === 'WIN' ? 'SUSPECT CAUGHT' : 'WRONG EVIDENCE'}
                      </h2>
                  </div>
                  
                  <div className="bg-black/40 p-4 rounded-xl mb-6 border border-slate-800 text-sm leading-relaxed text-slate-300">
                      <strong className="block text-slate-500 text-xs uppercase mb-2">CASE ANALYSIS:</strong>
                      <FormattedText text={caseData.explanation} />
                  </div>

                  <button 
                    onClick={loadCase}
                    className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${
                        gameState === 'WIN' ? 'bg-green-600 text-white' : 'bg-slate-700 text-white'
                    }`}
                  >
                      {gameState === 'WIN' ? 'NEXT CASE' : 'TRY AGAIN'}
                  </button>
              </div>
          </div>
      )}

      {/* BOTTOM ACTION BAR (Floating) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 pb-6 pt-10 pointer-events-none">
          <button 
             onClick={handleSubmit}
             disabled={selectedLogId === null || gameState !== 'PLAYING'}
             className="pointer-events-auto w-full py-4 bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95"
          >
             <Database className="w-5 h-5" />
             SUBMIT EVIDENCE
          </button>
      </div>

    </div>
  );
};

export default KC7Screen;
