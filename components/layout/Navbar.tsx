'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const NavLink = ({ href, children, activeClass = 'text-accent', inactiveClass = 'text-secondary hover:text-foreground' }: { href: string, children: React.ReactNode, activeClass?: string, inactiveClass?: string }) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={clsx(
          "relative px-3 py-2 text-sm font-medium transition-colors duration-200",
          isActive ? activeClass : inactiveClass
        )}
      >
        {children}
        {isActive && (
          <motion.div
            layoutId="navbar-indicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </Link>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center text-xl font-semibold tracking-tight text-foreground">
              <span className="mr-2">📸</span> 摄影大赛
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="/gallery">作品展示</NavLink>
              {user && (
                <>
                  <NavLink href="/upload">上传作品</NavLink>
                  <NavLink href="/my-photos">我的作品</NavLink>
                  {profile?.role === 'judge' && (
                    <NavLink href="/judge" activeClass="text-purple-600">评委打分</NavLink>
                  )}
                  {profile?.role === 'admin' && (
                    <>
                      <NavLink href="/admin">管理后台</NavLink>
                      <NavLink href="/admin/export">数据导出</NavLink>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-secondary hidden sm:inline-block">
                  你好, <span className="font-medium text-foreground">{profile?.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-secondary hover:text-foreground transition-colors"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-secondary hover:text-foreground transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
