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
              "镜观交通"<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                交通主题摄影交流活动
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary mb-10 max-w-3xl mx-auto leading-relaxed">
              在交通强国建设的时代背景下，通过镜头记录交通的美、思考交通的困、探索交通的变。
              <br />
              汇聚跨高校交通青年群体与公众的创意力量，共同讲述交通故事。
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-foreground text-center">活动背景</h2>
            <div className="prose prose-lg max-w-none text-secondary">
              <p className="text-lg leading-relaxed mb-6">
                在交通强国建设的时代背景下，交通不仅是连接城市与生活的纽带，更是现代文明的脉搏。本次"镜观交通"摄影交流活动旨在通过镜头记录交通的美、思考交通的困、探索交通的变，汇聚跨高校交通青年群体与公众的创意力量，共同讲述交通故事、凝聚交通智慧，助力推动交通事业的未来发展。
              </p>
              <p className="text-lg leading-relaxed">
                为深入学习交通强国战略理念，促进高校交通青年之间的交流，鼓励公众以多元视角观察与理解交通系统，由全国多所交通学科相关院校的团支部、党支部联合发起"镜观交通"交通主题摄影交流活动。活动将通过摄影作品展示与讨论，呈现交通领域的多样性、复杂性与时代变革，为交通现代化建设贡献青年力量。
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Organizers Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-10 text-foreground text-center">主办单位</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "浙江大学工程师学院智慧交通项目 24 班团支部",
                "浙江大学工程师学院智慧交通项目研究生党支部",
                "北京交通大学交通运输学院 硕2305 党支部",
                "上海交通大学船舶海洋与建筑工程学院交通运输工程系硕士生党支部",
                "同济大学交通运输工程学院研究生第二、研究生第六党支部",
                "西南交通大学本科交运茅以升班党支部"
              ].map((org, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-4"></div>
                    <p className="text-base text-foreground font-medium">{org}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Themes Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">活动主题</h2>
          <p className="text-center text-secondary mb-12 text-lg">活动设立三个主线主题，投稿可按任意主题进行创作</p>
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { 
                icon: "🌈", 
                title: "交通之美", 
                desc: "捕捉交通设施、交通流线、城市肌理与自然环境的和谐瞬间；展现工程之美、秩序之美、效率之美。" 
              },
              { 
                icon: "🚦", 
                title: "交通之困", 
                desc: "呈现交通运行中的困难、瓶颈、风险和挑战，如拥堵、事故、设施老化、交通公平问题等，引发公众思考。" 
              },
              { 
                icon: "🚀", 
                title: "交通之变", 
                desc: "记录交通新技术、新趋势、新模式的涌现，如智能交通、绿色交通、自动驾驶、城市更新等时代浪潮中的交通变革。" 
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{feature.title}</h3>
                <p className="text-secondary leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-12 text-foreground text-center">活动时间安排</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl overflow-hidden shadow-lg">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <tr>
                    <th className="w-32 px-12 py-6 text-left font-semibold">阶段</th>
                    <th className="w-65 px-6 py-6 text-left font-semibold">时间</th>
                    <th className="px-8 py-6 text-left font-semibold">内容</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { stage: "作品征集", time: "2024.12.12 – 2025.01.18", content: "向社会公开征集作品" },
                    { stage: "公众点赞", time: "2024.12.12 – 2025.01.23", content: "对优秀作品开启线上点赞（若总作品数较多，会依据此进行入围筛选，不带入评分）" },
                    { stage: "评委评审", time: "2025.01.23 – 2025.01.29", content: "专家维度评分、多模态模型评分" },
                    { stage: "结果公布", time: "2025.02.01", content: "公布最终获奖名单" },
                    { stage: "后续赛事", time: "春节特别档", content: "敬请期待更多主题系列活动" }
                  ].map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{item.stage}</td>
                      <td className="px-6 py-4 text-secondary">{item.time}</td>
                      <td className="px-6 py-4 text-secondary">{item.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Submission Requirements Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-12 text-foreground text-center">作品投稿须知</h2>
            
            <div className="space-y-8">
              {/* 作品内容要求 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-100">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                  作品内容要求
                </h3>
                <p className="text-secondary leading-relaxed">
                  主题鲜明、积极健康；可投稿摄影作品或短视频作品。
                </p>
              </div>

              {/* 摄影作品格式 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                  摄影作品格式
                </h3>
                <ul className="text-secondary leading-relaxed space-y-2 list-disc list-inside">
                  <li>JPG格式，文件大小建议 2–15 MB；彩色/黑白不限</li>
                  <li>单幅或组照（每组 4–6 幅，按 1 件作品计）</li>
                </ul>
              </div>

              {/* 作品规范 */}
              <div className="bg-gradient-to-r from-pink-50 to-orange-50 p-8 rounded-2xl border border-pink-100">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <span className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                  作品规范
                </h3>
                <ul className="text-secondary leading-relaxed space-y-2 list-disc list-inside">
                  <li>不得加入边框、水印、签名、LOGO 等额外元素</li>
                  <li>允许构图裁剪及不改变真实性的整体调色</li>
                  <li>不得提供电脑合成或过度修饰的创意作品</li>
                </ul>
              </div>

              {/* 原创与权利声明 */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-8 rounded-2xl border border-orange-100">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-3 text-sm">4</span>
                  原创与权利声明
                </h3>
                <ul className="text-secondary leading-relaxed space-y-2 list-disc list-inside">
                  <li>投稿者须为作品原创作者，拥有完整著作权</li>
                  <li>不得侵犯他人肖像权、名誉权、隐私权等合法权益</li>
                  <li>因投稿引发的法律责任由投稿者自行承担</li>
                </ul>
              </div>

              {/* 作品使用授权 */}
              <div className="bg-gradient-to-r from-yellow-50 to-green-50 p-8 rounded-2xl border border-yellow-100">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <span className="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center mr-3 text-sm">5</span>
                  作品使用授权
                </h3>
                <p className="text-secondary leading-relaxed">
                  主办单位可在著作权存续期内以复制、展览、网络传播等方式使用入选作品，且不另付报酬。
                </p>
              </div>

              {/* 禁止内容 */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-2xl border border-red-200">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mr-3 text-sm">⚠</span>
                  禁止内容
                </h3>
                <p className="text-secondary leading-relaxed">
                  凡涉及违法、违反公序良俗、严重误导公众或具有欺诈性质的作品，一经发现取消资格。
                </p>
              </div>

              <div className="text-center pt-4">
                <p className="text-lg font-medium text-foreground">
                  📌 投稿即视为同意本启事的全部内容
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Judging Criteria Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-foreground text-center">评奖规则</h2>
            <p className="text-center text-secondary mb-12 text-lg max-w-3xl mx-auto">
              本活动将从多学科、多视角对作品进行综合评价，以确保公平客观
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "交通专家评分",
                  ratio: "1/3",
                  icon: "🎓",
                  desc: "关注作品所展现的交通现象、问题、场景的专业价值与交通学科意义。",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  title: "摄影专家评分",
                  ratio: "1/3",
                  icon: "📸",
                  desc: "关注构图、光影、叙事性、艺术性等摄影美学维度。",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  title: "多模态大模型评分",
                  ratio: "1/3",
                  icon: "🤖",
                  desc: "通过设定科学、透明的提示词，由模型从视觉内容、场景语义、结构叙事等多维度进行客观评分。",
                  color: "from-orange-500 to-red-500"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100"
                >
                  <div className={`text-5xl mb-4 inline-block p-4 rounded-2xl bg-gradient-to-br ${item.color} bg-opacity-10`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${item.color} mb-4`}>
                    占比 {item.ratio}
                  </div>
                  <p className="text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 bg-white p-6 rounded-2xl border border-blue-200">
              <p className="text-center text-secondary text-sm">
                💡 <span className="font-medium text-foreground">评分提示词及模型将在活动后公开</span>，以保证可解释性与公正性。
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              准备好开始你的创作了吗？
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              用你的镜头记录交通故事，为交通强国建设贡献青年力量
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-blue-600 font-medium rounded-full hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                立即报名参赛
              </Link>
              <Link
                href="/upload"
                className="px-8 py-4 bg-transparent text-white border-2 border-white font-medium rounded-full hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
              >
                上传作品
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
