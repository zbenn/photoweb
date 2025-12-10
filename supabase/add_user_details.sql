-- =============================================
-- 添加用户详细信息字段
-- =============================================

-- 在 profiles 表中添加真实姓名、学校、团支部/党支部字段
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS real_name TEXT,
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT;

-- 添加注释
COMMENT ON COLUMN profiles.real_name IS '真实姓名';
COMMENT ON COLUMN profiles.username IS '昵称（网页显示名）';
COMMENT ON COLUMN profiles.school IS '学校名称';
COMMENT ON COLUMN profiles.branch IS '团支部/党支部名称';
