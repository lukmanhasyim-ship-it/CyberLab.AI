
import React, { useState, useEffect } from 'react';
import { UserProfile, StudyMaterial } from '../types';
import { getLearningMaterial, evaluateEssayAnswer } from '../services/geminiService';
import { learningTopics } from '../data/topics'; 
import { BookOpen, ChevronLeft, Sparkles, Server, Shield, Lock, Eye, Monitor, HelpCircle, PlayCircle, Info, Award, X, CheckCircle, XCircle, FileText, AlertCircle, Loader2, ChevronRight, Target, Lightbulb, Bookmark, ArrowDown, RefreshCw } from 'lucide-react';
import FormattedText from './FormattedText';

interface LearningScreenProps {
  user: UserProfile;
}

const LearningScreen: React.FC<LearningScreenProps> = ({ user }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{[key: number]: number}>({});
  const [showStandardsModal, setShowStandardsModal] = useState(false);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  
  // Essay States
  const [essayAnswers, setEssayAnswers] = useState<{[key: number]: string}>({});
  const [essayResults, setEssayResults] = useState<{[key: number]: { status: 'CORRECT' | 'PARTIAL' | 'WRONG'; feedback: string } | null}>({});
  const [essayLoading, setEssayLoading] = useState<{[key: number]: boolean}>({});

  // Load completed topics from local storage
  useEffect(() => {
    const savedCompleted = JSON.parse(localStorage.getItem('completedTopics') || '[]');
    setCompletedTopics(savedCompleted);
  }, []);

  // Helper to check access
  const userGradeStr = user.grade.replace(/\D/g, ''); // "11" or "12"
  const isTopicLocked = (topicGrades: string[]) => {
      // If current user grade is NOT in the allowed grades for this topic, it is locked.
      return !topicGrades.includes(userGradeStr);
  };

  const handleTopicClick = async (topicTitle: string, grades: string[]) => {
    if (isTopicLocked(grades)) {
      alert(`Materi ini belum tersedia untuk kelas ${userGradeStr}.`);
      return;
    }

    setSelectedTopic(topicTitle);
    setLoading(true);
    setMaterial(null);
    setQuizAnswers({});
    setEssayAnswers({});
    setEssayResults({});
    setEssayLoading({});
    setShowQuiz(false); // Reset quiz visibility

    // UPDATED CACHE KEY TO FORCE REFRESH FOR NEW PROMPT REQUIREMENTS
    const cacheKey = `material_deep_v2_${topicTitle}`; // v2 for Objectives update
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      setMaterial(JSON.parse(cachedData));
      setLoading(false);
    } else {
      const data = await getLearningMaterial(topicTitle, user);
      if (data) {
        setMaterial(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedTopic(null);
    setMaterial(null);
    setQuizAnswers({});
    setEssayAnswers({});
    setEssayResults({});
    setEssayLoading({});
    setShowStandardsModal(false);
    setShowQuiz(false);
  };

  const handleQuizAnswer = (questionIndex: number, optionIndex: number) => {
    if (quizAnswers[questionIndex] !== undefined) return;
    
    const newAnswers = { ...quizAnswers, [questionIndex]: optionIndex };
    setQuizAnswers(newAnswers);

    // Check if topic should be marked as completed
    if (material && material.quiz) {
       // Filter only MCQ questions
       const mcqQuestions = material.quiz.filter(q => q.type !== 'ESSAY');
       const mcqIndices = material.quiz.map((q, idx) => q.type !== 'ESSAY' ? idx : -1).filter(idx => idx !== -1);
       
       // Check if all MCQs are answered
       const allAnswered = mcqIndices.every(idx => newAnswers[idx] !== undefined);
       
       if (allAnswered) {
          // Check if all answers are correct
          const allCorrect = mcqIndices.every(idx => newAnswers[idx] === material.quiz[idx].correctAnswerIndex);
          
          if (allCorrect) {
              markTopicAsCompleted();
          }
       }
    }
  };

  const handleRetryQuestion = (questionIndex: number) => {
    const newAnswers = { ...quizAnswers };
    delete newAnswers[questionIndex];
    setQuizAnswers(newAnswers);
  };

  const markTopicAsCompleted = () => {
      if (selectedTopic && !completedTopics.includes(selectedTopic)) {
          const newCompleted = [...completedTopics, selectedTopic];
          setCompletedTopics(newCompleted);
          localStorage.setItem('completedTopics', JSON.stringify(newCompleted));
      }
  };

  const handleEssaySubmit = async (qIndex: number, question: string, answerKey: string) => {
      if (!essayAnswers[qIndex]?.trim()) return;
      
      setEssayLoading(prev => ({...prev, [qIndex]: true}));
      
      const result = await evaluateEssayAnswer(question, essayAnswers[qIndex], answerKey);
      
      setEssayResults(prev => ({...prev, [qIndex]: result}));
      setEssayLoading(prev => ({...prev, [qIndex]: false}));
  };

  const startQuiz = () => {
      setShowQuiz(true);
      // Smooth scroll to quiz section
      setTimeout(() => {
          const quizSection = document.getElementById('quiz-section');
          if (quizSection) {
              quizSection.scrollIntoView({ behavior: 'smooth' });
          }
      }, 100);
  }

  // --- SMART CONTENT RENDERER ---
  const renderSmartContent = (text: string) => {
    if (!text) return null;
    
    // Split text by newlines to process paragraph by paragraph
    const lines = text.split('\n');
    
    return lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-3"></div>; // Spacer for empty lines

        // 1. DETECT LISTS (1. , 2. )
        // Regex looks for "Number." at start of string
        const listMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (listMatch) {
            return (
                <div key={idx} className="flex items-start gap-3 mb-3 pl-1 group">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-xs font-bold mt-0.5 group-hover:bg-emerald-100 transition-colors">
                        {listMatch[1]}
                    </span>
                    <span className="text-gray-700 leading-relaxed text-[15px] sm:text-base">
                        <FormattedText text={listMatch[2]} />
                    </span>
                </div>
            );
        }

        // 2. DETECT BULLET POINTS (- )
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
             return (
                <div key={idx} className="flex items-start gap-3 mb-2 pl-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 shrink-0"></div>
                    <span className="text-gray-700 leading-relaxed text-[15px] sm:text-base">
                        <FormattedText text={trimmed.substring(2)} />
                    </span>
                </div>
            );
        }

        // 3. DETECT "STUDI KASUS" / "CONTOH" BOXES (Like Screenshot)
        const lower = trimmed.toLowerCase();
        if (lower.startsWith('studi kasus') || lower.startsWith('contoh:') || lower.startsWith('scenario:')) {
            const content = trimmed.replace(/^(studi kasus|contoh|scenario)[:\s-]*/i, '');
            return (
                <div key={idx} className="mt-4 mb-6 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-lg"></div>
                    <div className="bg-purple-50 rounded-r-lg p-5 border border-purple-100 border-l-0">
                        <h4 className="font-bold text-purple-700 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Bookmark className="w-4 h-4" />
                            Studi Kasus & Implementasi
                        </h4>
                        <p className="text-gray-800 leading-relaxed text-[15px]">
                            <FormattedText text={content} />
                        </p>
                    </div>
                </div>
            );
        }

        // 4. DETECT "IMPORTANT" / "NOTE" BOXES
        if (lower.startsWith('penting:') || lower.startsWith('catatan:') || lower.startsWith('note:')) {
             const content = trimmed.replace(/^(penting|catatan|note)[:\s-]*/i, '');
             return (
                <div key={idx} className="mt-4 mb-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                             <h4 className="font-bold text-amber-800 text-xs uppercase mb-1">Poin Penting</h4>
                             <p className="text-amber-900/80 text-sm leading-relaxed">
                                <FormattedText text={content} />
                             </p>
                        </div>
                    </div>
                </div>
             )
        }

        // 5. STANDARD PARAGRAPH
        return (
            <p key={idx} className="mb-4 text-gray-700 leading-relaxed text-[15px] sm:text-base text-justify">
                <FormattedText text={trimmed} />
            </p>
        );
    });
  };

  if (selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
        <div className="bg-emerald-600 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col">
              {/* Header Navigation Row */}
              <div className="flex justify-between items-center mb-6">
                  <button 
                      onClick={handleBack}
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 pl-3 pr-5 py-2.5 rounded-full backdrop-blur-md transition-all active:scale-95 shadow-lg border border-white/10 group"
                  >
                      <ChevronLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-sm font-bold text-white tracking-wide">Kembali Ke Topik</span>
                  </button>

                  <button 
                        onClick={() => setShowStandardsModal(true)}
                        className="bg-white/20 hover:bg-white/30 p-2.5 rounded-full backdrop-blur-md transition-all active:scale-95 shadow-lg border border-white/10"
                        title="Lihat Standar Kompetensi"
                    >
                        <Info className="w-5 h-5 text-white" />
                    </button>
              </div>

              {/* Title Section */}
              <div>
                 <div className="inline-flex items-center gap-2 bg-emerald-700/50 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-500/50 shadow-sm">
                   <Sparkles className="w-3 h-3 text-yellow-300" />
                   Materi Deep Learning & Standar Industri
                 </div>
                 
                 {material ? (
                     <div className="flex items-start gap-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight drop-shadow-sm max-w-3xl flex-1">
                          {material.topic}
                        </h1>
                        {completedTopics.includes(material.topic) && (
                           <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/30 shadow-lg" title="Materi Telah Dipelajari">
                               <CheckCircle className="w-8 h-8 text-green-300 fill-green-600" />
                           </div>
                        )}
                     </div>
                 ) : (
                     <div className="animate-pulse h-8 bg-white/20 rounded w-3/4"></div>
                 )}
              </div>
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
             <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
             <p className="text-gray-500 animate-pulse font-medium">Sedang menyusun materi mendalam...</p>
             <p className="text-xs text-gray-400 mt-2 max-w-xs text-center">
               Menganalisis Konsep, Teknis, & Praktik Industri...
             </p>
          </div>
        ) : material ? (
          <div className="animate-fade-in-up">
            
            {/* Introduction */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
                 <BookOpen className="w-6 h-6 text-emerald-600" />
                 Pendahuluan
              </h3>
              <div className="text-gray-600">
                {renderSmartContent(material.introduction)}
              </div>
            </div>

            {/* Learning Objectives - NEW SECTION */}
            {material.learningObjectives && material.learningObjectives.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-100 mb-6 shadow-sm">
                   <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Tujuan Pembelajaran
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {material.learningObjectives.map((obj, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                  {idx + 1}
                              </span>
                              <span className="text-blue-900 text-sm font-medium leading-relaxed">
                                  <FormattedText text={obj} />
                              </span>
                          </div>
                      ))}
                   </div>
                </div>
            )}

            {/* Video Integration */}
            {material.youtubeUrl && (
              <div className="mb-8 overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-black">
                <div className="bg-gray-900 p-4 flex items-center gap-2 text-white border-b border-gray-800">
                   <PlayCircle className="w-5 h-5 text-red-500" />
                   <span className="font-bold text-sm">Video Referensi: Etika Digital</span>
                </div>
                <div className="aspect-video">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${material.youtubeUrl.split('v=')[1]}`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* Sections */}
            <div className="space-y-8 mb-10">
              {material.sections.map((section, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Header: Number and Title with Separator */}
                  <div className="bg-gray-50/50 p-6 sm:p-8 pb-4 border-b border-gray-100">
                      <div className="flex items-start gap-4">
                        <div className="bg-white text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-sm border border-emerald-100">
                            {idx + 1}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight pt-1">
                            {section.subtitle.replace(/^[\d\.\)]+\s*/, '')}
                        </h3>
                      </div>
                  </div>
                  
                  <div className="p-6 sm:p-8 pt-6">
                     {renderSmartContent(section.content)}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 rounded-2xl p-6 sm:p-8 border border-yellow-100 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
              <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2 relative z-10">
                <BookOpen className="w-5 h-5" />
                Rangkuman Eksekutif
              </h3>
              <div className="text-yellow-900/80 leading-relaxed italic text-justify text-lg relative z-10">
                {renderSmartContent(material.summary)}
              </div>
            </div>

            {/* START QUIZ BUTTON */}
            {!showQuiz && (
                <div className="mt-12 text-center py-8 bg-gradient-to-b from-white to-gray-50 rounded-3xl border border-gray-200 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Sudah Paham Materi?</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Uji pemahamanmu dengan kuis interaktif. Jawab 8 soal Pilihan Ganda dengan benar semua untuk menandai materi ini sebagai "Selesai".</p>
                    <button 
                        onClick={startQuiz}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                    >
                        <HelpCircle className="w-5 h-5" />
                        Mulai Uji Pemahamanmu
                        <ArrowDown className="w-4 h-4 ml-1" />
                    </button>
                </div>
            )}

            {/* MINI QUIZ SECTION */}
            {showQuiz && material.quiz && material.quiz.length > 0 && (
              <div id="quiz-section" className="border-t-4 border-dashed border-gray-200 pt-10 mt-12 animate-fade-in-up">
                <div className="text-center mb-8">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 inline-block">Evaluasi</span>
                    <h3 className="text-3xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
                    <HelpCircle className="w-8 h-8 text-emerald-600" />
                    Uji Pemahaman Materi
                    </h3>
                    <p className="text-gray-500 mt-2">Jawab semua soal Pilihan Ganda dengan benar untuk menyelesaikan topik ini.</p>
                </div>
                
                {completedTopics.includes(material.topic) && (
                    <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 flex items-center justify-center gap-2 font-bold animate-pulse">
                        <CheckCircle className="w-5 h-5" />
                        Selamat! Kamu telah menguasai materi ini.
                    </div>
                )}
                
                <div className="space-y-8">
                  {material.quiz.map((question, qIndex) => {
                    const isEssay = question.type === 'ESSAY';
                    const essayResult = essayResults[qIndex];
                    const isEssayLoading = essayLoading[qIndex];

                    return (
                      <div key={qIndex} className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 transition-all hover:border-emerald-100 relative overflow-hidden">
                        {/* Question Decorator */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${isEssay ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>

                        <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-2">
                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${
                                    isEssay ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {qIndex + 1}
                                </span>
                                {isEssay && <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 tracking-wide">Essay Analysis</span>}
                                {!isEssay && <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 tracking-wide">{question.difficulty}</span>}
                             </div>
                        </div>
                        
                        <h4 className="font-bold text-gray-800 mb-6 text-lg sm:text-xl leading-snug">
                          <FormattedText text={question.question} />
                        </h4>
                        
                        {!isEssay && question.options ? (
                          <div className="space-y-3">
                            {question.options.map((option, optIndex) => {
                              const isSelected = quizAnswers[qIndex] === optIndex;
                              const isCorrect = question.correctAnswerIndex === optIndex;
                              const hasAnswered = quizAnswers[qIndex] !== undefined;
                              
                              const cleanOptionText = option.replace(/^[A-Ea-e][\.\)]\s*/, '');

                              let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all text-[15px] font-medium relative group overflow-hidden ";
                              
                              if (!hasAnswered) {
                                btnClass += "border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50 bg-white text-gray-600 cursor-pointer shadow-sm";
                              } else {
                                if (isCorrect) {
                                  btnClass += "border-green-500 bg-green-50 text-green-800 shadow-inner";
                                } else if (isSelected && !isCorrect) {
                                  btnClass += "border-red-500 bg-red-50 text-red-800 shadow-inner";
                                } else {
                                  btnClass += "border-gray-100 text-gray-400 opacity-50";
                                }
                              }

                              return (
                                <button
                                  key={optIndex}
                                  onClick={() => handleQuizAnswer(qIndex, optIndex)}
                                  disabled={hasAnswered}
                                  className={btnClass}
                                >
                                  <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                                      hasAnswered && isCorrect ? 'bg-green-600 text-white' :
                                      hasAnswered && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                                      'bg-gray-100 text-gray-500 group-hover:bg-emerald-200 group-hover:text-emerald-700'
                                    }`}>
                                      {['A','B','C','D', 'E'][optIndex]}
                                    </div>
                                    <span className="leading-snug">{cleanOptionText}</span>
                                    
                                    {hasAnswered && isCorrect && <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />}
                                    {hasAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          // ESSAY VIEW FOR MINI QUIZ (INTERACTIVE)
                          <div className="space-y-4">
                             <div className="relative">
                                <textarea
                                    className="w-full p-5 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 min-h-[150px] bg-gray-50 text-gray-800 text-base transition-all focus:bg-white outline-none resize-y"
                                    placeholder="Ketik analisis jawaban teknis di sini (sertakan perintah CLI/config jika perlu)..."
                                    value={essayAnswers[qIndex] || ''}
                                    onChange={(e) => setEssayAnswers(prev => ({...prev, [qIndex]: e.target.value}))}
                                    disabled={!!essayResult || isEssayLoading}
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none font-medium">
                                    Min. 20 Karakter
                                </div>
                             </div>

                             {!essayResult && (
                                <div className="flex justify-end">
                                    <button
                                      onClick={() => handleEssaySubmit(qIndex, question.question, question.answerKey || '')}
                                      disabled={!essayAnswers[qIndex] || essayAnswers[qIndex].length < 20 || isEssayLoading}
                                      className="bg-amber-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm shadow-md"
                                    >
                                        {isEssayLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin"/> Menganalisis...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4"/> Kirim Jawaban & Cek AI
                                            </>
                                        )}
                                    </button>
                                </div>
                             )}

                             {essayResult && (
                                <div className="animate-fade-in space-y-4 mt-4">
                                    <div className={`rounded-xl border-2 overflow-hidden ${
                                        essayResult.status === 'CORRECT' ? 'bg-green-50/50 border-green-200' : 
                                        essayResult.status === 'PARTIAL' ? 'bg-orange-50/50 border-orange-200' :
                                        'bg-red-50/50 border-red-200'
                                    }`}>
                                        <div className={`px-5 py-3 border-b flex items-center gap-2 font-bold uppercase text-xs tracking-wider ${
                                            essayResult.status === 'CORRECT' ? 'bg-green-100/50 border-green-200 text-green-700' : 
                                            essayResult.status === 'PARTIAL' ? 'bg-orange-100/50 border-orange-200 text-orange-700' :
                                            'bg-red-100/50 border-red-200 text-red-700'
                                        }`}>
                                            {essayResult.status === 'CORRECT' ? <><CheckCircle className="w-4 h-4"/> Analisis Tepat</> : 
                                             essayResult.status === 'PARTIAL' ? <><AlertCircle className="w-4 h-4"/> Analisis Kurang Lengkap</> : 
                                             <><XCircle className="w-4 h-4"/> Perlu Perbaikan</>}
                                        </div>
                                        
                                        <div className="p-5">
                                            <div className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                                <Monitor className="w-3 h-3" /> Feedback AI Tutor
                                            </div>
                                            <div className="text-sm text-gray-800 leading-relaxed font-medium">
                                                <FormattedText text={essayResult.feedback} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Answer Key explicitly NOT rendered here as per requirement to force learning from feedback */}
                                </div>
                             )}
                          </div>
                        )}

                        {!isEssay && quizAnswers[qIndex] !== undefined && (
                           <div className={`mt-6 p-5 rounded-xl text-sm border ${
                              quizAnswers[qIndex] === question.correctAnswerIndex 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-red-50 border-red-200 text-red-800'
                           }`}>
                              <p className="font-bold mb-2 flex items-center gap-2">
                                 {quizAnswers[qIndex] === question.correctAnswerIndex 
                                    ? <><CheckCircle className="w-4 h-4" /> Jawaban Benar!</> 
                                    : <><XCircle className="w-4 h-4" /> Jawaban Salah</>
                                 }
                              </p>

                              {/* RETRY BUTTON FOR INCORRECT ANSWERS */}
                              {quizAnswers[qIndex] !== question.correctAnswerIndex && (
                                  <button 
                                    onClick={() => handleRetryQuestion(qIndex)}
                                    className="mb-3 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 transition-colors flex items-center gap-2"
                                  >
                                    <RefreshCw className="w-3 h-3" /> Coba Lagi
                                  </button>
                              )}

                              <div className="opacity-90 leading-relaxed">
                                  <span className="font-bold mr-1">Pembahasan:</span>
                                  <FormattedText text={question.explanation || ''} />
                              </div>
                           </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* NEW BUTTON ADDED HERE */}
                <div className="mt-12 flex justify-center pb-8">
                  <button 
                    onClick={handleBack}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 px-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Kembali Ke Daftar Topik
                  </button>
                </div>

              </div>
            )}
          </div>
        ) : null}

        {/* STANDARDS MODAL */}
        {showStandardsModal && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setShowStandardsModal(false)}
              ></div>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 max-h-[85vh] overflow-y-auto animate-fade-in-up">
                 <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center z-20">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                       <Award className="w-6 h-6 text-amber-500" />
                       Dasar Kurikulum & Standar
                    </h3>
                    <button onClick={() => setShowStandardsModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                       <X className="w-5 h-5 text-gray-500" />
                    </button>
                 </div>
                 
                 <div className="p-6 space-y-6">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                       <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> CP BSKAP 046 Tahun 2025 (TKJ)
                       </h4>
                       <p className="text-sm text-emerald-800 leading-relaxed">
                          Digunakan sebagai dasar tujuan pembelajaran.
                       </p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                       <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4" /> Standar Kompetensi (SKKNI)
                       </h4>
                       <div className="space-y-3">
                           <div>
                               <p className="text-xs font-bold text-blue-800 uppercase">SKKNI No. 191 Tahun 2024</p>
                               <ul className="text-sm text-blue-700 list-disc pl-4 mt-1">
                                   <li>J.62KAM00.005.2 – Kebijakan Keamanan Dasar</li>
                                   <li>J.62KAM00.007.1 – Autentikasi</li>
                               </ul>
                           </div>
                           <div>
                               <p className="text-xs font-bold text-blue-800 uppercase">SKKNI No. 637 Tahun 2016</p>
                               <ul className="text-sm text-blue-700 list-disc pl-4 mt-1">
                                   <li>J.621000.008.02 – Firewall & Hak Akses</li>
                               </ul>
                           </div>
                       </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                       <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                          <Lock className="w-4 h-4" /> UU No. 1 Tahun 2024 (ITE)
                       </h4>
                       <ul className="text-sm text-red-800 space-y-1 list-disc pl-4">
                          <li>Pasal 27A: Pencemaran nama baik</li>
                          <li>Pasal 27 ayat (1): Cyberbullying</li>
                          <li>Pasal 28 & 29: Hoaks & Ancaman Digital</li>
                       </ul>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  }

  // LIST VIEW (Select Topic)
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20 animate-fade-in-up">
       <div className="mb-8 text-center sm:text-left bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-100 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="relative z-10">
              <h2 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight">Materi Pembelajaran</h2>
              <p className="text-gray-500">Sesuai dengan kurikulum Pembelajaran Mendalam (Deep Learning) yang terintegrasi dengan SKKNI dan Industri <strong>(PT.Riyad Network Multi Technologi dan CV. Pemuda Group Indonesia (PGI))</strong></p>
          </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {learningTopics.map((topic, idx) => {
              const locked = isTopicLocked(topic.grades);
              const isCompleted = completedTopics.includes(topic.title);
              
              return (
                 <button
                   key={idx}
                   onClick={() => handleTopicClick(topic.title, topic.grades)}
                   disabled={locked}
                   className={`p-5 rounded-2xl text-left transition-all border group relative overflow-hidden ${
                       locked 
                       ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                       : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1'
                   }`}
                 >
                    <div className="flex justify-between items-start mb-3 relative z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                            locked ? 'bg-gray-200 text-gray-400' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors'
                        }`}>
                            {locked ? <Lock className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                        </div>
                        <div className="flex items-center gap-2">
                           {isCompleted && !locked && (
                               <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                   <CheckCircle className="w-3 h-3" /> Selesai
                               </div>
                           )}
                           {!locked && <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />}
                        </div>
                    </div>
                    
                    <h3 className={`font-bold text-lg mb-1 relative z-10 ${locked ? 'text-gray-400' : 'text-gray-800 group-hover:text-emerald-700'}`}>
                        {topic.title}
                    </h3>
                    <div className="flex gap-2 relative z-10">
                        {topic.grades.map(g => (
                            <span key={g} className={`text-[10px] font-bold px-2 py-0.5 rounded ${locked ? 'bg-gray-200 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                Kelas {g}
                            </span>
                        ))}
                    </div>
                 </button>
              )
           })}
       </div>
    </div>
  );
};

export default LearningScreen;
