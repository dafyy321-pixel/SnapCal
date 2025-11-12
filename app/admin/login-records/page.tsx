"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface LoginRecord {
  id: string
  phone: string
  username: string
  login_time: string
  ip_address: string
  user_agent: string
}

export default function LoginRecordsPage() {
  const [records, setRecords] = useState<LoginRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchPhone, setSearchPhone] = useState("")
  const [total, setTotal] = useState(0)

  const fetchRecords = async (phone?: string) => {
    setLoading(true)
    try {
      const url = phone 
        ? `/api/auth/login-records?phone=${phone}`
        : "/api/auth/login-records"
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setRecords(data.records)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("获取登录记录失败:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleSearch = () => {
    fetchRecords(searchPhone)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">登录记录管理</h1>
          <p className="text-muted-foreground mt-2">查看所有用户的登录历史</p>
        </div>

        {/* Search Bar */}
        <Card className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入手机号搜索..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>搜索</Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchPhone("")
                fetchRecords()
              }}
            >
              重置
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">总登录次数</div>
            <div className="text-2xl font-bold mt-1">{total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">显示记录</div>
            <div className="text-2xl font-bold mt-1">{records.length}</div>
          </Card>
        </div>

        {/* Records Table */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无登录记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">手机号</th>
                    <th className="text-left py-3 px-4">用户名</th>
                    <th className="text-left py-3 px-4">登录时间</th>
                    <th className="text-left py-3 px-4">IP地址</th>
                    <th className="text-left py-3 px-4">设备信息</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{record.phone}</td>
                      <td className="py-3 px-4">{record.username || "-"}</td>
                      <td className="py-3 px-4">{formatDate(record.login_time)}</td>
                      <td className="py-3 px-4">{record.ip_address}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                        {record.user_agent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
