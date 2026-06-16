"use client"

import { useEffect, useState } from "react"
import {
  Loader2,
  Plus,
  Trash2,
  Megaphone,
  Pencil,
  X,
  Calendar as CalendarIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUploader, type UploadFile } from "@/components/ui/file-uploader"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  role: string
  email: string
}

interface EventType {
  id: string
  title: string
  category: string
  location: string
  startTime: string
  capacity: number
  bookedCount?: number
  soldCount?: number
  description?: string
  coverUrl?: string | null
}

export default function EventsManagementPage() {
  const [user, setUser] = useState<User | null>(null)
  const [createdEvents, setCreatedEvents] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [dbCategories, setDbCategories] = useState<{ label: string; value: string }[]>([])

  // 发布/编辑活动表单状态
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState("50")
  const [category, setCategory] = useState("学术讲座")
  const [eventMsg, setEventMsg] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([])
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [originalStartTime, setOriginalStartTime] = useState<string | null>(null)

  // 日期选择状态
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedHour, setSelectedHour] = useState("09")
  const [selectedMinute, setSelectedMinute] = useState("00")

  // 广播通知表单状态
  const [broadcastEventId, setBroadcastEventId] = useState<string | null>(null)
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastContent, setBroadcastContent] = useState("")
  const [broadcastMsg, setBroadcastMsg] = useState("")
  const [broadcastLoading, setBroadcastLoading] = useState(false)

  const startTimeStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}T${selectedHour}:${selectedMinute}`
    : ""

  const loadEventsData = async (currUser: User) => {
    try {
      const res = await fetch(`/api/events/dashboard?organizerId=${currUser.id}`)
      const data = await res.json()
      if (data.events) {
        const formatted = data.events.map((e: EventType) => ({
          ...e,
          bookedCount: e.soldCount,
        }))
        setCreatedEvents(formatted)
      }
    } catch (err) {
      console.error(err)
      toast.error("获取活动数据失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("campus_user")
    if (stored) {
      const curr = JSON.parse(stored)
      setUser(curr)
      loadEventsData(curr)
    }

    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setDbCategories(data.map((c: any) => ({ label: c.name, value: c.name })))
          }
        }
      } catch (err) {
        console.error("加载动态分类失败:", err)
      }
    }
    fetchCategories()
  }, [])

  const handleImageUpload = async (
    file: UploadFile,
    onProgress: (progress: number) => void
  ) => {
    const formData = new FormData()
    if (file.rawFile) {
      formData.append("file", file.rawFile)
    }

    return new Promise<{ url: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", "/api/upload")

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            if (data.success) {
              resolve({ url: data.url })
            } else {
              reject(new Error(data.message || "上传失败"))
            }
          } catch {
            reject(new Error("解析响应失败"))
          }
        } else {
          reject(new Error(`服务器响应错误: ${xhr.status}`))
        }
      }

      xhr.onerror = () => reject(new Error("网络错误，上传失败"))
      xhr.send(formData)
    })
  }

  const validateTime = (date: Date | undefined, hour: string, minute: string) => {
    if (!date) {
      setEventMsg((prev) =>
        prev === "活动开始时间不能早于当前时间" || prev === "请选择活动开始日期"
          ? ""
          : prev
      )
      return
    }
    const tempStartTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${hour}:${minute}`

    if (editingEventId && tempStartTime === originalStartTime) {
      setEventMsg((prev) => (prev === "活动开始时间不能早于当前时间" ? "" : prev))
      return
    }

    const selectedDateTime = new Date(tempStartTime)
    if (selectedDateTime.getTime() - Date.now() < -60 * 1000) {
      setEventMsg("活动开始时间不能早于当前时间")
    } else {
      setEventMsg((prev) =>
        prev === "活动开始时间不能早于当前时间" || prev === "请选择活动开始日期"
          ? ""
          : prev
      )
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    validateTime(date, selectedHour, selectedMinute)
  }

  const handleHourChange = (hour: string | null) => {
    const h = hour || "00"
    setSelectedHour(h)
    validateTime(selectedDate, h, selectedMinute)
  }

  const handleMinuteChange = (minute: string | null) => {
    const m = minute || "00"
    setSelectedMinute(m)
    validateTime(selectedDate, selectedHour, m)
  }

  const handleStartEdit = (evt: EventType) => {
    setEditingEventId(evt.id)
    setOriginalStartTime(evt.startTime)
    setTitle(evt.title)
    setCategory(evt.category)
    setDescription(evt.description || "")
    setLocation(evt.location)
    setCapacity(evt.capacity.toString())

    const start = new Date(evt.startTime)
    setSelectedDate(start)
    setSelectedHour(String(start.getHours()).padStart(2, "0"))
    setSelectedMinute(String(start.getMinutes()).padStart(2, "0"))

    setUploadedFiles(
      evt.coverUrl
        ? [
            {
              id: "existing-cover",
              name: "current-cover.png",
              size: 0,
              type: "image/png",
              status: "success",
              url: evt.coverUrl,
            },
          ]
        : []
    )
    setEventMsg("")

    const formPanel = document.getElementById("event-form-panel")
    if (formPanel) {
      formPanel.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleCancelEdit = () => {
    setEditingEventId(null)
    setOriginalStartTime(null)
    setTitle("")
    setCategory(dbCategories[0]?.value || "学术讲座")
    setDescription("")
    setLocation("")
    setCapacity("50")
    setSelectedDate(undefined)
    setSelectedHour("09")
    setSelectedMinute("00")
    setUploadedFiles([])
    setEventMsg("")
  }

  const handleCreateOrUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setEventMsg("")

    if (!selectedDate) {
      setEventMsg("请选择活动开始日期")
      return
    }

    const coverUrl = uploadedFiles.find((f) => f.status === "success")?.url || null

    try {
      let res
      if (editingEventId) {
        if (startTimeStr !== originalStartTime) {
          const selectedDateTime = new Date(startTimeStr)
          if (selectedDateTime.getTime() - Date.now() < -60 * 1000) {
            setEventMsg("活动开始时间不能早于当前时间")
            return
          }
        }

        res = await fetch(`/api/events?id=${editingEventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            coverUrl,
            location,
            startTime: startTimeStr,
            endTime: startTimeStr,
            capacity: parseInt(capacity),
            category,
          }),
        })
      } else {
        const selectedDateTime = new Date(startTimeStr)
        if (selectedDateTime.getTime() - Date.now() < -60 * 1000) {
          setEventMsg("活动开始时间不能早于当前时间")
          return
        }

        res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            coverUrl,
            location,
            startTime: startTimeStr,
            endTime: startTimeStr,
            capacity: parseInt(capacity),
            category,
            organizerId: user.id,
          }),
        })
      }

      const data = await res.json()
      if (data.success) {
        toast.success(editingEventId ? "活动更新成功！" : "活动创建并发布成功！")
        handleCancelEdit()
        loadEventsData(user)
      } else {
        setEventMsg(data.message || (editingEventId ? "更新失败" : "创建失败"))
        toast.error(data.message || (editingEventId ? "更新失败" : "创建失败"))
      }
    } catch {
      setEventMsg("接口故障")
      toast.error("网络故障，操作失败")
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!user) return
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast.success("活动已成功删除")
        loadEventsData(user)
      } else {
        toast.error(data.message || "删除活动失败")
      }
    } catch {
      toast.error("网络异常，删除活动失败")
    }
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastEventId || !user) return
    setBroadcastLoading(true)
    setBroadcastMsg("")
    try {
      const res = await fetch(`/api/events/${broadcastEventId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizerId: user.id,
          title: broadcastTitle,
          content: broadcastContent,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("广播消息已成功群发给所有购票者！")
        setBroadcastContent("")
        setBroadcastEventId(null)
        setBroadcastTitle("")
        setBroadcastMsg("")
      } else {
        setBroadcastMsg(data.message || "群发广播失败")
        toast.error(data.message || "群发广播失败")
      }
    } catch {
      setBroadcastMsg("广播接口故障")
      toast.error("网络故障，广播发送失败")
    } finally {
      setBroadcastLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">活动发布与管理</h1>
        <p className="text-sm text-muted-foreground mt-1">创建校园活动、编辑活动属性以及向参与人发送广播消息</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* 左侧：发布与编辑表单 */}
        <div id="event-form-panel" className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-xs h-fit">
          <h2 className="text-base font-bold text-foreground mb-4">
            {editingEventId ? "📝 编辑活动信息" : "📣 发布全新校园活动"}
          </h2>
          <form onSubmit={handleCreateOrUpdateEvent} className="space-y-4">
            <FieldGroup className="space-y-3">
              <Field>
                <FieldLabel>活动名称</FieldLabel>
                <Input
                  type="text"
                  placeholder="输入活动主题..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-background text-foreground"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>活动类别</FieldLabel>
                  <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                    <SelectTrigger className="bg-background text-foreground">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-border bg-popover shadow-md">
                      <SelectGroup>
                        {(dbCategories.length > 0 ? dbCategories : [
                          { label: "学术讲座", value: "学术讲座" },
                          { label: "文体比赛", value: "文体比赛" },
                          { label: "社团活动", value: "社团活动" },
                        ]).map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>人数上限容量</FieldLabel>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>举办地点</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. 大礼堂 / 线上腾讯会议..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="bg-background text-foreground"
                />
              </Field>

              <Field>
                <FieldLabel>开始时间 (24小时制)</FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex h-9 cursor-pointer items-center justify-start gap-1.5 rounded-lg border border-border bg-background py-2 pr-2.5 pl-3 text-left text-xs text-muted-foreground outline-hidden transition-colors select-none hover:bg-muted",
                        !selectedDate && "text-muted-foreground/80"
                      )}
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground/85" />
                      {selectedDate ? (
                        format(selectedDate, "yyyy-MM-dd")
                      ) : (
                        "选择活动日期"
                      )}
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto rounded-lg border border-border bg-popover p-0 shadow-md"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        locale={zhCN}
                        className="bg-popover text-foreground"
                      />
                    </PopoverContent>
                  </Popover>

                  <Select value={selectedHour} onValueChange={handleHourChange}>
                    <SelectTrigger className="h-9 w-16 bg-background text-xs text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 rounded-lg border border-border bg-popover shadow-md">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const h = String(i).padStart(2, "0")
                        return (
                          <SelectItem key={h} value={h}>
                            {h} 时
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>

                  <Select value={selectedMinute} onValueChange={handleMinuteChange}>
                    <SelectTrigger className="h-9 w-16 bg-background text-xs text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 rounded-lg border border-border bg-popover shadow-md">
                      {Array.from({ length: 60 }).map((_, i) => {
                        const m = String(i).padStart(2, "0")
                        return (
                          <SelectItem key={m} value={m}>
                            {m} 分
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </Field>

              <Field>
                <FieldLabel>活动宣传海报 (可选)</FieldLabel>
                <FileUploader
                  value={uploadedFiles}
                  onChange={setUploadedFiles}
                  onUpload={handleImageUpload}
                  maxCount={1}
                  maxSize={2}
                  multiple={false}
                  accept="image/*"
                  className="border-dashed"
                />
              </Field>

              <Field>
                <FieldLabel>活动详细描述</FieldLabel>
                <Textarea
                  placeholder="输入活动详情、流程安排、注意事项等..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-background text-foreground"
                />
              </Field>

              {eventMsg && (
                <p className="text-xs font-semibold text-destructive">
                  ⚠️ {eventMsg}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="h-10 flex-1 cursor-pointer font-bold bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={!selectedDate || eventMsg === "活动开始时间不能早于当前时间"}
                >
                  {!editingEventId && <Plus className="inline-start shrink-0 mr-1.5 h-4 w-4" />}
                  {editingEventId ? "保存修改" : "确认发布活动"}
                </Button>
                {editingEventId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="h-10 cursor-pointer font-semibold"
                  >
                    取消编辑
                  </Button>
                )}
              </div>
            </FieldGroup>
          </form>
        </div>

        {/* 右侧：活动管理列表 */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col min-h-125">
          <h2 className="text-base font-bold text-foreground mb-4">📅 活动管理列表</h2>
          <div className="divide-y divide-border flex-1">
            {createdEvents.map((evt) => (
              <div key={evt.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div>
                  <h3 className="text-sm font-bold text-foreground/90">{evt.title}</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    地点: {evt.location} | 容量: {evt.capacity} 人 | 已售: {evt.bookedCount} 张
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartEdit(evt)}
                    className="flex h-8 items-center gap-1 px-3 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                    编辑活动
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBroadcastEventId(evt.id)
                      setBroadcastTitle(`关于活动《${evt.title}》的通知`)
                      setBroadcastContent("")
                      setBroadcastMsg("")
                    }}
                    className="flex h-8 items-center gap-1 px-3 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Megaphone className="h-3 w-3" />
                    群发消息
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/80 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除此活动吗?</AlertDialogTitle>
                        <AlertDialogDescription>此操作无法撤销，所有已订票将同步失效。</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteEvent(evt.id)}>
                          确认
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {createdEvents.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground/80">
                目前未发布任何活动
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 广播弹窗 */}
      <AlertDialog
        open={!!broadcastEventId}
        onOpenChange={(open) => {
          if (!open) {
            setBroadcastEventId(null)
            setBroadcastTitle("")
            setBroadcastContent("")
            setBroadcastMsg("")
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>群发广播通知</AlertDialogTitle>
              <AlertDialogDescription>向所有订购该活动门票的用户发送站内信通知。</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/80">通知标题</label>
                <Input
                  type="text"
                  placeholder="请输入通知标题，如：活动场地变更"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  className="mt-1 bg-background text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80">通知内容</label>
                <Textarea
                  placeholder="请输入通知的详细内容..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  required
                  rows={4}
                  className="mt-1 bg-background text-foreground"
                />
              </div>
              {broadcastMsg && (
                <p className={cn("text-xs font-semibold", broadcastMsg.includes("成功") ? "text-emerald-600" : "text-destructive")}>
                  {broadcastMsg}
                </p>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                onClick={() => {
                  setBroadcastEventId(null)
                  setBroadcastTitle("")
                  setBroadcastContent("")
                  setBroadcastMsg("")
                }}
                disabled={broadcastLoading}
              >
                取消
              </AlertDialogCancel>
              <Button type="submit" disabled={broadcastLoading} className="bg-brand text-brand-foreground hover:bg-brand/90">
                {broadcastLoading ? "发送中..." : "确定发送"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
