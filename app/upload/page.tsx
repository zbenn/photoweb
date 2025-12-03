'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Category } from '@/types/database'
import toast from 'react-hot-toast'
import imageCompression from 'browser-image-compression'

export default function UploadPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [uploadCount, setUploadCount] = useState(0)
  const [contest, setContest] = useState<any>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    file: null as File | null,
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    loadCategories()
    loadContest()
    checkUploadCount()
  }, [user])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('order_idx')
    
    if (data) setCategories(data)
  }

  const loadContest = async () => {
    const { data } = await supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (data) setContest(data)
  }

  const checkUploadCount = async () => {
    if (!user) return
    
    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_deleted', false)
    
    setUploadCount(count || 0)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 检查文件大小 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('图片大小不能超过 20MB')
      return
    }

    setFormData({ ...formData, file })
    
    // 预览
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !profile) {
      toast.error('请先登录')
      return
    }

    if (!formData.file) {
      toast.error('请选择图片')
      return
    }

    if (!contest) {
      toast.error('当前没有活动')
      return
    }

    // 检查上传数量限制
    if (uploadCount >= contest.max_photos_per_user) {
      toast.error(`最多只能上传 ${contest.max_photos_per_user} 张作品`)
      return
    }

    // 检查活动时间
    const now = new Date()
    const uploadStart = new Date(contest.upload_start_at)
    const uploadEnd = new Date(contest.upload_end_at)

    if (now < uploadStart) {
      toast.error('上传活动还未开始')
      return
    }

    if (now > uploadEnd) {
      toast.error('上传活动已结束')
      return
    }

    setLoading(true)

    try {
      // 1. 压缩图片
      toast.loading('正在压缩图片...')
      const compressedFile = await imageCompression(formData.file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })

      // 2. 上传到 Supabase Storage
      const fileExt = formData.file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      toast.loading('正在上传图片...')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, compressedFile)

      if (uploadError) throw uploadError

      // 3. 获取图片 URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      // 4. 保存作品信息到数据库
      const { data: photo, error: dbError } = await supabase
        .from('photos')
        .insert({
          contest_id: contest.id,
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          author_name: profile.username,
          image_url: publicUrl,
          thumbnail_url: publicUrl,
          file_size: compressedFile.size,
          status: 'public',
        })
        .select()
        .single()

      if (dbError) throw dbError

      // 5. 关联分类
      if (formData.categoryId) {
        await supabase
          .from('photo_categories')
          .insert({
            photo_id: photo.id,
            category_id: parseInt(formData.categoryId),
          })
      }

      toast.dismiss()
      toast.success('上传成功！')
      router.push('/my-photos')
    } catch (error: any) {
      console.error('上传错误:', error)
      toast.dismiss()
      toast.error(error.message || '上传失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">上传作品</h1>

        {contest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📅 活动: {contest.name} | 
              已上传: {uploadCount}/{contest.max_photos_per_user} 张
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择图片 *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {preview && (
              <div className="mt-4">
                <img
                  src={preview}
                  alt="预览"
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
              </div>
            )}
          </div>

          {/* 标题 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              作品标题 *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="给你的作品起个名字"
            />
          </div>

          {/* 描述 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              作品描述
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="介绍一下你的作品..."
            />
          </div>

          {/* 分类 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              作品分类 *
            </label>
            <select
              id="category"
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '上传中...' : '提交作品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
