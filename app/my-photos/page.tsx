'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Photo } from '@/types/database'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

export default function MyPhotosPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    loadMyPhotos()
  }, [user])

  const loadMyPhotos = async () => {
    if (!user) return
    
    setLoading(true)
    
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('加载我的作品错误:', error)
    }

    if (data) {
      // 获取每个作品的点赞数和评论数
      const photosWithCounts = await Promise.all(
        data.map(async (photo) => {
          const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
            supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('photo_id', photo.id),
            supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('photo_id', photo.id)
              .eq('is_deleted', false)
          ])
          
          return {
            ...photo,
            like_count: likeCount || 0,
            comment_count: commentCount || 0,
          }
        })
      )
      setPhotos(photosWithCounts)
    }

    setLoading(false)
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('确定要删除这张作品吗？此操作无法撤销。')) {
      return
    }

    try {
      const { error } = await supabase
        .from('photos')
        .update({ is_deleted: true })
        .eq('id', photoId)

      if (error) throw error

      toast.success('删除成功')
      loadMyPhotos()
    } catch (error: any) {
      console.error('删除错误:', error)
      toast.error('删除失败，请重试')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">我的作品</h1>
          <p className="text-secondary mt-2">管理你上传的所有摄影作品</p>
        </div>
        <Link
          href="/upload"
          className="px-6 py-3 bg-foreground text-white font-medium rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-200"
        >
          上传新作品
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-medium text-foreground mb-2">你还没有上传任何作品</h3>
          <p className="text-secondary mb-8">分享你的第一张摄影作品，开始你的创作之旅</p>
          <Link
            href="/upload"
            className="inline-block px-8 py-3 bg-accent text-white font-medium rounded-full hover:bg-accent-hover transition-all hover:scale-105 active:scale-95"
          >
            上传第一张作品
          </Link>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <Link href={`/photo/${photo.id}`} className="block relative overflow-hidden">
                  <div className="aspect-[4/3] relative bg-gray-100">
                    <Image
                      src={photo.thumbnail_url || photo.image_url}
                      alt={photo.title}
                      fill
                      className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md shadow-sm",
                        photo.status === 'public' ? 'bg-green-500/90 text-white' :
                        photo.status === 'hidden' ? 'bg-yellow-500/90 text-white' :
                        'bg-red-500/90 text-white'
                      )}>
                        {photo.status === 'public' ? '公开' :
                         photo.status === 'hidden' ? '隐藏' : '已屏蔽'}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-foreground truncate mb-3">
                    {photo.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-secondary mb-5">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">❤️ {photo.like_count || 0}</span>
                      <span className="flex items-center gap-1">💬 {photo.comment_count || 0}</span>
                    </div>
                    <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/photo/${photo.id}`}
                      className="flex-1 px-4 py-2 bg-gray-50 text-foreground text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors text-center border border-gray-200"
                    >
                      查看
                    </Link>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
