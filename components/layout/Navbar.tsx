'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center text-xl font-bold text-gray-900">
              📸 摄影大赛
            </Link>
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/gallery"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/gallery'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                作品展示
              </Link>
              {user && (
                <>
                  <Link
                    href="/upload"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/upload'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    上传作品
                  </Link>
                  <Link
                    href="/my-photos"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/my-photos'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    我的作品
                  </Link>
                  {profile?.role === 'judge' && (
                    <Link
                      href="/judge"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === '/judge'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-700 hover:bg-purple-50'
                      }`}
                    >
                      评委打分
                    </Link>
                  )}
                  {profile?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        pathname.startsWith('/admin')
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      管理后台
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  你好, <span className="font-medium">{profile?.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
