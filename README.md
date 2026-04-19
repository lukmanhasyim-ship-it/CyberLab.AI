<div align="center">
  <img width="1200" height="475" alt="CyberLab AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CyberLab.AI 🚀

CyberLab.AI adalah platform pembelajaran interaktif dan cerdas yang dirancang khusus untuk meningkatkan gaya dan cara belajar menggunakan dukungan kecerdasan buatan (AI) terintegrasi serta gamifikasi. Dioptimalkan untuk pengalaman *mobile-first*, aplikasi ini ditujukan untuk memfasilitasi proses edukasi yang canggih, interaktif, dan *engaging*.

> **Informasi Project**: Project ini digunakan untuk mendukung program **SMK PK (Pusat Keunggulan) SMKS AL-AZHAR SEMPU Tahun 2025**.

Fitur Utama:
- **🤖 AI Chat Tutor**: Asisten belajar virtual 24/7 bertenaga Google Gemini GenAI.
- **📝 AI Quiz Generator**: Pembuat kuis dinamis dan otomatis untuk membantu mengevaluasi pemahaman siswa secara real-time.
- **🎮 Game Center**: Berbagai macam mini-games edukasi yang berfokus pada *cyber security* dan *problem solving*, seperti:
  - Data Hunter
  - Let's Defend
  - Red Team
  - KC7
  - Word Games
- **📊 Reporting & Dashboard**: Laporan belajar komprehensif untuk memantau perkembangan nilai dan aktivitas.
- **🔐 Firebase Integration**: Sistem autentikasi dan penyimpanan data yang *seamless* dan terdistribusi.
- **📱 Mobile-Friendly**: Antarmuka responsif yang dilengkapi dengan kontrol Bottom Navigation untuk memudahkan akses di perangkat *mobile*.

## Tech Stack

Aplikasi ini dikembangkan modern menggunakan ekosistem *frontend* mutakhir:
- **Framework**: React 19 dengan TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS & Lucide React Icons
- **Backend & Database**: Firebase
- **AI Engine**: Google GenAI (`@google/genai`)

## Menjalankan Aplikasi Secara Lokal (Local Development)

**Prasyarat:** Pastikan Anda telah menginstal Node.js di sistem Anda.

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment Variable**
   Salin `.env.local` atau buat file baru bernama `.env.local` di root folder, kemudian masukkan API Key Gemini Anda:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Catatan: pastikan semua environment variable yang diperlukan oleh Firebase juga diset dengan benar).*

3. **Mulai Development Server**
   ```bash
   npm run dev
   ```

Aplikasi akan berjalan di lokal. Silakan buka browser sesuai `localhost` port yang disediakan oleh Vite.

---
*© 2025 SMK AL-AZHAR SEMPU*
