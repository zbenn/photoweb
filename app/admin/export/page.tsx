'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface PhotoExportData {
  id: string
  title: string
  description: string
  author_name: string
  real_name: string
  school: string
  branch: string
  category_names: string
  image_url: string
  created_at: string
  avg_judge_score: number
  like_count: number
}

export default function ExportPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<PhotoExportData[]>([])
  const [contests, setContests] = useState<any[]>([])
  const [selectedContest, setSelectedContest] = useState<string>('')

  useEffect(() => {
    if (!profile || profile.role !== 'admin') {
      toast.error('仅管理员可以访问此页面')
      router.push('/')
      return
    }
    
    loadContests()
  }, [profile])

  const loadContests = async () => {
    const { data } = await supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setContests(data)
      if (data.length > 0) {
        setSelectedContest(data[0].id)
      }
    }
  }

  const loadPhotosForExport = async () => {
    if (!selectedContest) {
      toast.error('请选择活动')
      return
    }

    setLoading(true)

    try {
      // 获取作品基本信息
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select(`
          id,
          title,
          description,
          author_name,
          user_id,
          image_url,
          created_at
        `)
        .eq('contest_id', selectedContest)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (photosError) throw photosError

      // 获取所有用户的详细信息
      const userIds = [...new Set(photosData.map(p => p.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, real_name, school, branch')
        .in('id', userIds)

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])

      // 获取分类信息
      const photoIds = photosData.map(p => p.id)
      const { data: photoCategoriesData } = await supabase
        .from('photo_categories')
        .select('photo_id, category_id, categories(name)')
        .in('photo_id', photoIds)

      const categoriesMap = new Map<string, string[]>()
      photoCategoriesData?.forEach(pc => {
        const existing = categoriesMap.get(pc.photo_id) || []
        if (pc.categories) {
          existing.push((pc.categories as any).name)
        }
        categoriesMap.set(pc.photo_id, existing)
      })

      // 获取评委打分
      const { data: scoresData } = await supabase
        .from('judge_scores')
        .select('photo_id, score')
        .in('photo_id', photoIds)

      const scoresMap = new Map<string, number[]>()
      scoresData?.forEach(score => {
        const existing = scoresMap.get(score.photo_id) || []
        existing.push(score.score)
        scoresMap.set(score.photo_id, existing)
      })

      // 获取点赞数
      const { data: likesData } = await supabase
        .from('likes')
        .select('photo_id')
        .in('photo_id', photoIds)

      const likesMap = new Map<string, number>()
      likesData?.forEach(like => {
        likesMap.set(like.photo_id, (likesMap.get(like.photo_id) || 0) + 1)
      })

      // 组合数据
      const exportData: PhotoExportData[] = photosData.map(photo => {
        const userProfile = profilesMap.get(photo.user_id)
        const scores = scoresMap.get(photo.id) || []
        const avgScore = scores.length > 0 
          ? scores.reduce((a, b) => a + b, 0) / scores.length 
          : 0

        return {
          id: photo.id,
          title: photo.title,
          description: photo.description || '',
          author_name: photo.author_name,
          real_name: userProfile?.real_name || '',
          school: userProfile?.school || '',
          branch: userProfile?.branch || '',
          category_names: (categoriesMap.get(photo.id) || []).join(', '),
          image_url: photo.image_url,
          created_at: photo.created_at,
          avg_judge_score: Math.round(avgScore * 100) / 100,
          like_count: likesMap.get(photo.id) || 0,
        }
      })

      setPhotos(exportData)
      toast.success(`已加载 ${exportData.length} 张作品`)
    } catch (error: any) {
      console.error('加载数据错误:', error)
      toast.error(error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (photos.length === 0) {
      toast.error('没有数据可导出')
      return
    }

    // CSV 表头
    const headers = [
      '作品ID',
      '作品标题',
      '作品描述',
      '昵称',
      '真实姓名',
      '学校',
      '团支部/党支部',
      '分类',
      '评委平均分',
      '点赞数',
      '上传时间',
      '图片URL'
    ]

    // CSV 数据行
    const rows = photos.map(photo => [
      photo.id,
      `"${photo.title.replace(/"/g, '""')}"`,
      `"${photo.description.replace(/"/g, '""')}"`,
      `"${photo.author_name}"`,
      `"${photo.real_name}"`,
      `"${photo.school}"`,
      `"${photo.branch}"`,
      `"${photo.category_names}"`,
      photo.avg_judge_score,
      photo.like_count,
      new Date(photo.created_at).toLocaleString('zh-CN'),
      photo.image_url
    ])

    // 生成 CSV 内容
    const csvContent = '\uFEFF' + // UTF-8 BOM for Excel
      [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const contestName = contests.find(c => c.id === selectedContest)?.name || '作品数据'
    link.setAttribute('href', url)
    link.setAttribute('download', `${contestName}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('导出成功！')
  }

  if (!profile || profile.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">数据导出</h1>
        <p className="text-gray-600">导出作品信息，包括参赛者真实信息、评委打分等</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择活动
            </label>
            <select
              value={selectedContest}
              onChange={(e) => setSelectedContest(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {contests.map(contest => (
                <option key={contest.id} value={contest.id}>
                  {contest.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadPhotosForExport}
            disabled={loading || !selectedContest}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '加载中...' : '加载数据'}
          </button>
          <button
            onClick={exportToCSV}
            disabled={photos.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            导出 CSV
          </button>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    昵称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    真实姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学校
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    团支部/党支部
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    评委均分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    点赞数
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {photos.map(photo => (
                  <tr key={photo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{photo.title}</div>
                      <div className="text-sm text-gray-500">{photo.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {photo.author_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {photo.real_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {photo.school || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {photo.branch || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {photo.category_names || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {photo.avg_judge_score > 0 ? photo.avg_judge_score : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {photo.like_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {photos.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">请选择活动并点击"加载数据"按钮</p>
        </div>
      )}
    </div>
  )
}
