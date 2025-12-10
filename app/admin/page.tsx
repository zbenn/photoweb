'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useAuthStore()

  useEffect(() => {
    if (!profile) return
    
    if (profile.role !== 'admin') {
      toast.error('仅管理员可以访问此页面')
      router.push('/')
    }
  }, [profile, router])

  if (!profile || profile.role !== 'admin') {
    return null
  }

  const adminFeatures = [
    {
      title: '数据导出',
      description: '导出所有作品信息，包括参赛者真实信息、评委打分、点赞数等',
      href: '/admin/export',
      icon: '📊',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: '用户管理',
      description: '查看和管理所有用户，设置用户角色',
      href: '/admin/users',
      icon: '👥',
      color: 'from-purple-500 to-purple-600',
      comingSoon: true
    },
    {
      title: '作品审核',
      description: '审核用户上传的作品，管理违规内容\n',
      href: '/admin/photos',
      icon: '🖼️',
      color: 'from-green-500 to-green-600',
      comingSoon: true
    },
    {
      title: '活动管理',
      description: '创建、编辑和管理摄影大赛活动\n',
      href: '/admin/contests',
      icon: '🏆',
      color: 'from-orange-500 to-orange-600',
      comingSoon: true
    },
    {
      title: '分类管理',
      description: '管理作品分类，添加或修改分类信息\n',
      href: '/admin/categories',
      icon: '📁',
      color: 'from-pink-500 to-pink-600',
      comingSoon: true
    },
    {
      title: '系统统计',
      description: '查看网站统计数据，包括用户数、作品数等',
      href: '/admin/statistics',
      icon: '📈',
      color: 'from-indigo-500 to-indigo-600',
      comingSoon: true
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理后台</h1>
        <p className="text-gray-600">欢迎回来，{profile.username}。这里是网站管理中心。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature, index) => (
          <div key={index} className="relative">
            {feature.comingSoon ? (
              <div className="bg-white rounded-xl shadow-md p-6 opacity-60 cursor-not-allowed">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {feature.description}
                </p>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  即将推出
                </span>
              </div>
            ) : (
              <Link
                href={feature.href}
                className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 提示</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• 当前可用功能：数据导出</li>
          <li>• 其他管理功能正在开发中，敬请期待</li>
          <li>• 如需帮助或有建议，请联系技术支持团队</li>
        </ul>
      </div>
    </div>
  )
}
