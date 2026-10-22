# REPO_AUDIT

审计时间：2026-10-22（Asia/Shanghai）  
审计范围：`C:\Users\Administrator\Documents\Codex\2026-10-22\n-k` 及本机运行环境。

## 1. 操作系统与运行时

| 项目 | 结果 |
| --- | --- |
| OS | Microsoft Windows 10 专业版 10.0.19045，64 位 |
| Shell | PowerShell |
| Node.js | v24.16.0 |
| npm | 11.13.0 |
| Git | 2.54.0.windows.1 |
| 浏览器 | Microsoft Edge（`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`）、Google Chrome |
| 端口 3000 / 3001 / 3010 / 5173 / 8080 | 初始均空闲 |

## 2. 既有仓库检查

- 工作目录初始只包含 `outputs/` 与 `work/`，没有 `package.json`、`.git`、Next.js/Vite 项目或既有网站代码。
- 未发现需要保留或迁移的既有 UI 框架。
- 未触碰用户业务文件、`.env`、审计目录或真实 scRNA 数据。
- 结论：新建独立目录 `outputs/cpgmoe-atlas-web/`，不做覆盖式改造。

## 3. 技术选型

按任务书要求使用 Next.js App Router + TypeScript + Tailwind CSS，并锁定版本：

| 包 | 版本 | 备注 |
| --- | --- | --- |
| next | 15.5.28 | 15.5.4 存在 CVE-2025-66478；升级到同系列修补版 |
| react / react-dom | 19.1.1 | 与 Next 15.5 兼容 |
| typescript | 5.8.3 | `tsc --noEmit` 通过 |
| tailwindcss | 3.4.17 | 稳定 v3 配置 |
| zod | 3.25.76 | 运行时 schema 校验 |
| lucide-react | 1.61.0 | 图标 |
| three | 0.186.1 | 点云、shader、后处理 |
| vitest | 3.2.4 | 单元/API 测试 |
| puppeteer-core | 25.15.0 | 仅 devDependency，驱动本机 Edge 做 UI QA |

`package-lock.json` 已提交到项目目录。没有使用未授权字体、图库、UI 服务或机构 logo。

## 4. 安全与隔离

- 网站代码独立于 Human scRNA 审计任务；没有读取 `/data/...`、没有访问审计输出、没有提交 GPU 作业。
- 没有真实数据、donor ID、token、secret 或 `.env`。
- 没有账号系统、上传入口或可触发 GPU 推理的接口。
- 所有 preview API 明确返回 `checkpoint_loaded: false` 与 `is_synthetic_demo: true`。
- 开发服务器仅绑定本机默认端口 3000；生产预览使用 3001 时未成功启动（`.next` 被 dev 覆盖），不影响交付。

## 5. 初始验证

- `npx tsc --noEmit`：通过。
- `npm test`：3 个测试文件、32 个测试通过。
- `npm run build`：通过，12 个静态页面 + 9 个动态 API 路由。
- `npm run qa:ui`：页面、Hero canvas、reduced-motion 等检查全部通过，0 个 console error。

首页 3D 使用 `three/examples/jsm/postprocessing/EffectComposer.js`、`RenderPass.js` 与 `UnrealBloomPass.js`，不额外引入 R3F、drei 或后处理 npm 包。粒子渲染通过 `next/dynamic` 延迟加载，静态 2D canvas 作为 reduced-motion/WebGL fallback。

## 6. 依赖安全审计

- 使用 `npm audit --omit=dev --registry=https://registry.npmjs.org` 检查；本机默认 npmmirror 镜像不实现 audit 端点。
- 已将 Next.js 从 15.5.4 升级到 15.5.28，规避 CVE-2025-66478。
- 剩余 2 条公告（1 moderate、1 high）来自 Next 15.5.28 内置的 `postcss <= 8.5.22`（XSS / sourceMappingURL 文件读取）。这些是构建期 CSS 处理路径，当前站点只处理项目自身静态 CSS，不接受用户 CSS 或 source map。官方修复要求升级到 Next 16.4.2（breaking change），未在本 Phase 0 交付中执行；上线前应评估升级。
- `sharp` 未作为直接依赖安装；`npm audit fix --omit=dev` 后已不再出现在生产依赖列表中。
