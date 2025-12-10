-- =============================================
-- 修复管理员权限 - 允许管理员删除任何作品
-- =============================================

-- 1. 修复单幅作品 (photos) 的删除策略
DROP POLICY IF EXISTS "用户可以删除自己的作品" ON photos;
CREATE POLICY "用户可以删除自己的作品或管理员可以删除任何作品" ON photos 
FOR DELETE 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. 修复组照 (photo_series) 的删除策略
DROP POLICY IF EXISTS "Users can delete their own series" ON photo_series;
CREATE POLICY "Users can delete their own series or admins can delete any" ON photo_series
FOR DELETE 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. 修复组照 (photo_series) 的更新策略 (软删除需要)
DROP POLICY IF EXISTS "Users can update their own series" ON photo_series;
CREATE POLICY "Users can update their own series or admins can update any" ON photo_series
FOR UPDATE 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. 修复组照图片 (photo_series_images) 的删除策略
DROP POLICY IF EXISTS "Users can delete their series images" ON photo_series_images;
CREATE POLICY "Users can delete their series images or admins can delete any" ON photo_series_images
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM photo_series 
    WHERE id = series_id AND user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. 添加管理员查看所有组照的策略 (如果还没有)
DROP POLICY IF EXISTS "Admins can manage all series" ON photo_series;
CREATE POLICY "Admins can manage all series" ON photo_series
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. 添加管理员管理评论的权限
DROP POLICY IF EXISTS "用户可以删除自己的评论" ON comments;
CREATE POLICY "用户可以删除自己的评论或管理员可以删除任何评论" ON comments
FOR UPDATE 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. 添加管理员管理组照评论的权限
DROP POLICY IF EXISTS "Users can update their own comments" ON photo_series_comments;
CREATE POLICY "Users can update their own comments or admins can update any" ON photo_series_comments
FOR UPDATE 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 验证: 检查策略是否正确创建
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('photos', 'photo_series', 'photo_series_images', 'comments', 'photo_series_comments')
ORDER BY tablename, cmd;
