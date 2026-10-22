# CPGMoE Atlas — Phase 0 网站骨架

一个可本地运行、可交互的学术数据门户原型，用于探索 **predicted**、panel-based、single-cell DNA methylation。首页采用 Guomics 风格的深色粒子入口，但主体是两条姐妹染色单体组成的可交互染色体，向内页过渡为浅色科研数据门户。所有页面、图表和 API 当前都只使用 **合成演示数据**。

> 重要边界：本仓库不读取真实人类 scRNA 文件，不运行 CPGMoE 推理，不生成甲基化图谱，不提供生产下载。所有 `predicted_beta` 都是 `is_synthetic_demo: true` 的界面契约演示值。

## 快速开始

环境：Node.js 18.18+（本机验证为 Node 24.16.0）、npm 11+。

```bash
npm install
npm run dev
```

打开 http://localhost:3000。

生产构建与本地预览：

```bash
npm run build
npm run start
```

质量检查：

```bash
npm run lint
npm test          # 32 个 Vitest 测试
npm run qa:ui     # 需要先运行 npm run dev；使用本机 Edge 生成截图
```

## 页面

| 路由 | 说明 |
| --- | --- |
| `/` | 首页：全局搜索、四个入口、审计占位指标、模型与证据边界 |
| `/datasets` | 搜索、多选过滤、排序、分页的合成数据集表 |
| `/datasets/[id]` | 数据集详情：元数据、阶段、QC、provenance、适用性与限制 |
| `/atlas` | 合成 UMAP、颜色映射、点选/框选、分组甲基化、Demo prediction API |
| `/browser` | Gene / CpG probe / GRCh38 region 查询、基因示意、分布图、基因组轨道占位 |
| `/compare` | 两组切换、群体均值、Δ 热图、无推断统计的边界声明 |
| `/downloads` | 禁用中的计划下载产品、字段字典、API 契约 |
| `/methods` | 方法、语义、评估边界、坐标约定、生命周期与治理 |
| `/about` | 定位、数据政策、引用与联系方式占位 |
| `/not-found`、`error.tsx`、`loading.tsx` | 404、路由错误和加载状态 |

## 首页 Hero

- 参考 Guomics（guomics.com）的入口语言：深蓝全屏、居中大标题、左上 logo 组、顶部中央标语、右上搜索与全屏菜单；不复制其粒子球，而是换成染色体主体。
- 主体由两条姐妹染色单体组成：约 14k 蓝色/白蓝粒子壳、暖色核心粒子、着丝粒处的黏连桥、半透明膜、内部双螺旋纤维和 Bloom 光晕。
- 鼠标靠近时粒子会被推开，形成可交互的“拨开染色体”效果；滚动时镜头绕行、标题淡出，进入下方数据平台。
- 使用 `three` + `EffectComposer` + `UnrealBloomPass`（来自 `three/examples/jsm`），通过 `next/dynamic` 延迟加载，不进入首页首屏初始 JS。
- `prefers-reduced-motion` 或 WebGL 不可用时，切换为同构图的静态 2D 粒子染色体封面。
- 页面在 1440 / 1024 / 390 三种视口检查；动画参数保持慢速，避免游戏化闪烁。

## 首页内容区

浅色部分参考 CELLxGENE、Arc Institute 与 Human Cell Atlas 的编辑式数据门户语言：

- 大字号衬线标题 + 正文 sans，减少等宽卡片堆叠。
- 左侧资源介绍与搜索，右侧是四个工具的编号索引。
- 资源范围指标：450K 面板、12 个合成数据集、审计中的人类细胞数 `—`。
- Featured datasets 以数据表而不是卡片展示，直接连到数据集详情。
- 三张可交互界面预览、Release state 列表、模型事实表和最终深色 CTA。

## API

所有响应包含 `data_mode: "synthetic_demo"`，并带 `X-Data-Mode` 响应头。

| 方法 | 端点 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/status` | 审计中状态；production counts 为 `null` |
| GET | `/api/v1/datasets` | `search`、重复 `tissue`/`disease`/`assay`、`cursor`、`limit` |
| GET | `/api/v1/datasets/{id}` | 数据集详情；未知 ID 返回 404 |
| GET | `/api/v1/cpgs?query=&assembly=GRCh38` | gene / probe / region 查询 |
| GET | `/api/v1/groups` | 按 dataset/tissue/cell_type 聚合的合成组均值 |
| GET | `/api/v1/models` | CPGMoE metadata；`checkpoint_hash` 为 `null` |
| GET | `/api/v1/schema` | 字段字典与坐标约定 |
| POST | `/api/v1/preview/predictions` | 合成预测预览；`checkpoint_loaded: false` |
| POST | `/api/v1/preview/compare` | 合成 Δ 预览；`statistical_tests: "unavailable_in_demo"` |

完整参数、状态码和示例见 [docs/API_CONTRACT.md](docs/API_CONTRACT.md)。

## 代码结构

```text
src/
├── app/                     # Next.js App Router 页面与 API
├── components/              # 导航、图表、表格、状态组件
├── lib/
│   ├── atlas-provider.ts    # AtlasDataProvider 接口 + Synthetic 实现
│   ├── schemas.ts           # Zod 运行时 schema
│   ├── coordinate-utils.ts  # 0-based half-open ↔ 1-based inclusive
│   ├── api.ts               # 统一响应/错误/limit 处理
│   ├── colors.ts            # Viridis 与分类色
│   └── data-mode.ts         # 单一数据模式来源
└── mock/
    ├── datasets.ts          # 12 条 DEMO_ 数据集
    ├── cells.ts             # 360 个确定性合成细胞
    └── methylation.ts       # 14 条 CpG 记录、11 个 demo gene、聚合工具
tests/                       # 坐标、provider、API 路由测试
scripts/ui-qa.cjs            # Edge + Puppeteer 截图/交互验收
docs/                        # 契约、状态模型、接入计划、限制
screenshots/                 # 1440 / 1024 / 390 截图
```

## Mock 数据

- 12 个 `DEMO_*` 数据集，`source = Synthetic demo`，细胞数和 QC 均为 illustrative 占位。
- 360 个合成细胞（每个数据集 30 个），确定性 PRNG，可重复渲染。
- 14 条 CpG 记录：12 条 `synthetic_window`（`cgDEMO0001`–`cgDEMO0012`），2 条 `annotation_withheld`（`cg00000029`、`cg00000030`）。
- 11 个 demo gene（TP53、EGFR、CDKN2A 等），坐标为 **illustrative demo window**，不是 curated transcript annotation。
- 所有预测值都是合成值；可信的真实值必须来自审计后的 provider。

## 设计说明

- 浅色 white/slate，主色 `#156E86`，RNA `#158F80`，DNA `#5065A8`。
- 甲基化连续色使用 Viridis；Δ 使用蓝–白–赭色发散色。没有红绿高低编码。
- 顶部固定细导航；桌面左侧轻量 filter，移动端变 drawer。
- 每个图表实现 `loading / empty / error / demo` 四种状态，可通过图表头部的 `State` 选择器检查。
- 所有预测值、组比较和 API preview 都带 `Synthetic demo` 标记。

## 截图

代表性截图（完整列表见 [UI_QA.md](UI_QA.md)）：

| 页面 | 桌面 1440 | 移动 390 |
| --- | --- | --- |
| Home Hero | `screenshots/home-hero-1440.png` | `screenshots/home-hero-390.png` |
| Home（reduced motion） | `screenshots/home-reduced-1440.png` | — |
| Datasets | `screenshots/datasets-1440.png` | `screenshots/datasets-390.png` |
| Dataset detail | `screenshots/dataset-detail-1440.png` | — |
| Cell Atlas | `screenshots/atlas-1440.png` | `screenshots/atlas-390.png` |
| Gene & CpG | `screenshots/browser-tp53-1440.png` | `screenshots/browser-390.png` |
| Compare | `screenshots/compare-1440.png` | `screenshots/compare-390.png` |
| Downloads | `screenshots/downloads-1440.png` | `screenshots/downloads-390.png` |
| Methods | `screenshots/methods-1440.png` | — |
| About | `screenshots/about-1440.png` | — |

## 明确不可用的功能

- 真实数据浏览、真实细胞计数、真实 QC、真实 license 判定。
- CPGMoE 推理、checkpoint 加载、embedding 生成。
- 下载生产 TSV/Parquet、批量 cell×CpG 矩阵。
- p-values、FDR、DMR 调用、临床或因果解释。
- 账号、上传、GPU 触发、生产数据库。

## 文档

- [REPO_AUDIT.md](REPO_AUDIT.md)：环境与仓库审计
- [UI_QA.md](UI_QA.md)：截图、交互、状态与残留问题
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
- [docs/DATA_STATE_MODEL.md](docs/DATA_STATE_MODEL.md)
- [docs/INTEGRATION_PLAN.md](docs/INTEGRATION_PLAN.md)
- [docs/LIMITATIONS.md](docs/LIMITATIONS.md)

## 许可与引用

仅用于研究与界面原型评估。页面中的引用、联系方式和机构标识均为占位；没有声明任何真实论文 DOI、发表状态或机构隶属关系。
