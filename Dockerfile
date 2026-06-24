# 1. 依赖阶段
FROM node:20-alpine AS deps
# 安装 Python 和 C++ 编译工具以防 better-sqlite3 编译失败
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖配置
COPY package.json pnpm-lock.yaml .npmrc ./
# 复制 prisma 文件夹以便生成 client
COPY prisma ./prisma

# 安装依赖
RUN pnpm install --frozen-lockfile

# 2. 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖和生成的 client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/prisma ./prisma
COPY . .

# 设置构建时环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建项目
RUN pnpm build

# 3. 运行阶段
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制编译产物和必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

EXPOSE 3000

# 启动容器时，先执行数据库同步和填充，然后启动服务
CMD ["sh", "-c", "node scripts/setup-db.js && pnpm start"]
