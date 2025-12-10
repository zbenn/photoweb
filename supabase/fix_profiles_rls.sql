-- =============================================
-- 修复 profiles 表的 RLS 策略和触发器
-- 问题: 新用户注册时无法插入 profiles 记录
-- =============================================

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

-- INSERT: 允许认证用户创建 profile (触发器需要)
-- 注意: SECURITY DEFINER 函数会绕过这个检查
CREATE POLICY "用户可以创建自己的 profile" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- UPDATE: 用户只能更新自己的 profile
CREATE POLICY "用户可以更新自己的 profile" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 步骤 3: 创建或更新触发器函数 (使用 SECURITY DEFINER 绕过 RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_username TEXT;
  user_real_name TEXT;
  user_school TEXT;
  user_branch TEXT;
BEGIN
  -- 从 raw_user_meta_data 中提取数据
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  user_real_name := COALESCE(NEW.raw_user_meta_data->>'real_name', '');
  user_school := COALESCE(NEW.raw_user_meta_data->>'school', '');
  user_branch := COALESCE(NEW.raw_user_meta_data->>'branch', '');

  -- 插入到 profiles 表
  INSERT INTO public.profiles (id, username, real_name, school, branch, role, created_at, updated_at)
  VALUES (
    NEW.id,
    user_username,
    user_real_name,
    user_school,
    user_branch,
    'participant',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- 如果已存在则忽略

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING '创建 profile 失败: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 步骤 4: 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 步骤 5: 为现有的没有 profile 的用户创建 profile
-- 这会修复已经注册但 profile 没有创建的用户
INSERT INTO public.profiles (id, username, real_name, school, branch, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as username,
  COALESCE(au.raw_user_meta_data->>'real_name', '') as real_name,
  COALESCE(au.raw_user_meta_data->>'school', '') as school,
  COALESCE(au.raw_user_meta_data->>'branch', '') as branch,
  'participant' as role,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 验证: 显示修复结果
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.profiles p ON p.id = au.id WHERE p.id IS NULL) as missing_profiles
FROM auth.users;
