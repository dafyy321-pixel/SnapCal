"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { memo } from "react"

interface AchievementsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AchievementsModal = memo<AchievementsModalProps>(({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">我的成就</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground touch-feedback w-8 h-8 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-2xl">🔥</div>
            <div className="flex-1">
              <h3 className="font-semibold">连续记录 1 天</h3>
              <p className="text-xs text-muted-foreground">继续保持！</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-muted">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl opacity-50">
              🏆
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-muted-foreground">连续记录 7 天</h3>
              <p className="text-xs text-muted-foreground">还需 6 天</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-muted">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl opacity-50">
              💪
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-muted-foreground">首次达成蛋白质目标</h3>
              <p className="text-xs text-muted-foreground">还需 38g</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-muted">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl opacity-50">
              🥗
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-muted-foreground">健康饮食一周</h3>
              <p className="text-xs text-muted-foreground">保持营养均衡</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
})

AchievementsModal.displayName = "AchievementsModal"