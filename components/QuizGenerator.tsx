import React, { useState } from 'react';
import { QuizQuestion, UserProfile, QuizHistory } from '../types';
import { generateQuizQuestions, evaluateEssayAnswer } from '../services/geminiService';
import { learningTopics } from '../data/topics';
import { Brain, CheckCircle, XCircle, ChevronRight, RefreshCw, Trophy, Sparkles, Target, Zap, Lock, FileText, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import FormattedText from './FormattedText';

interface QuizGeneratorProps {
  user: UserProfile;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ user }) => {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  // MCQ State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Essay State
  const [essayAnswer, setEssayAnswer] = useState('');
  const [essayFeedbackState, setEssayFeedbackState] = useState<'TYPING' | 'EVALUATING' | 'GRADED'>('TYPING');
  const [essayResult, setEssayResult] = useState<{ status: 'CORRECT' | 'PARTIAL' | 'WRONG'; feedback: string } | null>(null);
  
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Filter topics based on user grade
  const userGradeStr = user.grade.replace(/\D/g, ''); // "Kelas 11" -> "11"
  const availableTopics = learningTopics.filter(t => t.grades.includes(userGradeStr));

  const handleGenerate = async (topicOverride?: string) => {
    const topicToUse = typeof topicOverride === 'string' ? topicOverride : topic;

    if (!topicToUse.trim()) return;
    if (topicOverride) setTopic(topicOverride);

    setLoading(true);
    setQuestions([]);
    setQuizFinished(false);
    setScore(0);
    setCurrentQIndex(0);
    
    // Requesting 25 questions from AI service
    const qs = await generateQuizQuestions(topicToUse, user);
    setQuestions(qs);
    setLoading(false);
  };

  // MCQ LOGIC
  const handleOptionClick = (index: number) => {
    if (selectedOption !== null) return; 
    setSelectedOption(index);
    setShowExplanation(true);
    if (questions[currentQIndex].type === 'MCQ' && index === questions[currentQIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  // ESSAY LOGIC (UPDATED: PARTIAL SCORING)
  const checkEssay = async () => {
    if (!essayAnswer.trim()) return;
    
    setEssayFeedbackState('EVALUATING');
    
    // Call AI to evaluate
    const currentQ = questions[currentQIndex];
    const result = await evaluateEssayAnswer(
      currentQ.question, 
      essayAnswer, 
      currentQ.answerKey || ""
    );

    setEssayResult(result);
    
    // Scoring Logic:
    // CORRECT = 1 Point
    // PARTIAL = 0.5 Point
    // WRONG = 0 Point
    if (result.status === 'CORRECT') {
      setScore(s => s + 1);
    } else if (result.status === 'PARTIAL') {
      setScore(s => s + 0.5);
    }
    
    setEssayFeedbackState('GRADED');
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      // Reset States
      setSelectedOption(null);
      setShowExplanation(false);
      setEssayAnswer('');
      setEssayFeedbackState('TYPING');
      setEssayResult(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    
    // Final score adjustment for the last question is handled in real-time update
    const newHistoryItem: QuizHistory = {
      id: Date.now().toString(),
      topic: topic,
      score: score,
      totalQuestions: questions.length,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const existingHistory = JSON.parse(localStorage.getItem('cyberLabHistory') || '[]');
    localStorage.setItem('cyberLabHistory', JSON.stringify([newHistoryItem, ...existingHistory]));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[60vh]">
        <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
            <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin relative z-10"></div>
            <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-600 w-8 h-8 z-20" />
        </div>
        <h3 className="mt-8 text-xl font-bold text-gray-800">Menyusun Soal Latihan...</h3>
        <p className="text-gray-500 mt-2">Menyiapkan campuran soal HOTS, LOTS, dan Essay.</p>
      </div>
    );
  }

  // Initial State
  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20 animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-yellow-500"></div>
          
          <div className="p-8 pb-4 text-center">
            <div className="bg-gradient-to-tr from-emerald-100 to-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Target className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2 tracking-tight">Uji Kompetensi Siswa</h2>
            <p className="text-gray-500 max-w-md mx-auto">Pilih topik sesuai jenjang kelasmu ({user.grade}) untuk memulai latihan intensif (20 PG + 5 Essay).</p>
          </div>

          <div className="p-6 pt-0">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Topik Tersedia untuk {user.grade}</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {availableTopics.length > 0 ? (
                    availableTopics.map((t, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleGenerate(t.title)}
                            className="text-left px-4 py-3 rounded-xl border border-gray-100 bg-white hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md transition-all group flex items-center justify-between"
                        >
                            <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">{t.title}</span>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                    ))
                ) : (
                    <div className="col-span-2 text-center text-gray-400 py-4">Tidak ada topik tersedia untuk kelas ini.</div>
                )}
                
                {learningTopics.filter(t => !t.grades.includes(userGradeStr)).map((t, idx) => (
                    <div key={`locked-${idx}`} className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between opacity-60 cursor-not-allowed">
                         <span className="text-sm font-medium text-gray-400">{t.title}</span>
                         <Lock className="w-4 h-4 text-gray-300" />
                    </div>
                ))}
             </div>

             <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Atau Cari Topik Lain</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                <div className="relative flex-1">
                    <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: VLAN, Routing OSPF"
                    className="w-full pl-12 pr-6 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                    />
                    <Sparkles className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400 w-5 h-5" />
                </div>
                <button
                onClick={() => handleGenerate()}
                disabled={!topic.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                <Zap className="w-5 h-5" />
                Buat Kuis
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (quizFinished) {
    return (
      <div className="max-w-md mx-auto p-6 text-center mt-10 animate-fade-in-up pb-24">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
          <div className="relative z-10">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-xl animate-bounce" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Latihan Selesai!</h2>
            <p className="text-gray-500 mb-6">Topik: <strong className="text-emerald-600">{topic}</strong></p>
            
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
              {Math.round((score / questions.length) * 100)}
            </div>
            <p className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest">SKOR AKHIR ({score}/{questions.length} Poin)</p>

            <button
              onClick={() => {
                setQuestions([]);
                setTopic('');
              }}
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-4 rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Kembali ke Menu Kuis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question Card
  const currentQ = questions[currentQIndex];
  const isEssay = currentQ.type === 'ESSAY';

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
          Soal {currentQIndex + 1} / {questions.length}
          <span className={`px-2 py-0.5 rounded text-[10px] text-white ${currentQ.difficulty === 'HOTS' ? 'bg-orange-500' : 'bg-blue-500'}`}>
            {currentQ.difficulty}
          </span>
        </h2>
        <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-emerald-100">
          Skor: {score}
        </span>
      </div>

      <div key={currentQIndex} className="animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-100 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full ${isEssay ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            
            {isEssay && (
                <div className="mb-2 text-amber-600 font-bold text-sm flex items-center gap-2 uppercase tracking-wide">
                    <FileText className="w-4 h-4" /> Soal Essay (Analisis)
                </div>
            )}
            
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-8 leading-snug pl-2">
              <FormattedText text={currentQ.question} />
            </h3>

            {/* MCQ OPTIONS RENDER */}
            {!isEssay && currentQ.options && (
                <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                    let btnClass = "w-full text-left p-5 rounded-xl border-2 transition-all font-medium relative overflow-hidden group ";
                    
                    if (selectedOption === null) {
                    btnClass += "border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 text-gray-700 bg-gray-50/50";
                    } else {
                    if (currentQ.correctAnswerIndex !== undefined && idx === currentQ.correctAnswerIndex) {
                        btnClass += "border-green-500 bg-green-50 text-green-800 shadow-md";
                    } else if (idx === selectedOption) {
                        btnClass += "border-red-500 bg-red-50 text-red-800";
                    } else {
                        btnClass += "border-gray-100 text-gray-400 opacity-50 grayscale";
                    }
                    }

                    return (
                    <button
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        disabled={selectedOption !== null}
                        className={btnClass}
                    >
                        <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                selectedOption === null ? 'bg-white border border-gray-200 text-gray-500 group-hover:border-emerald-300 group-hover:text-emerald-600' :
                                currentQ.correctAnswerIndex !== undefined && idx === currentQ.correctAnswerIndex ? 'bg-green-200 text-green-700' :
                                idx === selectedOption ? 'bg-red-200 text-red-700' : 'bg-gray-100'
                            }`}>
                                {['A', 'B', 'C', 'D', 'E'][idx]}
                            </span>
                            <span className="text-sm sm:text-base"><FormattedText text={opt} /></span>
                        </div>
                        
                        {selectedOption !== null && currentQ.correctAnswerIndex !== undefined && idx === currentQ.correctAnswerIndex && (
                            <CheckCircle className="w-6 h-6 text-green-600 animate-blob" />
                        )}
                        {selectedOption === idx && currentQ.correctAnswerIndex !== undefined && idx !== currentQ.correctAnswerIndex && (
                            <XCircle className="w-6 h-6 text-red-600 animate-pulse" />
                        )}
                        </div>
                    </button>
                    );
                })}
                </div>
            )}

            {/* ESSAY RENDER */}
            {isEssay && (
                <div className="space-y-4">
                    <textarea 
                        className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[150px] bg-slate-50 text-gray-800"
                        placeholder="Ketik jawaban analisismu di sini secara rinci..."
                        value={essayAnswer}
                        onChange={(e) => setEssayAnswer(e.target.value)}
                        disabled={essayFeedbackState !== 'TYPING'}
                    ></textarea>

                    {essayFeedbackState === 'TYPING' && (
                        <button 
                            onClick={checkEssay}
                            disabled={!essayAnswer.trim()}
                            className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            Cek Jawaban Otomatis
                        </button>
                    )}

                    {essayFeedbackState === 'EVALUATING' && (
                        <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-lg animate-pulse">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-bold text-sm">AI sedang mengoreksi jawabanmu...</span>
                        </div>
                    )}

                    {essayFeedbackState === 'GRADED' && essayResult && (
                        <div className={`animate-fade-in p-6 rounded-xl border ${
                            essayResult.status === 'CORRECT' ? 'bg-green-50 border-green-200' : 
                            essayResult.status === 'PARTIAL' ? 'bg-orange-50 border-orange-200' :
                            'bg-red-50 border-red-200'
                        }`}>
                             <div className="flex items-center gap-2 mb-3">
                                {essayResult.status === 'CORRECT' ? (
                                    <div className="flex items-center gap-2 text-green-700 font-bold uppercase text-sm">
                                        <CheckCircle className="w-5 h-5" /> Jawaban Benar (+1.0)
                                    </div>
                                ) : essayResult.status === 'PARTIAL' ? (
                                    <div className="flex items-center gap-2 text-orange-700 font-bold uppercase text-sm">
                                        <AlertCircle className="w-5 h-5" /> Kurang Tepat (+0.5)
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-700 font-bold uppercase text-sm">
                                        <XCircle className="w-5 h-5" /> Jawaban Salah (+0)
                                    </div>
                                )}
                             </div>

                             <h4 className="font-bold text-gray-700 text-xs uppercase mb-1">Feedback AI Tutor:</h4>
                             <p className="text-sm text-gray-800 leading-relaxed mb-4">
                                {essayResult.feedback}
                             </p>

                             <h4 className="font-bold text-amber-800 text-xs uppercase mb-1 flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Poin Kunci Jawaban:
                            </h4>
                            <div className="text-xs text-gray-600 italic bg-white p-3 rounded border border-gray-200">
                                <FormattedText text={currentQ.answerKey || "Kunci jawaban tidak tersedia."} />
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* MCQ EXPLANATION */}
          {!isEssay && showExplanation && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-24 animate-fade-in-up shadow-sm">
              <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5" /> Pembahasan:
              </h4>
              <p className="text-blue-900/80 leading-relaxed text-sm sm:text-base">
                <FormattedText text={currentQ.explanation || 'Pembahasan detil tidak tersedia untuk soal ini.'} />
              </p>
            </div>
          )}
      </div>

      {/* NAVIGATION BUTTON */}
      {(selectedOption !== null || essayFeedbackState === 'GRADED') && (
        <div className="fixed bottom-[80px] md:bottom-10 left-0 right-0 px-4 flex justify-center z-30 pointer-events-none">
          <button
            onClick={nextQuestion}
            className="pointer-events-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-all font-bold text-lg animate-fade-in-up"
          >
            {currentQIndex < questions.length - 1 ? 'Soal Selanjutnya' : 'Lihat Hasil'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;