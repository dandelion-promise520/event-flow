import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../prisma/dev.db');

// 确认数据库已被推送且生成客户端
if (!fs.existsSync(dbPath)) {
  console.log('🚀 检测到首次运行，正在为您初始化 SQLite 数据库并导入测试数据...');
  try {
    // 运行 prisma db push 同步表结构并生成客户端，并运行 seed 填充初始数据
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('✅ 数据库初始化成功！');
  } catch (error) {
    console.error('❌ 初始化数据库失败:', error);
    process.exit(1);
  }
}
