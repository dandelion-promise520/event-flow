"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
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

interface CategoryType {
  id: string;
  name: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

export default function CategoriesManagement() {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdminUser(curr);
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch {
      toast.error("加载分类数据失败");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentName.trim() || !adminUser) return;
    setSubmitting(true);

    try {
      const url = editingId ? `/api/categories?id=${editingId}` : "/api/categories";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: adminUser.id, name: currentName }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "修改分类成功" : "新增分类成功");
        setDialogOpen(false);
        setCurrentName("");
        setEditingId(null);
        loadCategories();
      } else {
        toast.error(data.message || "保存失败");
      }
    } catch {
      toast.error("网络故障，操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (cat: CategoryType) => {
    setEditingId(cat.id);
    setCurrentName(cat.name);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!adminUser) return;
    try {
      const res = await fetch(`/api/categories?id=${id}&adminId=${adminUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("删除分类成功");
        loadCategories();
      } else {
        toast.error(data.message || "删除分类失败");
      }
    } catch {
      toast.error("网络错误，删除分类失败");
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
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> 返回控制台
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">活动分类管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">在此处新增、编辑或删除校园活动选项卡及分类标签。</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setCurrentName("");
              setDialogOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus data-icon="inline-start" /> 添加分类
          </Button>
        </div>

        {/* 分类数据列表 */}
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/70 text-xs font-bold text-muted-foreground uppercase">
                <th className="p-4">分类名称</th>
                <th className="p-4">创建时间</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {categories.map((cat) => (
                <tr key={cat.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-4 font-semibold">{cat.name}</td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(cat.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(cat)}
                        className="h-8 px-2 text-xs"
                      >
                        <Pencil data-icon="inline-start" /> 编辑
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 data-icon="inline-start" /> 删除
                            </Button>
                          }
                        />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除该活动分类吗？</AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作将永久删除分类“{cat.name}”。若该分类下当前存在活动关联，系统将拦截删除以防止数据产生异常。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(cat.id)}>
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    暂无活动分类数据，请点击右上角添加。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 弹窗模态框 */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-foreground">
              {editingId ? "编辑活动分类" : "添加活动分类"}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>分类名称</FieldLabel>
                  <Input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    required
                    placeholder="请输入分类名称，如：户外拓展"
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
                      setCurrentName("");
                    }}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "正在保存..." : "保存"}
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
