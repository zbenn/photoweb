'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Category } from '@/types/database'
import toast from 'react-hot-toast'
import imageCompression from 'browser-image-compression'
import Image from 'next/image'

type UploadType = 'single' | 'series'

interface SeriesFile {
  file: File
  preview: string
  id: string
}

export default function UploadPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [uploadCount, setUploadCount] = useState(0)
  const [contest, setContest] = useState<any>(null)
  const [uploadType, setUploadType] = useState<UploadType>('single')
  
  // 单幅作品
  const [singlePreview, setSinglePreview] = useState<string | null>(null)
  const [singleFormData, setSingleFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    file: null as File | null,
  })

  // 组照作品
  const [seriesFiles, setSeriesFiles] = useState<SeriesFile[]>([])
  const [seriesFormData, setSeriesFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
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
    
    // 单幅作品数量
    const { count: photoCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'single')
      .eq('is_deleted', false)
    
    // 组照数量
    const { count: seriesCount } = await supabase
      .from('photo_series')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_deleted', false)
    
    setUploadCount((photoCount || 0) + (seriesCount || 0))
  }

  // 单幅作品上传
  const handleSingleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('图片大小不能超过 20MB')
      return
    }

    setSingleFormData({ ...singleFormData, file })
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setSinglePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 组照文件选择
  const handleSeriesFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length < 4) {
      toast.error('组照至少需要 4 张图片')
      return
    }
    
    if (files.length > 6) {
      toast.error('组照最多 6 张图片')
      return
    }

    // 检查所有文件
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('请只选择图片文件')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`图片 ${file.name} 大小超过 20MB`)
        return
      }
    }

    // 生成预览
    const seriesFilesWithPreview: SeriesFile[] = []
    for (const file of files) {
      const reader = new FileReader()
      const preview = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      seriesFilesWithPreview.push({
        file,
        preview,
        id: Math.random().toString(36).substring(7)
      })
    }
    
    setSeriesFiles(seriesFilesWithPreview)
  }

  // 删除组照中的某张图片
  const removeSeriesImage = (id: string) => {
    setSeriesFiles(seriesFiles.filter(f => f.id !== id))
  }

  // 调整组照图片顺序
  const moveSeriesImage = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...seriesFiles]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newFiles.length) return
    
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]]
    setSeriesFiles(newFiles)
  }

  // 提交单幅作品
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !profile) {
      toast.error('请先登录')
      return
    }

    if (!singleFormData.file) {
      toast.error('请选择图片')
      return
    }

    if (!contest) {
      toast.error('当前没有活动')
      return
    }

    if (uploadCount >= contest.max_photos_per_user) {
      toast.error(`最多只能上传 ${contest.max_photos_per_user} 组作品（单幅或组照各算1组）`)
      return
    }

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
      let fileToUpload = singleFormData.file

      // 智能压缩
      if (singleFormData.file.size > 20 * 1024 * 1024) {
        toast.loading('图片过大，正在压缩...')
        fileToUpload = await imageCompression(singleFormData.file, {
          maxSizeMB: 20,
          maxWidthOrHeight: 4096,
          useWebWorker: true,
        })
      } else if (singleFormData.file.size > 5 * 1024 * 1024) {
        toast.loading('正在优化图片...')
        fileToUpload = await imageCompression(singleFormData.file, {
          maxSizeMB: 10,
          maxWidthOrHeight: 3840,
          useWebWorker: true,
        })
      }

      // 上传到 Supabase Storage
      const fileExt = singleFormData.file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      toast.loading('正在上传图片...')
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, fileToUpload)

      if (uploadError) throw uploadError

      // 获取图片 URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      // 保存作品信息到数据库
      const { data: photo, error: dbError } = await supabase
        .from('photos')
        .insert({
          contest_id: contest.id,
          user_id: user.id,
          title: singleFormData.title,
          description: singleFormData.description,
          author_name: profile.username,
          image_url: publicUrl,
          thumbnail_url: publicUrl,
          file_size: fileToUpload.size,
          type: 'single',
          status: 'public',
        })
        .select()
        .single()

      if (dbError) throw dbError

      // 关联分类
      if (singleFormData.categoryId) {
        await supabase
          .from('photo_categories')
          .insert({
            photo_id: photo.id,
            category_id: parseInt(singleFormData.categoryId),
          })
      }

      toast.dismiss()
      toast.success('单幅作品上传成功！')
      router.push('/my-photos')
    } catch (error: any) {
      console.error('上传错误:', error)
      toast.dismiss()
      toast.error(error.message || '上传失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 提交组照作品
  const handleSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !profile) {
      toast.error('请先登录')
      return
    }

    if (seriesFiles.length < 4 || seriesFiles.length > 6) {
      toast.error('组照需要 4-6 张图片')
      return
    }

    if (!contest) {
      toast.error('当前没有活动')
      return
    }

    if (uploadCount >= contest.max_photos_per_user) {
      toast.error(`最多只能上传 ${contest.max_photos_per_user} 组作品（单幅或组照各算1组）`)
      return
    }

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
      toast.loading(`正在上传组照 (0/${seriesFiles.length})...`)

      // 上传所有图片
      const uploadedImages = []
      for (let i = 0; i < seriesFiles.length; i++) {
        const seriesFile = seriesFiles[i]
        let fileToUpload = seriesFile.file

        // 智能压缩
        if (seriesFile.file.size > 5 * 1024 * 1024) {
          fileToUpload = await imageCompression(seriesFile.file, {
            maxSizeMB: 10,
            maxWidthOrHeight: 3840,
            useWebWorker: true,
          })
        }

        const fileExt = seriesFile.file.name.split('.').pop()
        const fileName = `${user.id}/series/${Date.now()}_${i}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, fileToUpload)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName)

        uploadedImages.push({
          image_url: publicUrl,
          thumbnail_url: publicUrl,
          file_size: fileToUpload.size,
          order_idx: i
        })

        toast.loading(`正在上传组照 (${i + 1}/${seriesFiles.length})...`)
      }

      // 创建组照记录
      console.log('准备创建组照记录:', {
        contest_id: contest.id,
        user_id: user.id,
        title: seriesFormData.title,
        image_count: uploadedImages.length,
      })
      
      const { data: photoSeries, error: seriesError } = await supabase
        .from('photo_series')
        .insert({
          contest_id: contest.id,
          user_id: user.id,
          title: seriesFormData.title,
          description: seriesFormData.description,
          author_name: profile.username,
          cover_image_url: uploadedImages[0].image_url,
          image_count: uploadedImages.length,
          status: 'public',
        })
        .select()
        .single()

      console.log('组照记录创建结果:', { photoSeries, seriesError })
      if (seriesError) {
        console.error('创建组照记录失败:', seriesError)
        throw seriesError
      }

      // 保存组照中的所有图片
      console.log('准备保存组照图片:', uploadedImages.length, '张')
      const { error: imagesError } = await supabase
        .from('photo_series_images')
        .insert(
          uploadedImages.map(img => ({
            series_id: photoSeries.id,
            ...img
          }))
        )

      console.log('组照图片保存结果:', { imagesError })
      if (imagesError) {
        console.error('保存组照图片失败:', imagesError)
        throw imagesError
      }

      // 关联分类
      if (seriesFormData.categoryId) {
        await supabase
          .from('photo_series_categories')
          .insert({
            series_id: photoSeries.id,
            category_id: parseInt(seriesFormData.categoryId),
          })
      }

      toast.dismiss()
      toast.success('组照上传成功！')
      router.push('/my-photos')
    } catch (error: any) {
      console.error('上传组照错误:', error)
      console.error('错误详情:', JSON.stringify(error, null, 2))
      toast.dismiss()
      toast.error(error.message || '上传失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">上传作品</h1>
        <p className="text-gray-600">
          已上传 {uploadCount} / {contest?.max_photos_per_user || 5} 组作品
          <span className="text-sm ml-2">(单幅和组照各算1组)</span>
        </p>
      </div>

      {/* 作品类型选择 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          作品类型
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setUploadType('single')}
            className={`p-4 rounded-lg border-2 transition-all ${
              uploadType === 'single'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">🖼️</div>
            <div className="font-semibold">单幅作品</div>
            <div className="text-sm text-gray-500 mt-1">上传 1 张图片</div>
          </button>
          <button
            type="button"
            onClick={() => setUploadType('series')}
            className={`p-4 rounded-lg border-2 transition-all ${
              uploadType === 'series'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">📚</div>
            <div className="font-semibold">组照作品</div>
            <div className="text-sm text-gray-500 mt-1">上传 4-6 张图片</div>
          </button>
        </div>
      </div>

      {/* 单幅作品表单 */}
      {uploadType === 'single' && (
        <form onSubmit={handleSingleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作品标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={singleFormData.title}
              onChange={(e) => setSingleFormData({ ...singleFormData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入作品标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作品描述
            </label>
            <textarea
              value={singleFormData.description}
              onChange={(e) => setSingleFormData({ ...singleFormData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请描述作品的创作背景、理念等（选填）"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作品分类 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={singleFormData.categoryId}
              onChange={(e) => setSingleFormData({ ...singleFormData, categoryId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择分类</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择图片 <span className="text-red-500">*</span>
              <span className="text-sm text-gray-500 ml-2">(最大 20MB)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSingleFileChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {singlePreview && (
              <div className="mt-4">
                <Image
                  src={singlePreview}
                  alt="预览"
                  width={800}
                  height={600}
                  className="w-full rounded-lg"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploadCount >= (contest?.max_photos_per_user || 5)}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '上传中...' : '提交单幅作品'}
          </button>
        </form>
      )}

      {/* 组照作品表单 */}
      {uploadType === 'series' && (
        <form onSubmit={handleSeriesSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              组照标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={seriesFormData.title}
              onChange={(e) => setSeriesFormData({ ...seriesFormData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入组照标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              组照描述
            </label>
            <textarea
              value={seriesFormData.description}
              onChange={(e) => setSeriesFormData({ ...seriesFormData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请描述组照的主题、创作背景等（选填）"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作品分类 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={seriesFormData.categoryId}
              onChange={(e) => setSeriesFormData({ ...seriesFormData, categoryId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择分类</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择图片 <span className="text-red-500">*</span>
              <span className="text-sm text-gray-500 ml-2">(4-6 张，每张最大 20MB)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSeriesFilesChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              提示：可以按住 Ctrl (Windows) 或 Cmd (Mac) 键选择多张图片
            </p>
          </div>

          {seriesFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  已选择 {seriesFiles.length} 张图片
                </label>
                <button
                  type="button"
                  onClick={() => setSeriesFiles([])}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  清空所有
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {seriesFiles.map((seriesFile, index) => (
                  <div key={seriesFile.id} className="relative group">
                    <div className="relative aspect-square">
                      <Image
                        src={seriesFile.preview}
                        alt={`图片 ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      #{index + 1}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveSeriesImage(index, 'up')}
                          className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                          title="上移"
                        >
                          ↑
                        </button>
                      )}
                      {index < seriesFiles.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveSeriesImage(index, 'down')}
                          className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                          title="下移"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSeriesImage(seriesFile.id)}
                        className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                        title="删除"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || seriesFiles.length < 4 || seriesFiles.length > 6 || uploadCount >= (contest?.max_photos_per_user || 5)}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '上传中...' : '提交组照作品'}
          </button>
        </form>
      )}
    </div>
  )
}
