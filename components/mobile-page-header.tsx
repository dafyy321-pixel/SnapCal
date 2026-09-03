"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function MobilePageHeader({ title, description }: { title: string; description?: string }) {
  const router = useRouter()
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <button type="button" aria-label="返回" onClick={() => router.back()} className="grid size-10 shrink-0 place-items-center rounded-full border bg-card">
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
    </header>
  )
}
