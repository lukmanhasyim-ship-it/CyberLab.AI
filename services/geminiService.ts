
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, QuizQuestion, UserProfile, QuizHistory, StudyMaterial, GameScenario, SOCAlert, RedTeamMission, KC7Case } from "../types";
import { learningTopics } from "../data/topics";

// Initialize the client with the provided API Key.
const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY_GEMINI" });

const REFERENCE_CONTEXT = `
DASAR KURIKULUM & HUKUM (WAJIB DIGUNAKAN):
1. CP BSKAP 046 Tahun 2025 (TKJ).
2. SKKNI Keamanan Informasi No. 191 Tahun 2024.
3. UU No. 1 Tahun 2024 (Perubahan Kedua UU ITE).
4. SKKNI Teknisi Jaringan Komputer No. 637 Tahun 2016.
`;

// Mapping Topik ke ID Video Youtube
const TOPIC_VIDEO_MAP: Record<string, string> = {
  "Kebutuhan persyaratan alat-alat untuk membangun server firewall": "V4zIUiC3e2c",
  "Kebutuhan persyaratan alat-alat untuk membangun server autentifikasi": "JwFUn7ipwpM",
  "Konsep dan implementasi firewall di host dan server": "LhkdN03yDTI",
  "Fungsi dan cara kerja server autentifikasi": "uXfBt6pnpnU",
  "Firewall pada host dan server": "MNwBYStyaPE",
  "Fungsi dan tata cara pengamanan server-server layanan pada jaringan": "K8EfbNL1S5Q",
  "Etika dan hukum siber (UU ITE 2024)": "qNskX8A5I90",
  "Ancaman Serangan Jaringan (Advanced)": "S89LpW5Tbpw",
  "Pemantauan keamanan & Intrusion Detection": "Ufy3N1a9bvU",
  "Sistem Keamanan Jaringan Terpadu": "WiUc2HGI0oY",
  "Tata cara pengamanan komunikasi data menggunakan teknik kriptografi": "NufPsj01dc0"
};

// Mapping Topik ke ID Video Youtube
const TOPIC_VIDEO_MAP: Record<string, string> = {
  "Kebutuhan persyaratan alat-alat untuk membangun server firewall": "V4zIUiC3e2c",
  "Kebutuhan persyaratan alat-alat untuk membangun server autentifikasi": "JwFUn7ipwpM",
  "Konsep dan implementasi firewall di host dan server": "LhkdN03yDTI",
  "Fungsi dan cara kerja server autentifikasi": "uXfBt6pnpnU",
  "Firewall pada host dan server": "MNwBYStyaPE",
  "Fungsi dan tata cara pengamanan server-server layanan pada jaringan": "K8EfbNL1S5Q",
  "Etika dan hukum siber (UU ITE 2024)": "qNskX8A5I90",
  "Ancaman Serangan Jaringan (Advanced)": "S89LpW5Tbpw",
  "Pemantauan keamanan & Intrusion Detection": "Ufy3N1a9bvU",
  "Sistem Keamanan Jaringan Terpadu": "WiUc2HGI0oY",
  "Tata cara pengamanan komunikasi data menggunakan teknik kriptografi": "NufPsj01dc0"
};

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

// Helper to clean JSON string from Markdown code blocks or extra text
const cleanJson = (text: string): string => {
  let cleaned = text.trim();

  // Simple cleanup for Markdown code blocks
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');

  cleaned = cleaned.trim();

  // Robust extraction: Find the first { or [ and the last } or ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let start = -1;
  let end = -1;

  if (firstBrace === -1 && firstBracket === -1) return cleaned; // No JSON markers found

  // Determine if we are looking for object or array based on which comes first
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    // It's likely an object
    start = firstBrace;
    end = cleaned.lastIndexOf('}');
  } else {
    // It's likely an array
    start = firstBracket;
    end = cleaned.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  return cleaned;
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

REFERENSI MATERI (Gunakan jika relevan):
${REFERENCE_CONTEXT}

REFERENSI MATERI (Gunakan jika relevan):
${REFERENCE_CONTEXT}
`;

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string,
  user: UserProfile
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'Gemini 2.5 Flash Lite',
      model: 'Gemini 2.5 Flash Lite',
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

      REFERENSI KURIKULUM:
      ${REFERENCE_CONTEXT}

      REFERENSI KURIKULUM:
      ${REFERENCE_CONTEXT}

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
      model: 'gemini-2.5-flash lite',
      model: 'gemini-2.5-flash lite',
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
            required: ["type", "difficulty", "question", "explanation"]
          }
        }
      }
    });

    if (response.text) {
      const cleanText = cleanJson(response.text);
      const questions = JSON.parse(cleanText) as QuizQuestion[];
      const cleanText = cleanJson(response.text);
      const questions = JSON.parse(cleanText) as QuizQuestion[];
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
      model: 'gemini-2.5-flash lite lite',
      model: 'gemini-2.5-flash lite lite',
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
      const cleanText = cleanJson(response.text);
      const result = JSON.parse(cleanText);
      const cleanText = cleanJson(response.text);
      const result = JSON.parse(cleanText);
      return {
        status: result.status,
        feedback: formatContent(result.feedback)
        status: result.status,
        feedback: formatContent(result.feedback)
      };
    }
    throw new Error("Empty response from AI");
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini Essay Eval Error:", error);
    return { status: 'PARTIAL', feedback: "Maaf, AI sedang sibuk. Jawabanmu sudah dicatat." };
    console.error("Gemini Essay Eval Error:", error);
    return { status: 'PARTIAL', feedback: "Maaf, AI sedang sibuk. Jawabanmu sudah dicatat." };
  }
};

export const analyzeLearningProgress = async (history: QuizHistory[], user: UserProfile): Promise<string> => {
  try {
    const prompt = `
      Analisis progres belajar siswa bernama ${user.name} (${user.grade}).
      
      RIWAYAT KUIS TERAKHIR:
      ${JSON.stringify(history.map(h => ({
      topic: h.topic,
      score: h.score,
      total: h.totalQuestions,
      date: h.date
    })))}
      
      Tugas:
      1. Berikan Ringkasan Eksekutif tentang kekuatan & kelemahan siswa.
      2. Rekomendasikan topik selanjutnya yang perlu dipelajari berdasarkan kelemahan (jika ada).
      3. Gunakan gaya bahasa motivator yang konstruktif.
      4. Maksimal 150 kata.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash lite',
      model: 'gemini-2.5-flash lite',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return formatContent(response.text || "Belum cukup data untuk analisis.");
    return formatContent(response.text || "Belum cukup data untuk analisis.");
  } catch (error) {
    return "Analisis belum tersedia saat ini.";
    return "Analisis belum tersedia saat ini.";
  }
};

export const getLearningMaterial = async (topic: string, user: UserProfile): Promise<StudyMaterial | null> => {
  try {
    const prompt = `
          Buat MODUL PEMBELAJARAN MENDALAM (Deep Learning Module) untuk topik: "${topic}".
          Target: Siswa ${user.grade} SMK TKJ.
          
          Output MURNI JSON (Tanpa Markdown, Tanpa Penjelasan Tambahan).
          Format:
          {
             "topic": "${topic}",
             "introduction": "Pengantar konsep yang menarik & relevan dengan industri.",
             "learningObjectives": ["Tujuan 1", "Tujuan 2", "Tujuan 3"],
             "sections": [
                { "subtitle": "Judul Sub-Bab", "content": "Isi materi detail dengan analogi & contoh teknis." }
             ],
             "summary": "Rangkuman padat.",
             "youtubeUrl": "Link youtube relevan (ID saja)",
             "quiz": [
                { 
                  "type": "MCQ", "difficulty": "LOTS", 
                  "question": "...", "options": ["A", "B", "C", "D", "E"], 
                  "correctAnswerIndex": 0, "explanation": "..." 
                },
                {
                   "type": "ESSAY", "difficulty": "HOTS",
                   "question": "Studi kasus analisis...",
                   "answerKey": "Poin-poin jawaban yang diharapkan..."
                }
             ]
          }

          ATURAN:
          1. Pastikan tidak ada karakter kontrol (newline/tab) literal di dalam string JSON. Gunakan escape sequence (\\n, \\t) jika perlu.
          2. Pastikan materi mencakup implementasi dunia nyata (Real World Scenario).
          Referensi: ${REFERENCE_CONTEXT}
        `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      const cleanText = cleanJson(response.text);
      const data = JSON.parse(cleanText) as StudyMaterial;

      // Apply Video Override from Map
      if (TOPIC_VIDEO_MAP[topic]) {
        data.youtubeUrl = TOPIC_VIDEO_MAP[topic];
      }

      return {
        ...data,
        introduction: formatContent(data.introduction),
        summary: formatContent(data.summary),
        sections: data.sections.map(s => ({ ...s, content: formatContent(s.content) }))
      };
    }
    return null;
  } catch (error) {
    console.error("Gemini Learn Error:", error);
    return null;
  }
}

export const generateGameScenario = async (user: UserProfile): Promise<GameScenario | null> => {
  try {
    const prompt = `
          Buat skenario game "Cyber Defense" untuk siswa SMK.
          Topik: Keamanan Jaringan (Firewall, DDoS, Malware, Phishing).
          
          Format JSON:
          {
             "id": "...",
             "topic": "Judul Skenario",
             "situation": "Deskripsi masalah keamanan yang sedang terjadi...",
             "severity": "LOW" | "MEDIUM" | "CRITICAL",
             "options": [
                { "text": "Opsi Solusi A", "isCorrect": boolean, "impact": "Dampak dari pilihan ini..." },
                { "text": "Opsi Solusi B", "isCorrect": boolean, "impact": "..." },
                { "text": "Opsi Solusi C", "isCorrect": boolean, "impact": "..." }
             ]
          }
        `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash lite',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    if (response.text) {
      const cleanText = cleanJson(response.text);
      return JSON.parse(cleanText);
    }
    return null;
  } catch (e) { return null; }
}

export const generateSOCAlert = async (user: UserProfile): Promise<SOCAlert | null> => {
  try {
    const prompt = `
           Generate a SOC Alert Ticket (JSON) for a Cybersecurity Analyst simulation.
           Fields: id, title, timestamp, severity (Low/Medium/High/Critical), sourceIp, destinationIp, logPayload (raw log simulation), hash (optional malware hash), isTruePositive (boolean), analysisReport (explanation).
           Make it realistic for Enterprise Network environment.
        `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash lite',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    if (response.text) {
      const cleanText = cleanJson(response.text);
      return JSON.parse(cleanText);
    }
    return null;
  } catch (e) { return null; }
}

export const generateKC7Case = async (user: UserProfile): Promise<KC7Case | null> => {
  try {
    const prompt = `
           Generate a KC7 Investigation Case (JSON).
           Theme: Blue Team Log Analysis (SQL Injection, Brute Force, or Data Exfiltration).
           Structure:
           {
             "title": "Case Title",
             "description": "Brief briefing...",
             "queryQuestion": "Find the specific log entry that shows...",
             "logs": [
                { "id": 1, "timestamp": "...", "source": "IP/User", "event": "Event Name", "details": "...", "isSuspicious": boolean }
             ],
             "explanation": "Why the suspicious log is the correct answer."
           }
           Generate about 10-15 logs, mixed normal and 1 suspicious.
        `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash lite',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    if (response.text) {
      const cleanText = cleanJson(response.text);
      return JSON.parse(cleanText);
    }
    return null;
  } catch (e) { return null; }
}

export const generateRedTeamMission = async (user: UserProfile): Promise<RedTeamMission | null> => {
  try {
    const prompt = `
           Generate a Red Team Ops Mission (JSON).
           Context: Ethical Hacking / Penetration Testing Simulation.
           Structure:
           {
              "id": "...",
              "targetName": "Target Server Name",
              "targetIp": "10.10.x.x",
              "os": "Linux/Windows",
              "description": "Mission objective...",
              "openPorts": ["22/tcp", "80/tcp"],
              "vulnerability": "Hidden vuln description",
              "availableTools": [
                  { "id": "t1", "name": "Tool Name", "description": "...", "type": "SCAN" | "EXPLOIT" }
              ],
              "correctToolId": "id of the tool that works",
              "successMessage": "Shell access granted...",
              "failureMessage": "Connection refused..."
           }
           Provide 4 tools options, only 1 correct.
        `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash lite',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    if (response.text) {
      const cleanText = cleanJson(response.text);
      return JSON.parse(cleanText);
    }
    return null;
  } catch (e) { return null; }
}
