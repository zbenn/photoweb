'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Photo, Category } from '@/types/database'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

export default function GalleryPage() {
  const supabase = createClient()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')

  useEffect(() => {
    loadCategories()
    loadPhotos()
  }, [selectedCategory, sortBy])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('order_idx')
    
    if (data) setCategories(data)
  }

  const loadPhotos = async () => {
    setLoading(true)
    
    let query = supabase
      .from('photos')
      .select('*')
      .eq('status', 'public')
      .eq('is_deleted', false)

    // 分类筛选
    if (selectedCategory) {
      const { data: photoIds } = await supabase
        .from('photo_categories')
        .select('photo_id')
        .eq('category_id', selectedCategory)
      
      if (photoIds && photoIds.length > 0) {
        const ids = photoIds.map(p => p.photo_id)
        query = query.in('id', ids)
      } else if (selectedCategory) {
        // 如果选择了分类但没有作品,直接返回空数组
        setPhotos([])
        setLoading(false)
        return
      }
    }

    // 排序
    if (sortBy === 'latest') {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('加载作品错误:', error)
    }

    if (data) {
      // 获取每个作品的点赞数
      const photosWithLikes = await Promise.all(
        data.map(async (photo) => {
          const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('photo_id', photo.id)
          
          return {
            ...photo,
            like_count: count || 0
          }
        })
      )

      // 如果按热度排序
      if (sortBy === 'popular') {
        photosWithLikes.sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      }

      setPhotos(photosWithLikes)
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
            {photos.map((photo) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={photo.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <Link href={`/photo/${photo.id}`}>
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={photo.thumbnail_url || photo.image_url}
                      alt={photo.title}
                      fill
                      className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                      <h3 className="text-lg font-semibold truncate">{photo.title}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-200">
                        <span>❤️ {photo.like_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {!loading && photos.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-medium text-foreground">暂无作品</h3>
          <p className="text-secondary mt-2">该分类下暂时没有作品，快来上传第一张吧！</p>
        </div>
      )}
    </div>
  )
}
