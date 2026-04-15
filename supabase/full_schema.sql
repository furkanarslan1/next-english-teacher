-- =============================================
-- NEXT ENGLISH TEACHER — TAM SCHEMA + RLS
-- Yeni bir Supabase projesinde sıfırdan çalıştırılır.
-- Supabase SQL Editor'e yapıştırıp çalıştır.
-- Sıra önemli: tablolar bağımlılık sırasına göre oluşturulur.
-- =============================================


-- =============================================
-- 1. ADMIN USERS
-- =============================================

CREATE TABLE IF NOT EXISTS admin_users (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- =============================================
-- 2. PROFILES (Öğrenci kullanıcılar)
-- =============================================
-- Supabase Auth ile kayıt olan öğrencilerin profil bilgileri.
-- id → auth.users.id ile eşleşir.

CREATE TABLE IF NOT EXISTS profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);


-- =============================================
-- 3. LEVELS (Üst kategoriler: A1, A2, B1…)
-- =============================================

CREATE TABLE IF NOT EXISTS levels (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text        NOT NULL UNIQUE,   -- "A1", "B2" vb.
  sort_order integer     NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO levels (label, sort_order) VALUES
  ('A1', 10),
  ('A2', 20),
  ('B1', 30),
  ('B2', 40),
  ('C1', 50),
  ('C2', 60)
ON CONFLICT (label) DO NOTHING;


-- =============================================
-- 4. CATEGORIES (Alt kategoriler: Present Cont. vb.)
-- =============================================

CREATE TABLE IF NOT EXISTS categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id   uuid        NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  label      text        NOT NULL,          -- "Present Continuous Tense"
  sort_order integer     NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- =============================================
-- 5. CARDS (Bilgi kartları)
-- =============================================
-- category_id ve title zorunlu, diğerleri opsiyonel.
-- Kart ön yüz: title + description + example_sentence
-- Kart arka yüz: translation

CREATE TABLE IF NOT EXISTS cards (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      uuid        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title            text        NOT NULL,   -- kelime veya konu başlığı (zorunlu)
  description      text,                  -- açıklama (opsiyonel)
  example_sentence text,                  -- örnek cümle İngilizce (opsiyonel)
  translation      text,                  -- Türkçe karşılık / arka yüz (opsiyonel)
  sort_order       integer     NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);


-- =============================================
-- 6. QUIZZES (Testler)
-- =============================================

CREATE TABLE IF NOT EXISTS quizzes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  uuid        REFERENCES categories(id) ON DELETE SET NULL,
  level_id     uuid        REFERENCES levels(id) ON DELETE SET NULL,
  title        text        NOT NULL,
  description  text,
  time_per_question integer NOT NULL DEFAULT 30,  -- saniye cinsinden
  is_active    boolean     NOT NULL DEFAULT true,
  sort_order   integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);


-- =============================================
-- 7. QUESTIONS (Test soruları)
-- =============================================
-- type: 'true_false' | 'multiple_choice'

CREATE TABLE IF NOT EXISTS questions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       uuid        NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type          text        NOT NULL DEFAULT 'multiple_choice'
                              CHECK (type IN ('true_false', 'multiple_choice')),
  question_text text        NOT NULL,
  options       jsonb       NOT NULL DEFAULT '[]',
  -- true_false için: [{"label":"Doğru","is_correct":true},{"label":"Yanlış","is_correct":false}]
  -- multiple_choice için: [{"label":"...","is_correct":false}, ...]
  points        integer     NOT NULL DEFAULT 10,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- =============================================
-- 8. updated_at TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================
-- 9. PROFILE OTO-OLUŞTURMA TRIGGER
-- =============================================
-- Öğrenci kayıt olduğunda profiles tablosuna otomatik satır açılır.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- =============================================
-- 10. SIRALAMA SWAP FONKSİYONLARI
-- =============================================

CREATE OR REPLACE FUNCTION swap_level_sort_order(p_id_a uuid, p_id_b uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_sort_a int;
  v_sort_b int;
BEGIN
  SELECT sort_order INTO v_sort_a FROM levels WHERE id = p_id_a FOR UPDATE;
  SELECT sort_order INTO v_sort_b FROM levels WHERE id = p_id_b FOR UPDATE;
  UPDATE levels SET sort_order = v_sort_b WHERE id = p_id_a;
  UPDATE levels SET sort_order = v_sort_a WHERE id = p_id_b;
END;
$$;

CREATE OR REPLACE FUNCTION swap_category_sort_order(p_id_a uuid, p_id_b uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_sort_a int;
  v_sort_b int;
BEGIN
  SELECT sort_order INTO v_sort_a FROM categories WHERE id = p_id_a FOR UPDATE;
  SELECT sort_order INTO v_sort_b FROM categories WHERE id = p_id_b FOR UPDATE;
  UPDATE categories SET sort_order = v_sort_b WHERE id = p_id_a;
  UPDATE categories SET sort_order = v_sort_a WHERE id = p_id_b;
END;
$$;

CREATE OR REPLACE FUNCTION swap_card_sort_order(p_id_a uuid, p_id_b uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_sort_a int;
  v_sort_b int;
BEGIN
  SELECT sort_order INTO v_sort_a FROM cards WHERE id = p_id_a FOR UPDATE;
  SELECT sort_order INTO v_sort_b FROM cards WHERE id = p_id_b FOR UPDATE;
  UPDATE cards SET sort_order = v_sort_b WHERE id = p_id_a;
  UPDATE cards SET sort_order = v_sort_a WHERE id = p_id_b;
END;
$$;


-- =============================================
-- 11. İNDEKSLER
-- =============================================

-- Levels
CREATE INDEX IF NOT EXISTS idx_levels_sort_order  ON levels(sort_order);
CREATE INDEX IF NOT EXISTS idx_levels_is_active   ON levels(is_active);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_level_id   ON categories(level_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_level_sort ON categories(level_id, sort_order);

-- Cards
CREATE INDEX IF NOT EXISTS idx_cards_category_id   ON cards(category_id);
CREATE INDEX IF NOT EXISTS idx_cards_sort_order    ON cards(sort_order);
CREATE INDEX IF NOT EXISTS idx_cards_is_active     ON cards(is_active);
CREATE INDEX IF NOT EXISTS idx_cards_category_sort ON cards(category_id, sort_order);

-- Quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_category_id ON quizzes(category_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_level_id    ON quizzes(level_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active   ON quizzes(is_active);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id    ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_sort_order ON questions(sort_order);


-- =============================================
-- 12. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions   ENABLE ROW LEVEL SECURITY;

-- ADMIN USERS
CREATE POLICY "admin_users_self_read"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- PROFILES
-- Kullanıcı kendi profilini okuyup yazabilir; admin hepsini okuyabilir.
CREATE POLICY "profiles_self_read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- LEVELS — herkese açık okuma, sadece admin yazar
CREATE POLICY "levels_public_read"
  ON public.levels FOR SELECT
  TO public
  USING (true);

CREATE POLICY "levels_admin_write"
  ON public.levels FOR ALL
  TO authenticated
  USING    (auth.uid() IN (SELECT id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- CATEGORIES — herkese açık okuma, sadece admin yazar
CREATE POLICY "categories_public_read"
  ON public.categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "categories_admin_write"
  ON public.categories FOR ALL
  TO authenticated
  USING    (auth.uid() IN (SELECT id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- CARDS — herkese açık okuma, sadece admin yazar
CREATE POLICY "cards_public_read"
  ON public.cards FOR SELECT
  TO public
  USING (true);

CREATE POLICY "cards_admin_write"
  ON public.cards FOR ALL
  TO authenticated
  USING    (auth.uid() IN (SELECT id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- QUIZZES — herkese açık okuma, sadece admin yazar
CREATE POLICY "quizzes_public_read"
  ON public.quizzes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "quizzes_admin_write"
  ON public.quizzes FOR ALL
  TO authenticated
  USING    (auth.uid() IN (SELECT id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- QUESTIONS — herkese açık okuma, sadece admin yazar
CREATE POLICY "questions_public_read"
  ON public.questions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "questions_admin_write"
  ON public.questions FOR ALL
  TO authenticated
  USING    (auth.uid() IN (SELECT id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));


-- =============================================
-- 13. ADMIN KULLANICI KURULUMU (3 adım)
-- =============================================

-- ADIM 1: Email adresini gir.
INSERT INTO admin_users (email) VALUES ('senin@email.com');

-- ADIM 2: Supabase → Authentication → Users → "Add user" ile
--         aynı email adresini kullanarak bir auth kullanıcısı oluştur.
--         Oluşan UUID'yi kopyala.

-- ADIM 3: UUID'yi admin_users kaydına bağla (ADIM 2'den sonra çalıştır).
-- UPDATE admin_users
-- SET id = 'buraya-kopyaladigin-uuid'
-- WHERE email = 'senin@email.com';
