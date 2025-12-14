'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage() {
  const { user } = useAuthStore()
  const router = useRouter()

  const handleJoinContest = () => {
    if (user) {
      router.push('/upload')
    } else {
      router.push('/register')
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-white opacity-70"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
              一帧画面，<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                一份思考
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              2025年冬季“镜观交通”摄影大赛现已开启。
              <br />
              定格流动瞬间，珍藏城市脉搏。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleJoinContest}
                className="px-8 py-4 bg-foreground text-white font-medium rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-200"
              >
                立即参赛
              </button>
              <Link
                href="/contest/introduction"
                className="px-8 py-4 bg-white text-foreground border border-gray-200 font-medium rounded-full hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
              >
                活动详情
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              { icon: "📸", title: "多种分类", desc: "交通之美、交通之困、交通之变" },
              { icon: "👍", title: "共享社区", desc: "所有访客都可以为喜欢的作品点赞，让优秀作品获得更多关注" },
              { icon: "🏆", title: "专业评审", desc: "多维度评选，确保比赛的公平公正及趣味性" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
              >
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-secondary leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">活动日程</h2>
          <div className="relative">
            {/* Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
            
            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {[
                { date: "12.15 - 01.18", title: "作品征集", color: "bg-blue-500" },
                { date: "12.15 - 01.23", title: "公众投票", color: "bg-green-500" },
                { date: "01.23 - 01.29", title: "评委评审", color: "bg-purple-500" },
                { date: "02.01", title: "结果公布", color: "bg-red-500" },
                { date: "后续主题赛事", title: "春节特别档，敬请期待！", color: "bg-red-500"}
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center md:text-left relative group hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className={`w-3 h-3 rounded-full ${item.color} mb-4 mx-auto md:mx-0`}></div>
                  <div className="text-2xl font-bold text-foreground mb-1 font-mono tracking-tight">
                    {item.date}
                  </div>
                  <p className="text-secondary font-medium">{item.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 to-black opacity-50"></div>
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">准备好展示你的作品了吗？</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            定格瞬间，关照现实，心向未来，共同见证交通变迁与城市脉动。
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
          >
            开始参赛
          </Link>
        </div>
      </section>
    </div>
  )
}
