import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              2025年春季摄影大赛
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              展示你的摄影才华，分享精彩瞬间！
              <br />
              每位参赛者最多可上传 5 张作品
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                立即参赛
              </Link>
              <Link
                href="/gallery"
                className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition"
              >
                浏览作品
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">活动亮点</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-xl font-semibold mb-2">多种分类</h3>
            <p className="text-gray-600">
              人像、风光、纪实、创意、街头、野生动物等多个摄影分类供你选择
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">👍</div>
            <h3 className="text-xl font-semibold mb-2">公众投票</h3>
            <p className="text-gray-600">
              所有访客都可以为喜欢的作品点赞，让优秀作品获得更多关注
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">专业评审</h3>
            <p className="text-gray-600">
              专业评委团队打分评选，确保比赛的公平公正性
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">活动时间</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                12月2日 - 12月31日
              </div>
              <p className="text-gray-600">作品征集期</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                1月1日 - 1月15日
              </div>
              <p className="text-gray-600">公众投票期</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                1月16日 - 1月19日
              </div>
              <p className="text-gray-600">评委评审期</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">
                1月20日
              </div>
              <p className="text-gray-600">结果公布</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">准备好展示你的作品了吗？</h2>
          <p className="text-gray-300 mb-8">
            立即注册参赛，上传你的精彩摄影作品
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            开始参赛
          </Link>
        </div>
      </div>
    </div>
  )
}
