'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Photo, Comment } from '@/types/database'
import Image from 'next/image'
import toast from 'react-hot-toast'

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* 左侧: 图片 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={photo.image_url}
                alt={photo.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* 右侧: 信息和评论 */}
        <div className="space-y-6">
          {/* 作品信息 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {photo.title}
            </h1>
            
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold">
                {photo.author_name[0].toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">{photo.author_name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(photo.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>

            {photo.description && (
              <p className="text-gray-700 mb-4">{photo.description}</p>
            )}

            {/* 点赞按钮 */}
            <button
              onClick={handleLike}
              className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                isLiked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isLiked ? '❤️' : '🤍'} {likeCount} 人点赞
            </button>
          </div>

          {/* 评论区 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingComment ? '发送中...' : '发送评论'}
                </button>
              </form>
            ) : (
              <div className="mb-6 text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2">登录后才能评论</p>
                <button
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  立即登录
                </button>
              </div>
            )}

            {/* 评论列表 */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-4">暂无评论</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">
                          {comment.profiles?.username || '匿名用户'}
                        </p>
                        <p className="text-gray-700 mt-1">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
