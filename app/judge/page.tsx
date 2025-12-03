'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Photo } from '@/types/database'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function JudgePage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useAuthStore()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [score, setScore] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [myScores, setMyScores] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!user || profile?.role !== 'judge') {
      toast.error('你没有权限访问此页面')
      router.push('/')
      return
    }
    
    loadPhotos()
    loadMyScores()
  }, [user, profile])

  const loadPhotos = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('status', 'public')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('加载作品错误:', error)
      toast.error('加载作品失败')
    } else if (data) {
      setPhotos(data)
    }
    
    setLoading(false)
  }

  const loadMyScores = async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('judge_scores')
      .select('photo_id, score')
      .eq('judge_id', user.id)

    if (data) {
      const scoresMap: Record<string, number> = {}
      data.forEach(item => {
        scoresMap[item.photo_id] = item.score
      })
      setMyScores(scoresMap)
    }
  }

  const handleOpenScoreModal = (photo: Photo) => {
    setSelectedPhoto(photo)
    const existingScore = myScores[photo.id]
    setScore(existingScore ? existingScore.toString() : '')
    setComment('')
  }

  const handleSubmitScore = async () => {
    if (!user || !selectedPhoto) return

    const scoreNum = parseFloat(score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error('请输入 0-100 之间的分数')
      return
    }

    setSubmitting(true)

    try {
      // 获取当前活动
      const { data: contest } = await supabase
        .from('contests')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!contest) {
        toast.error('未找到活动')
        return
      }

      // 检查是否已经打过分
      const { data: existing } = await supabase
        .from('judge_scores')
        .select('id')
        .eq('photo_id', selectedPhoto.id)
        .eq('judge_id', user.id)
        .single()

      if (existing) {
        // 更新分数
        const { error } = await supabase
          .from('judge_scores')
          .update({
            score: scoreNum,
            comment: comment.trim() || null,
          })
          .eq('id', existing.id)

        if (error) throw error
        toast.success('分数已更新')
      } else {
        // 插入新分数
        const { error } = await supabase
          .from('judge_scores')
          .insert({
            contest_id: contest.id,
            photo_id: selectedPhoto.id,
            judge_id: user.id,
            score: scoreNum,
            comment: comment.trim() || null,
          })

        if (error) throw error
        toast.success('打分成功')
      }

      setMyScores({ ...myScores, [selectedPhoto.id]: scoreNum })
      setSelectedPhoto(null)
      setScore('')
      setComment('')
    } catch (error: any) {
      console.error('打分错误:', error)
      toast.error('打分失败: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || profile?.role !== 'judge') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">评委打分</h1>
        <p className="text-gray-600">为参赛作品打分 (0-100分)</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">暂无作品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => {
            const hasScored = myScores[photo.id] !== undefined
            return (
              <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <Image
                    src={photo.thumbnail_url || photo.image_url}
                    alt={photo.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate mb-1">
                    {photo.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    作者: {photo.author_name}
                  </p>
                  {hasScored ? (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        已打分: {myScores[photo.id]} 分
                      </span>
                    </div>
                  ) : null}
                  <button
                    onClick={() => handleOpenScoreModal(photo)}
                    className={`w-full py-2 px-4 rounded-md font-medium ${
                      hasScored
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {hasScored ? '修改分数' : '开始打分'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 打分弹窗 */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                为作品打分
              </h2>
              
              <div className="mb-6">
                <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={selectedPhoto.image_url}
                    alt={selectedPhoto.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{selectedPhoto.title}</h3>
                <p className="text-gray-600 mb-2">作者: {selectedPhoto.author_name}</p>
                {selectedPhoto.description && (
                  <p className="text-gray-700">{selectedPhoto.description}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分数 (0-100) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入分数"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    评语 (可选)
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="写下你对这个作品的评价..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedPhoto(null)
                    setScore('')
                    setComment('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitScore}
                  disabled={submitting || !score}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '提交'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
