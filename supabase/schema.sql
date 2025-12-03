-- =============================================
-- 摄影大赛网站数据库表结构
-- =============================================

-- 1. 用户资料表 (profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'judge', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 活动表 (contests)
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  upload_start_at TIMESTAMPTZ NOT NULL,
  upload_end_at TIMESTAMPTZ NOT NULL,
  vote_start_at TIMESTAMPTZ NOT NULL,
  vote_end_at TIMESTAMPTZ NOT NULL,
  result_publish_at TIMESTAMPTZ,
  max_photos_per_user INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 分类表 (categories)
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  order_idx INTEGER NOT NULL DEFAULT 0
);

-- 4. 作品表 (photos)
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  author_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL DEFAULT 'public' CHECK (status IN ('public', 'hidden', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. 作品分类关联表 (photo_categories)
CREATE TABLE IF NOT EXISTS photo_categories (
  id BIGSERIAL PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(photo_id, category_id)
);

-- 6. 点赞表 (likes)
CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  UNIQUE(photo_id, user_id)
);

-- 7. 评论表 (comments)
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 8. 评委评分表 (judge_scores)
CREATE TABLE IF NOT EXISTS judge_scores (
  id BIGSERIAL PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(photo_id, judge_id)
);

-- =============================================
-- 索引优化
-- =============================================

CREATE INDEX IF NOT EXISTS idx_photos_contest_id ON photos(contest_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_likes_photo_id ON likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

CREATE INDEX IF NOT EXISTS idx_judge_scores_photo_id ON judge_scores(photo_id);
CREATE INDEX IF NOT EXISTS idx_judge_scores_judge_id ON judge_scores(judge_id);

-- =============================================
-- 触发器: 自动更新 updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON contests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 触发器: 用户注册时自动创建 profile
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'participant'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- RLS (Row Level Security) 策略
-- =============================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_scores ENABLE ROW LEVEL SECURITY;

-- profiles 策略
CREATE POLICY "用户可以查看所有 profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "用户可以更新自己的 profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- contests 策略
CREATE POLICY "所有人可以查看活动" ON contests FOR SELECT USING (true);
CREATE POLICY "管理员可以管理活动" ON contests FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- categories 策略
CREATE POLICY "所有人可以查看分类" ON categories FOR SELECT USING (true);
CREATE POLICY "管理员可以管理分类" ON categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- photos 策略
CREATE POLICY "所有人可以查看公开作品" ON photos FOR SELECT USING (
  status = 'public' AND is_deleted = FALSE
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'judge'))
);

CREATE POLICY "用户可以上传作品" ON photos FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "用户可以更新自己的作品" ON photos FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "用户可以删除自己的作品" ON photos FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- photo_categories 策略
CREATE POLICY "所有人可以查看作品分类" ON photo_categories FOR SELECT USING (true);
CREATE POLICY "用户可以设置自己作品的分类" ON photo_categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM photos WHERE id = photo_id AND user_id = auth.uid())
);

-- likes 策略
CREATE POLICY "所有人可以查看点赞" ON likes FOR SELECT USING (true);
CREATE POLICY "登录用户可以点赞" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以取消自己的点赞" ON likes FOR DELETE USING (auth.uid() = user_id);

-- comments 策略
CREATE POLICY "所有人可以查看未删除的评论" ON comments FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "登录用户可以评论" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的评论" ON comments FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- judge_scores 策略
CREATE POLICY "所有人可以查看评分" ON judge_scores FOR SELECT USING (true);
CREATE POLICY "评委可以打分" ON judge_scores FOR INSERT WITH CHECK (
  auth.uid() = judge_id
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'judge')
);
CREATE POLICY "评委可以修改自己的评分" ON judge_scores FOR UPDATE USING (
  auth.uid() = judge_id
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'judge')
);

-- =============================================
-- 初始化数据
-- =============================================

-- 插入默认分类
INSERT INTO categories (name, slug, order_idx) VALUES
  ('人像摄影', 'portrait', 1),
  ('风光摄影', 'landscape', 2),
  ('纪实摄影', 'documentary', 3),
  ('创意摄影', 'creative', 4),
  ('街头摄影', 'street', 5),
  ('野生动物', 'wildlife', 6)
ON CONFLICT (slug) DO NOTHING;

-- 插入默认活动 (2025年春季摄影大赛)
INSERT INTO contests (
  name,
  description,
  upload_start_at,
  upload_end_at,
  vote_start_at,
  vote_end_at,
  result_publish_at,
  max_photos_per_user
) VALUES (
  '2025年春季摄影大赛',
  '展示你的摄影才华,分享精彩瞬间!',
  '2025-12-02 00:00:00+00',
  '2025-12-31 23:59:59+00',
  '2026-01-01 00:00:00+00',
  '2026-01-15 23:59:59+00',
  '2026-01-20 00:00:00+00',
  5
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 完成!
-- =============================================
