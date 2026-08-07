# Personal Website

这是从 Framer 作品集重建的可自托管静态网站。首页、6 个作品详情页、图片、字体、
CSS 和 JavaScript 均已保存到本地，不依赖 Framer 编辑器、统计、发布平台或
`framerusercontent.com` 运行时资源。

桌面端首页作品图标支持按住拖动，轻点仍可进入对应详情页；移动端保持触控滚动和
点击导航。

## 页面

- `/`
- `/works/champ-silencieux/`
- `/works/elan-brut/`
- `/works/la-ou-dort-l-eau/`
- `/works/les-silences-miroirs/`
- `/works/lisiere/`
- `/works/revolte-douce/`

原站中发现的 6 个内部页面均已下载并转换，没有暂时无法下载的内部页面。

## 本地预览

进入项目目录：

```bash
cd ~/Desktop/personal-website
python3 -m http.server 8000
```

浏览器打开：

```text
http://127.0.0.1:8000/
```

停止服务器时，在运行服务器的终端按 `Control + C`。

## 重新生成与检查

安装分析工具：

```bash
npm install
```

从已有本地素材重新生成静态页面：

```bash
npm run build
```

静态服务器运行期间执行自动验收：

```bash
npm run validate
```

验收覆盖首页、全部作品页、资源加载、控制台错误、Framer 请求、桌面窗口交互和移动端
横向溢出。

`npm run download-assets` 会依据 `analysis/` 中的动态抓取结果重新下载素材，需要联网；
日常修改和部署不需要执行。

## 上传到 Nginx

将以下内容完整上传到服务器站点目录，例如 `/var/www/personal-website`：

```text
index.html
assets/
works/
```

Nginx 站点配置示例：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    root /var/www/personal-website;
    index index.html;

    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    location ~* \.(?:css|js|png|jpg|jpeg|svg|webp|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

检查并重新加载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

生产环境建议再配置 HTTPS，例如使用 Certbot 申请 Let's Encrypt 证书。

### zhouying.cn

本仓库包含与当前 ECS 环境匹配的两阶段配置：

- `deploy/zhouying.cn.http.conf`：首次签发证书前的 HTTP 配置。
- `deploy/zhouying.cn.conf`：证书签发后的正式 HTTPS 配置。

正式站点目录为 `/var/www/zhouying.cn`，Nginx 配置目标为
`/etc/nginx/conf.d/zhouying.cn.conf`。证书路径为
`/etc/letsencrypt/live/zhouying.cn/`。

### 访问计数器

首页通过同源 `POST /api/visit` 记录访问次数。计数服务使用 Python 标准库和
SQLite，数据库保存在 `/var/lib/zhouying-counter/visits.sqlite3`，服务重启后数据仍会保留。

服务器端文件：

- `server/visit_counter.py` → `/opt/zhouying-counter/visit_counter.py`
- `deploy/zhouying-counter.service` → `/etc/systemd/system/zhouying-counter.service`
- `deploy/zhouying.cn.conf` → `/etc/nginx/conf.d/zhouying.cn.conf`

更新后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now zhouying-counter.service
sudo nginx -t
sudo nginx -s reload
```

## 目录说明

```text
assets/       本地图片、字体、CSS、JavaScript 和来源清单
works/        6 个本地作品详情页
server/       访问计数等轻量服务器端程序
scripts/      动态分析、资源下载、静态生成和自动验收工具
analysis/     人工分析报告；原始抓取和截图由脚本生成但不提交
index.html    静态首页
```

## 已知差异

- Framer 的 React/Motion 运行时已移除，原有动效由轻量原生 CSS/JavaScript 重建。
- 社交链接仍使用原模板中的 Instagram、X 和 Behance 通用地址，部署前应替换为真实账号。
- 原站可能随发布而变化；本仓库保留的是抓取和重建时的版本。
