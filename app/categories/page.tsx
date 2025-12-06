'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types/database'

export default function CategoriesIntroPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('order_idx')
    
    if (data) setCategories(data)
  }

  const categoryIcons: Record<string, string> = {
    'beauty': '🌟',
    'difficulty': '⚠️',
    'change': '🔄'
  }

  const categoryColors: Record<string, string> = {
    'beauty': 'from-blue-500 to-cyan-500',
    'difficulty': 'from-orange-500 to-red-500',
    'change': 'from-green-500 to-emerald-500'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">参赛分类</h1>
        <p className="text-xl text-gray-600">
          选择一个分类，用镜头讲述交通故事
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
          >
            <div className={`bg-gradient-to-br ${categoryColors[category.slug]} p-8 text-white text-center`}>
              <div className="text-6xl mb-4">{categoryIcons[category.slug]}</div>
              <h2 className="text-3xl font-bold">{category.name}</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                {category.description || '暂无描述'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">参赛提示</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>每位参赛者最多可提交 5 张作品</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>每张作品只能选择一个分类</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>作品需与所选分类主题相符</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>鼓励原创作品，展现独特视角</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
