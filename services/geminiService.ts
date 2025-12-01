
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, QuizQuestion, UserProfile, QuizHistory, StudyMaterial, GameScenario, SOCAlert, RedTeamMission, KC7Case } from "../types";
import { learningTopics } from "../data/topics";

// Initialize the client with the provided API Key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const REFERENCE_CONTEXT = `
DASAR KURIKULUM & HUKUM (WAJIB DIGUNAKAN):
1. CP BSKAP 046 Tahun 2025 (TKJ).
2. SKKNI Keamanan Informasi No. 191 Tahun 2024.
3. UU No. 1 Tahun 2024 (Perubahan Kedua UU ITE).
4. SKKNI Teknisi Jaringan Komputer No. 637 Tahun 2016.
`;

// Helper to clean formatting based on user requirements
const formatContent = (text: string): string => {
  if (!text) return "";
  let formatted = text;

  // 1. Replace backticks ` with single quotes ' or "
  formatted = formatted.replace(/`/g, "'");

  // 2. Replace # (Headers) with **Bold** wrapper
  // Matches # Header or ## Header and wraps content in **
  formatted = formatted.replace(/#{1,6}\s?(.*?)(\n|$)/g, '**$1**$2');

  // 3. Replace * (Bullets) with Numbering
  // We process line by line to maintain a counter that resets on paragraph breaks
  const lines = formatted.split('\n');
  let count = 1;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    // Check for * or - at start of line
    if (/^[\*\-]\s/.test(trimmed)) { 
       // Replace symbol with number
       const newLine = line.replace(/^(\s*)([\*\-])\s+/, `$1${count}. `);
       count++;
       return newLine;
    } else {
       if (trimmed === '') count = 1; // Reset counter on empty lines (new section)
       return line;
    }
  });

  return processedLines.join('\n');
};

// System instruction to set the persona
const getSystemInstruction = (user: UserProfile) => `
Kamu adalah "CyberLab.Ai", tutor teman belajar yang asik untuk siswa SMK TKJ bernama ${user.name} (Kelas ${user.grade}).

GAYA BAHASA:
- Santai, humanis, dan menyemangati (seperti kakak pembimbing).
- JANGAN KAKU seperti robot. Gunakan bahasa yang mudah dimengerti remaja.
- JAWABAN RINGKAS & RAPI: Maksimal 3 paragraf pendek. Gunakan bullet points jika perlu.
- Hindari penjelasan teknis yang terlalu panjang dan membosankan.

PEDOMAN:
Gunakan **teks tebal** untuk poin penting.
Kaitkan dengan kehidupan sehari-hari siswa jika memungkinkan.
`;

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string,
  user: UserProfile
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: getSystemInstruction(user),
        thinkingConfig: { thinkingBudget: 0 }, 
        temperature: 0.8, // Slightly higher for more creative/human response
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return formatContent(result.text || "Waduh, koneksi AI-nya lagi gangguan nih. Coba tanya lagi ya!");
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Maaf, sistem sedang sibuk. Coba cek koneksi internetmu ya.";
  }
};

export const generateQuizQuestions = async (topic: string, user: UserProfile): Promise<QuizQuestion[]> => {
  try {
    const prompt = `
      Bertindaklah sebagai SEORANG AHLI BAHASA INDONESIA (LINGUIST) profesional dan Guru Senior SMK TKJ.
      Tugas Anda adalah menyusun 10 SOAL kuis berkualitas tinggi tentang topik "${topic}".
      Target Audien: Siswa Kelas ${user.grade} SMK TKJ.
      
      PEDOMAN PENULISAN SOAL (GAYA AHLI BAHASA):
      1. **Tata Bahasa Baku:** Gunakan Bahasa Indonesia yang baik dan benar sesuai PUEBI (Pedoman Umum Ejaan Bahasa Indonesia).
      2. **Kalimat Efektif:** Hindari kalimat yang bertele-tele. Setiap kata harus memiliki makna. Struktur kalimat harus jelas (Subjek-Predikat-Objek).
      3. **Diksi Presisi:** Gunakan istilah teknis jaringan yang tepat, namun rangkai dalam kalimat yang mengalir dan mudah dipahami.
      4. **Logika Soal:** Pastikan premis soal dan pilihan jawaban memiliki hubungan logis yang kuat. Hindari ambiguitas.
      5. **Hindari Bias:** Gunakan bahasa yang objektif dan formal.

      STRUKTUR SOAL (TOTAL 10):
      1. 8 Soal Pilihan Ganda (MCQ):
         - 2 Soal LOTS (Pengetahuan Dasar).
         - 6 Soal HOTS (Analisis Kasus, Troubleshooting, Konfigurasi).
         - Opsi Jawaban: Harus homogen dan logis. Hindari opsi seperti "Semua Benar" jika tidak relevan.
      2. 2 Soal ESSAY (Berpikir Kritis):
         - Berikan studi kasus nyata (Real World Case).
         - Siswa diminta menganalisis penyebab masalah atau merancang solusi.

      Output JSON valid dengan format array.
      - 'explanation' WAJIB SANGAT DETAIL: Jelaskan jawaban dengan bahasa yang edukatif, runtut, dan mudah dimengerti, seolah-olah Anda sedang membimbing siswa secara privat.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Kamu adalah Editor Bahasa & Ahli Kurikulum SMK. Output JSON only.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["MCQ", "ESSAY"] },
              difficulty: { type: Type.STRING, enum: ["LOTS", "HOTS"] },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              answerKey: { type: Type.STRING }
            },
            // IMPORTANT: explanation added to required fields to ensure feedback works
            required: ["type", "difficulty", "question", "explanation"] 
          }
        }
      }
    });

    if (response.text) {
      const questions = JSON.parse(response.text) as QuizQuestion[];
      // Apply cleanup to questions and explanations
      return questions.map(q => ({
        ...q,
        question: formatContent(q.question),
        explanation: q.explanation ? formatContent(q.explanation) : undefined,
        answerKey: q.answerKey ? formatContent(q.answerKey) : undefined,
        options: q.options ? q.options.map(o => formatContent(o)) : undefined
      }));
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    return [];
  }
};

export const evaluateEssayAnswer = async (
  question: string, 
  studentAnswer: string, 
  answerKey: string
): Promise<{ status: 'CORRECT' | 'PARTIAL' | 'WRONG'; feedback: string }> => {
  try {
    const prompt = `
      Bertindaklah sebagai Senior Network Engineer yang sedang mengoreksi jawaban junior.
      
      PERTANYAAN: "${question}"
      POIN KUNCI (RUBRIK): "${answerKey}"
      JAWABAN SISWA: "${studentAnswer}"
      
      Tugasmu:
      1. Tentukan STATUS:
         - "CORRECT": Jawaban menunjukkan pemahaman mendalam (deep understanding).
         - "PARTIAL": Jawaban menyentuh permukaan tapi kurang detail teknis.
         - "WRONG": Konsep salah total.
      
      2. Berikan Feedback (Deep Learning Style):
         - Identifikasi "Knowledge Gap": Bagian mana yang siswa belum paham?
         - Berikan Analogi: Jika konsep sulit, berikan analogi sederhana.
         - Koreksi Teknis: Jika ada kesalahan perintah/konsep, luruskan dengan detail.
         - Tone: Mentor profesional namun suportif.

      Output JSON Only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["CORRECT", "PARTIAL", "WRONG"] },
            feedback: { type: Type.STRING }
          },
          required: ["status", "feedback"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return {
          ...result,
          feedback: formatContent(result.feedback)
      };
    }
    return { status: 'WRONG', feedback: "Gagal mengevaluasi jawaban." };

  } catch (error) {
    console.error("Essay Eval Error:", error);
    return { status: 'WRONG', feedback: "Terjadi kesalahan sistem saat menilai." };
  }
};

export const analyzeLearningProgress = async (history: QuizHistory[], user: UserProfile): Promise<string> => {
  try {
    const historyText = history.map(h => 
      `- Topik: ${h.topic}, Skor: ${Math.round((h.score/h.totalQuestions)*100)}%`
    ).join("\n");

    const prompt = `
      Data Belajar Siswa:
      ${historyText}

      Buat evaluasi "Learning Analytics":
      1. Identifikasi Pola: Apakah siswa kuat di hafalan tapi lemah di analisis?
      2. Rekomendasi Spesifik: Sarankan topik spesifik yang perlu diulang (Deep Dive).
      3. Next Steps: Tantangan apa yang harus diambil selanjutnya.
      
      Gunakan bahasa yang memotivasi tapi analitis.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(user),
        temperature: 0.7,
      }
    });

    return formatContent(response.text) || "Belum ada data yang cukup untuk analisis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Maaf, belum bisa menganalisis data saat ini.";
  }
};

export const getLearningMaterial = async (topic: string, user: UserProfile): Promise<StudyMaterial | null> => {
  try {
    const isEthicsTopic = topic.toLowerCase().includes('hukum') || topic.toLowerCase().includes('etika') || topic.toLowerCase().includes('uu');
    const specificVideoUrl = isEthicsTopic ? "https://www.youtube.com/watch?v=qNskX8A5I90" : "";

    const prompt = `
      Buatkan materi pembelajaran **DEEP LEARNING** (Mendalam & Komprehensif) untuk topik: "${topic}".
      Target: Siswa ${user.grade} SMK TKJ (Teknik Komputer & Jaringan).
      
      INSTRUKSI KONTEN (DEEP LEARNING APPROACH):
      Jangan hanya memberikan definisi kulit luar. Materi harus terstruktur untuk membangun pemahaman fundamental hingga implementasi.
      
      STRUKTUR JSON (Wajib):
      1. **Introduction**: Pengantar menarik.
      2. **Learning Objectives**: Array string berisi 3-5 tujuan pembelajaran spesifik (apa yang akan siswa kuasai).
      3. **Sections** (Array):
         - **Fundamental Concept (Why & What)**: Filosofi di balik teknologi ini.
         - **Technical Mechanism (How it works)**: Penjelasan teknis mendalam.
         - **Industry Implementation (Praktik Nyata)**: Contoh konfigurasi nyata (Cisco/Mikrotik/Linux).
         - **Case Study & Troubleshooting**: Studi kasus kegagalan umum.
      4. **Summary**: Rangkuman.
      5. **Quiz**: 10 Soal (8 MCQ + 2 Essay).

      STRUKTUR MINI KUIS (Relevansi Tinggi):
      Total **10 SOAL** (8 MCQ + 2 Essay) yang SANGAT RELEVAN dengan detail materi di atas.
      - MCQ dengan 5 Opsi.
      - Essay studi kasus HOTS dengan rubrik penilaian (answerKey).
      - **PENTING UNTUK ESSAY**: Studi kasus WAJIB menggunakan konteks **"SMK AL-AZHAR SEMPU"**.
        Contoh Essay: "Jaringan Laboratorium Komputer SMK AL-AZHAR SEMPU mengalami serangan DDoS saat ujian..." atau "Kepala Jurusan TKJ SMK AL-AZHAR SEMPU ingin menerapkan..."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Kamu adalah Pakar Network Engineer & Instruktur Senior. Materi harus 'daging' (berbobot), teknis, dan aplikatif. Output JSON valid.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            introduction: { type: Type.STRING },
            learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } }, // Added Learning Objectives
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subtitle: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["subtitle", "content"]
              }
            },
            summary: { type: Type.STRING },
            imageUrl: { type: Type.STRING },
            standards: { type: Type.ARRAY, items: { type: Type.STRING } },
            quiz: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   type: { type: Type.STRING, enum: ["MCQ", "ESSAY"] }, 
                   difficulty: { type: Type.STRING, enum: ["LOTS", "HOTS"] },
                   question: { type: Type.STRING },
                   options: { type: Type.ARRAY, items: { type: Type.STRING } },
                   correctAnswerIndex: { type: Type.INTEGER },
                   explanation: { type: Type.STRING },
                   answerKey: { type: Type.STRING } 
                 },
                 required: ["question", "explanation", "type"]
               }
            }
          },
          required: ["topic", "introduction", "learningObjectives", "sections", "summary", "quiz"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as StudyMaterial;
      if (!data.imageUrl) {
          const keyword = topic.split(' ')[0] + ",server,network";
          data.imageUrl = `https://source.unsplash.com/800x600/?${keyword}`;
      }
      if (isEthicsTopic) data.youtubeUrl = specificVideoUrl;

      // Clean Content using formatContent helper
      data.introduction = formatContent(data.introduction);
      data.summary = formatContent(data.summary);
      data.learningObjectives = data.learningObjectives.map(obj => formatContent(obj));
      data.sections = data.sections.map(s => ({
          subtitle: formatContent(s.subtitle),
          content: formatContent(s.content)
      }));
      data.quiz = data.quiz.map(q => ({
          ...q,
          question: formatContent(q.question),
          explanation: q.explanation ? formatContent(q.explanation) : undefined,
          answerKey: q.answerKey ? formatContent(q.answerKey) : undefined,
          options: q.options ? q.options.map(o => formatContent(o)) : undefined
      }));

      return data;
    }
    return null;
  } catch (error) {
    console.error("Gemini Material Error:", error);
    return null;
  }
};

export const generateGameScenario = async (user: UserProfile): Promise<GameScenario | null> => {
    // Pick random topic from array of objects
    const randomTopicObj = learningTopics[Math.floor(Math.random() * learningTopics.length)];
    const randomTopic = randomTopicObj.title;

    try {
        const prompt = `
            Buat skenario game "Cyber Defense" untuk siswa kelas ${user.grade}.
            Topik: ${randomTopic}.
            Buat skenario yang menegangkan dengan Time Limit.
            Level: ${user.grade.includes('12') ? 'SULIT (Analisis Log & UU ITE)' : 'MENENGAH (Konfigurasi & Alat)'}.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "Game Master Cybersecurity.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        situation: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "CRITICAL"] },
                        options: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    isCorrect: { type: Type.BOOLEAN },
                                    impact: { type: Type.STRING }
                                },
                                required: ["text", "isCorrect", "impact"]
                            }
                        }
                    },
                    required: ["topic", "situation", "options", "severity"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text) as GameScenario;
        return null;

    } catch (error) {
        console.error("Gemini Game Error:", error);
        return null;
    }
}

export const generateSOCAlert = async (user: UserProfile): Promise<SOCAlert | null> => {
    return generateGenericAIResponse<SOCAlert>(
        "Buat Alert SOC realistis (True/False Positive) dengan log raw.",
        "Security Analyst",
        {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            timestamp: { type: Type.STRING },
            severity: { type: Type.STRING },
            sourceIp: { type: Type.STRING },
            destinationIp: { type: Type.STRING },
            logPayload: { type: Type.STRING },
            hash: { type: Type.STRING },
            isTruePositive: { type: Type.BOOLEAN },
            analysisReport: { type: Type.STRING }
          }
        }
    );
};

export const generateRedTeamMission = async (user: UserProfile): Promise<RedTeamMission | null> => {
    return generateGenericAIResponse<RedTeamMission>(
        "Buat misi Penetration Testing (Target, Ports, Vuln, Tools).",
        "Red Team Instructor",
        {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                targetName: { type: Type.STRING },
                targetIp: { type: Type.STRING },
                os: { type: Type.STRING },
                description: { type: Type.STRING },
                openPorts: { type: Type.ARRAY, items: { type: Type.STRING } },
                vulnerability: { type: Type.STRING },
                availableTools: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type:Type.STRING}, name: {type:Type.STRING}, description:{type:Type.STRING}, type:{type:Type.STRING} } } },
                correctToolId: { type: Type.STRING },
                successMessage: { type: Type.STRING },
                failureMessage: { type: Type.STRING }
            }
        }
    );
};

export const generateKC7Case = async (user: UserProfile): Promise<KC7Case | null> => {
    return generateGenericAIResponse<KC7Case>(
        "Buat kasus investigasi log server (Blue Team).",
        "Investigator",
        {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                queryQuestion: { type: Type.STRING },
                logs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type:Type.INTEGER}, timestamp: {type:Type.STRING}, source: {type:Type.STRING}, event: {type:Type.STRING}, details: {type:Type.STRING}, isSuspicious: {type:Type.BOOLEAN} } } },
                explanation: { type: Type.STRING }
            }
        }
    );
}

// Helper for repetitive generic calls
async function generateGenericAIResponse<T>(promptText: string, role: string, schema: any): Promise<T | null> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
            config: {
                systemInstruction: role,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        if (response.text) {
             const data = JSON.parse(response.text);
             // Since this is generic, we try to clean common string fields if they exist
             // But simpler to just return data as generic T, assuming structure matches
             return data as T;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}
