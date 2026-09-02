"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { profileService } from "@/lib/api-services"

type FormData = {
  username: string
  birthday: string
  gender: "male" | "female" | "other" | ""
  height: string
  weight: string
}

export default function ProfileEditPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormData>({ username: "", birthday: "", gender: "", height: "", weight: "" })

  useEffect(() => {
    profileService.getProfile<Record<string, unknown>>().then(profile => {
      setForm({
        username: String(profile.username || ""),
        birthday: String(profile.birthday || ""),
        gender: (profile.gender || "") as FormData["gender"],
        height: profile.height == null ? "" : String(profile.height),
        weight: profile.weight == null ? "" : String(profile.weight),
      })
    }).catch(error => setError(error instanceof Error ? error.message : "加载失败"))
  }, [])

  async function save() {
    setSaving(true)
    setError("")
    try {
      await profileService.updateProfile({
        username: form.username,
        birthday: form.birthday || null,
        gender: form.gender || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
      })
      router.push("/profile")
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="pt-12 pb-6 px-6 border-b flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold">编辑资料</h1>
          <Button size="icon" onClick={save} disabled={saving}><Save className="w-4 h-4" /></Button>
        </header>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Card className="p-6 space-y-4">
            <label className="block text-sm font-medium">姓名<Input className="mt-2" value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} maxLength={50} /></label>
            <label className="block text-sm font-medium">生日<Input className="mt-2" type="date" value={form.birthday} onChange={event => setForm({ ...form, birthday: event.target.value })} /></label>
            <div><span className="text-sm font-medium">性别</span><div className="grid grid-cols-3 gap-2 mt-2">
              {([['male', '男'], ['female', '女'], ['other', '其他']] as const).map(([value, label]) => <Button type="button" key={value} variant={form.gender === value ? "default" : "outline"} onClick={() => setForm({ ...form, gender: value })}>{label}</Button>)}
            </div></div>
            <label className="block text-sm font-medium">身高 (cm)<Input className="mt-2" type="number" min="50" max="300" value={form.height} onChange={event => setForm({ ...form, height: event.target.value })} /></label>
            <label className="block text-sm font-medium">体重 (kg)<Input className="mt-2" type="number" min="20" max="500" step="0.1" value={form.weight} onChange={event => setForm({ ...form, weight: event.target.value })} /></label>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
