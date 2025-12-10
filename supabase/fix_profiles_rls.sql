-- 修复 profiles 表的 RLS 策略
-- 问题: 新用户注册时无法插入 profiles 记录

-- 步骤 1: 删除旧策略
DROP POLICY IF EXISTS "用户可以创建自己的 profile" ON profiles;
DROP POLICY IF EXISTS "用户可以查看所有 profile" ON profiles;
DROP POLICY IF EXISTS "用户可以更新自己的 profile" ON profiles;

-- 步骤 2: 创建新策略
-- SELECT: 所有人可以查看所有 profiles
CREATE POLICY "用户可以查看所有 profile" 
ON profiles 
FOR SELECT 
USING (true);

-- INSERT: 允许用户创建自己的 profile (触发器会用到)
CREATE POLICY "用户可以创建自己的 profile" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- UPDATE: 用户只能更新自己的 profile
CREATE POLICY "用户可以更新自己的 profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 步骤 3: 确保触发器函数使用 SECURITY DEFINER (绕过 RLS)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, real_name, school, branch, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'real_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'school', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', ''),
    'participant'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- 如果已存在则忽略(避免重复创建)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 步骤 4: 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
