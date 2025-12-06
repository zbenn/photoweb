'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function ContestIntroductionPage() {
  return (
    <div className="min-h-screen bg-white">
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
              镜观交通，<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                定格瞬间
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              2025-2026学年——“镜观交通”摄影大赛现已开启。
              <br />
              用镜头记录交通之美、交通之痛、交通之变。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-foreground text-white font-medium rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-200"
              >
                立即参赛
              </Link>
              <Link
                href="/gallery"
                className="px-8 py-4 bg-white text-foreground border border-gray-200 font-medium rounded-full hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
              >
                浏览作品
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8 text-foreground">大赛介绍</h2>
          <p className="text-lg text-secondary leading-relaxed mb-12">
            “镜观交通”摄影大赛旨在鼓励大家拿起相机，记录身边交通的点点滴滴。
            无论是宏伟的交通枢纽，还是街头的车水马龙；无论是便捷出行的喜悦，还是拥堵等待的无奈；
            亦或是交通方式的日新月异。我们期待通过你的镜头，引发对现代交通文明的思考与共鸣。
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">参赛类别</h2>
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              { icon: "🌈", title: "交通之美", desc: "展现交通设施的建筑美、交通工具的流线美、交通运行的秩序美，以及人与交通和谐共处的画面。" },
              { icon: "🚦", title: "交通之痛", desc: "关注交通拥堵、事故隐患、不文明行为等交通领域存在的问题，以警示和反思为主题。" },
              { icon: "🚀", title: "交通之变", desc: "记录交通发展变迁、新旧交通方式对比、绿色交通出行趋势，展现时代发展的步伐。" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-8 rounded-3xl bg-white hover:shadow-xl transition-all duration-300 border border-gray-100"
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
    </div>
  )
}
