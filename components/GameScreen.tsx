
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, GameScenario, GameLevel, Achievement } from '../types';
import { generateGameScenario } from '../services/geminiService';
import { Shield, AlertTriangle, Terminal, CheckCircle, XCircle, Play, Clock, Zap, Award, Trophy, X, Star } from 'lucide-react';
import FormattedText from './FormattedText';

interface GameScreenProps {
  user: UserProfile;
}

// --- CONFIG & CONSTANTS ---
const TIME_LIMIT_SECONDS = 30;

const LEVELS: GameLevel[] = [
  { rank: "Newbie Admin", minScore: 0, color: "text-gray-400" },
  { rank: "Sysadmin", minScore: 100, color: "text-blue-400" },
  { rank: "Network Engineer", minScore: 300, color: "text-purple-400" },
  { rank: "Security Analyst", minScore: 600, color: "text-orange-400" },
  { rank: "Cyber Guardian", minScore: 1000, color: "text-emerald-400 shadow-[0_0_10px_#34d399]" }
];

const ACHIEVEMENTS: Achievement[] = [
  { id: 'cd_first_blood', title: 'First Defense', description: 'Menyelesaikan insiden pertama', icon: '🔰', unlocked: false },
  { id: 'cd_streak_master', title: 'Combo Breaker', description: 'Mencapai 3x Streak', icon: '🔥', unlocked: false },
  { id: 'cd_survivor', title: 'Survivor', description: 'Mencapai skor 500', icon: '🛡️', unlocked: false },
  { id: 'cd_perfectionist', title: 'Zero Trust', description: 'Menjawab 5 benar berturut-turut', icon: '💎', unlocked: false },
  { id: 'cd_speed', title: 'Lightning Fast', description: 'Menjawab < 5 detik', icon: '⚡', unlocked: false },
  { id: 'cd_integrity', title: 'Iron Wall', description: 'Menang dengan Integrity 100%', icon: '🏰', unlocked: false },
  { id: 'cd_clutch', title: 'Clutch Save', description: 'Selamat dari Integrity < 20%', icon: '🚑', unlocked: false },
  { id: 'cd_guardian', title: 'Guardian', description: 'Mencapai Rank Cyber Guardian', icon: '👼', unlocked: false },
  { id: 'cd_veteran', title: 'Veteran', description: 'Bermain 10 ronde', icon: '🎖️', unlocked: false },
  { id: 'cd_hacker', title: 'Counter Hack', description: 'Menggagalkan serangan CRITICAL', icon: '👨‍💻', unlocked: false }
];

// --- HELPER COMPONENT: TYPING EFFECT ---
const TypingEffect: React.FC<{ text: string; speed?: number }> = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

// --- MAIN COMPONENT ---
const GameScreen: React.FC<GameScreenProps> = ({ user }) => {
  // Game State
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'RESULT' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [systemIntegrity, setSystemIntegrity] = useState(100);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [currentRank, setCurrentRank] = useState(LEVELS[0]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  // Scenario State
  const [currentScenario, setCurrentScenario] = useState<GameScenario | null>(null);
  const [lastImpact, setLastImpact] = useState<{ text: string; success: boolean; pointsGained: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Achievement UI
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{title: string, icon: string} | null>(null);

  const timerRef = useRef<number | null>(null);

  // Initialize
  useEffect(() => {
    const savedScore = localStorage.getItem('highscore_cyber_defense');
    if (savedScore) setHighScore(parseInt(savedScore));
    const savedAch = JSON.parse(localStorage.getItem('achievements_cyber') || '[]');
    setUnlockedAchievements(savedAch);
  }, []);

  // Timer Logic
  useEffect(() => {
    if (gameState === 'PLAYING' && !loading && currentScenario) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, loading, currentScenario]);

  // Rank Update Logic
  useEffect(() => {
    const newRank = [...LEVELS].reverse().find(l => score >= l.minScore) || LEVELS[0];
    if (newRank.rank !== currentRank.rank) {
      setCurrentRank(newRank);
    }
    if (newRank.rank === 'Cyber Guardian') unlockAchievement('cd_guardian');
  }, [score, currentRank.rank]);

  const startGame = async () => {
    setScore(0);
    setStreak(0);
    setSystemIntegrity(100);
    setRoundsPlayed(0);
    setGameState('PLAYING');
    await nextRound();
  };

  const nextRound = async () => {
    setGameState('PLAYING');
    setLastImpact(null);
    setLoading(true);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setRoundsPlayed(p => p + 1);

    const scenario = await generateGameScenario(user);
    if (scenario) {
      setCurrentScenario(scenario);
    } else {
      // Fallback
      setCurrentScenario({
        id: 'fallback',
        topic: 'Network Security',
        situation: 'Koneksi internet kantor terputus tiba-tiba. Log firewall menunjukkan ribuan request dari IP asing.',
        severity: 'CRITICAL',
        options: [
           { text: 'Block IP Range di Firewall', isCorrect: true, impact: 'Serangan berhasil dihentikan.' },
           { text: 'Restart Router', isCorrect: false, impact: 'Router nyala kembali tapi serangan lanjut.' },
           { text: 'Abaikan saja', isCorrect: false, impact: 'Jaringan lumpuh total.' }
        ]
      });
    }
    setLoading(false);
  };

  const handleTimeOut = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    handleOptionSelect(-1, true); // -1 indicates timeout
  };

  const unlockAchievement = (id: string) => {
    if (!unlockedAchievements.includes(id)) {
      const newList = [...unlockedAchievements, id];
      setUnlockedAchievements(newList);
      localStorage.setItem('achievements_cyber', JSON.stringify(newList));
      
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) {
        setAchievementToast({ title: ach.title, icon: ach.icon });
        setTimeout(() => setAchievementToast(null), 3000);
      }
    }
  };

  const handleOptionSelect = (index: number, isTimeout: boolean = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    let points = 0;
    let success = false;
    let impactText = "";
    let integrityDeduction = 0;

    if (isTimeout) {
      success = false;
      impactText = "WAKTU HABIS! Sistem pertahanan gagal merespons tepat waktu. Serangan masuk!";
      integrityDeduction = 25;
      setStreak(0);
    } else if (currentScenario) {
      const selected = currentScenario.options[index];
      success = selected.isCorrect;
      impactText = selected.impact;

      if (success) {
        const basePoints = 100;
        const timeBonus = Math.floor(timeLeft * 2); 
        let multiplier = 1 + (streak * 0.1); 
        if (multiplier > 3) multiplier = 3; 

        points = Math.floor((basePoints + timeBonus) * multiplier);
        setStreak(s => s + 1);
        
        setSystemIntegrity(prev => {
            const val = Math.min(100, prev + 5);
            if (prev < 20 && val >= 20) unlockAchievement('cd_clutch');
            if (val === 100) unlockAchievement('cd_integrity');
            return val;
        });

        // Achievements
        unlockAchievement('cd_first_blood');
        if (score + points >= 500) unlockAchievement('cd_survivor');
        if (streak + 1 >= 3) unlockAchievement('cd_streak_master');
        if (streak + 1 >= 5) unlockAchievement('cd_perfectionist');
        if (TIME_LIMIT_SECONDS - timeLeft < 5) unlockAchievement('cd_speed');
        if (roundsPlayed >= 10) unlockAchievement('cd_veteran');
        if (currentScenario.severity === 'CRITICAL') unlockAchievement('cd_hacker');

      } else {
        setStreak(0);
        integrityDeduction = currentScenario.severity === 'CRITICAL' ? 40 : 20;
      }
    }

    const newScore = score + points;
    setScore(newScore);
    const newIntegrity = Math.max(0, systemIntegrity - integrityDeduction);
    setSystemIntegrity(newIntegrity);

    setLastImpact({
      text: impactText,
      success: success,
      pointsGained: points
    });

    if (newIntegrity <= 0) {
      setGameState('GAMEOVER');
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('highscore_cyber_defense', newScore.toString());
      }
    } else {
      setGameState('RESULT');
    }
  };

  // --- RENDER UI --- (Same layout, logic improved)
  if (loading && gameState === 'PLAYING') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-140px)] bg-slate-950 text-emerald-500 font-mono">
        <Terminal className="w-16 h-16 mb-4 animate-pulse" />
        <div className="text-xl">ACCESSING MAINFRAME...</div>
        <div className="text-xs text-slate-500 mt-2">DECRYPTING SECURITY LOGS</div>
      </div>
    );
  }

  // --- START SCREEN ---
  if (gameState === 'START' || gameState === 'GAMEOVER') {
    return (
      <div className="h-[calc(100dvh-140px)] md:h-[85vh] bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-mono relative overflow-hidden rounded-xl md:rounded-none m-2 md:m-0 border border-slate-800 md:border-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* ACHIEVEMENT BUTTON */}
        <button 
           onClick={() => setShowAchievements(true)}
           className="absolute top-4 right-4 z-50 bg-slate-800/80 p-2 rounded-xl border border-yellow-500/30 hover:bg-slate-700 transition-colors group"
        >
           <Trophy className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
        </button>

        <div className="relative z-10 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 rounded-full flex items-center justify-center border-4 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
               <Shield className="w-10 h-10 md:w-12 md:h-12 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            CYBER DEFENSE
          </h1>
          <p className="text-slate-400 mb-8 text-xs md:text-sm">SIMULASI KEAMANAN JARINGAN (TKJ)</p>

          <div className="bg-slate-900/50 border border-slate-800 p-4 md:p-6 rounded-xl mb-8 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs uppercase tracking-widest">High Score</span>
              <span className="text-yellow-400 font-bold font-mono text-xl">{highScore}</span>
            </div>
            <div className="h-px bg-slate-800 w-full mb-4"></div>
            <div className="text-left space-y-2 text-xs md:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Waktu: <strong>{TIME_LIMIT_SECONDS}s</strong>/soal.</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Streak Combo Multiplier.</span>
              </div>
            </div>
          </div>

          {gameState === 'GAMEOVER' && (
            <div className="mb-8 animate-fade-in-up">
              <h2 className="text-red-500 text-2xl font-bold mb-2">SYSTEM FAILURE</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <div className="text-xs text-slate-500 uppercase">Score</div>
                    <div className="text-xl font-bold text-white">{score}</div>
                 </div>
                 <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <div className="text-xs text-slate-500 uppercase">Rank</div>
                    <div className={`text-lg font-bold ${currentRank.color}`}>{currentRank.rank}</div>
                 </div>
              </div>
            </div>
          )}

          <button
            onClick={startGame}
            className="w-full group relative px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold text-lg rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <span className="flex items-center justify-center gap-2">
              <Terminal className="w-5 h-5" />
              {gameState === 'GAMEOVER' ? 'REBOOT SYSTEM' : 'START GAME'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // --- PLAYING UI --- (Standard)
  return (
    <div className="h-[calc(100dvh-140px)] md:h-[90vh] bg-slate-950 text-white font-mono flex flex-col p-4 relative overflow-hidden rounded-none md:rounded-lg">
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
                      {ACHIEVEMENTS.map((ach) => {
                          const isUnlocked = unlockedAchievements.includes(ach.id);
                          return (
                              <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                  isUnlocked 
                                  ? 'bg-emerald-900/20 border-emerald-600/50 shadow-inner' 
                                  : 'bg-slate-950 border-slate-800 opacity-50 grayscale'
                              }`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                                      isUnlocked ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'
                                  }`}>
                                      {ach.icon}
                                  </div>
                                  <div>
                                      <div className={`font-bold text-sm ${isUnlocked ? 'text-emerald-400' : 'text-slate-500'}`}>{ach.title}</div>
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

      {/* HUD HEADER */}
      <div className="flex justify-between items-end mb-4 border-b border-slate-800 pb-2 z-10 flex-shrink-0">
        <div>
           <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Rank</div>
           <div className={`font-bold ${currentRank.color} flex items-center gap-2 text-sm`}>
             <Shield className="w-4 h-4" />
             {currentRank.rank}
           </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setShowAchievements(true)}
                className="bg-slate-900 p-2 rounded-lg border border-slate-700 hover:border-yellow-500 hover:text-yellow-500 transition-colors"
                title="Achievements"
            >
                <Trophy className="w-5 h-5" />
            </button>
            <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Score</div>
                <div className="text-xl font-bold text-emerald-400">{score}</div>
            </div>
        </div>
      </div>

      {/* SYSTEM INTEGRITY BAR */}
      <div className="mb-4 z-10 flex-shrink-0">
         <div className="flex justify-between text-xs mb-1">
            <span className={systemIntegrity < 30 ? "text-red-500 animate-pulse font-bold" : "text-slate-400"}>INTEGRITY</span>
            <span className="text-slate-400">{systemIntegrity}%</span>
         </div>
         <div className="w-full h-2 bg-slate-900 rounded-full border border-slate-800 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-500 ${
                  systemIntegrity > 60 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 
                  systemIntegrity > 30 ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 
                  'bg-red-600 shadow-[0_0_10px_#dc2626] animate-pulse'
              }`}
              style={{ width: `${systemIntegrity}%` }}
            ></div>
         </div>
      </div>

      {/* TIMER & STREAK */}
      <div className="flex justify-between items-center mb-4 z-10 flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded border border-slate-800">
             <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-500 animate-ping' : 'text-blue-400'}`} />
             <span className={`font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-white'}`}>00:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
          {streak > 1 && (
             <div className="flex items-center gap-1 text-yellow-400 animate-bounce">
                <Zap className="w-4 h-4 fill-current" />
                <span className="font-bold text-sm">x{streak >= 3 ? '2' : '1.5'}</span>
             </div>
          )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 z-10 flex flex-col justify-center overflow-y-auto pb-4 scrollbar-hide">
        {gameState === 'RESULT' && lastImpact ? (
            <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4 md:p-6 shadow-2xl animate-fade-in-up">
                <div className={`flex items-center gap-3 mb-4 ${lastImpact.success ? 'text-emerald-400' : 'text-red-500'}`}>
                    {lastImpact.success ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                    <h3 className="text-lg font-bold uppercase">{lastImpact.success ? 'MITIGATED' : 'BREACHED'}</h3>
                </div>
                <div className="bg-black/30 p-3 rounded-lg mb-4 font-mono text-xs md:text-sm leading-relaxed border border-slate-800">
                    <span className="text-slate-500 mr-2">{'>'}</span>
                    <TypingEffect text={lastImpact.text} speed={15} />
                </div>
                <button 
                  onClick={nextRound}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold border border-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                   NEXT <Play className="w-4 h-4" />
                </button>
            </div>
        ) : (
            currentScenario && (
                <div className="animate-fade-in">
                    {/* TERMINAL WINDOW */}
                    <div className="bg-black/80 border border-slate-700 rounded-t-lg p-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-[10px] text-slate-500 ml-2">root@server:~#</span>
                    </div>
                    <div className="bg-slate-900/90 border-x border-b border-slate-700 rounded-b-lg p-4 mb-4 shadow-lg min-h-[100px]">
                        <div className="flex items-start gap-3">
                           <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-1 ${currentScenario.severity === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
                           <div>
                                <h3 className="text-emerald-500 font-bold mb-1 text-[10px] uppercase tracking-widest">THREAT: {currentScenario.severity}</h3>
                                <p className="text-sm md:text-base leading-snug font-medium text-white">
                                    <TypingEffect text={currentScenario.situation} speed={20} />
                                </p>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {currentScenario.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                className="w-full text-left p-3 bg-slate-800/50 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-500/50 rounded-lg transition-all group active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="bg-slate-700 text-slate-300 w-5 h-5 flex items-center justify-center rounded text-xs font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        {idx + 1}
                                    </span>
                                    <span className="text-slate-200 text-xs sm:text-sm group-hover:text-emerald-100 font-medium line-clamp-2">
                                        <FormattedText text={opt.text} />
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )
        )}
      </div>
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none z-0"></div>
    </div>
  );
};

export default GameScreen;
