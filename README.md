# The Call of the Stars — 官方网站部署与使用指南

此网站已升级为**动态网站**，新增了可以发布/编辑/删除文章的星空日志栏目，并支持读者实时发表留言。

## 📁 文件结构

```
website/
├── server.js                         ← Node.js Express 后端服务器
├── package.json                      ← 项目依赖配置
├── index.html                        ← 网站宣传主页
├── index.css                         ← 样式表（含主页与日志的所有样式）
├── index.js                          ← 主页交互脚本（星空动画、滚动效果）
├── blog.html                         ← 日志栏目页面（含列表、文章详情、留言板与管理面板）
├── blog.js                           ← 日志页面交互脚本（加载数据、提交留言、管理模块）
├── data/
│   └── db.json                       ← 轻量级 JSON 数据库文件（保存文章与留言）
└── assets/                           ← 图片资源
```

---

## 💻 本地运行

1. 安装依赖包：
   ```bash
   npm install
   ```
2. 启动本地服务器：
   ```bash
   npm start
   ```
3. 在浏览器中访问：`http://localhost:3000`

---

## 🚀 线上部署方案

因为升级为了动态网站，原有的 **GitHub Pages**、**Netlify 拖拽部署** 等纯静态托管方案无法运行 Node.js 后端服务器，也无法写入留言。

推荐以下两种适合 Node.js 动态应用的部署方案：

### 方案一：Render 部署（免费，推荐）

[Render.com](https://render.com) 是一家对开发者极其友好的云托管平台，可以直接拉取 GitHub 仓库并自动部署 Node.js 项目。

1. **将代码推送到 GitHub**：
   ```bash
   git add .
   git commit -m "Upgrade website to dynamic blog"
   git push origin main
   ```
2. **在 Render 创建 Web Service**：
   - 登录 Render，点击 **New** → **Web Service**。
   - 绑定你的 GitHub 账号，选择 `thecallofthestars` 仓库。
   - 配置如下：
     - **Runtime**：`Node`
     - **Build Command**：`npm install`
     - **Start Command**：`npm start`
     - **Instance Type**：`Free`
3. **设置持久化磁盘 (Persistent Disk)**：
   *由于 Render 免费实例的文件系统是临时性的（每次重启会清空留言），你需要为 JSON 数据库添加一个持久化磁盘。*
   - 进入你创建的 Web Service，点击左侧的 **Disks**。
   - 点击 **Add Disk**：
     - **Name**：`db-storage`
     - **Mount Path**：`/opt/render/project/src/data` (此路径将映射到项目的 `data` 目录)
     - **Size**：`1 GB` (足够几十万条留言)
4. **部署完成**：
   Render 会分配一个二级域名（如 `xxx.onrender.com`），访问该域名即可。

---

### 方案二：VPS 服务器部署 (如阿里云、腾讯云、腾讯轻量、DigitalOcean)

如果你有自己独立的 Linux 服务器，可以使用 PM2 守护进程来部署：

1. **克隆代码并安装依赖**：
   ```bash
   git clone git@github.com:wccoffeell-dot/thecallofthestars.git
   cd thecallofthestars
   npm install
   ```
2. **使用 PM2 在后台持续运行**：
   ```bash
   # 全局安装 pm2 (如果未安装)
   npm install -g pm2
   # 启动服务
   pm2 start server.js --name "stars-website"
   # 设置开机自启
   pm2 startup
   pm2 save
   ```
3. **配置 Nginx 反向代理**：
   将 80/443 端口的流量代理到本地的 `3000` 端口。

---

## 🔐 管理员使用说明

- **默认登录入口**：点击网站底部页脚的 **Admin Panel**，或直接在浏览器访问 `你的域名/admin`。
- **默认管理员密码**：`admin123`
- **修改密码**：登录后在顶部的金色管理员横幅中点击 **Change Password** 进行更改。
