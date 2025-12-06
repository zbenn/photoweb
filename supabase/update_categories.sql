-- =============================================
-- 更新分类为交通主题
-- =============================================

-- 1. 添加 description 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'description') THEN
        ALTER TABLE categories ADD COLUMN description TEXT;
    END IF;
END $$;

-- 2. 清空旧的分类关联
DELETE FROM photo_categories WHERE category_id IN (
  SELECT id FROM categories WHERE slug NOT IN ('beauty', 'difficulty', 'change')
);

-- 3. 删除旧分类
DELETE FROM categories WHERE slug NOT IN ('beauty', 'difficulty', 'change');

-- 4. 插入或更新新的交通主题分类
INSERT INTO categories (name, slug, order_idx, description) VALUES
  ('交通之美', 'beauty', 1, '展现交通设施的建筑美、交通工具的流线美、交通运行的秩序美等。'),
  ('交通之困', 'difficulty', 2, '关注交通拥堵、事故隐患、不文明行为等交通领域存在的问题。'),
  ('交通之变', 'change', 3, '记录交通发展变迁、新旧交通方式对比、绿色交通出行等。')
ON CONFLICT (slug) DO UPDATE 
  SET name = EXCLUDED.name,
      order_idx = EXCLUDED.order_idx,
      description = EXCLUDED.description;

-- 5. 更新活动信息
UPDATE contests 
SET 
  name = '镜观交通摄影大赛',
  description = '定格流动瞬间，珍藏城市脉搏。用镜头记录交通之美、反映交通之困、见证交通之变！'
WHERE id IN (SELECT id FROM contests ORDER BY created_at DESC LIMIT 1);

-- =============================================
-- 完成！请在 Supabase SQL Editor 中执行此脚本
-- =============================================
