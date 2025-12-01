import React, { useEffect, useState, useRef } from 'react';
import { UserProfile, QuizHistory, Achievement } from '../types';
import { analyzeLearningProgress } from '../services/geminiService';
import { PieChart, TrendingUp, Award, Calendar, Sparkles, Download, Upload, Printer, AlertCircle, Gamepad2, Target, Trophy, Shield, Key, Search, Terminal } from 'lucide-react';
import FormattedText from './FormattedText';

interface ReportScreenProps {
  user: UserProfile;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ user }) => {
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Game Stats & Achievements
  const [gameStats, setGameStats] = useState({
     cyberDefense: 0,
     cryptoCracker: 0,
     dataHunter: 0,
     socCases: 0,
     kc7Cases: 0,
     redTeamMissions: 0
  });

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('cyberLabHistory') || '[]');
    setHistory(savedHistory);

    if (savedHistory.length > 0) {
      handleAnalyze(savedHistory);
    }

    setGameStats({
        cyberDefense: parseInt(localStorage.getItem('highscore_cyber_defense') || '0'),
        cryptoCracker: parseInt(localStorage.getItem('highscore_crypto_cracker') || '0'),
        dataHunter: parseInt(localStorage.getItem('highscore_data_hunter') || '0'),
        socCases: parseInt(localStorage.getItem('highscore_soc_cases') || '0'),
        kc7Cases: parseInt(localStorage.getItem('highscore_kc7_cases') || '0'),
        redTeamMissions: parseInt(localStorage.getItem('highscore_redteam_missions') || '0'),
    });
  }, []);

  const handleAnalyze = async (data: QuizHistory[]) => {
    setLoadingAnalysis(true);
    const recentData = data.slice(0, 5); 
    const result = await analyzeLearningProgress(recentData, user);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  const calculateAverage = () => {
    if (history.length === 0) return 0;
    const totalPercentage = history.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
    return Math.round(totalPercentage / history.length);
  };

  const getTotalQuizzes = () => history.length;

  const getBestTopic = () => {
    if (history.length === 0) return '-';
    const best = [...history].sort((a, b) => (b.score/b.totalQuestions) - (a.score/a.totalQuestions))[0];
    return best.topic;
  };

  const handleExportData = () => {
    try {
      const exportData = {
        user: JSON.parse(localStorage.getItem('cyberLabUser') || 'null'),
        history: JSON.parse(localStorage.getItem('cyberLabHistory') || '[]'),
        highScore: localStorage.getItem('cyberLabHighScore') || '0',
        gameStats: {
             cyberDefense: localStorage.getItem('highscore_cyber_defense') || '0',
             cryptoCracker: localStorage.getItem('highscore_crypto_cracker') || '0',
             dataHunter: localStorage.getItem('highscore_data_hunter') || '0',
             socCases: localStorage.getItem('highscore_soc_cases') || '0',
             kc7Cases: localStorage.getItem('highscore_kc7_cases') || '0',
             redTeamMissions: localStorage.getItem('highscore_redteam_missions') || '0',
        },
        achievements: {
            crypto: JSON.parse(localStorage.getItem('achievements_crypto') || '[]'),
            datahunter: JSON.parse(localStorage.getItem('achievements_datahunter') || '[]'),
            cyber: JSON.parse(localStorage.getItem('achievements_cyber') || '[]'),
            soc: JSON.parse(localStorage.getItem('achievements_soc') || '[]'),
            kc7: JSON.parse(localStorage.getItem('achievements_kc7') || '[]'),
            redteam: JSON.parse(localStorage.getItem('achievements_redteam') || '[]'),
        },
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `CyberLab_Backup_${user.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      alert("Gagal mengekspor data.");
      console.error(error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonStr = e.target?.result as string;
        const data = JSON.parse(jsonStr);

        if (!data.history || !Array.isArray(data.history)) {
          throw new Error("Format file tidak valid.");
        }

        if (window.confirm(`Ditemukan data cadangan tanggal ${new Date(data.exportedAt).toLocaleDateString()}.\nTimpa data saat ini?`)) {
          localStorage.setItem('cyberLabHistory', JSON.stringify(data.history));
          if (data.highScore) localStorage.setItem('cyberLabHighScore', data.highScore);
          if (data.user) localStorage.setItem('cyberLabUser', JSON.stringify(data.user));
          
          if (data.gameStats) {
             localStorage.setItem('highscore_cyber_defense', data.gameStats.cyberDefense);
             localStorage.setItem('highscore_crypto_cracker', data.gameStats.cryptoCracker);
             localStorage.setItem('highscore_data_hunter', data.gameStats.dataHunter);
             localStorage.setItem('highscore_soc_cases', data.gameStats.socCases);
             localStorage.setItem('highscore_kc7_cases', data.gameStats.kc7Cases);
             localStorage.setItem('highscore_redteam_missions', data.gameStats.redTeamMissions);
          }

          if (data.achievements) {
              localStorage.setItem('achievements_crypto', JSON.stringify(data.achievements.crypto || []));
              localStorage.setItem('achievements_datahunter', JSON.stringify(data.achievements.datahunter || []));
              localStorage.setItem('achievements_cyber', JSON.stringify(data.achievements.cyber || []));
              localStorage.setItem('achievements_soc', JSON.stringify(data.achievements.soc || []));
              localStorage.setItem('achievements_kc7', JSON.stringify(data.achievements.kc7 || []));
              localStorage.setItem('achievements_redteam', JSON.stringify(data.achievements.redteam || []));
          }

          alert("Data berhasil dipulihkan! Aplikasi akan dimuat ulang.");
          window.location.reload();
        }
      } catch (error) {
        alert("Gagal membaca file backup.");
        console.error(error);
      }
    };
    reader.readAsText(fileObj);
    event.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20 print:p-0 print:pb-0 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <PieChart className="text-emerald-600 print:text-black" />
            Rapor Belajar
          </h2>
          <p className="text-gray-500 print:text-black print:mt-1">
            Siswa: <strong>{user.name}</strong> ({user.grade})
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto print:hidden">
           <button 
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-md"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
          <button 
            onClick={handleExportData}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-medium transition-colors border border-emerald-200 text-sm"
          >
            {/* Swapped Icon: Upload icon for Export (Sending UP to cloud/file) as requested by user "terbalik" */}
            <Upload className="w-4 h-4" />
            Ekspor
          </button>
          <button 
            onClick={handleImportClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200 text-sm shadow-sm"
          >
            {/* Swapped Icon: Download icon for Import (Getting DOWN from file) as requested */}
            <Download className="w-4 h-4" />
            Impor
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:grid-cols-3 print:gap-4 print:mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:border-gray-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-500 font-medium">Rata-rata Nilai</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{calculateAverage()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:border-gray-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-gray-500 font-medium">Kuis Selesai</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{getTotalQuizzes()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:border-gray-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-gray-500 font-medium">Topik Terbaik</span>
          </div>
          <p className="text-lg font-bold text-gray-800 truncate" title={getBestTopic()}>
            {getBestTopic()}
          </p>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-br from-emerald-600 to-green-800 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden print:bg-none print:bg-white print:text-black print:border-2 print:border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl print:hidden"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 print:text-black">
            <Sparkles className="w-5 h-5 text-yellow-300 print:text-black" />
            Evaluasi AI Tutor
          </h3>
          {loadingAnalysis ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/20 rounded w-3/4 print:bg-gray-200"></div>
              <div className="h-4 bg-white/20 rounded w-full print:bg-gray-200"></div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none print:prose-neutral">
              {history.length === 0 ? (
                <p className="opacity-90">Belum ada data kuis. Kerjakan beberapa kuis agar aku bisa memberikan evaluasi!</p>
              ) : (
                <p className="whitespace-pre-line leading-relaxed opacity-95">
                  <FormattedText text={analysis} />
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ACHIEVEMENTS SECTION (UPGRADED UI) */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
           <Trophy className="w-5 h-5 text-yellow-500" /> Daftar Pencapaian (Achievements)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
           {/* Render achievements for ALL games with vibrant cards */}
           {[
             { k: 'achievements_crypto', name: 'Crypto Cracker', color: 'indigo', icon: <Key className="w-5 h-5"/> },
             { k: 'achievements_datahunter', name: 'Net Defense', color: 'pink', icon: <Shield className="w-5 h-5"/> },
             { k: 'achievements_cyber', name: 'Cyber Defense', color: 'emerald', icon: <Gamepad2 className="w-5 h-5"/> },
             { k: 'achievements_soc', name: 'SOC Simulator', color: 'blue', icon: <Target className="w-5 h-5"/> },
             { k: 'achievements_kc7', name: 'KC7 Detective', color: 'cyan', icon: <Search className="w-5 h-5"/> },
             { k: 'achievements_redteam', name: 'Red Team Ops', color: 'red', icon: <Terminal className="w-5 h-5"/> }
           ].map((g, idx) => {
               const unlocked = JSON.parse(localStorage.getItem(g.k) || '[]');
               const count = unlocked.length;
               
               return (
                   <div key={idx} className={`relative bg-white p-4 rounded-xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all hover:border-${g.color}-200`}>
                      <div className={`absolute -right-4 -top-4 w-16 h-16 bg-${g.color}-100 rounded-full opacity-50 group-hover:scale-150 transition-transform`}></div>
                      
                      <div className="relative z-10 flex flex-col items-center justify-center text-center">
                          <div className={`p-3 rounded-full bg-${g.color}-50 text-${g.color}-600 mb-2`}>
                              {g.icon}
                          </div>
                          <div className={`text-3xl font-bold text-${g.color}-600 mb-1`}>{count}</div>
                          <div className={`text-xs font-bold text-${g.color}-800 uppercase tracking-tight`}>{g.name}</div>
                          <div className="text-[10px] text-gray-400 mt-1">Medals Unlocked</div>
                      </div>
                   </div>
               )
           })}
        </div>
      </div>

      {/* GAME STATISTICS */}
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Gamepad2 className="w-5 h-5 text-emerald-600" />
        Statistik Game & Simulasi
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 print:grid-cols-3 print:mb-6">
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:shadow-none">
             <div className="flex items-center gap-2 text-emerald-600 mb-1 font-bold text-xs uppercase print:text-black"><Trophy className="w-4 h-4" /> Cyber Defense</div>
             <div className="text-2xl font-bold text-gray-800 print:text-black">{gameStats.cyberDefense}</div>
             <div className="text-xs text-gray-400 print:text-black">High Score</div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:shadow-none">
             <div className="flex items-center gap-2 text-indigo-600 mb-1 font-bold text-xs uppercase print:text-black"><Key className="w-4 h-4" /> Crypto Cracker</div>
             <div className="text-2xl font-bold text-gray-800 print:text-black">{gameStats.cryptoCracker}</div>
             <div className="text-xs text-gray-400 print:text-black">High Score</div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:shadow-none">
             <div className="flex items-center gap-2 text-pink-600 mb-1 font-bold text-xs uppercase print:text-black"><Shield className="w-4 h-4" /> Net Defense</div>
             <div className="text-2xl font-bold text-gray-800 print:text-black">{gameStats.dataHunter}</div>
             <div className="text-xs text-gray-400 print:text-black">Max RAM Score</div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:shadow-none">
             <div className="flex items-center gap-2 text-blue-600 mb-1 font-bold text-xs uppercase print:text-black"><Target className="w-4 h-4" /> SOC Simulator</div>
             <div className="text-2xl font-bold text-gray-800 print:text-black">{gameStats.socCases}</div>
             <div className="text-xs text-gray-400 print:text-black">Kasus Selesai</div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:shadow-none">
             <div className="flex items-center gap-2 text-cyan-600 mb-1 font-bold text-xs uppercase print:text-black"><Search className="w-4 h-4" /> KC7 Detective</div>
             <div className="text-2xl font-bold text-gray-800 print:text-black">{gameStats.kc7Cases}</div>
             <div className="text-xs text-gray-400 print:text-black">Investigasi Sukses</div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:shadow-none">
             <div className="flex items-center gap-2 text-red-600 mb-1 font-bold text-xs uppercase print:text-black"><Terminal className="w-4 h-4" /> Red Team Ops</div>
             <div className="text-2xl font-bold text-gray-800 print:text-black">{gameStats.redTeamMissions}</div>
             <div className="text-xs text-gray-400 print:text-black">Misi Selesai</div>
         </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4 print:text-black">Riwayat Aktivitas Kuis</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 print:border-gray-300 print:shadow-none print:rounded-none">
        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada riwayat kuis.</div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left print:text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 print:bg-gray-100 print:border-gray-300">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase print:text-black">Tanggal</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase print:text-black">Topik</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center print:text-black">Nilai</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center print:text-black">Skor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 print:divide-gray-200">
                {history.map((item) => {
                  const percentage = Math.round((item.score / item.totalQuestions) * 100);
                  let gradeColor = 'text-red-500';
                  if (percentage >= 80) gradeColor = 'text-green-500';
                  else if (percentage >= 60) gradeColor = 'text-yellow-500';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors print:hover:bg-transparent">
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap print:text-black">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 print:hidden" />
                          {item.date}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-800 print:text-black">{item.topic}</td>
                      <td className={`p-4 text-sm font-bold text-center ${gradeColor} print:text-black`}>
                        {percentage}
                      </td>
                      <td className="p-4 text-sm text-gray-500 text-center print:text-black">
                        {item.score}/{item.totalQuestions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-8 print:hidden animate-fade-in-up">
         <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0">
             <AlertCircle className="w-5 h-5" />
         </div>
         <div>
             <h4 className="font-bold text-blue-800 text-sm mb-1">Penyimpanan Data Lokal</h4>
             <p className="text-sm text-blue-700/80 leading-relaxed">
                 Perhatian: Data progres belajar Anda disimpan secara lokal di browser ini. Mohon lakukan <strong>Ekspor Data</strong> secara berkala agar tidak hilang saat berganti perangkat atau membersihkan cache.
             </p>
         </div>
      </div>

      <div className="hidden print:block text-center text-xs text-gray-400 mt-8">
         Dicetak pada {new Date().toLocaleDateString()} melalui CyberLab.Ai
      </div>
    </div>
  );
};

export default ReportScreen;