"use client"

import { ArrowLeft, Share2, Copy, Gift, Users, Crown, Zap, Heart, QrCode, Download, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SharePage() {
  const router = useRouter()
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [shareMethod, setShareMethod] = useState<"link" | "qr" | "code">("link")

  const inviteLink = "https://snapcal.app/invite?ref=user123456"
  const inviteCode = "SNAPCAL2024"
  const shareText = "我正在使用SnapCal记录饮食营养，AI拍照识别超方便！快来一起健康饮食吧！"

  const referralRewards = [
    {
      level: "新手邀请官",
      friendsRequired: 1,
      reward: "高级会员7天",
      icon: "🎁",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      level: "社交达人",
      friendsRequired: 3,
      reward: "高级会员1个月",
      icon: "⭐",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      level: "邀请大使",
      friendsRequired: 5,
      reward: "高级会员3个月",
      icon: "👑",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      level: "超级推广者",
      friendsRequired: 10,
      reward: "高级会员1年",
      icon: "💎",
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    }
  ]

  const shareOptions = [
    {
      icon: Users,
      label: "微信好友",
      color: "text-green-500",
      bgColor: "bg-green-50",
      action: () => handleShare("wechat")
    },
    {
      icon: Share2,
      label: "朋友圈",
      color: "text-green-600",
      bgColor: "bg-green-50",
      action: () => handleShare("wechat-moments")
    },
    {
      icon: Heart,
      label: "微博",
      color: "text-red-500",
      bgColor: "bg-red-50",
      action: () => handleShare("weibo")
    },
    {
      icon: Copy,
      label: "复制链接",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      action: () => handleShare("copy-link")
    }
  ]

  const userStats = {
    invitedFriends: 2,
    successfulInvites: 1,
    totalRewards: 7, // days of premium
    level: "社交达人",
    progress: 40 // percentage to next level
  }

  const handleShare = async (method: string) => {
    try {
      switch (method) {
        case "wechat":
          // 实际项目中应该调用微信SDK
          alert("请使用微信扫码分享功能")
          break
        case "wechat-moments":
          alert("请打开微信朋友圈分享")
          break
        case "weibo":
          window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(inviteLink)}&title=${encodeURIComponent(shareText)}`, "_blank")
          break
        case "copy-link":
          await navigator.clipboard.writeText(inviteLink)
          setCopiedLink(true)
          setTimeout(() => setCopiedLink(false), 3000)
          break
        default:
          break
      }
    } catch (error) {
      console.error("分享失败:", error)
      alert("分享失败，请重试")
    }
  }

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 3000)
    } catch (error) {
      console.error("复制失败:", error)
      alert("复制失败，请重试")
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SnapCal - AI营养记录助手",
          text: shareText,
          url: inviteLink
        })
      } catch (error) {
        console.error("分享失败:", error)
      }
    } else {
      handleShare("copy-link")
    }
  }

  const generateQRCode = () => {
    // 实际项目中应该使用QR码生成库
    alert("QR码功能开发中...")
  }

  const downloadInviteImage = () => {
    // 实际项目中应该生成并下载邀请图片
    alert("邀请图片下载功能开发中...")
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
            <h1 className="text-lg font-semibold text-foreground">分享给朋友</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 用户邀请统计 */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">我的邀请成果</h3>
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{userStats.invitedFriends}</div>
                <div className="text-xs text-muted-foreground">邀请人数</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{userStats.successfulInvites}</div>
                <div className="text-xs text-muted-foreground">成功注册</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-amber-600">{userStats.totalRewards}</div>
                <div className="text-xs text-muted-foreground">奖励天数</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">{userStats.level}</span>
                <span className="text-xs text-muted-foreground">{userStats.progress}% 到下一级</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${userStats.progress}%` }}
                />
              </div>
            </div>
          </Card>

          {/* 邀请奖励阶梯 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
              <Gift className="w-5 h-5 mr-2 text-purple-500" />
              邀请奖励
            </h3>
            <div className="space-y-3">
              {referralRewards.map((reward, index) => {
                const isUnlocked = userStats.successfulInvites >= reward.friendsRequired
                const isCurrent = userStats.invitedFriends >= reward.friendsRequired && userStats.invitedFriends < (referralRewards[index + 1]?.friendsRequired || Infinity)

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${isCurrent ? 'border-blue-300 bg-blue-50' : 'border-border'} ${isUnlocked ? 'bg-muted/30' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${reward.bgColor}`}>
                        {reward.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{reward.level}</h4>
                          {isUnlocked && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {isCurrent && (
                            <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full">当前</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">邀请{reward.friendsRequired}位朋友</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{reward.reward}</span>
                          {!isUnlocked && (
                            <span className="text-xs text-muted-foreground">
                              还需{reward.friendsRequired - userStats.invitedFriends}人
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* 分享方式选择 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">分享方式</h3>
            <div className="flex gap-2 mb-4">
              <Button
                variant={shareMethod === "link" ? "default" : "outline"}
                onClick={() => setShareMethod("link")}
                className="flex-1"
              >
                链接
              </Button>
              <Button
                variant={shareMethod === "qr" ? "default" : "outline"}
                onClick={() => setShareMethod("qr")}
                className="flex-1"
              >
                二维码
              </Button>
              <Button
                variant={shareMethod === "code" ? "default" : "outline"}
                onClick={() => setShareMethod("code")}
                className="flex-1"
              >
                邀请码
              </Button>
            </div>

            {shareMethod === "link" && (
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">邀请链接</div>
                  <div className="text-xs text-foreground break-all">{inviteLink}</div>
                </div>
                <Button
                  onClick={() => handleShare("copy-link")}
                  className="w-full"
                  variant={copiedLink ? "secondary" : "default"}
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      已复制链接
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      复制链接
                    </>
                  )}
                </Button>
              </div>
            )}

            {shareMethod === "qr" && (
              <div className="text-center space-y-3">
                <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground">扫描二维码邀请朋友</p>
                <Button onClick={generateQRCode} variant="outline" className="w-full">
                  生成二维码
                </Button>
              </div>
            )}

            {shareMethod === "code" && (
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2">邀请码</div>
                  <div className="text-2xl font-bold text-foreground font-mono">{inviteCode}</div>
                </div>
                <Button
                  onClick={handleCopyInviteCode}
                  className="w-full"
                  variant={copiedCode ? "secondary" : "default"}
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      已复制邀请码
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      复制邀请码
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* 快速分享选项 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">快速分享</h3>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option, index) => {
                const Icon = option.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={option.action}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <div className={`w-10 h-10 rounded-lg ${option.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${option.color}`} />
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </Button>
                )
              })}
            </div>
          </Card>

          {/* 邀请说明 */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-500" />
              邀请说明
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• 朋友通过您的邀请链接/二维码/邀请码注册并使用SnapCal</p>
              <p>• 每成功邀请1位朋友，您和朋友都能获得奖励</p>
              <p>• 奖励会在朋友完成首次饮食记录后发放</p>
              <p>• 高级会员享受AI识别无限制、详细数据分析等特权</p>
            </div>
          </Card>

          {/* 生成邀请图片 */}
          <Card className="p-6">
            <Button onClick={downloadInviteImage} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              下载邀请海报
            </Button>
          </Card>

          {/* 系统分享按钮 */}
          {typeof navigator.share !== 'undefined' && (
            <Button onClick={handleNativeShare} className="w-full" size="lg">
              <Share2 className="w-5 h-5 mr-2" />
              分享给朋友
            </Button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}