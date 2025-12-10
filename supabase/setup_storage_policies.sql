-- =============================================
-- Supabase Storage 策略设置
-- 用于 photos bucket
-- =============================================

-- 1. 允许所有人查看 photos bucket 中的文件（已公开）
-- 这个策略应该已经存在，如果 bucket 是 public 的

-- 先删除可能存在的旧策略，然后创建新策略

-- 2. 允许认证用户上传文件到自己的文件夹
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. 允许用户删除自己文件夹中的文件
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. 允许管理员删除任何文件
DROP POLICY IF EXISTS "Admins can delete any photos" ON storage.objects;
CREATE POLICY "Admins can delete any photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. 允许用户更新自己的文件
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 验证策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;
