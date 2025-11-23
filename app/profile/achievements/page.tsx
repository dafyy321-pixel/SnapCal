"use client"

import { ArrowLeft, Award, Trophy, Star, Target, Zap, Calendar, ChevronRight, Lock, Crown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  category: "record" | "goal" | "social" | "special"
  rarity: "common" | "rare" | "epic" | "legendary"
  progress: number
  maxProgress: number
  unlocked: boolean
  unlockedAt?: string
  points: number
}

export default function AchievementsPage() {
  const router = useRouter()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [unlockedCount, setUnlockedCount] = useState(0)

  useEffect(() => {
    const loadAchievements = () => {
      // 模拟成就数据，实际项目中应该从API获取
      const mockAchievements: Achievement[] = [
        {
          id: "first_record",
          title: "初来乍到",
          description: "完成第一条饮食记录",
          icon: Star,
          category: "record",
          rarity: "common",
          progress: 1,
          maxProgress: 1,
          unlocked: true,
          unlockedAt: "2024-01-15",
          points: 10
        },
        {
          id: "week_streak",
          title: "坚持一周",
          description: "连续7天记录饮食",
          icon: Calendar,
          category: "record",
          rarity: "common",
          progress: 7,
          maxProgress: 7,
          unlocked: true,
          unlockedAt: "2024-01-22",
          points: 25
        },
        {
          id: "month_streak",
          title: "月度达人",
          description: "连续30天记录饮食",
          icon: Trophy,
          category: "record",
          rarity: "rare",
          progress: 15,
          maxProgress: 30,
          unlocked: false,
          points: 100
        },
        {
          id: "calorie_goal",
          title: "卡路里大师",
          description: "连续7天达到卡路里目标",
          icon: Target,
          category: "goal",
          rarity: "rare",
          progress: 3,
          maxProgress: 7,
          unlocked: false,
          points: 75
        },
        {
          id: "protein_champ",
          title: "蛋白质冠军",
          description: "单日蛋白质摄入超过100g",
          icon: Zap,
          category: "goal",
          rarity: "common",
          progress: 1,
          maxProgress: 1,
          unlocked: true,
          unlockedAt: "2024-02-01",
          points: 20
        },
        {
          id: "social_butterfly",
          title: "社交达人",
          description: "邀请5位好友使用SnapCal",
          icon: Crown,
          category: "social",
          rarity: "epic",
          progress: 2,
          maxProgress: 5,
          unlocked: false,
          points: 150
        },
        {
          id: "early_adopter",
          title: "早期使用者",
          description: "在应用上线前注册",
          icon: Award,
          category: "special",
          rarity: "legendary",
          progress: 1,
          maxProgress: 1,
          unlocked: true,
          unlockedAt: "2024-01-01",
          points: 500
        },
        {
          id: "food_explorer",
          title: "美食探险家",
          description: "记录100种不同的食物",
          icon: Star,
          category: "record",
          rarity: "epic",
          progress: 42,
          maxProgress: 100,
          unlocked: false,
          points: 200
        }
      ]

      setAchievements(mockAchievements)

      // 计算总积分和解锁数量
      const points = mockAchievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)
      const unlocked = mockAchievements.filter(a => a.unlocked).length

      setTotalPoints(points)
      setUnlockedCount(unlocked)
    }

    loadAchievements()
  }, [])

  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case "common":
        return {
          color: "bg-gray-100 text-gray-700 border-gray-300",
          bgColor: "bg-gray-50",
          textColor: "text-gray-600",
          label: "普通"
        }
      case "rare":
        return {
          color: "bg-blue-100 text-blue-700 border-blue-300",
          bgColor: "bg-blue-50",
          textColor: "text-blue-600",
          label: "稀有"
        }
      case "epic":
        return {
          color: "bg-purple-100 text-purple-700 border-purple-300",
          bgColor: "bg-purple-50",
          textColor: "text-purple-600",
          label: "史诗"
        }
      case "legendary":
        return {
          color: "bg-amber-100 text-amber-700 border-amber-300",
          bgColor: "bg-amber-50",
          textColor: "text-amber-600",
          label: "传奇"
        }
      default:
        return {
          color: "bg-gray-100 text-gray-700 border-gray-300",
          bgColor: "bg-gray-50",
          textColor: "text-gray-600",
          label: "普通"
        }
    }
  }

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case "record":
        return { label: "记录成就", color: "text-blue-500" }
      case "goal":
        return { label: "目标成就", color: "text-green-500" }
      case "social":
        return { label: "社交成就", color: "text-purple-500" }
      case "special":
        return { label: "特殊成就", color: "text-amber-500" }
      default:
        return { label: "其他成就", color: "text-gray-500" }
    }
  }

  const filteredAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)

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
            <h1 className="text-lg font-semibold text-foreground">我的成就</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* 成就统计 */}
        <div className="p-6 space-y-6">
          <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">成就进度</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-600">{totalPoints}</div>
                <div className="text-xs text-muted-foreground">成就积分</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{unlockedCount}</div>
                <div className="text-xs text-muted-foreground">已解锁</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-muted-foreground">
                  {achievements.length - unlockedCount}
                </div>
                <div className="text-xs text-muted-foreground">未解锁</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">
                  {Math.round((unlockedCount / achievements.length) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">完成度</div>
              </div>
            </div>

            <Progress
              value={(unlockedCount / achievements.length) * 100}
              className="h-2"
            />
          </Card>

          {/* 已解锁成就 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">已解锁成就</h3>
            {filteredAchievements.length === 0 ? (
              <div className="text-center py-8">
                <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">还没有解锁任何成就</p>
                <p className="text-sm text-muted-foreground">开始记录饮食，解锁你的第一个成就吧！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAchievements.map((achievement) => {
                  const Icon = achievement.icon
                  const rarityConfig = getRarityConfig(achievement.rarity)
                  const categoryConfig = getCategoryConfig(achievement.category)

                  return (
                    <div
                      key={achievement.id}
                      className={`border rounded-lg p-4 ${rarityConfig.color} cursor-pointer hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Icon className="w-6 h-6 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{achievement.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${rarityConfig.bgColor} ${rarityConfig.textColor}`}>
                              {rarityConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className={categoryConfig.color}>{categoryConfig.label}</span>
                              <span>+{achievement.points} 积分</span>
                              {achievement.unlockedAt && (
                                <span>{new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* 未解锁成就 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">未解锁成就</h3>
            {lockedAchievements.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                <p className="text-foreground">恭喜！</p>
                <p className="text-sm text-muted-foreground">您已解锁所有成就</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lockedAchievements.map((achievement) => {
                  const Icon = achievement.icon
                  const rarityConfig = getRarityConfig(achievement.rarity)
                  const categoryConfig = getCategoryConfig(achievement.category)
                  const progressPercent = (achievement.progress / achievement.maxProgress) * 100

                  return (
                    <div
                      key={achievement.id}
                      className="border rounded-lg p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-muted-foreground">{achievement.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${rarityConfig.bgColor} ${rarityConfig.textColor}`}>
                              {rarityConfig.label}
                            </span>
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

                          {/* 进度条 */}
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>{categoryConfig.label}</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>+{achievement.points} 积分</span>
                            <span>{Math.round(progressPercent)}% 完成</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* 成就等级 */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 text-foreground">成就等级</h3>
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h4 className="text-xl font-bold text-blue-600 mb-1">营养新手</h4>
              <p className="text-sm text-muted-foreground mb-3">当前等级</p>
              <div className="bg-white rounded-lg p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span>{totalPoints} 积分</span>
                  <span>1000 积分</span>
                </div>
                <Progress value={(totalPoints / 1000) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">还需 {1000 - totalPoints} 积分升级</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}