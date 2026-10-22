# UI_QA

验收日期：2026-10-22  
验收工具：`scripts/ui-qa.cjs`（puppeteer-core 25.15.0 + 本机 Microsoft Edge headless）  
服务：`npm run dev`，http://localhost:3000

## 1. 覆盖视口

- Desktop：1440 × 900
- Tablet：1024 × 768
- Mobile：390 × 844

任务要求的三种视口均已覆盖；移动端侧栏以 drawer 形式打开，导航以折叠菜单形式打开。

## 1.1 首页电影感 Hero 专项

设计参考（只参考构图、材质与信息密度，不复制设计）：

- Guomics（https://guomics.com/zh/）：主参考。深蓝全屏、居中标题、左上 logo 组、顶部中央标语、右上搜索/菜单、可交互粒子与滚动镜头。
- CELLxGENE（https://cellxgene.cziscience.com/）：科研数据门户的指标带、工具导航和目录层级。
- Arc Institute（https://arcinstitute.org/）：衬线大标题、细规则线、编辑式 research/news 排版。
- Human Cell Atlas（https://www.humancellatlas.org/）：机构型留白、mission statement 和科学图像的使用方式。
- EvolutionaryScale（https://www.evolutionaryscale.ai/）：单一大标题 + 低饱和分子点云 + 大量留白。
- AlphaFold, Google DeepMind（https://deepmind.google/technologies/alphafold/）：文字左、3D 标本右的分栏结构。
- Altos Labs（https://www.altoslabs.com/）：全幅科学视觉、单一使命陈述、极简导航。
- Alliance Creative / Awwwards（https://www.awwwards.com/inspiration/dna-alliance-creative）：近黑背景、细线框、衬线强调、克制发光。
- Bright Biotech / Awwwards（https://www.awwwards.com/sites/bright-biotech）：单一大 3D 主体、悬浮控制、少量界面元素。

检查结果：

| 检查项 | 结果 |
| --- | --- |
| Desktop 1440 Hero canvas | WebGL canvas 存在且非空；像素采样 `nonTransparent` 远大于阈值 |
| Canvas 动画 | 粒子缓慢漂移，相邻帧下采样像素有可见变化 |
| 鼠标交互 | 指针移动后粒子被推开，形成局部空洞（手动验证） |
| 滚动镜头 | 标题淡出，镜头绕染色体移动，粒子结构保持可读 |
| 表面细节与扫光 | 细法线纹理、虹彩高光、两条沿染色单体移动的扫描光；相邻帧高光位置变化 |
| 鼠标视差 | 相机/组旋转随 pointer 平滑变化 |
| 页面滚动 | 从 Hero 滚动到浅色内容区时，顶部导航由深色透明切换为浅色实底（手动验证） |
| Enter Atlas | 点击后出现推近/淡出遮罩，并导航到 `/atlas`（手动验证） |
| Mobile 390 Hero | 标题在上、染色体在中部，无横向溢出 |
| reduced motion | 不创建 WebGL canvas，改为静态 2D 粒子染色体封面 |
| WebGL fallback | 与 reduced motion 共用静态 2D 封面路径 |
| Console | 0 个 console error / pageerror |

## 2. 路由与页面检查

自动冒烟检查结果：**18/18 通过，0 个 console error，0 个 pageerror**。  
更细的筛选、选区、Preview API 等交互已手动验证，并由 `tests/api.test.ts` 与 `tests/provider.test.ts` 覆盖。

| 检查项 | 结果 |
| --- | --- |
| Home `/` | 200；电影感 Hero、搜索、工具索引、资源 scope、Featured datasets、界面预览、Release state 可见 |
| Datasets `/datasets` | 200；12 条合成记录、搜索/过滤/排序/分页可用 |
| Dataset search "lung" | 返回 2 条 lung 记录 |
| Dataset detail `/datasets/DEMO_LUNG_ADENO_01` | 200；元数据、阶段、QC、provenance 显示 |
| Cell Atlas `/atlas?dataset=...` | 200；数据集筛选后 30 cells in view |
| Atlas selection | 勾选细胞后显示 Selected cells、mean β、CpG 上下文 |
| Atlas preview API | POST `/api/v1/preview/predictions` 返回 200，显示 `Synthetic response` |
| Browser `?q=TP53` | 200；Gene overview、2 条 panel CpG |
| Browser `?q=cg00000029` | 200；显示 `Annotation withheld in demo`，不伪造坐标 |
| Browser `?q=NOTAREALGENE` | 200；显示 `No demo records found` |
| Compare `/compare` | 200；两组、group means、Δ heatmap、统计边界声明可见 |
| Compare preview API | POST `/api/v1/preview/compare` 返回 200，显示 `statistical_tests` |
| Downloads `/downloads` | 200；三个禁用下载产品、字段字典、API 示例 |
| Methods `/methods` | 200；评估边界、坐标约定、生命周期 |
| About `/about` | 200；数据政策、引用/联系方式占位 |
| Tablet 1024 | Datasets / Atlas 均 200 |
| Mobile 390 | Datasets / Atlas / Browser / Compare / Downloads 均 200 |
| Mobile filter drawer | 可打开、可关闭，包含 dataset/tissue/disease/cell type |
| Mobile navigation | 可打开，包含全部主导航和二级链接（手动验证） |
| 图表状态 | Loading / Empty / Error / Live demo 四态均可切换（手动验证） |

## 3. 截图

所有截图位于 `screenshots/`。路由/Hero/降级截图由 `npm run qa:ui` 重新生成；筛选、选区、Preview、图表四态与移动导航截图为手动补充。

### 桌面 1440

- `home-hero-1440.png`
- `home-scroll-900.png`
- `home-scroll-1750.png`
- `home-mouse-left.png`
- `home-mouse-right.png`
- `home-menu-1440.png`
- `home-content-1440.png`
- `home-content-2-1440.png`
- `home-content-3-1440.png`
- `home-content-4-1440.png`
- `home-full-1440.png`
- `home-reduced-1440.png`
- `home-1440.png`
- `datasets-1440.png`
- `datasets-search-1440.png`
- `datasets-filter-1440.png`
- `dataset-detail-1440.png`
- `atlas-1440.png`
- `atlas-dataset-1440.png`
- `atlas-methylation-1440.png`
- `atlas-selection-1440.png`
- `atlas-preview-1440.png`
- `atlas-state-loading-1440.png`
- `atlas-state-empty-1440.png`
- `atlas-state-error-1440.png`
- `browser-tp53-1440.png`
- `browser-withheld-1440.png`
- `browser-empty-1440.png`
- `compare-1440.png`
- `compare-preview-1440.png`
- `downloads-1440.png`
- `methods-1440.png`
- `about-1440.png`

长页面补充：`browser-tp53-full.png`（1440 × 2400）。

### 平板 1024

- `home-1024.png`
- `datasets-1024.png`
- `atlas-1024.png`

### 手机 390

- `home-hero-390.png`
- `home-content-390.png`
- `home-390.png`
- `home-menu-390.png`
- `datasets-390.png`
- `atlas-390.png`
- `atlas-filter-drawer-390.png`
- `browser-390.png`
- `compare-390.png`
- `downloads-390.png`

## 4. 验收中发现并修复的问题

| 问题 | 处理 |
| --- | --- |
| SVG `<title>` 使用多个 children 触发 React 警告，dev overlay 显示 1 issue | 改为单个模板字符串 |
| Loading 状态柱状骨架高度为 0，只剩一条短线 | 改为固定像素高度并填满图表区域 |
| Selected cells 表格 520px 最小宽在右栏溢出 | 降到 400px，四列在桌面右栏完整显示 |
| "1 cells" 文案 | 改为单复数判断 |
| 移动端 filter drawer 与固定 header 层级冲突 | drawer 层级提升至 z-60，并加 dialog/aria-modal |
| Datasets 表格在 1024 宽度裁切过多 | 最小宽 1040 → 980 |
| 无 favicon 导致 404 console error | 增加 `src/app/icon.svg` |

## 5. 残留问题与边界

- Datasets / Browser 的宽表在手机端使用横向滚动；已加 "Swipe horizontally" 提示。没有为小屏重做卡片式表格。
- 自定义 SVG/HTML 图表没有虚拟化；当前数据量（360 cells、12 datasets、8 CpGs）远低于性能阈值。百万级点需要 density tiles / decimation，见 `/methods`。
- 未做 Firefox/Safari 实机检查；本次只验证 Edge/Chromium。
- 未做完整 WCAG 2.2 AA 审计；已实现 label、focus ring、键盘可达的表格替代、aria-live、图表文字替代和对比度检查，但未使用屏幕阅读器实测。
- 路由级 `error.tsx` 未通过故障注入触发；图表 Error 预览已验证。
- 没有像素级视觉回归；截图用于人工检查。
- 没有真实数据、真实模型、真实下载；这是 Phase 0 的设计约束，不是缺陷。
- 首页粒子染色体是风格化示意标本，不是从 PDB/实验结构重建的分子模型；它的价值是建立入口识别度，不是结构生物学准确性。
- Three.js + EffectComposer/UnrealBloomPass 通过动态 import 加载，首屏 HTML 与文字先渲染；低配设备或 WebGL 不可用时使用静态 2D 封面。

## 6. 复现方式

```bash
npm install
npm run dev
# 另一个终端
npm run qa:ui
```

若 Edge 不在默认路径，可设置：

```powershell
$env:EDGE_PATH = "C:\path\to\msedge.exe"
$env:BASE_URL = "http://localhost:3000"
npm run qa:ui
```
