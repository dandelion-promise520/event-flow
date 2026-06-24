"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, ArrowLeft, Pencil, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const roleOptions = [
  { label: "管理员", value: "ADMIN" },
  { label: "活动组织者", value: "ORGANIZER" },
  { label: "普通学生", value: "USER" },
];

const filterRoleOptions = [
  { label: "全部角色", value: "all" },
  ...roleOptions,
];

export default function AccountsManagement() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 表单字段
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [password, setPassword] = useState("");

  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const stored = localStorage.getItem("campus_user");
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    const curr = JSON.parse(stored);
    if (curr.role !== "ADMIN") {
      toast.error("您不是管理员，无权访问此页面！");
      window.location.href = "/dashboard";
      return;
    }
    setAdminUser(curr);
    loadUsers(curr.id, searchQuery, roleFilter);
  }, [searchQuery, roleFilter]);

  const loadUsers = async (adminId: string, search: string, roleVal: string) => {
    try {
      const res = await fetch(`/api/users?adminId=${adminId}&search=${encodeURIComponent(search)}&role=${roleVal}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch {
      toast.error("获取账号列表数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setRole("USER");
    setPassword("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: UserType) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword(""); // 编辑时不强制输入密码
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role || !adminUser) return;
    setSubmitting(true);

    try {
      const url = editingId ? `/api/users?id=${editingId}` : "/api/users";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminUser.id,
          name: name.trim(),
          email: email.trim(),
          role,
          password: password.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "修改资料成功" : "创建账号成功");
        setDialogOpen(false);
        loadUsers(adminUser.id, searchQuery, roleFilter);
      } else {
        toast.error(data.message || "操作失败");
      }
    } catch {
      toast.error("网络连接失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminUser) return;
    try {
      const res = await fetch(`/api/users?id=${id}&adminId=${adminUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("账号删除成功");
        loadUsers(adminUser.id, searchQuery, roleFilter);
      } else {
        toast.error(data.message || "删除账号失败");
      }
    } catch {
      toast.error("删除账号接口错误");
    }
  };

  if (loading || !adminUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> 返回控制台
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">系统账号管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">在此对系统内部的管理员（ADMIN）、主办方（ORGANIZER）和普通学生（USER）进行维护。</p>
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 self-start sm:self-auto">
            <Plus className="size-4" /> 新建账号
          </Button>
        </div>

        {/* 筛选与搜索工具条 */}
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="搜索姓名、邮箱"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full bg-background text-sm sm:w-64"
          />
          <Select
            value={roleFilter}
            onValueChange={(val) => setRoleFilter(val || "all")}
          >
            <SelectTrigger className="h-9 w-40 bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-md">
              <SelectGroup>
                {filterRoleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* 用户列表表格 */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/70 text-xs font-bold text-muted-foreground uppercase">
                <th className="p-4">姓名</th>
                <th className="p-4">邮箱 (账号)</th>
                <th className="p-4">角色</th>
                <th className="p-4">注册时间</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-4 font-semibold">{u.name}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.role === "ADMIN"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
                          : u.role === "ORGANIZER"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                      }`}
                    >
                      {u.role === "ADMIN" ? "管理员" : u.role === "ORGANIZER" ? "组织者" : "普通学生"}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(u)} className="h-8 px-2 text-xs">
                        <Pencil className="size-3 mr-1" /> 编辑
                      </Button>
                      {u.id !== adminUser.id ? (
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-3 mr-1" /> 删除
                              </Button>
                            }
                          />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-destructive">确认删除该系统账号吗？</AlertDialogTitle>
                              <AlertDialogDescription className="text-left">
                                <span className="font-bold text-destructive inline-flex items-center gap-1"><AlertTriangle className="size-3.5 shrink-0" />警告：</span>
                                删除账号“{u.name} ({u.email})”将执行级联删除。这会同步彻底删除其发布的全部活动、历史门票记录等。此操作具有极高数据风险，且无法恢复。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                确认强行删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    未找到匹配的系统用户。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新建/编辑账号弹窗 */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-foreground">
              {editingId ? "编辑系统账号资料" : "新建系统账号"}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>姓名/名称</FieldLabel>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="姓名或协会名称"
                    className="bg-background"
                  />
                </Field>
                <Field>
                  <FieldLabel>电子邮箱 (登录账号)</FieldLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="username@domain.com"
                    className="bg-background"
                  />
                </Field>
                <Field>
                  <FieldLabel>系统角色</FieldLabel>
                  <Select value={role} onValueChange={(val) => setRole(val || "USER")}>
                    <SelectTrigger className="w-full bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-md">
                      <SelectGroup>
                        {roleOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>
                    {editingId ? "重置密码 (留空则不修改)" : "登录密码 (留空默认为 admin123)"}
                  </FieldLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingId ? "输入新密码" : "默认为 admin123"}
                    className="bg-background"
                  />
                </Field>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingId(null);
                    }}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "正在保存..." : "确认"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
