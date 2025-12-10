'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Photo, PhotoSeries, PhotoSeriesImage, Comment } from '@/types/database'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

type WorkData = {
  type: 'single' | 'series'
  data: Photo | PhotoSeries
  images?: PhotoSeriesImage[]
}

export default function PhotoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useAuthStore()
  
  const [work, setWork] = useState<WorkData | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    loadWork()
  }, [params.id])

  useEffect(() => {
    if (work && user) {
      checkIfLiked()
    }
  }, [work, user])

  const loadWork = async () => {
    setLoading(true)
    
    // 先尝试加载单幅作品
    const { data: photoData, error: photoError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .maybeSingle()

    if (photoData) {
      setWork({ type: 'single', data: photoData })
      loadLikeCount('single')
      loadComments('single')
      setLoading(false)
      return
    }

    // 如果不是单幅，尝试加载组照
    const { data: seriesData, error: seriesError } = await supabase
      .from('photo_series')
      .select('*')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .maybeSingle()

    if (seriesData) {
      // 加载组照图片
      const { data: imagesData } = await supabase
        .from('photo_series_images')
        .select('*')
        .eq('series_id', params.id)
        .order('order_idx')

      setWork({ 
        type: 'series', 
        data: seriesData,
        images: imagesData || []
      })
      loadLikeCount('series')
      loadComments('series')
      setLoading(false)
      return
    }

    // 都没找到
    toast.error('作品不存在')
    router.push('/gallery')
    setLoading(false)
  }

  const loadLikeCount = async (type: 'single' | 'series') => {
    const table = type === 'single' ? 'likes' : 'photo_series_likes'
    const column = type === 'single' ? 'photo_id' : 'series_id'
    
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(column, params.id)
    
    setLikeCount(count || 0)
  }

  const checkIfLiked = async () => {
    if (!user || !work) return
    
    const table = work.type === 'single' ? 'likes' : 'photo_series_likes'
    const column = work.type === 'single' ? 'photo_id' : 'series_id'
    
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq(column, params.id)
      .eq('user_id', user.id)
      .maybeSingle()
    
    setIsLiked(!!data)
  }

  const loadComments = async (type: 'single' | 'series') => {
    const table = type === 'single' ? 'comments' : 'photo_series_comments'
    const column = type === 'single' ? 'photo_id' : 'series_id'
    
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq(column, params.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (data) {
      const commentsWithProfiles = await Promise.all(
        data.map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', comment.user_id)
            .single()
          
          return {
            ...comment,
            profiles: profile
          }
        })
      )
      setComments(commentsWithProfiles)
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast.error('请先登录')
      router.push('/login')
      return
    }

    if (!work) return

    try {
      const table = work.type === 'single' ? 'likes' : 'photo_series_likes'
      const column = work.type === 'single' ? 'photo_id' : 'series_id'

      if (isLiked) {
        await supabase
          .from(table)
          .delete()
          .eq(column, params.id)
          .eq('user_id', user.id)
        
        setIsLiked(false)
        setLikeCount(prev => prev - 1)
        toast.success('已取消点赞')
      } else {
        await supabase
          .from(table)
          .insert({
            [column]: params.id as string,
            user_id: user.id,
          })
        
        setIsLiked(true)
        setLikeCount(prev => prev + 1)
        toast.success('点赞成功')
      }
    } catch (error: any) {
      console.error('点赞错误:', error)
      toast.error('操作失败，请重试')
    }
  }

  const handleDelete = async () => {
    if (!work) return
    
    const workTypeText = work.type === 'single' ? '作品' : '组照'
    if (!confirm(`确定要删除这个${workTypeText}吗？此操作无法撤销。`)) {
      return
    }

    try {
      // 收集需要删除的图片路径
      const filesToDelete: string[] = []
      
      // 辅助函数：从完整 URL 提取存储路径
      const extractStoragePath = (url: string): string | null => {
        if (!url) return null
        
        // Supabase Storage URL 格式示例:
        // https://xxx.supabase.co/storage/v1/object/public/photos/user-id/timestamp.jpg
        const match = url.match(/\/photos\/(.+)$/)
        return match ? match[1] : null
      }
      
      if (work.type === 'single') {
        const photo = work.data as Photo
        
        const imagePath = extractStoragePath(photo.image_url)
        if (imagePath) filesToDelete.push(imagePath)
        
        const thumbnailPath = extractStoragePath(photo.thumbnail_url || '')
        if (thumbnailPath && thumbnailPath !== imagePath) {
          filesToDelete.push(thumbnailPath)
        }
      } else {
        // 组照：删除封面和所有图片
        const series = work.data as PhotoSeries
        
        const coverPath = extractStoragePath(series.cover_image_url)
        if (coverPath) filesToDelete.push(coverPath)
        
        // 删除组照中的所有图片
        if (work.images) {
          for (const img of work.images) {
            const imgPath = extractStoragePath(img.image_url)
            if (imgPath) filesToDelete.push(imgPath)
            
            const thumbPath = extractStoragePath(img.thumbnail_url || '')
            if (thumbPath && thumbPath !== imgPath) {
              filesToDelete.push(thumbPath)
            }
          }
        }
      }
      
      console.log('准备删除的文件:', filesToDelete)
      
      // 从 Storage 删除文件
      if (filesToDelete.length > 0) {
        const { data: deleteData, error: storageError } = await supabase.storage
          .from('photos')
          .remove(filesToDelete)
        
        if (storageError) {
          console.error('删除存储文件错误:', storageError)
          // 继续执行数据库删除，即使文件删除失败
        } else {
          console.log('存储文件删除成功:', deleteData)
        }
      }
      
      // 软删除数据库记录
      const table = work.type === 'single' ? 'photos' : 'photo_series'
      
      const { error } = await supabase
        .from(table)
        .update({ is_deleted: true })
        .eq('id', params.id)

      if (error) throw error

      toast.success('删除成功')
      router.push('/my-photos')
    } catch (error: any) {
      console.error('删除错误:', error)
      toast.error('删除失败，请重试')
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('请先登录')
      router.push('/login')
      return
    }

    if (!newComment.trim() || !work) return

    setSubmittingComment(true)

    try {
      const table = work.type === 'single' ? 'comments' : 'photo_series_comments'
      const column = work.type === 'single' ? 'photo_id' : 'series_id'
      
      const { error } = await supabase
        .from(table)
        .insert({
          [column]: params.id as string,
          user_id: user.id,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      toast.success('评论成功')
      loadComments(work.type)
    } catch (error: any) {
      console.error('评论错误:', error)
      toast.error('评论失败，请重试')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) {
      return
    }

    if (!work) return

    try {
      const table = work.type === 'single' ? 'comments' : 'photo_series_comments'
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', commentId)

      if (error) throw error

      toast.success('评论已删除')
      loadComments(work.type)
    } catch (error: any) {
      console.error('删除评论错误:', error)
      toast.error('删除失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!work) {
    return null
  }

  const isOwner = user && work.data.user_id === user.id
  const isAdmin = profile?.role === 'admin'
  const canDelete = isOwner || isAdmin

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 图片展示区域 */}
        <div className="space-y-4">
          {work.type === 'single' ? (
            // 单幅作品
            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src={(work.data as Photo).image_url}
                alt={work.data.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            // 组照 - 轮播展示
            <div className="space-y-4">
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden bg-gray-100">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={work.images![currentImageIndex].image_url}
                      alt={`${work.data.title} - 图 ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                      priority={currentImageIndex === 0}
                    />
                  </motion.div>
                </AnimatePresence>
                
                {/* 轮播控制 */}
                {work.images!.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? work.images!.length - 1 : prev - 1
                      )}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === work.images!.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                    >
                      →
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {work.images!.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* 缩略图导航 */}
              {work.images!.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {work.images!.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={clsx(
                        "aspect-square relative rounded-lg overflow-hidden transition-all",
                        currentImageIndex === index 
                          ? "ring-2 ring-blue-500 scale-95" 
                          : "opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image
                        src={img.thumbnail_url || img.image_url}
                        alt={`缩略图 ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 信息展示区域 */}
        <div className="space-y-8">
          {/* 标题和操作 */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{work.data.title}</h1>
                  {work.type === 'series' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      组照 {work.images!.length}张
                    </span>
                  )}
                </div>
                <p className="text-gray-600">
                  作者: {work.data.author_name}
                </p>
              </div>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title={isAdmin && !isOwner ? '管理员删除' : '删除作品'}
                >
                  删除
                </button>
              )}
            </div>

            {work.data.description && (
              <p className="text-gray-700 leading-relaxed">{work.data.description}</p>
            )}

            <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
              <span>发布于 {new Date(work.data.created_at).toLocaleString('zh-CN')}</span>
            </div>
          </div>

          {/* 点赞按钮 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={clsx(
                "flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all",
                isLiked
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
              <span>{likeCount} 人点赞</span>
            </button>
          </div>

          {/* 评论区 */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-bold mb-6">评论 ({comments.length})</h2>

            {/* 评论表单 */}
            {user ? (
              <form onSubmit={handleSubmitComment} className="mb-8">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写下你的评论..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? '发送中...' : '发送评论'}
                </button>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">
                  请 <button onClick={() => router.push('/login')} className="text-blue-600 hover:underline">登录</button> 后评论
                </p>
              </div>
            )}

            {/* 评论列表 */}
            <div className="space-y-6">
              {comments.map((comment) => {
                const isCommentOwner = user && comment.user_id === user.id
                const canDeleteComment = isCommentOwner || isAdmin

                return (
                  <div key={comment.id} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {comment.profiles?.avatar_url ? (
                        <Image
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles?.username || '用户'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-gray-600">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {comment.profiles?.username || '匿名用户'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleString('zh-CN')}
                        </span>
                        {canDeleteComment && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="ml-auto text-sm text-red-600 hover:text-red-700 hover:underline"
                            title={isAdmin && !isCommentOwner ? '管理员删除' : '删除评论'}
                          >
                            删除
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                )
              })}

              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-8">暂无评论，快来抢沙发吧！</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
