"use client"

import { Home, BarChart3, ListChecks, User } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { FabButton } from "@/components/fab-button"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { icon: Home, label: "今天", path: "/" },
    { icon: ListChecks, label: "记录", path: "/records" },
    null,
    { icon: BarChart3, label: "洞察", path: "/analytics" },
    { icon: User, label: "我的", path: "/profile" },
  ]

  return (
    <>
    <div aria-hidden="true" className="h-[env(safe-area-inset-bottom)]" />
    {/* Radix hides the scrollbar when a sheet opens; compensate fixed navigation too. */}
    <nav aria-label="主导航" className="fixed bottom-0 left-0 right-[var(--removed-body-scroll-bar-size,0px)] z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-[68px] max-w-md grid-cols-[1fr_1fr_88px_1fr_1fr] items-center px-2 sm:px-3">
        {navItems.map((item) => {
          if (!item) return <div key="add" className="relative h-full"><FabButton /></div>
          const Icon = item.icon
          const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)
          return (
            <button
              type="button"
              key={item.path}
              onClick={() => router.push(item.path)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-14 min-w-11 w-full max-w-16 flex-col items-center justify-center justify-self-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
    </>
  )
}
