'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Photo, PhotoSeries } from '@/types/database'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

type WorkItem = (Photo | PhotoSeries) & { work_type: 'single' | 'series' }

export default function MyPhotosPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const [works, setWorks] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    loadMyWorks()
  }, [user])

  const loadMyWorks = async () => {
    if (!user) return
    
    setLoading(true)
    
    try {
      // 加载单幅作品
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'single')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (photosError) {
        console.error('加载单幅作品错误:', photosError)
      }

      // 加载组照作品
      const { data: seriesData, error: seriesError } = await supabase
        .from('photo_series')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (seriesError) {
        console.error('加载组照作品错误:', seriesError)
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
      }))

      const allWorks = [...photosWithType, ...seriesWithType].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // 获取每个作品的点赞数和评论数
      const worksWithCounts = await Promise.all(
        allWorks.map(async (work) => {
          if (work.work_type === 'single') {
            const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
              supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('photo_id', work.id),
              supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('photo_id', work.id)
                .eq('is_deleted', false)
            ])
            
            return {
              ...work,
              like_count: likeCount || 0,
              comment_count: commentCount || 0,
            }
          } else {
            const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
              supabase
                .from('photo_series_likes')
                .select('*', { count: 'exact', head: true })
                .eq('series_id', work.id),
              supabase
                .from('photo_series_comments')
                .select('*', { count: 'exact', head: true })
                .eq('series_id', work.id)
                .eq('is_deleted', false)
            ])
            
            return {
              ...work,
              like_count: likeCount || 0,
              comment_count: commentCount || 0,
            }
          }
        })
      )
      
      setWorks(worksWithCounts)
    } catch (error) {
      console.error('加载作品错误:', error)
    }

    setLoading(false)
  }

  const handleDelete = async (workId: string, workType: 'single' | 'series') => {
    const typeText = workType === 'single' ? '单幅作品' : '组照'
    if (!confirm(`确定要删除这个${typeText}吗？此操作无法撤销。`)) {
      return
    }

    try {
      console.log('准备删除:', { workId, workType })
      
      if (workType === 'single') {
        const { error } = await supabase
          .from('photos')
          .update({ is_deleted: true })
          .eq('id', workId)

        console.log('删除单幅作品结果:', { error })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('photo_series')
          .update({ is_deleted: true })
          .eq('id', workId)

        console.log('删除组照结果:', { error })
        if (error) throw error
      }

      toast.success('删除成功')
      loadMyWorks()
    } catch (error: any) {
      console.error('删除错误:', error)
      console.error('错误详情:', JSON.stringify(error, null, 2))
      toast.error(error.message || '删除失败，请重试')
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
          <p className="text-secondary mt-2">
            管理你上传的所有摄影作品（共 {works.length} 组）
          </p>
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
      ) : works.length === 0 ? (
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
            {works.map((work) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={work.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <Link href={`/photo/${work.id}`} className="block relative overflow-hidden">
                  <div className="aspect-[4/3] relative bg-gray-100">
                    <Image
                      src={work.work_type === 'single' ? ((work as Photo).thumbnail_url || (work as Photo).image_url) : (work as PhotoSeries).cover_image_url}
                      alt={work.title}
                      fill
                      className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/90 text-white backdrop-blur-md shadow-sm">
                        {work.work_type === 'single' ? '单幅' : `组照 ${(work as PhotoSeries).image_count}张`}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md shadow-sm",
                        work.status === 'public' ? 'bg-green-500/90 text-white' :
                        work.status === 'hidden' ? 'bg-yellow-500/90 text-white' :
                        'bg-red-500/90 text-white'
                      )}>
                        {work.status === 'public' ? '公开' :
                         work.status === 'hidden' ? '隐藏' : '已屏蔽'}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-foreground truncate mb-3">
                    {work.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-secondary mb-5">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">❤️ {work.like_count || 0}</span>
                      <span className="flex items-center gap-1">💬 {work.comment_count || 0}</span>
                    </div>
                    <span>{new Date(work.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/photo/${work.id}`}
                      className="flex-1 px-4 py-2 bg-gray-50 text-foreground text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors text-center border border-gray-200"
                    >
                      查看
                    </Link>
                    <button
                      onClick={() => handleDelete(work.id, work.work_type)}
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
