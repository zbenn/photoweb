'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Photo, PhotoSeries, Category } from '@/types/database'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

type WorkItem = (Photo | PhotoSeries) & { work_type: 'single' | 'series'; like_count?: number }

export default function GalleryPage() {
  const supabase = createClient()
  const [works, setWorks] = useState<WorkItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')

  useEffect(() => {
    loadCategories()
    loadWorks()
  }, [selectedCategory, sortBy])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('order_idx')
    
    if (data) setCategories(data)
  }

  const loadWorks = async () => {
    setLoading(true)
    
    try {
      // 加载单幅作品
      let photosQuery = supabase
        .from('photos')
        .select('*')
        .eq('status', 'public')
        .eq('type', 'single')
        .eq('is_deleted', false)

      // 分类筛选 - 单幅
      if (selectedCategory) {
        const { data: photoIds } = await supabase
          .from('photo_categories')
          .select('photo_id')
          .eq('category_id', selectedCategory)
        
        if (photoIds && photoIds.length > 0) {
          const ids = photoIds.map(p => p.photo_id)
          photosQuery = photosQuery.in('id', ids)
        } else {
          photosQuery = photosQuery.in('id', []) // 空结果
        }
      }

      const { data: photosData, error: photosError } = await photosQuery

      if (photosError) {
        console.error('加载单幅作品错误:', photosError)
      }

      // 加载组照
      let seriesQuery = supabase
        .from('photo_series')
        .select('*')
        .eq('status', 'public')
        .eq('is_deleted', false)

      // 分类筛选 - 组照
      if (selectedCategory) {
        const { data: seriesIds } = await supabase
          .from('photo_series_categories')
          .select('series_id')
          .eq('category_id', selectedCategory)
        
        if (seriesIds && seriesIds.length > 0) {
          const ids = seriesIds.map(s => s.series_id)
          seriesQuery = seriesQuery.in('id', ids)
        } else {
          seriesQuery = seriesQuery.in('id', []) // 空结果
        }
      }

      const { data: seriesData, error: seriesError } = await seriesQuery

      if (seriesError) {
        console.error('加载组照错误:', seriesError)
      }

      // 合并数据
      const photosWithType: WorkItem[] = (photosData || []).map(photo => ({
        ...photo,
        work_type: 'single' as const
      }))

      const seriesWithType: WorkItem[] = (seriesData || []).map(series => ({
        ...series,
        work_type: 'series' as const,
        image_url: series.cover_image_url,
        thumbnail_url: series.cover_image_url,
        title: series.title,
        author_name: series.author_name,
        created_at: series.created_at,
      }))

      const allWorks = [...photosWithType, ...seriesWithType]

      // 获取点赞数
      const worksWithLikes = await Promise.all(
        allWorks.map(async (work) => {
          if (work.work_type === 'single') {
            const { count } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('photo_id', work.id)
            
            return {
              ...work,
              like_count: count || 0
            }
          } else {
            const { count } = await supabase
              .from('photo_series_likes')
              .select('*', { count: 'exact', head: true })
              .eq('series_id', work.id)
            
            return {
              ...work,
              like_count: count || 0
            }
          }
        })
      )

      // 排序
      if (sortBy === 'latest') {
        worksWithLikes.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      } else if (sortBy === 'popular') {
        worksWithLikes.sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      }

      setWorks(worksWithLikes)
    } catch (error) {
      console.error('加载作品错误:', error)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-6 tracking-tight">作品展示</h1>
        <p className="text-secondary max-w-2xl mx-auto">
          探索来自世界各地的精彩瞬间，感受摄影的魅力。
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              selectedCategory === null
                ? "bg-foreground text-white shadow-md"
                : "bg-white text-secondary hover:bg-gray-100 border border-gray-200"
            )}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                selectedCategory === category.id
                  ? "bg-foreground text-white shadow-md"
                  : "bg-white text-secondary hover:bg-gray-100 border border-gray-200"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSortBy('latest')}
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              sortBy === 'latest'
                ? "bg-white text-foreground shadow-sm"
                : "text-secondary hover:text-foreground"
            )}
          >
            最新
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              sortBy === 'popular'
                ? "bg-white text-foreground shadow-sm"
                : "text-secondary hover:text-foreground"
            )}
          >
            最热
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {works.map((work) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={work.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <Link href={`/photo/${work.id}`}>
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={work.work_type === 'single' ? ((work as Photo).thumbnail_url || (work as Photo).image_url) : (work as PhotoSeries).cover_image_url}
                      alt={work.title}
                      fill
                      className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    {work.work_type === 'series' && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/90 text-white backdrop-blur-md shadow-sm">
                          组照 {(work as PhotoSeries).image_count}张
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                      <h3 className="text-lg font-semibold truncate">{work.title}</h3>
                      <div className="flex items-center justify-between mt-1 text-sm text-gray-200">
                        <span>❤️ {work.like_count || 0}</span>
                        <span>{work.author_name}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {!loading && works.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-medium text-foreground">暂无作品</h3>
          <p className="text-secondary mt-2">该分类下暂时没有作品，快来上传第一张吧！</p>
        </div>
      )}
    </div>
  )
}
