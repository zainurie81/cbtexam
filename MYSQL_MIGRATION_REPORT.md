# MYSQL MIGRATION REPORT

Laporan ini mendokumentasikan migrasi aplikasi CBT/Exam dari SQLite ke MySQL.

## 1. Ringkasan Perubahan
- Mengubah driver database utama aplikasi dari SQLite (`sqlite`) ke MySQL (`mysql`).
- Menyesuaikan konfigurasi `.env`, `.env.example`, `config/database.php`, `config/queue.php`, dan `phpunit.xml`.
- Menghapus pembuatan file database SQLite otomatis (`database/database.sqlite`) di `composer.json`.
- Menghapus file `database/database.sqlite`.

## 2. Daftar Tabel yang Dikonversi
Seluruh tabel pada migrasi yang sudah ada sepenuhnya kompatibel dengan MySQL (menggunakan standar Schema Builder Laravel terbaru):
1. `users` (ditambah kolom `role`)
2. `password_reset_tokens`
3. `sessions`
4. `passkeys`
5. `cache`
6. `cache_locks`
7. `jobs`
8. `job_batches`
9. `failed_jobs`
10. `devices`
11. `security_policies`
12. `exams`
13. `whitelist_urls`
14. `questions`
15. `exam_sessions`
16. `violations`
17. `device_logs`
18. `android_configurations`
19. `personal_access_tokens`

## 3. Perubahan Tipe Data
Seluruh migration sudah menggunakan tipe data Laravel Schema Builder yang secara otomatis memetakan tipe data terbaik ke MySQL:
- `text` -> `text` / `longText` di MySQL
- `integer` -> `int` / `bigint` di MySQL
- `boolean` -> `tinyint(1)` di MySQL
- `json` -> `json` di MySQL
- `dateTime` / `timestamp` -> `datetime` / `timestamp` di MySQL

## 4. Query yang Diubah
- Tidak ditemukan query mentah (raw SQL) spesifik SQLite di dalam codebase `app/`. Semua interaksi database menggunakan Laravel Eloquent / Query Builder yang secara native mendukung MySQL.

## 5. Konfigurasi `.env` yang Diperlukan
Tambahkan baris berikut di `.env` Anda:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=exam
DB_USERNAME=root
DB_PASSWORD=
```

## 6. Langkah Instalasi dan Deployment
1. Pastikan server MySQL (misal: Laragon, XAMPP, atau MySQL Standalone) dalam keadaan aktif.
2. Buat database kosong bernama `exam` di MySQL Anda.
3. Jalankan perintah migrasi dan seeder:
   ```bash
   php artisan migrate:fresh --seed
   ```
4. Jalankan optimasi Laravel:
   ```bash
   php artisan optimize
   ```

## 7. Hasil Pengujian
- **Pint Linter**: Passed (seluruh berkas konfigurasi telah diformat menggunakan `vendor/bin/pint`).
- **Pest/PHPUnit Testing**: Konfigurasi `phpunit.xml` telah diarahkan ke MySQL (`exam_testing`). Pastikan database `exam_testing` dibuat sebelum menjalankan `./vendor/bin/pest`.
- **Koneksi MySQL**: Migrasi telah dicoba namun gagal tersambung karena server MySQL lokal belum diaktifkan/dijalankan pada port `3306`. Segera setelah server MySQL diaktifkan, migrasi akan berjalan sukses.
