# 目标站点初步分析

分析日期：2026-07-27
目标地址：<https://jubilant-library-370712.framer.app/>

## 页面概况

- 页面标题：`MakOS — Creative Portfolio Template`
- 页面类型：Framer 生成的单页创意作品集首页
- 动态方式：服务端预渲染 HTML，随后通过 React、Framer Runtime 和 Motion 水合
- 渲染后元素数量：213
- 首页图片数量：12
- 首屏网络资源数量：32（不含 Framer 编辑器 iframe 内继续加载的资源）
- 首次动态检查：0 个失败请求，0 条控制台消息

页面主要由 macOS 风格桌面、窗口、个人资料、作品卡片、社交链接和底部
Framer 品牌链接组成。交互和动效依赖 Framer Motion 及站点生成的 ES Module。

## 资源情况

- 图片：11 个位图资源和 1 个 SVG，来源为 `framerusercontent.com/images/`
- 字体：Inter 与 Inter Display，多字重、多语言分片，来源为
  `framerusercontent.com/assets/`
- 站点脚本：React、Motion、Framer Runtime、共享库及站点入口脚本，来源为
  `framerusercontent.com/sites/`
- 平台依赖：Framer 统计、编辑按钮、编辑器 iframe、Sentry 和编辑器鉴权请求
- 样式：核心页面样式以内联 CSS 为主；编辑器自身另行加载平台 CSS

后续静态化将下载页面实际使用的图片、字体和运行时代码，并剥离统计、编辑器、
Sentry、“Made in Framer”链接及其他与自托管无关的平台请求。

## 链接

首页渲染后可见的外部链接：

- Instagram
- X
- Behance
- Framer 品牌链接（待删除）

源码中声明的内部作品路由：

- `/works/champ-silencieux`
- `/works/elan-brut`
- `/works/la-ou-dort-l-eau`
- `/works/les-silences-miroirs`
- `/works/lisiere`
- `/works/revolte-douce`

这些详情页尚未下载。后续阶段将逐页动态抓取，成功页面改成本地目录链接，失败页面
记录到 README 的已知限制中。

## 抓取策略

1. 使用 `playwright-core` 驱动本机 Google Chrome，等待页面水合及网络空闲。
2. 保存渲染后 DOM、截图、网络响应、控制台信息和内部链接用于比对。
3. 根据真实网络清单下载资源，而不是只使用普通 `wget` 递归抓取。
4. 本地化资源后使用静态服务器和 Playwright 再次检查响应式布局及控制台错误。
