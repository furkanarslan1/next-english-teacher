# Next English Teacher — Proje Planı

## Genel Bakış
Bir İngilizce öğretmeni için hazırlanan, öğrencilerin kayıt olup bilgi kartları ve testlerle öğrenebileceği bir web uygulaması.

---

## Veri Yapısı

### Kategoriler (categories)
- **Üst kategori (level):** A1, A2, B1, B2, C1, C2 gibi seviyeler
- **Alt kategori:** Present Continuous Tense, Past Simple vb. konular
- Üst kategoriler admin tarafından oluşturulur

### Bilgi Kartları (cards)
| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| category | ✅ | Bağlı olduğu alt kategori |
| title | ✅ | Kelime veya konu başlığı |
| description | ❌ | Açıklama metni |
| example_sentence | ❌ | Örnek cümle (İngilizce) |
| translation | ❌ | Türkçe karşılığı (kartın arkası) |

### Testler (quizzes)
- Doğru/Yanlış soruları
- Çoktan seçmeli sorular
- Her sorunun süresi var
- Her doğru soru puan veriyor *(puan sistemi ilerleyen aşamada)*

### Kullanıcılar
- Öğrenciler kayıt olabilir (Supabase Auth)
- Admin paneli ayrı, korumalı

---

## Modüller ve Geliştirme Sırası

### ✅ Tamamlanan
- [x] Proje kurulumu (Next.js + Shadcn + Tailwind)
- [x] Supabase bağlantısı (`lib/supabase/`)
- [x] Cloudinary bağlantısı (`lib/cloudinary/`)
- [x] Auth middleware (`proxy.ts`)

### 🔄 Şu An: Admin Paneli

#### 1. Kategori Yönetimi
- [x] Supabase'de `levels`, `categories`, `cards`, `quizzes`, `questions`, `profiles` tabloları (`supabase/full_schema.sql`)
- [ ] Admin: Seviye (A1, B2…) oluştur / düzenle / sil
- [ ] Admin: Alt kategori oluştur / düzenle / sil

#### 2. Bilgi Kartı Yönetimi
- [ ] Supabase'de `cards` tablosu
- [ ] Admin: Kart oluştur (kategori, başlık zorunlu; açıklama, örnek cümle, çeviri opsiyonel)
- [ ] Admin: Kart düzenle / sil
- [ ] Kart listesi sayfası (admin)

#### 3. Kart Görüntüleme (Öğrenci)
- [ ] Kart bileşeni — ön yüz: başlık + açıklama + örnek cümle
- [ ] Kart flip animasyonu — arka yüz: Türkçe çeviri
- [ ] Sağa/sola kaydırma ile kart geçişi

### 📋 Sıradaki: Test Modülü

#### Test Mantığı — 3 Katman

**Katman 1: Otomatik Seviye Testi (sıralı + kilitli)**
- Hiç manuel soru girişi gerekmez; sorular `word_cards` tablosundan çalışma zamanında üretilir
- Kelimeler `sort_order`'a göre sıralanır, 10'arlık gruplara (batch) bölünür
- Batch 1 tamamlanınca Batch 2 açılır (kilitli ilerleme)
- Soru formatı: kelime gösterilir → 4 şık (3 yanlış aynı seviyeden rastgele, 1 doğru)
- Yön: EN→TR veya TR→EN, her testte karıştırılmış
- İlerleme `level_quiz_progress` tablosunda tutulur

**Katman 2: Sonsuz Pratik Modu**
- Öğrenci seviye seçer, rastgele 10 kelime gelir
- Skor veya kilit yok — saf pratik
- İstediği kadar tekrarlanabilir

**Katman 3: Admin Özel Testleri (opsiyonel)**
- Öğretmen tematik testler oluşturabilir ("Düzensiz Fiiller", "B2 Deyimler" vb.)
- Manuel soru girişi: Doğru/Yanlış, Çoktan Seçmeli (kelime bazlı veya serbest)
- Birden fazla seviye ve kategoriye bağlanabilir (junction table)
- Admin panelinde `/admin/quizzes` → `/admin/quizzes/[id]`

#### Gerekli Tablolar
- `quizzes` — admin özel testleri
- `quiz_levels` — quiz ↔ level (çoka-çok)
- `quiz_categories` — quiz ↔ category (çoka-çok)
- `questions` — soru metni, şıklar (jsonb), word_card_id (opsiyonel), yön
- `level_quiz_progress` — öğrencinin Katman 1 ilerlemesi (student_id, level_id, batch, score)

#### Görevler
- [ ] `level_quiz_progress` tablosunu Supabase'de oluştur
- [ ] Katman 1: öğrenci tarafı — seviye seç → batch listesi → test çöz → sonuç
- [ ] Katman 2: öğrenci tarafı — seviye seç → rastgele 10 kelime → pratik
- [ ] Katman 3: öğrenci tarafı — admin testlerini listele → test çöz
- [ ] Soru başına süre sayacı (time_per_question saniye)
- [ ] Doğru cevap = puan *(puan sistemi detayları sonra)*

### 📋 Sonraki: Kullanıcı Sistemi
- [ ] Öğrenci kayıt / giriş sayfaları (Supabase Auth)
- [ ] Öğrenci profil sayfası
- [ ] Puan / ilerleme takibi *(detaylar sonra)*

---

## Teknik Notlar
- Auth middleware `/admin` altındaki tüm route'ları korur
- `admin_users` tablosunda olmayan kullanıcılar admin paneline erişemez
- Cloudinary: görsel yükleme için (`next-english-teacher` klasörü)
- Public sayfalar ISR cache için `createPublicClient()` kullanır