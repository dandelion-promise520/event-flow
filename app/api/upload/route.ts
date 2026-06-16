import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "未找到上传的文件" }, { status: 400 });
    }

    // 校验文件类型，只允许图片
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, message: "仅支持上传图片文件" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 基于文件内容计算 SHA-256 哈希
    const fileHash = createHash("sha256").update(buffer).digest("hex");
    const originalName = file.name;
    const extension = originalName.split(".").pop() || "png";
    const filename = `${fileHash}.${extension}`;

    // 保存到 public/uploads 目录
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // 返回图片的可访问 URL
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传过程中发生错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
