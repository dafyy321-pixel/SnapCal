"use client"

import { ArrowLeft, HelpCircle, Search, Send, MessageSquare, Book, Bug, Lightbulb, Star, ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function HelpPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [feedbackForm, setFeedbackForm] = useState({
    type: "",
    subject: "",
    content: "",
    email: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const faqs = [
    {
      question: "如何使用拍照识别功能？",
      answer: "点击主页的拍照按钮，对准食物拍摄清晰的图片，系统会自动识别食物并计算营养成分。确保光线充足，食物清晰可见以获得最佳识别效果。"
    },
    {
      question: "识别结果不准确怎么办？",
      answer: "您可以在分析页面手动调整食物类型、份量和营养成分。系统会根据您的反馈不断学习改进，提高识别准确率。"
    },
    {
      question: "如何设置每日营养目标？",
      answer: "进入'我的'页面，点击'目标设置'，根据您的身高、体重、活动水平和健康目标设置个性化的每日卡路里和营养素摄入目标。"
    },
    {
      question: "数据会被如何使用和保护？",
      answer: "您的健康数据采用端到端加密存储，仅用于为您提供个性化服务。我们严格遵守隐私政策，不会未经授权分享您的个人信息。"
    },
    {
      question: "如何导出我的数据？",
      answer: "在'我的'页面选择'数据导出'，您可以选择导出时间范围和格式（JSON、CSV或PDF），导出的数据可用于备份或分析。"
    },
    {
      question: "忘记密码怎么办？",
      answer: "在登录页面点击'忘记密码'，输入注册邮箱，系统会发送密码重置链接。按照邮件指引重置密码即可。"
    },
    {
      question: "如何联系客服？",
      answer: "您可以通过'帮助反馈'页面提交问题，或发送邮件至support@snapcal.app，我们会在24小时内回复您。"
    },
    {
      question: "应用是否支持离线使用？",
      answer: "基本的记录功能支持离线使用，但AI识别需要网络连接。离线记录的数据会在网络恢复后自动同步。"
    }
  ]

  const helpCategories = [
    {
      icon: Book,
      title: "使用指南",
      description: "详细了解应用功能和使用方法",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: Bug,
      title: "故障排除",
      description: "常见问题解决方案",
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    {
      icon: Lightbulb,
      title: "使用技巧",
      description: "提高使用效率的小技巧",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      icon: Star,
      title: "最佳实践",
      description: "营养记录和健康管理建议",
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
  ]

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.type || !feedbackForm.subject || !feedbackForm.content) {
      alert("请填写完整信息")
      return
    }

    setSubmitting(true)
    try {
      // TODO: 实际项目中应该调用API提交反馈
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert("反馈提交成功，感谢您的宝贵意见！")
      setFeedbackForm({
        type: "",
        subject: "",
        content: "",
        email: "",
      })
    } catch (error) {
      console.error("提交失败:", error)
      alert("提交失败，请重试")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
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
            <h1 className="text-lg font-semibold text-foreground">帮助中心</h1>
            <div className="w-10" />
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索问题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 快速帮助分类 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">快速帮助</h3>
            <div className="grid grid-cols-2 gap-3">
              {helpCategories.map((category, index) => {
                const Icon = category.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center text-center hover:bg-accent/50"
                  >
                    <div className={`w-12 h-12 rounded-xl ${category.bgColor} flex items-center justify-center mb-3`}>
                      <Icon className={`w-6 h-6 ${category.color}`} />
                    </div>
                    <span className="font-medium text-sm text-foreground">{category.title}</span>
                    <span className="text-xs text-muted-foreground mt-1">{category.description}</span>
                  </Button>
                )
              })}
            </div>
          </Card>

          {/* 常见问题 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">常见问题</h3>
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-medium text-sm text-foreground">{faq.question}</span>
                    {expandedFAQ === index ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* 联系我们 */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 text-foreground">联系我们</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open("mailto:support@snapcal.app")}
              >
                <MessageSquare className="w-4 h-4 mr-3" />
                邮件客服
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open("https://help.snapcal.app", "_blank")}
              >
                <HelpCircle className="w-4 h-4 mr-3" />
                在线帮助文档
              </Button>
            </div>
          </Card>

          {/* 意见反馈 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">意见反馈</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">反馈类型</label>
                <Select value={feedbackForm.type} onValueChange={(value) => setFeedbackForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择反馈类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">问题报告</SelectItem>
                    <SelectItem value="feature">功能建议</SelectItem>
                    <SelectItem value="improvement">改进建议</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">主题</label>
                <Input
                  placeholder="请输入反馈主题"
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">详细描述</label>
                <Textarea
                  placeholder="请详细描述您的问题或建议..."
                  value={feedbackForm.content}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">联系邮箱（可选）</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleSubmitFeedback}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    提交反馈
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* 使用技巧 */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              使用技巧
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 📸 拍照时确保光线充足，食物清晰可见</li>
              <li>• 🎯 每天定时记录，养成良好习惯</li>
              <li>• 📊 定期查看分析报告，了解营养趋势</li>
              <li>• 💡 多尝试不同食物，丰富营养搭配</li>
              <li>• 🔔 开启提醒功能，避免遗漏记录</li>
            </ul>
          </Card>

          {/* 服务状态 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">服务状态</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">AI识别服务</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">正常</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">数据同步</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">正常</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">推送通知</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">正常</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}