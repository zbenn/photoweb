-- =============================================
-- 添加组照支持
-- =============================================

-- 1. 作品系列表 (photo_series) - 用于组照
CREATE TABLE IF NOT EXISTS photo_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  author_name TEXT NOT NULL,
  cover_image_url TEXT NOT NULL, -- 封面图（第一张图片）
  image_count INTEGER NOT NULL CHECK (image_count >= 4 AND image_count <= 6),
  status TEXT NOT NULL DEFAULT 'public' CHECK (status IN ('public', 'hidden', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. 组照图片表 (photo_series_images) - 存储组照中的每张图片
CREATE TABLE IF NOT EXISTS photo_series_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES photo_series(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  order_idx INTEGER NOT NULL DEFAULT 0, -- 图片顺序
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 修改 photos 表，添加 type 和 series_id 字段
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'series')),
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES photo_series(id) ON DELETE CASCADE;

-- 4. 组照分类关联表 (photo_series_categories)
CREATE TABLE IF NOT EXISTS photo_series_categories (
  id BIGSERIAL PRIMARY KEY,
  series_id UUID NOT NULL REFERENCES photo_series(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(series_id, category_id)
);

-- 5. 组照点赞表 (photo_series_likes)
CREATE TABLE IF NOT EXISTS photo_series_likes (
  id BIGSERIAL PRIMARY KEY,
  series_id UUID NOT NULL REFERENCES photo_series(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  UNIQUE(series_id, user_id)
);

-- 6. 组照评论表 (photo_series_comments)
CREATE TABLE IF NOT EXISTS photo_series_comments (
  id BIGSERIAL PRIMARY KEY,
  series_id UUID NOT NULL REFERENCES photo_series(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. 组照评委评分表 (photo_series_judge_scores)
CREATE TABLE IF NOT EXISTS photo_series_judge_scores (
  id BIGSERIAL PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES photo_series(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(series_id, judge_id)
);

-- =============================================
-- 索引优化
-- =============================================

CREATE INDEX IF NOT EXISTS idx_photo_series_user_id ON photo_series(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_series_contest_id ON photo_series(contest_id);
CREATE INDEX IF NOT EXISTS idx_photo_series_created_at ON photo_series(created_at);
CREATE INDEX IF NOT EXISTS idx_photo_series_images_series_id ON photo_series_images(series_id);
CREATE INDEX IF NOT EXISTS idx_photo_series_images_order ON photo_series_images(series_id, order_idx);
CREATE INDEX IF NOT EXISTS idx_photo_series_likes_series_id ON photo_series_likes(series_id);
CREATE INDEX IF NOT EXISTS idx_photo_series_comments_series_id ON photo_series_comments(series_id);
CREATE INDEX IF NOT EXISTS idx_photo_series_judge_scores_series_id ON photo_series_judge_scores(series_id);

-- =============================================
-- RLS 策略
-- =============================================

-- photo_series 表的 RLS
ALTER TABLE photo_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public series" ON photo_series;
CREATE POLICY "Anyone can view public series" ON photo_series
  FOR SELECT USING (status = 'public' AND is_deleted = false);

DROP POLICY IF EXISTS "Users can insert their own series" ON photo_series;
CREATE POLICY "Users can insert their own series" ON photo_series
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own series" ON photo_series;
CREATE POLICY "Users can update their own series" ON photo_series
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own series" ON photo_series;
CREATE POLICY "Users can delete their own series" ON photo_series
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all series" ON photo_series;
CREATE POLICY "Admins can view all series" ON photo_series
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- photo_series_images 表的 RLS
ALTER TABLE photo_series_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view series images" ON photo_series_images;
CREATE POLICY "Anyone can view series images" ON photo_series_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert series images" ON photo_series_images;
CREATE POLICY "Users can insert series images" ON photo_series_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM photo_series 
      WHERE id = series_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their series images" ON photo_series_images;
CREATE POLICY "Users can delete their series images" ON photo_series_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM photo_series 
      WHERE id = series_id AND user_id = auth.uid()
    )
  );

-- photo_series_categories 表的 RLS
ALTER TABLE photo_series_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view series categories" ON photo_series_categories;
CREATE POLICY "Anyone can view series categories" ON photo_series_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their series categories" ON photo_series_categories;
CREATE POLICY "Users can manage their series categories" ON photo_series_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM photo_series 
      WHERE id = series_id AND user_id = auth.uid()
    )
  );

-- photo_series_likes 表的 RLS
ALTER TABLE photo_series_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view series likes" ON photo_series_likes;
CREATE POLICY "Anyone can view series likes" ON photo_series_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like series" ON photo_series_likes;
CREATE POLICY "Users can like series" ON photo_series_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike series" ON photo_series_likes;
CREATE POLICY "Users can unlike series" ON photo_series_likes
  FOR DELETE USING (auth.uid() = user_id);

-- photo_series_comments 表的 RLS
ALTER TABLE photo_series_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view series comments" ON photo_series_comments;
CREATE POLICY "Anyone can view series comments" ON photo_series_comments
  FOR SELECT USING (is_deleted = false);

DROP POLICY IF EXISTS "Authenticated users can create series comments" ON photo_series_comments;
CREATE POLICY "Authenticated users can create series comments" ON photo_series_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their series comments" ON photo_series_comments;
CREATE POLICY "Users can update their series comments" ON photo_series_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- photo_series_judge_scores 表的 RLS
ALTER TABLE photo_series_judge_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Judges can view all series scores" ON photo_series_judge_scores;
CREATE POLICY "Judges can view all series scores" ON photo_series_judge_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('judge', 'admin')
    )
  );

DROP POLICY IF EXISTS "Judges can score series" ON photo_series_judge_scores;
CREATE POLICY "Judges can score series" ON photo_series_judge_scores
  FOR INSERT WITH CHECK (
    auth.uid() = judge_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('judge', 'admin')
    )
  );

DROP POLICY IF EXISTS "Judges can update their series scores" ON photo_series_judge_scores;
CREATE POLICY "Judges can update their series scores" ON photo_series_judge_scores
  FOR UPDATE USING (
    auth.uid() = judge_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('judge', 'admin')
    )
  );

-- =============================================
-- 注释说明
-- =============================================

COMMENT ON TABLE photo_series IS '组照作品表';
COMMENT ON TABLE photo_series_images IS '组照图片表，每个组照包含4-6张图片';
COMMENT ON COLUMN photos.type IS '作品类型：single=单幅作品，series=组照作品';
COMMENT ON COLUMN photos.series_id IS '如果是组照，关联到 photo_series 表';
COMMENT ON COLUMN photo_series.image_count IS '组照图片数量，限制4-6张';
COMMENT ON COLUMN photo_series_images.order_idx IS '图片在组照中的顺序，从0开始';
