"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function FabButton() {
  const router = useRouter()
  return (
    <Button
      aria-label="扫描食物"
      onClick={() => router.push("/scan")}
      size="icon"
      className="fixed right-6 bottom-24 w-16 h-16 rounded-full shadow-xl z-50 bg-black/90 text-white hover:scale-105 active:scale-95"
    >
      <Image
        src="/jimeng-2025-11-05-2611-logo_design,_a_minimalist,_friendly_came...png"
        alt=""
        width={28}
        height={28}
        className="object-contain invert brightness-150 contrast-150"
      />
    </Button>
  )
}
