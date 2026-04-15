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
- [ ] Supabase'de `quizzes` ve `questions` tabloları
- [ ] Doğru/Yanlış soru tipi
- [ ] Çoktan seçmeli soru tipi
- [ ] Soru başına süre sayacı
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