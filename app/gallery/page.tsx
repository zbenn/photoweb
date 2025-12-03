'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Photo, Category } from '@/types/database'
import Link from 'next/link'
import Image from 'next/image'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">作品展示</h1>
        
        {/* 筛选和排序 */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 rounded-lg ${
                sortBy === 'latest'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              最新
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 rounded-lg ${
                sortBy === 'popular'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              最热
            </button>
          </div>
        </div>
      </div>

      {/* 作品网格 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">暂无作品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <Link
              key={photo.id}
              href={`/photo/${photo.id}`}
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                <Image
                  src={photo.thumbnail_url || photo.image_url}
                  alt={photo.title}
                  fill
                  className="object-cover group-hover:scale-110 transition duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">
                  {photo.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  作者: {photo.author_name}
                </p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <span>👍 {photo.like_count || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
