"use client"

import { ArrowLeft, Shield, Save, Eye, EyeOff, Lock, Trash2, Smartphone } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function PrivacyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "private", // private, friends, public
    shareAnalytics: true,
    allowSearch: false,
    dataCollection: true,
    personalizationAds: false,
    locationTracking: false,
    biometricAuth: false,
    twoFactorAuth: false,
    emailNotifications: true,
    pushNotifications: true,
    dataRetention: "365", // days
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const loadPrivacySettings = () => {
      const savedSettings = localStorage.getItem("privacySettings")
      if (savedSettings) {
        setPrivacySettings(JSON.parse(savedSettings))
      }
    }
    loadPrivacySettings()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      localStorage.setItem("privacySettings", JSON.stringify(privacySettings))
      alert("隐私设置已保存")
      router.back()
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("新密码与确认密码不一致")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      alert("密码长度至少6位")
      return
    }

    setLoading(true)
    try {
      // TODO: 调用API修改密码
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert("密码修改成功")
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("密码修改失败:", error)
      alert("密码修改失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    // TODO: 实现删除账户的逻辑
    alert("删除账户功能需要额外验证，请联系客服处理")
    setDeleteAccountDialog(false)
  }

  const requestAccountDeletion = () => {
    // TODO: 发送删除账户请求到服务器
    alert("删除请求已提交，我们将在7天内处理")
    setDeleteAccountDialog(false)
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
            <h1 className="text-lg font-semibold text-foreground">隐私与安全</h1>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-10 h-10 rounded-full"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 账号安全 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
              <Lock className="w-5 h-5 mr-2 text-red-500" />
              账号安全
            </h3>

            {/* 双重认证 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-foreground">双重认证</div>
                <div className="text-sm text-muted-foreground">增加账号安全级别</div>
              </div>
              <Switch
                checked={privacySettings.twoFactorAuth}
                onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
              />
            </div>

            {/* 生物识别 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">生物识别登录</div>
                  <div className="text-sm text-muted-foreground">指纹或面容识别</div>
                </div>
              </div>
              <Switch
                checked={privacySettings.biometricAuth}
                onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, biometricAuth: checked }))}
              />
            </div>

            {/* 修改密码 */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 text-foreground">修改密码</h4>
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="当前密码"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="新密码"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="确认新密码"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
                <Button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  更新密码
                </Button>
              </div>
            </div>
          </Card>

          {/* 隐私设置 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
              <Shield className="w-5 h-5 mr-2 text-blue-500" />
              隐私设置
            </h3>

            {/* 资料可见性 */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">资料可见性</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={privacySettings.profileVisibility === "private" ? "default" : "outline"}
                  onClick={() => setPrivacySettings(prev => ({ ...prev, profileVisibility: "private" }))}
                  className="text-xs"
                >
                  私密
                </Button>
                <Button
                  variant={privacySettings.profileVisibility === "friends" ? "default" : "outline"}
                  onClick={() => setPrivacySettings(prev => ({ ...prev, profileVisibility: "friends" }))}
                  className="text-xs"
                >
                  好友
                </Button>
                <Button
                  variant={privacySettings.profileVisibility === "public" ? "default" : "outline"}
                  onClick={() => setPrivacySettings(prev => ({ ...prev, profileVisibility: "public" }))}
                  className="text-xs"
                >
                  公开
                </Button>
              </div>
            </div>

            {/* 搜索可见性 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-foreground">允许搜索</div>
                <div className="text-sm text-muted-foreground">其他用户可以通过手机号找到我</div>
              </div>
              <Switch
                checked={privacySettings.allowSearch}
                onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowSearch: checked }))}
              />
            </div>

            {/* 数据收集 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">数据收集</div>
                <div className="text-sm text-muted-foreground">帮助我们改进产品体验</div>
              </div>
              <Switch
                checked={privacySettings.dataCollection}
                onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, dataCollection: checked }))}
              />
            </div>
          </Card>

          {/* 通知设置 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">通知设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">邮件通知</div>
                  <div className="text-sm text-muted-foreground">重要更新和活动提醒</div>
                </div>
                <Switch
                  checked={privacySettings.emailNotifications}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">推送通知</div>
                  <div className="text-sm text-muted-foreground">应用内消息提醒</div>
                </div>
                <Switch
                  checked={privacySettings.pushNotifications}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, pushNotifications: checked }))}
                />
              </div>
            </div>
          </Card>

          {/* 数据管理 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">数据管理</h3>

            {/* 数据保留期 */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">数据保留期</label>
              <select
                value={privacySettings.dataRetention}
                onChange={(e) => setPrivacySettings(prev => ({ ...prev, dataRetention: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="30">30天</option>
                <option value="90">90天</option>
                <option value="180">180天</option>
                <option value="365">1年</option>
                <option value="0">永久保留</option>
              </select>
            </div>

            {/* 数据导出 */}
            <Button
              onClick={() => router.push("/profile/export")}
              variant="outline"
              className="w-full mb-3"
            >
              导出我的数据
            </Button>

            {/* 删除账户 */}
            <Button
              onClick={() => setDeleteAccountDialog(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除账户
            </Button>
          </Card>

          {/* 删除账户确认对话框 */}
          {deleteAccountDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
              <Card className="w-full max-w-sm p-6">
                <h3 className="text-lg font-semibold mb-2 text-red-600">删除账户</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  此操作不可逆转，您的所有数据将被永久删除：
                </p>
                <ul className="text-sm text-muted-foreground mb-6 space-y-1">
                  <li>• 所有饮食记录</li>
                  <li>• 个人资料和设置</li>
                  <li>• 营养分析数据</li>
                  <li>• 成就和统计</li>
                </ul>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteAccountDialog(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={requestAccountDeletion}
                  >
                    确认删除
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}