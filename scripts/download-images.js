import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, '../public/images');

const images = [
  { url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800", filename: "geek-marathon.jpg" },
  { url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800", filename: "ai-forum.jpg" },
  { url: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800", filename: "board-games.jpg" },
  { url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800", filename: "singer-contest.jpg" },
  { url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800", filename: "music-festival.jpg" },
  { url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800", filename: "badminton.jpg" },
  { url: "https://images.unsplash.com/photo-1502224562085-639556652f33?w=800", filename: "night-run.jpg" },
];

async function download(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.statusText}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));
}

async function main() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Created directory: ${targetDir}`);
  }

  console.log('⏳ 开始下载图片到本地 public/images 文件夹...');
  for (const img of images) {
    const destPath = path.join(targetDir, img.filename);
    try {
      console.log(`Downloading ${img.filename}...`);
      await download(img.url, destPath);
      console.log(`✅ Success: ${img.filename}`);
    } catch (error) {
      console.error(`❌ Failed to download ${img.filename}:`, error.message);
    }
  }
  console.log('🎉 所有图片下载流程处理完成！');
}

main();
