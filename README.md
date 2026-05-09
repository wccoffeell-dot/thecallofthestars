# The Call of the Stars — 官方网站部署指南

## 📁 文件位置

网站所有文件位于：

```
/Users/wangjh/Documents/Maurice/wchen/亚马逊/website/
```

### 文件结构

```
website/
├── index.html                        ← 主页面（唯一的HTML文件）
├── index.css                         ← 样式表（颜色、排版、动画）
├── index.js                          ← 交互脚本（星空动画、滚动效果）
└── assets/                           ← 图片资源
    ├── cover-en-front.png            ← 英文版封面（前封面）
    ├── cover-zh-traditional-front.jpg ← 繁体中文版封面（前封面）
    ├── cover-zh-simplified.jpg       ← 简体中文版封面
    ├── author.png                    ← 作者照片
    ├── cover-en.png                  ← 英文版完整封面（备份）
    └── cover-zh-traditional.jpg      ← 繁体中文完整封面（备份）
```

> **重要：** 部署时只需上传整个 `website/` 文件夹的内容即可。不需要任何编译或构建步骤。

---

## 🚀 部署方案

### 方案一：GitHub Pages（免费，推荐）

**适合：** 零成本、自动部署、可绑定自定义域名

1. **创建 GitHub 账号**（如果没有）：https://github.com
2. **创建新仓库**：
   - 点击 "New repository"
   - 仓库名建议：`callofthestars`（或你喜欢的名字）
   - 设为 Public
3. **上传文件**：
   ```bash
   cd /Users/wangjh/Documents/Maurice/wchen/亚马逊/website
   git init
   git add .
   git commit -m "The Call of the Stars official website"
   git branch -M main
   git remote add origin https://github.com/你的用户名/callofthestars.git
   git push -u origin main
   ```
4. **启用 GitHub Pages**：
   - 进入仓库 → Settings → Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 `main`，文件夹选择 `/ (root)`
   - 点击 Save
5. **访问网站**：
   - 几分钟后即可通过 `https://你的用户名.github.io/callofthestars/` 访问

**绑定自定义域名**（可选）：
- 在 Settings → Pages → Custom domain 中输入你的域名
- 在域名服务商处添加 CNAME 记录指向 `你的用户名.github.io`

---

### 方案二：Netlify（免费，最简单）

**适合：** 拖拽即部署，自带 HTTPS

1. 访问 https://www.netlify.com 并注册
2. 登录后，直接将 `website/` 文件夹 **拖拽** 到 Netlify 页面中
3. 等待几秒钟，网站即刻上线
4. Netlify 会分配一个免费域名（如 `xxx.netlify.app`）
5. 可在 Site settings → Domain 中绑定自定义域名

---

### 方案三：Vercel（免费）

1. 访问 https://vercel.com 并注册
2. 点击 "New Project" → "Import" 或直接上传文件夹
3. 自动部署完成后即可访问

---

### 方案四：传统服务器（VPS / 虚拟主机）

如果你已有服务器或虚拟主机：

1. 通过 FTP / SFTP 将 `website/` 文件夹中的所有文件上传到服务器的 web 根目录（通常是 `/var/www/html/` 或 `public_html/`）
2. 确保 `index.html` 在根目录下
3. 文件结构应为：
   ```
   /你的web根目录/
   ├── index.html
   ├── index.css
   ├── index.js
   └── assets/
       ├── cover-en-front.png
       ├── ...
   ```
4. 访问你的域名即可看到网站

---

## 🔗 修改 Amazon 购买链接

打开 `index.html`，搜索 `amazon.com/dp/B0GQBWXP5F`，将其替换为各版本的实际链接：

| 版本 | 搜索 ID | 替换为 |
|------|---------|--------|
| 繁體中文 Kindle | `btn-amazon-zh-tw` | 繁体版 Amazon 链接 |
| English Kindle | `btn-amazon-en-ebook` | 英文 Kindle 版链接 |
| English Paperback | `btn-amazon-en-paperback` | 英文 Paperback 版链接 |
| 主页按钮 | `btn-amazon-main` | 英文版主链接 |

---

## 🌐 域名建议

推荐注册一个专属域名，例如：
- `callofthestars.com`
- `thecallofthestars.com`
- `callofthestars.net`

可在以下平台购买域名：
- [Namecheap](https://www.namecheap.com) — 价格实惠
- [Google Domains](https://domains.google) — 简单易用
- [GoDaddy](https://www.godaddy.com) — 老牌服务商

---

## 📝 日后修改内容

- **修改文字**：直接编辑 `index.html`，用任何文本编辑器打开即可
- **修改样式**：编辑 `index.css`
- **替换图片**：将新图片放入 `assets/` 文件夹，保持同名即可
- **修改后重新部署**：GitHub Pages 和 Netlify 支持自动更新，重新 push 或上传即可

---

*此网站为纯静态页面（HTML + CSS + JavaScript），无需数据库、无需后端服务器，可部署在任何支持静态文件的平台上。*
