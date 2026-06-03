# Documentation: Gradia Mobile Architecture & Integration Guide

Dokumentasi ini menjelaskan rencana integrasi, arsitektur folder, pemetaan halaman, state management, dan sistem tema untuk memigrasikan Gradia Web (React 19 + Vite) ke Gradia Mobile (React Native + Expo Router).

---

## 1. Professional Folder Structure (Arsitektur Folder)

Struktur folder ini dirancang berdasarkan praktik terbaik (best practices) industri untuk pengembangan React Native berskala menengah hingga besar dengan Expo Router. Struktur ini memisahkan kekhawatiran (*separation of concerns*), modular, mudah diuji (*testable*), dan siap untuk skalabilitas.

```
Mobile/
├── assets/                    # Aset statis aplikasi (gambar, ikon tab, fonts)
│   └── images/
│       ├── tabIcons/          # Ikon untuk tab navigasi (home, explore, dll)
│       └── logo/              # Ikon/logo Gradia
├── src/                       # Folder utama kode sumber aplikasi
│   ├── app/                   # Expo Router File-Based Routing (Screens)
│   │   ├── _layout.tsx        # Root layout (Global Providers: Theme, Auth, Alert)
│   │   ├── +not-found.tsx     # Layar fallback 404
│   │   ├── (auth)/            # Grup rute otentikasi (Stack Navigation)
│   │   │   ├── _layout.tsx    # Stack Navigator untuk alur Auth
│   │   │   ├── login.tsx      # Layar Login
│   │   │   ├── register.tsx   # Layar Register (Registrasi)
│   │   │   ├── verify-otp.tsx # Layar Verifikasi OTP
│   │   │   ├── reset-password.tsx # Layar Reset Password
│   │   │   └── success.tsx    # Layar Success Message (Register & Reset)
│   │   └── (app)/             # Grup rute aplikasi utama yang diproteksi (Tabs Navigation)
│   │       ├── _layout.tsx    # Bottom Tab Navigator (Dashboard, Calendar, Tasks, Courses, Presences)
│   │       ├── workspaces/    # Pemilihan Workspace (Ditampilkan jika id_workspace kosong)
│   │       │   └── index.tsx  # Layar Workspace Selection
│   │       ├── dashboard/     # Fitur Dashboard
│   │       │   └── index.tsx  # Layar Utama Dashboard
│   │       ├── calendar/      # Fitur Kalender & Detail Acara
│   │       │   └── index.tsx  # Layar Utama Kalender
│   │       ├── courses/       # Fitur Mata Kuliah (Courses)
│   │       │   ├── index.tsx  # Layar Daftar Mata Kuliah
│   │       │   └── [id].tsx   # Layar Detail Mata Kuliah (Modal / Detail Stack)
│   │       ├── tasks/         # Fitur Tugas Kuliah (Tasks)
│   │       │   ├── index.tsx  # Layar Utama Tasks (Kanban / List)
│   │       │   └── [id].tsx   # Layar Detail/Edit Tugas (Modal)
│   │       └── presences/     # Fitur Presensi/Kehadiran (Presences)
│   │           └── index.tsx  # Layar Utama Presensi (Tabel & Log)
│   ├── components/            # Komponen UI Reusable (Shared Components)
│   │   ├── common/            # Komponen dasar yang tidak terikat fitur khusus (Atomic UI)
│   │   │   ├── button.tsx     # Tombol custom dengan tema Gradia
│   │   │   ├── input.tsx      # Input text custom (password, email, otp)
│   │   │   ├── alert.tsx      # Banner notifikasi/alert toast
│   │   │   ├── loader.tsx     # Indicator loading global
│   │   │   └── card.tsx       # Container/Card pembungkus layout
│   │   ├── layout/            # Komponen pembungkus layout (Screen wrapper, Safe Area, Custom Header)
│   │   │   ├── screen-container.tsx # Safe area view wrapper dengan latar belakang hitam
│   │   │   └── custom-header.tsx    # Header custom di bagian atas layar
│   │   └── features/          # Komponen UI spesifik untuk fitur tertentu (Non-screen components)
│   │       ├── auth/          # Komponen login/register (PasswordRule, OtpInput)
│   │       ├── dashboard/     # Widget dashboard (DueToday, Weather, TaskProgress, dll)
│   │       ├── courses/       # Komponen pendukung courses (CourseCard, AddCourseForm)
│   │       ├── tasks/         # Komponen pendukung tasks (TaskCard, CategoryColumn)
│   │       ├── presences/     # Komponen pendukung presensi (PresenceCard, PresenceTable)
│   │       └── calendar/      # Komponen pendukung kalender (CalendarStrip, EventList)
│   ├── constants/             # Nilai konstanta aplikasi
│   │   ├── colors.ts          # Palet warna Gradia (Logo, Neutral, Status, Gradients)
│   │   ├── config.ts          # Konfigurasi aplikasi (API_URL, keys, storage keys)
│   │   └── theme.ts           # Definisi tipografi, margin, padding, border radius
│   ├── context/               # React Context Providers untuk status global
│   │   ├── auth-context.tsx   # State otentikasi user (login, register, logout, checkAuth)
│   │   ├── alert-context.tsx  # Provider alert/toast yang dapat diakses di mana saja
│   │   └── workspace-context.tsx # State workspace aktif (id_workspace, name)
│   ├── hooks/                 # React Hooks kustom
│   │   ├── use-auth.ts        # Hook cepat untuk menggunakan AuthContext
│   │   ├── use-alert.ts       # Hook cepat untuk memicu notifikasi alert
│   │   └── use-workspace.ts   # Hook cepat untuk mengontrol workspace aktif
│   ├── services/              # Lapisan Layanan API (Networking / Supabase)
│   │   ├── api.ts             # Konfigurasi Axios / Fetch client dasar (interceptor token)
│   │   ├── auth.ts            # Service pemanggilan API Auth (Login, Register, OTP, Reset)
│   │   ├── courses.ts         # Service CRUD Courses
│   │   ├── tasks.ts           # Service CRUD Tasks
│   │   ├── presences.ts       # Service CRUD Presences
│   │   └── workspaces.ts      # Service CRUD Workspaces
│   ├── types/                 # Definisi Tipe Data TypeScript
│   │   ├── index.ts           # Ekspor terpusat semua tipe data
│   │   ├── auth.d.ts          # Interface User, Session, OTP
│   │   ├── courses.d.ts       # Interface Course
│   │   ├── tasks.d.ts         # Interface Task
│   │   └── workspaces.d.ts    # Interface Workspace
│   └── utils/                 # Fungsi Utilitas Pembantu (Helpers)
│       ├── date.ts            # Pengolah tanggal (format dd/mm/yyyy, jam, dll)
│       └── validation.ts      # Validasi form (email, password rules)
```

---

## 2. Pemetaan Komponen Web ke Mobile (Web-to-Mobile Map)

Berikut adalah tabel pemetaan halaman dan komponen dari Gradia Web ke Gradia Mobile untuk panduan migrasi:

| Halaman/Fitur Web | File Path di Web | Layar / Component Tujuan di Mobile | Deskripsi di React Native |
|---|---|---|---|
| **Landing Page** | `src/pages/Landing/Landing.jsx` | `src/app/(auth)/login.tsx` | Landing page web dilewati (biasa di mobile langsung masuk ke layar login/register). |
| **Login** | `src/pages/Auth/Login/Login.jsx` | `src/app/(auth)/login.tsx` | Form login menggunakan Native TextInput dan Google OAuth SDK untuk mobile. |
| **Registration** | `src/pages/Auth/Registration/Registration.jsx` | `src/app/(auth)/register.tsx` | Form registrasi menggunakan TextInput, dilanjutkan navigasi ke verify-otp. |
| **Verify OTP** | `src/pages/Auth/Verify-otp/VerifyOtp.jsx` | `src/app/(auth)/verify-otp.tsx` | Input OTP 6 digit. Menggunakan komponen `OtpInput` kustom dengan keyboard angka. |
| **Reset Password** | `src/pages/Auth/Reset-Password/ResetPassword.jsx` | `src/app/(auth)/reset-password.tsx` | Reset password alur input email dan password baru di mobile. |
| **Success Message** | `src/pages/Auth/Success-msg/SuccessMsg.jsx` | `src/app/(auth)/success.tsx` | Tampilan sukses visual dengan animasi centang/sukses. |
| **Workspaces** | `src/pages/Workspaces/Workspaces.jsx` | `src/app/(app)/workspaces/index.tsx` | Daftar workspace untuk dipilih. Memasukkan ID workspace terpilih ke context. |
| **Dashboard** | `src/pages/Dashboard/Dashboard.jsx` | `src/app/(app)/dashboard/index.tsx` | Layar utama dashboard, menampilkan ringkasan hari ini. |
| **Calendar** | `src/pages/Calendar/Calendar.jsx` | `src/app/(app)/calendar/index.tsx` | Tampilan kalender bulanan. Menggunakan library `react-native-calendars` atau sejenis. |
| **Courses** | `src/pages/Courses/Courses.jsx` | `src/app/(app)/courses/index.tsx` | Daftar mata kuliah per hari. Di mobile menggunakan layout tab horizontal hari. |
| **Tasks** | `src/pages/Tasks/Tasks.jsx` | `src/app/(app)/tasks/index.tsx` | Layar manajemen tugas. Menggunakan daftar scrollable vertikal per kategori status. |
| **Presence** | `src/pages/Presence/Presence.jsx` | `src/app/(app)/presences/index.tsx` | Pencatatan kehadiran harian dan daftar riwayat kehadiran. |
| **Sidebar (Web)** | `src/components/Sidebar.jsx` | `src/app/(app)/_layout.tsx` | Digantikan oleh Bottom Tab Navigation bawaan Expo Router. |
| **Delete Popup** | `src/components/Delete.jsx` | `src/components/common/alert.tsx` | Digantikan oleh `Alert` bawaan React Native atau Modal popup kustom. |
| **Alert/Toast** | `src/hooks/useAlert.jsx` | `src/context/alert-context.tsx` | Notifikasi toast kustom melayang di bagian atas/bawah layar mobile. |

---

## 3. Sistem Transisi State (State Management)

Di mobile, kita tidak menggunakan `localStorage` atau `sessionStorage` karena tidak tersedia secara native. Kita menggantinya dengan pendekatan yang aman dan sesuai untuk mobile:

1. **Penyimpanan Sesi Pengguna (Auth Session):**
   - **Web:** Menggunakan `localStorage.getItem("user")` dan `localStorage.getItem("id_user")`.
   - **Mobile:** Menggunakan **`expo-secure-store`** (untuk data sensitif seperti token otentikasi) atau **`@react-native-async-storage/async-storage`** (untuk data profil non-sensitif).

2. **Workspace ID Aktif:**
   - **Web:** Menggunakan `sessionStorage.getItem("id_workspace")`.
   - **Mobile:** Disimpan di dalam `WorkspaceContext` aplikasi secara memori dan di-persist menggunakan `AsyncStorage` agar saat aplikasi ditutup dan dibuka kembali, workspace terakhir tetap aktif.

3. **Global State flow:**
   - Di root `src/app/_layout.tsx`, bungkus aplikasi dengan `AuthProvider`, `AlertProvider`, dan `WorkspaceProvider`.
   - Gunakan `ProtectedRoute` logic di dalam root layout Expo Router dengan memantau status login dari `useAuth()`. Jika tidak login, secara dinamis arahkan ke rute `(auth)`. Jika masuk tapi workspace belum dipilih, arahkan ke `workspaces`.

---

## 4. Sistem Tema & Gaya (Styling & Theme Integration)

Gradia Mobile mengadopsi palet warna dari web untuk menjaga identitas merek yang konsisten. Di React Native, gaya diimplementasikan menggunakan StyleSheet native atau NativeWind (Tailwind CSS untuk React Native).

### Konstanta Warna (`src/constants/colors.ts`)

```typescript
export const colors = {
  // Brand Colors
  logo: '#9457FF',           // Ungu Logo
  icon: '#643EB2',           // Ungu Tua Ikon
  
  // Neutrals / Backgrounds
  background: '#000000',     // Hitam pekat latar belakang
  cardBg: '#141414',         // Abu-abu gelap untuk pembungkus konten/card
  textPrimary: '#FAFAFA',    // Putih susu untuk teks utama
  textSecondary: '#A3A3A3',  // Abu-abu terang untuk deskripsi/teks sekunder
  border: '#656565',         // Abu-abu border
  
  // Statuses (Web Mapped)
  yellow: '#FDE047',         // Kuning peringatan/angka stats
  yellowBg: 'rgba(253, 224, 71, 0.1)',
  red: '#F87171',            // Merah error/overdue
  redBg: 'rgba(248, 113, 113, 0.1)',
  cyan: '#22D3EE',           // Cyan (In Progress)
  cyanBg: 'rgba(34, 211, 238, 0.1)',
  green: '#4ADE80',          // Hijau (Completed/Success)
  greenBg: 'rgba(74, 222, 128, 0.1)',
  gray: '#D4D4D8',           // Abu-abu (Not Started)
  grayBg: 'rgba(212, 212, 216, 0.1)',
  
  // Gradients (Digunakan via LinearGradient Expo)
  buttonGradient: ['#34146C', '#28073B'] as const,
  logoGradient: ['#9457FF', '#FAFAFA'] as const,
  textGradient: ['#FAFAFA', '#949494'] as const,
};
```

---

## 5. Alur Navigasi Rute di Expo Router

Struktur navigasi didasarkan pada dua grup rute utama (`(auth)` dan `(app)`):

### A. Rute Otentikasi — `(auth)`
Grup rute ini menggunakan **Stack Navigator** karena layarnya berseri satu arah (Login → Register → OTP).
- `login` (Screen Utama)
- `register` (Ke kanan dari login)
- `verify-otp` (Diarahkan setelah register atau reset password)
- `reset-password` (Untuk alur lupa password)
- `success` (Layar penyelesaian dengan tombol kembali ke login)

### B. Rute Aplikasi Utama — `(app)`
Grup rute ini menggunakan **Tabs Navigator** untuk 5 fitur utama di bagian bawah layar mobile, ditambah layar modal untuk workspace selection.
- **Tab Home (Dashboard):** Menampilkan ringkasan tugas, jadwal hari ini, weather widget, dll.
- **Tab Calendar:** Mengintegrasikan list tugas per hari dalam UI kalender mobile yang kompak.
- **Tab Tasks:** Daftar tugas dengan tab filter (Not Started, In Progress, Completed, Overdue).
- **Tab Courses:** Jadwal kuliah harian. User bisa swipe kiri/kanan untuk berpindah hari.
- **Tab Presence:** Log kehadiran presensi dan pencatatan presensi hari ini.
- **Workspaces (Modal / Stack Screen):** Layar khusus untuk memilih workspace. Jika user belum memilih workspace, layar ini akan memblokir tab lain sampai workspace dipilih.

---

## 6. Rencana Implementasi Bertahap (Roadmap)

1. **Fase 1: Setup Struktur Folder & Dependensi (Sekarang)**
   - Membuat struktur folder utama di `src/`.
   - Menginstal dependensi esensial (AsyncStorage, SecureStore, Lucide-react-native/Remix Icon, Expo LinearGradient).

2. **Fase 2: Setup Core Providers & API Layer**
   - Implementasi `AuthContext`, `WorkspaceContext`, dan `AlertContext`.
   - Konfigurasi `src/services/api.ts` untuk terhubung ke endpoint `/api/` Supabase backend.

3. **Fase 3: Integrasi Alur Auth & Workspace**
   - Membangun layar `login`, `register`, `verify-otp`, dan `workspaces`.
   - Menguji persistensi sesi dan workspace ID.

4. **Fase 4: Migrasi Fitur Utama (Dashboard, Courses, Tasks, Presences, Calendar)**
   - Mengadaptasi komponen UI desktop web ke bentuk mobile yang ramah sentuhan (touch-friendly).
   - Memanfaatkan gesture RN (seperti Swipeable untuk status tugas, Tab hari untuk Courses).

5. **Fase 5: Pengujian, Polish, & Rilis**
   - Menambahkan micro-animations menggunakan `react-native-reanimated`.
   - Uji coba performa dan build aplikasi untuk distribusi.

---

## 7. Log Update Integrasi (Update Logs)

### [2026-06-04] — Inisialisasi NativeWind & Halaman Login
1. **Instalasi NativeWind v4 & Tailwind CSS v3**:
   - Dependensi terinstal: `nativewind@4.0.1`, `tailwindcss@3.4.0` (devDependency), dan `expo-linear-gradient`.
   - Konfigurasi file: `tailwind.config.js`, `metro.config.js`, `babel.config.js`, dan `nativewind-env.d.ts`.
   - Impor `global.css` di root `src/app/_layout.tsx`.
2. **Implementasi & Penyelarasan Halaman Login**:
   - Lokasi file: `src/app/(auth)/login.tsx`.
   - Menggunakan font resmi Gradia: **Genos** (untuk Logo), **Montserrat** (untuk Header utama), dan **Inter** (untuk seluruh teks deskripsi, input, label, dan tombol).
   - Menyusun ulang tata letak: Link *Forgot password?* sejajar kanan (justify-end), tombol Google Sign-In berbentuk bulat/kotak di tengah dengan border tipis (opacity rendah seperti input), serta padding tombol Login diperbesar (`py-[18px]`) dan teksnya di-center secara presisi.
   - Merapikan struktur folder aset: Memindahkan file `bubble-1.png`, `bubble-2.png`, dan `logo-google.png` ke folder khusus `assets/images/login/` dan memperbarui jalur impornya.
   - Menghapus aset tidak terpakai (`bubble-3`, `bubble-4`, `react-logo`, `logo-glow`, dll.) serta file halaman default bawaan template yang tidak digunakan seperti `src/app/explore.tsx`.

