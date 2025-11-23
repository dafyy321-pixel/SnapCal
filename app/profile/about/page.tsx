"use client"

import { ArrowLeft, Heart, Github, Mail, Globe, Shield, Sparkles, Users, Target } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"

export default function AboutPage() {
  const router = useRouter()

  const teamMembers = [
    {
      name: "张明",
      role: "产品负责人",
      avatar: "👨‍💼",
    },
    {
      name: "李婷",
      role: "AI算法工程师",
      avatar: "👩‍💻",
    },
    {
      name: "王浩",
      role: "全栈开发工程师",
      avatar: "👨‍💻",
    },
    {
      name: "陈雨",
      role: "UI/UX设计师",
      avatar: "👩‍🎨",
    },
  ]

  const features = [
    {
      icon: Sparkles,
      title: "AI智能识别",
      description: "基于先进的计算机视觉技术，准确识别食物类型和营养成分",
    },
    {
      icon: Shield,
      title: "数据安全",
      description: "采用端到端加密技术，确保您的健康数据安全私密",
    },
    {
      icon: Target,
      title: "个性化建议",
      description: "根据您的健康目标和饮食习惯，提供定制化营养建议",
    },
    {
      icon: Users,
      title: "专业团队",
      description: "由营养师、医生和AI专家共同打造的专业营养管理平台",
    },
  ]

  const handleEmailContact = () => {
    window.open("mailto:support@snapcal.app")
  }

  const handleGithubVisit = () => {
    window.open("https://github.com/snapcal", "_blank")
  }

  const handleWebsiteVisit = () => {
    window.open("https://snapcal.app", "_blank")
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* 顶部导航栏 */}
        <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-12 pb-6 px-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">关于我们</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 应用介绍 */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">🥗</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">SnapCal</h2>
              <p className="text-muted-foreground mb-4">让健康饮食更简单</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                我们是一款基于AI技术的营养记录应用，通过拍照识别食物，
                帮助您轻松管理每日营养摄入，实现健康生活目标。
              </p>
              <div className="flex items-center justify-center gap-1 mt-4">
                <span className="text-xs text-muted-foreground">版本</span>
                <span className="text-sm font-medium">1.0.1</span>
              </div>
            </div>
          </Card>

          {/* 核心功能 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">核心功能</h3>
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm mb-2 text-foreground">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* 我们的使命 */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-600" />
              我们的使命
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              在快节奏的现代生活中，我们深知保持健康饮食的挑战。SnapCal 致力于通过
              AI技术简化营养管理，让每个人都能轻松享受健康生活。
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">100万+</div>
                <div className="text-xs text-muted-foreground">用户信赖</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-xs text-muted-foreground">识别准确率</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">4.8</div>
                <div className="text-xs text-muted-foreground">用户评分</div>
              </div>
            </div>
          </Card>

          {/* 团队介绍 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">核心团队</h3>
            <div className="grid grid-cols-2 gap-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
                    {member.avatar}
                  </div>
                  <h4 className="font-medium text-sm text-foreground">{member.name}</h4>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* 联系我们 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">联系我们</h3>
            <div className="space-y-3">
              <Button
                onClick={handleEmailContact}
                variant="outline"
                className="w-full justify-start"
              >
                <Mail className="w-4 h-4 mr-3" />
                support@snapcal.app
              </Button>
              <Button
                onClick={handleGithubVisit}
                variant="outline"
                className="w-full justify-start"
              >
                <Github className="w-4 h-4 mr-3" />
                GitHub 开源项目
              </Button>
              <Button
                onClick={handleWebsiteVisit}
                variant="outline"
                className="w-full justify-start"
              >
                <Globe className="w-4 h-4 mr-3" />
                官方网站
              </Button>
            </div>
          </Card>

          {/* 用户协议 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">法律信息</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-between px-0"
                onClick={() => router.push("/terms")}
              >
                <span>用户协议</span>
                <span className="text-muted-foreground">→</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between px-0"
                onClick={() => router.push("/privacy")}
              >
                <span>隐私政策</span>
                <span className="text-muted-foreground">→</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between px-0"
                onClick={() => router.push("/cookies")}
              >
                <span>Cookie政策</span>
                <span className="text-muted-foreground">→</span>
              </Button>
            </div>
          </Card>

          {/* 致谢 */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">特别感谢</h3>
              <p className="text-sm text-muted-foreground">
                感谢所有用户的支持和反馈，
                感谢开源社区的技术贡献，
                感谢各位营养专家的专业指导。
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                让我们一起为更健康的世界努力！
              </p>
            </div>
          </Card>

          {/* 版权信息 */}
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground mb-1">
              © 2024 SnapCal. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Made with ❤️ in Beijing
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}