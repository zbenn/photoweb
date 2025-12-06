'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Photo, Comment } from '@/types/database'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function PhotoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    loadPhoto()
    loadComments()
    if (user) {
      checkIfLiked()
    }
    
    // 订阅实时更新
    const channel = supabase
      .channel(`photo-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `photo_id=eq.${params.id}`,
        },
        () => {
          loadLikeCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `photo_id=eq.${params.id}`,
        },
        () => {
          loadComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id, user])

  const loadPhoto = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .maybeSingle()

    if (data) {
      setPhoto(data)
      loadLikeCount()
    } else if (error) {
      console.error('加载作品错误:', error)
      toast.error('加载作品失败: ' + error.message)
      router.push('/gallery')
    } else {
      toast.error('作品不存在')
      router.push('/gallery')
    }
    
    setLoading(false)
  }

  const loadLikeCount = async () => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('photo_id', params.id)
    
    setLikeCount(count || 0)
  }

  const checkIfLiked = async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('photo_id', params.id)
      .eq('user_id', user.id)
      .single()
    
    setIsLiked(!!data)
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('photo_id', params.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (data) {
      // 获取每个评论的用户信息
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

    try {
      if (isLiked) {
        // 取消点赞
        await supabase
          .from('likes')
          .delete()
          .eq('photo_id', params.id)
          .eq('user_id', user.id)
        
        setIsLiked(false)
        toast.success('已取消点赞')
      } else {
        // 点赞
        await supabase
          .from('likes')
          .insert({
            photo_id: params.id as string,
            user_id: user.id,
          })
        
        setIsLiked(true)
        toast.success('点赞成功')
      }
    } catch (error: any) {
      console.error('点赞错误:', error)
      toast.error('操作失败，请重试')
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这张作品吗？此操作无法撤销。')) {
      return
    }

    try {
      const { error } = await supabase
        .from('photos')
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

    if (!newComment.trim()) {
      toast.error('请输入评论内容')
      return
    }

    setSubmittingComment(true)

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          photo_id: params.id as string,
          user_id: user.id,
          content: newComment.trim(),
        })

      if (error) throw error

      toast.success('评论成功')
      setNewComment('')
      loadComments()
    } catch (error: any) {
      console.error('评论错误:', error)
      toast.error('评论失败，请重试')
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!photo) {
    return null
  }

  const isOwner = user?.id === photo.user_id

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* 左侧: 图片 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="relative aspect-video bg-gray-50">
              <Image
                src={photo.image_url}
                alt={photo.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </motion.div>

        {/* 右侧: 信息和评论 */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* 作品信息 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-foreground">
                {photo.title}
              </h1>
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-600 text-sm font-medium px-3 py-1 rounded-full hover:bg-red-50 transition-colors"
                >
                  删除作品
                </button>
              )}
            </div>
            
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                {photo.author_name[0].toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="font-medium text-foreground">{photo.author_name}</p>
                <p className="text-sm text-secondary">
                  {new Date(photo.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>

            {photo.description && (
              <p className="text-secondary mb-6 leading-relaxed">{photo.description}</p>
            )}

            {/* 点赞按钮 */}
            <button
              onClick={handleLike}
              className={clsx(
                "w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2",
                isLiked
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-gray-50 text-foreground hover:bg-gray-100 border border-gray-200"
              )}
            >
              <span className={isLiked ? "scale-110" : ""}>{isLiked ? '❤️' : '🤍'}</span>
              <span>{likeCount} 人点赞</span>
            </button>
          </div>

          {/* 评论区 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-foreground mb-4">
              评论 ({comments.length})
            </h2>

            {/* 评论表单 */}
            {user ? (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写下你的评论..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all mb-3 resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="w-full py-2.5 px-4 bg-foreground text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? '发送中...' : '发送评论'}
                </button>
              </form>
            ) : (
              <div className="mb-6 text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-secondary mb-3">登录后才能评论</p>
                <button
                  onClick={() => router.push('/login')}
                  className="text-accent hover:text-accent-hover font-medium"
                >
                  立即登录
                </button>
              </div>
            )}

            {/* 评论列表 */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {comments.length === 0 ? (
                <p className="text-center text-secondary py-4">暂无评论</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold flex-shrink-0">
                        {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-baseline">
                          <p className="font-medium text-foreground text-sm">
                            {comment.profiles?.username || '匿名用户'}
                          </p>
                          <span className="text-xs text-secondary">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-secondary mt-1 text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
