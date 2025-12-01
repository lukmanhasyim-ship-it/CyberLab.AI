
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Achievement } from '../types';
import { Key, Unlock, Lock, AlertTriangle, RefreshCw, Trophy, Search, Eye, Award, X, Star } from 'lucide-react';

interface WordGameScreenProps {
  user: UserProfile;
}

const WORD_DATA = [
  { word: "FIREWALL", hint: "Sistem keamanan jaringan yang memantau trafik masuk dan keluar." },
  { word: "ENKRIPSI", hint: "Proses mengamankan data menjadi kode acak agar tidak bisa dibaca." },
  { word: "MALWARE", hint: "Perangkat lunak berbahaya yang dirancang untuk merusak sistem." },
  { word: "PHISHING", hint: "Teknik penipuan untuk mencuri data sensitif user melalui email/link palsu." },
  { word: "ROUTER", hint: "Perangkat keras yang menghubungkan beberapa jaringan berbeda dan menentukan rute terbaik." },
  { word: "SERVER", hint: "Komputer pusat yang menyediakan layanan (resource) bagi client dalam jaringan." },
  { word: "PROTOKOL", hint: "Kumpulan aturan standar yang memungkinkan komunikasi data antar perangkat." },
  { word: "MIKROTIK", hint: "Vendor perangkat keras dan sistem operasi router yang populer digunakan di SMK TKJ." },
  { word: "TOPOLOGI", hint: "Istilah untuk tata letak, desain, atau struktur fisik sebuah jaringan komputer." },
  { word: "BANDWIDTH", hint: "Besaran kapasitas maksimum transfer data dalam jaringan pada waktu tertentu." },
  { word: "LATENCY", hint: "Waktu tunda (delay) yang dibutuhkan data untuk merambat dari asal ke tujuan." },
  { word: "SWITCH", hint: "Perangkat penghubung jaringan di Layer 2 OSI yang bekerja menggunakan MAC Address." },
  { word: "IPADDRESS", hint: "Label numerik unik yang ditetapkan untuk setiap perangkat yang terhubung ke jaringan." },
  { word: "VPN", hint: "Teknologi yang menciptakan koneksi jaringan aman (tunnel) di atas jaringan publik." },
  { word: "DDOS", hint: "Jenis serangan siber yang membanjiri trafik server dengan request palsu hingga down." },
  { word: "TROJAN", hint: "Malware yang menyamar sebagai software sah untuk menipu pengguna." },
  { word: "SPYWARE", hint: "Software yang memata-matai aktivitas pengguna tanpa izin." },
  { word: "RANSOMWARE", hint: "Malware yang mengenkripsi data korban dan meminta tebusan." },
  { word: "BACKDOOR", hint: "Pintu belakang rahasia untuk akses sistem tanpa autentikasi normal." },
  { word: "EXPLOIT", hint: "Kode yang memanfaatkan celah keamanan untuk menyerang sistem." },
  { word: "PATCH", hint: "Pembaruan software untuk menutup celah keamanan." },
  { word: "SNIFFING", hint: "Penyadapan paket data yang lalu lalang di jaringan." },
  { word: "SPOOFING", hint: "Pemalsuan identitas (IP/MAC) untuk menipu sistem keamanan." },
  { word: "BOTNET", hint: "Jaringan komputer terinfeksi yang dikendalikan penyerang secara remote." },
  { word: "ZERO_DAY", hint: "Celah keamanan baru yang belum ada patch perbaikannya." },
  { word: "HONEYPOT", hint: "Sistem palsu untuk menjebak dan memantau aktivitas hacker." },
  { word: "KEYLOGGER", hint: "Alat yang merekam setiap ketukan tombol keyboard korban." }
];

const GAME_ACHIEVEMENTS: Achievement[] = [
    { id: 'cc_novice', title: 'Script Kiddie', description: 'Menyelesaikan 1 level', icon: '👶', unlocked: false },
    { id: 'cc_speed', title: 'Speed Runner', description: 'Menjawab dalam < 10 detik', icon: '⚡', unlocked: false },
    { id: 'cc_nohint', title: 'Pure Genius', description: 'Menjawab tanpa bantuan', icon: '🧠', unlocked: false },
    { id: 'cc_hacker', title: 'Hacker Elite', description: 'Skor mencapai 1000', icon: '💻', unlocked: false },
    { id: 'cc_streak', title: 'Streak Master', description: '5x Benar berturut-turut', icon: '🔥', unlocked: false },
    { id: 'cc_halfway', title: 'Halfway There', description: 'Menyelesaikan 12 Level', icon: '🏁', unlocked: false },
    { id: 'cc_survivor', title: 'Survivor', description: 'Tidak pernah kehabisan waktu', icon: '🛡️', unlocked: false },
    { id: 'cc_crypto', title: 'Crypto King', description: 'Menebak kata ENKRIPSI dengan benar', icon: '🔐', unlocked: false },
    { id: 'cc_netadmin', title: 'Net Admin', description: 'Menebak kata FIREWALL/ROUTER', icon: '🌐', unlocked: false },
    { id: 'cc_champion', title: 'Grandmaster', description: 'Menyelesaikan 25 Level!', icon: '🏆', unlocked: false }
];

const TIME_LIMIT = 60; 
const MAX_QUESTIONS = 25;

const WordGameScreen: React.FC<WordGameScreenProps> = ({ user }) => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'WIN' | 'LOSE' | 'FINISHED'>('START');
  const [currentWordObj, setCurrentWordObj] = useState(WORD_DATA[0]);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [unlockedList, setUnlockedList] = useState<string[]>([]);
  const [usedHint, setUsedHint] = useState(false);
  
  // Achievement UI
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{title: string, icon: string} | null>(null);

  // Load unlocked achievements
  useEffect(() => {
     const saved = JSON.parse(localStorage.getItem('achievements_crypto') || '[]');
     setUnlockedList(saved);
  }, []);

  const unlock = (id: string) => {
     if (!unlockedList.includes(id)) {
        const newList = [...unlockedList, id];
        setUnlockedList(newList);
        localStorage.setItem('achievements_crypto', JSON.stringify(newList));

        const ach = GAME_ACHIEVEMENTS.find(a => a.id === id);
        if (ach) {
            setAchievementToast({ title: ach.title, icon: ach.icon });
            setTimeout(() => setAchievementToast(null), 3000);
        }
     }
  };

  const pickRandomWord = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * WORD_DATA.length);
    setCurrentWordObj(WORD_DATA[randomIndex]);
    setGuessedLetters(new Set());
    setTimeLeft(TIME_LIMIT);
    setUsedHint(false);
  }, []);

  const startGame = () => {
    setScore(0);
    setQuestionsAnswered(0);
    setStreak(0);
    setGameState('PLAYING');
    pickRandomWord();
  };

  const nextRound = () => {
    if (questionsAnswered >= MAX_QUESTIONS - 1) {
        setGameState('FINISHED');
        unlock('cc_champion');
        return;
    }
    setQuestionsAnswered(p => p + 1);
    setGameState('PLAYING');
    pickRandomWord();
  };

  // Timer
  useEffect(() => {
    let timer: number;
    if (gameState === 'PLAYING') {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('LOSE');
            setStreak(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // Check Win Condition
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const isWin = currentWordObj.word.split('').every(char => guessedLetters.has(char));
      if (isWin) {
        const bonus = (timeLeft * 10) + 100;
        const newScore = score + bonus;
        setScore(newScore);
        setGameState('WIN');
        setStreak(s => s + 1);
        
        // Achievement Checks
        unlock('cc_novice');
        if (TIME_LIMIT - timeLeft < 10) unlock('cc_speed');
        if (!usedHint) unlock('cc_nohint');
        if (newScore >= 1000) unlock('cc_hacker');
        if (streak + 1 >= 5) unlock('cc_streak');
        if (questionsAnswered >= 12) unlock('cc_halfway');
        if (currentWordObj.word === 'ENKRIPSI') unlock('cc_crypto');
        if (currentWordObj.word === 'FIREWALL' || currentWordObj.word === 'ROUTER') unlock('cc_netadmin');

        // Save High Score
        const currentHigh = parseInt(localStorage.getItem('highscore_crypto_cracker') || '0');
        if (newScore > currentHigh) {
            localStorage.setItem('highscore_crypto_cracker', newScore.toString());
        }
      }
    }
  }, [guessedLetters, currentWordObj, gameState, timeLeft, score]);

  const handleGuess = (char: string) => {
    if (gameState !== 'PLAYING' || guessedLetters.has(char)) return;
    setGuessedLetters(prev => new Set(prev).add(char));
    if (!currentWordObj.word.includes(char)) {
      setTimeLeft(prev => Math.max(0, prev - 3)); 
    }
  };

  const handleRevealOne = () => {
    setUsedHint(true);
    const unrevealed = currentWordObj.word.split('').find(char => !guessedLetters.has(char));
    if (unrevealed) {
        setGuessedLetters(prev => new Set(prev).add(unrevealed));
        setScore(s => Math.max(0, s - 50)); 
        setTimeLeft(t => Math.max(0, t - 5));
    }
  };

  const keyboard = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

  if (gameState === 'START') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-140px)] md:h-[90vh] bg-slate-900 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-black"></div>
        
        {/* ACHIEVEMENT BUTTON */}
        <button 
           onClick={() => setShowAchievements(true)}
           className="absolute top-4 right-4 z-50 bg-slate-800/80 p-2 rounded-xl border border-yellow-500/30 hover:bg-slate-700 transition-colors group"
        >
           <Trophy className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
        </button>

        <div className="relative z-10 text-center max-w-md">
          <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-[0_0_30px_rgba(99,102,241,0.3)]">
             <Key className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">CRYPTO CRACKER</h1>
          
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8 backdrop-blur-sm">
             <h3 className="text-indigo-300 font-bold mb-2 flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> MISI:
             </h3>
             <ul className="text-slate-400 text-sm text-left space-y-2 list-disc pl-4">
                <li>Selesaikan <strong>25 Level</strong> tantangan.</li>
                <li>Tebak istilah jaringan sebelum waktu habis.</li>
                <li>Salah huruf = Waktu berkurang.</li>
                <li>Kumpulkan 10 Achievements unik!</li>
             </ul>
          </div>

          <button 
            onClick={startGame}
            className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Unlock className="w-5 h-5" /> MULAI (0/25)
          </button>
        </div>

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
                      {GAME_ACHIEVEMENTS.map((ach) => {
                          const isUnlocked = unlockedList.includes(ach.id);
                          return (
                              <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                  isUnlocked 
                                  ? 'bg-indigo-900/20 border-indigo-600/50 shadow-inner' 
                                  : 'bg-slate-950 border-slate-800 opacity-50 grayscale'
                              }`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                                      isUnlocked ? 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'
                                  }`}>
                                      {ach.icon}
                                  </div>
                                  <div>
                                      <div className={`font-bold text-sm ${isUnlocked ? 'text-indigo-400' : 'text-slate-500'}`}>{ach.title}</div>
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
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-140px)] md:h-[90vh] bg-slate-950 text-white flex flex-col p-4 relative overflow-hidden font-mono">
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
                      {GAME_ACHIEVEMENTS.map((ach) => {
                          const isUnlocked = unlockedList.includes(ach.id);
                          return (
                              <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                  isUnlocked 
                                  ? 'bg-indigo-900/20 border-indigo-600/50 shadow-inner' 
                                  : 'bg-slate-950 border-slate-800 opacity-50 grayscale'
                              }`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                                      isUnlocked ? 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'
                                  }`}>
                                      {ach.icon}
                                  </div>
                                  <div>
                                      <div className={`font-bold text-sm ${isUnlocked ? 'text-indigo-400' : 'text-slate-500'}`}>{ach.title}</div>
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

      {/* HUD */}
      <div className="flex justify-between items-start mb-4 z-10">
        <div className="flex gap-2">
             <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg shadow-lg">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Score</div>
                <div className="text-xl font-bold text-indigo-400">{score}</div>
             </div>
             <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg shadow-lg">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Level</div>
                <div className="text-xl font-bold text-yellow-400">{questionsAnswered + 1}/25</div>
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
            <div className={`text-2xl font-bold bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 ${timeLeft < 10 ? 'text-red-500 animate-pulse border-red-900' : 'text-emerald-400'}`}>
               00:{timeLeft.toString().padStart(2, '0')}
            </div>
        </div>
      </div>

      {/* GAME AREA */}
      <div className="flex-1 flex flex-col items-center z-10 overflow-y-auto pb-4 scrollbar-hide">
         
         {gameState === 'FINISHED' && (
             <div className="text-center animate-fade-in-up my-auto">
                 <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-bounce" />
                 <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">MISSION COMPLETE!</h2>
                 <p className="text-slate-400 mb-6 text-lg">Kamu menyelesaikan semua 25 level!</p>
                 <div className="text-3xl font-bold text-white mb-8">Final Score: {score}</div>
                 <button onClick={startGame} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto">
                    <RefreshCw className="w-5 h-5" /> RESTART GAME
                 </button>
             </div>
         )}

         {gameState === 'WIN' && (
             <div className="text-center animate-fade-in-up my-auto">
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h2 className="text-3xl font-bold text-emerald-400 mb-2">ACCESS GRANTED!</h2>
                <p className="text-slate-400 mb-6">Istilah <span className="text-white font-bold">{currentWordObj.word}</span> berhasil didekripsi.</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={nextRound} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                        NEXT LEVEL
                    </button>
                </div>
             </div>
         )}

         {gameState === 'LOSE' && (
             <div className="text-center animate-fade-in-up my-auto">
                <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                <h2 className="text-3xl font-bold text-red-500 mb-2">ACCESS DENIED</h2>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
                    <p className="text-slate-500 text-sm mb-1">Kunci Jawaban:</p>
                    <p className="text-2xl font-bold text-white tracking-widest">{currentWordObj.word}</p>
                </div>
                <button onClick={startGame} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold flex items-center gap-2 mx-auto transition-all active:scale-95">
                    <RefreshCw className="w-4 h-4" /> RESTART GAME
                </button>
             </div>
         )}

         {(gameState === 'PLAYING') && (
            <div className="w-full max-w-2xl flex flex-col items-center">
              
              <div className="w-full bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl mb-8 text-center shadow-[0_0_30px_rgba(99,102,241,0.1)] animate-fade-in">
                 <div className="flex items-center justify-center gap-2 mb-3">
                    <Search className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em]">CLUE / SOAL</span>
                 </div>
                 <p className="text-lg md:text-xl text-white font-medium leading-relaxed drop-shadow-md">
                   "{currentWordObj.hint}"
                 </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {currentWordObj.word.split('').map((char, idx) => (
                  <div key={idx} className={`w-10 h-12 sm:w-12 sm:h-14 rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-bold transition-all shadow-md ${
                    guessedLetters.has(char) 
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]' 
                        : 'bg-slate-800/50 text-transparent border-b-4 border-slate-600'
                  }`}>
                    {guessedLetters.has(char) ? char : ''}
                  </div>
                ))}
              </div>

              <div className="flex justify-between w-full max-w-lg mb-6 px-4">
                 <button 
                   onClick={handleRevealOne}
                   className="text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-full border border-slate-600 flex items-center gap-2 transition-colors active:scale-95"
                 >
                     <Eye className="w-3 h-3" /> Buka Huruf (-50)
                 </button>
                 <button 
                   onClick={startGame}
                   className="text-xs sm:text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-full border border-red-800 flex items-center gap-2 transition-colors active:scale-95"
                 >
                     <RefreshCw className="w-3 h-3" /> Restart
                 </button>
              </div>

              <div className="w-full flex flex-wrap justify-center gap-1.5 sm:gap-2">
                 {keyboard.map((char) => {
                     let statusClass = "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700";
                     if (guessedLetters.has(char)) {
                         if (currentWordObj.word.includes(char)) statusClass = "bg-emerald-600 text-white border-emerald-500 opacity-50 cursor-not-allowed transform scale-95";
                         else statusClass = "bg-slate-900 text-slate-700 border-slate-800 opacity-30 cursor-not-allowed";
                     }

                     return (
                         <button
                            key={char}
                            onClick={() => handleGuess(char)}
                            disabled={guessedLetters.has(char)}
                            className={`w-8 h-10 sm:w-10 sm:h-12 rounded-lg border-b-4 flex items-center justify-center font-bold text-lg sm:text-xl transition-all active:translate-y-1 active:border-b-0 ${statusClass}`}
                         >
                             {char}
                         </button>
                     )
                 })}
              </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default WordGameScreen;
