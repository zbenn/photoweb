-- =============================================
-- 修复组照删除权限问题
-- =============================================

-- 问题：UPDATE 策略的 USING 和 WITH CHECK 都必须满足
-- 解决：确保管理员和用户都能通过 UPDATE 检查

-- 1. 修复组照的 UPDATE 策略（用于软删除 is_deleted = true）
DROP POLICY IF EXISTS "Users can update their own series" ON photo_series;
DROP POLICY IF EXISTS "Users can update their own series or admins can update any" ON photo_series;

CREATE POLICY "Users and admins can update series" ON photo_series
FOR UPDATE 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. 修复单幅作品的 UPDATE 策略（用于软删除）
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "用户可以更新自己的作品" ON photos;

CREATE POLICY "Users and admins can update photos" ON photos
FOR UPDATE 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. 确保管理员有 SELECT 权限查看所有作品（包括已删除的）
DROP POLICY IF EXISTS "Admins can view all series" ON photo_series;
CREATE POLICY "Admins can view all series" ON photo_series
FOR SELECT 
USING (
  (status = 'public' AND is_deleted = false)
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can view all photos" ON photos;
CREATE POLICY "Admins can view all photos" ON photos
FOR SELECT 
USING (
  (status = 'public' AND is_deleted = false)
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 验证策略
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('photos', 'photo_series')
AND cmd IN ('UPDATE', 'SELECT')
ORDER BY tablename, cmd, policyname;
