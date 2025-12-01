
export interface TopicDef {
  title: string;
  grades: string[]; // ['11', '12']
}

export const learningTopics: TopicDef[] = [
  // MATERI KELAS 11 (Dasar Jaringan & Server)
  { title: "Kebutuhan persyaratan alat-alat untuk membangun server firewall", grades: ['11', '12'] },
  { title: "Kebutuhan persyaratan alat-alat untuk membangun server autentifikasi", grades: ['11', '12'] },
  { title: "Konsep dan implementasi firewall di host dan server", grades: ['11', '12'] },
  { title: "Fungsi dan cara kerja server autentifikasi", grades: ['11', '12'] },
  { title: "Firewall pada host dan server", grades: ['11', '12'] },
  
  // MATERI KELAS 12 (Keamanan Lanjut, Hukum, Kriptografi)
  { title: "Fungsi dan tata cara pengamanan server-server layanan pada jaringan", grades: ['12'] },
  { title: "Ancaman Serangan Jaringan (Advanced)", grades: ['12'] },
  { title: "Etika dan hukum siber (UU ITE 2024)", grades: ['12'] },
  { title: "Pemantauan keamanan & Intrusion Detection", grades: ['12'] },
  { title: "Sistem Keamanan Jaringan Terpadu", grades: ['12'] },
  { title: "Tata cara pengamanan komunikasi data menggunakan teknik kriptografi", grades: ['12'] }
];
