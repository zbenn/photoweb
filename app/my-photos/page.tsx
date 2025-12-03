'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Photo } from '@/types/database'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

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
    if (!confirm('确定要删除这张作品吗？')) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">我的作品</h1>
        <Link
          href="/upload"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          上传新作品
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">你还没有上传任何作品</p>
          <Link
            href="/upload"
            className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          >
            上传第一张作品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Link href={`/photo/${photo.id}`} className="block">
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <Image
                    src={photo.thumbnail_url || photo.image_url}
                    alt={photo.title}
                    fill
                    className="object-cover hover:scale-110 transition duration-300"
                  />
                </div>
              </Link>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate mb-2">
                  {photo.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>👍 {photo.like_count || 0}</span>
                  <span>💬 {photo.comment_count || 0}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    photo.status === 'public' ? 'bg-green-100 text-green-800' :
                    photo.status === 'hidden' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {photo.status === 'public' ? '公开' :
                     photo.status === 'hidden' ? '隐藏' : '已屏蔽'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/photo/${photo.id}`}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 text-center"
                  >
                    查看详情
                  </Link>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
