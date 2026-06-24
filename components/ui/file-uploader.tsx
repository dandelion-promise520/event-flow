"use client"

import * as React from "react"
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  status: "ready" | "uploading" | "success" | "error"
  progress?: number
  url?: string
  error?: string
  rawFile?: File
  hash?: string
}

async function calculateHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

interface FileUploaderProps {
  value?: UploadFile[]
  onChange?: (files: UploadFile[]) => void
  onUpload?: (file: UploadFile, onProgress: (progress: number) => void) => Promise<{ url: string } | void>
  maxCount?: number
  accept?: string // e.g. "image/*,.pdf"
  maxSize?: number // in MB
  multiple?: boolean
  className?: string
}

export function FileUploader({
  value = [],
  onChange,
  onUpload,
  maxCount = 5,
  accept,
  maxSize = 10,
  multiple = true,
  className,
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFiles = React.useCallback(
    async (rawFiles: FileList) => {
      let filesArray = Array.from(rawFiles)
      const initialCount = filesArray.length

      // 1. Accept type filter
      if (accept) {
        const acceptTypes = accept.split(",").map((t) => t.trim())
        filesArray = filesArray.filter((file) => {
          return acceptTypes.some((type) => {
            if (type.startsWith(".")) {
              return file.name.endsWith(type)
            }
            if (type.endsWith("/*")) {
              return file.type.startsWith(type.replace("/*", ""))
            }
            return file.type === type
          })
        })

        if (initialCount > 0 && filesArray.length === 0) {
          toast.error(`文件格式不正确，仅支持: ${accept}`)
          return
        }
      }

      // 2. Max size filter
      filesArray = filesArray.filter((file) => {
        const sizeInMB = file.size / (1024 * 1024)
        if (sizeInMB > maxSize) {
          toast.error(`文件 "${file.name}" 超过限制的 ${maxSize}MB`)
          return false
        }
        return true
      })

      // 3. Max count filter
      if (maxCount && value.length + filesArray.length > maxCount) {
        filesArray = filesArray.slice(0, maxCount - value.length)
        toast.error(`最多只能上传 ${maxCount} 个文件`)
      }

      if (filesArray.length === 0) return

      // 4. Duplicate check via SHA-256 Hash
      const filesWithHash: { file: File; hash: string }[] = []
      for (const file of filesArray) {
        try {
          const hash = await calculateHash(file)
          const isDuplicate = value.some((f) => f.hash === hash)
          if (isDuplicate) {
            toast.warning(`文件 "${file.name}" 与上传列表中的现有文件完全一致，已自动过滤！`)
            continue
          }
          filesWithHash.push({ file, hash })
        } catch {
          // Fallback if browser doesn't support SubtleCrypto or arrayBuffer fails
          filesWithHash.push({ file, hash: "" })
        }
      }

      if (filesWithHash.length === 0) return

      const newUploadFiles: UploadFile[] = filesWithHash.map(({ file, hash }) => {
        const isImage = file.type.startsWith("image/")
        return {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          status: onUpload ? "uploading" : "success",
          progress: onUpload ? 0 : 100,
          rawFile: file,
          hash,
          url: isImage ? URL.createObjectURL(file) : undefined,
        }
      })

      const updatedValue = [...value, ...newUploadFiles]
      onChange?.(updatedValue)

      // 5. Upload process
      if (onUpload) {
        newUploadFiles.forEach(async (uploadFile) => {
          try {
            const result = await onUpload(uploadFile, (progress) => {
              onChange?.(
                updatedValue.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress } : f
                )
              )
            })
            // Success
            onChange?.(
              updatedValue.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: "success", progress: 100, url: result?.url }
                  : f
              )
            )
          } catch (err) {
            // Error
            onChange?.(
              updatedValue.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "error",
                      error: err instanceof Error ? err.message : "上传失败",
                    }
                  : f
              )
            )
          }
        })
      }
    },
    [value, onChange, onUpload, maxCount, accept, maxSize]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleRemove = (id: string) => {
    const fileToRemove = value.find((f) => f.id === id)
    if (fileToRemove?.url && fileToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(fileToRemove.url)
    }
    const updated = value.filter((f) => f.id !== id)
    onChange?.(updated)
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  return (
    <div className={cn("space-y-3 w-full", className)}>
      {value.length < maxCount && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px]",
            isDragActive
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept={accept}
            multiple={multiple}
            className="hidden"
          />
          <div className="p-3 bg-muted rounded-full mb-2 text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">点击上传，或将文件拖拽到此处</p>
          <p className="text-xs text-muted-foreground mt-1">
            {accept ? `支持格式: ${accept}` : "支持任意文件"} (最大 {maxSize}MB)
          </p>
        </div>
      )}

      {value.length > 0 && (
        <div className="w-full">
          {maxCount === 1 && value[0].type?.startsWith("image/") && value[0].url ? (
            <div className="relative group rounded-xl border border-border overflow-hidden bg-muted/20 dark:bg-muted/5 flex items-center justify-center p-2 max-w-sm w-full mx-auto min-h-[160px] max-h-[260px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value[0].url}
                alt={value[0].name}
                className={cn(
                  "max-w-full max-h-[240px] rounded-lg object-contain transition-transform duration-300",
                  value[0].status === "uploading" ? "blur-xs opacity-50" : "group-hover:scale-[1.02]"
                )}
              />

              {value[0].status === "uploading" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-background/40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <div className="w-24 bg-muted rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-primary h-1 rounded-full transition-all duration-300"
                      style={{ width: `${value[0].progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1.5 font-medium">
                    正在上传 {value[0].progress || 0}%
                  </span>
                </div>
              ) : value[0].status === "error" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-destructive/10 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-destructive mb-1" />
                  <span className="text-xs text-destructive font-medium text-center truncate w-full px-2" title={value[0].error}>
                    {value[0].error || "上传失败"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] mt-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => handleRemove(value[0].id)}
                  >
                    移除并重试
                  </Button>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-xl">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-8 px-3 font-semibold text-xs cursor-pointer shadow-md rounded-lg"
                      onClick={() => handleRemove(value[0].id)}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      移除海报
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 rounded-md p-1.5 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate max-w-[calc(100%-16px)]">
                    <span>{value[0].name}</span>
                    {value[0].size > 0 && <span className="ml-2 opacity-80">({formatBytes(value[0].size)})</span>}
                  </div>
                </>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {value.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card text-card-foreground text-sm hover:shadow-sm transition-all"
                >
                  <div className="flex items-center space-x-3 overflow-hidden mr-2 flex-1">
                    {/* 缩略图预览 */}
                    <div className="h-10 w-10 rounded-lg bg-muted border overflow-hidden shrink-0 flex items-center justify-center relative">
                      {file.type.startsWith("image/") && file.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate text-foreground">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>

                      {file.status === "uploading" && (
                        <div className="w-full bg-muted rounded-full h-1 mt-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-1 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress || 0}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {file.status === "uploading" && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {file.status === "success" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {file.status === "error" && (
                      <span title={file.error}>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemove(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
