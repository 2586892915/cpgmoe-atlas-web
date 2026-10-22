# INTEGRATION_PLAN

目标：在不重建前端的前提下，把 Phase 0 的合成 provider 替换为审计后的真实数据与受控预测服务。

## 1. 接入顺序

### Step 1 — 审计产物 → dataset master

输入：Human scRNA 深度审计的 dataset-level 表、文件清单、去重结果、QC、license/provenance。

输出：版本化的 `dataset_master`（Parquet/Postgres 均可），字段与 `AtlasDataset` 对齐。

验收：

- 每个 `n_cells` 可回溯到审计脚本与去重口径。
- `n_cells` 与文件级记录数分开存储。
- `license_status`、`evidence_tier`、`status` 不由前端推断。

### Step 2 — 实现 `AuditedAtlasProvider`

实现 `src/lib/atlas-provider.ts` 的 `AtlasDataProvider` 接口：

```ts
getStatus(), listDatasets(), getDataset(), searchCpgs(),
listGroups(), previewPredictions(), previewCompare(), getModels(), getSchema()
```

验收：

- 所有响应继续通过 `src/lib/schemas.ts` 的 Zod schema。
- `data_mode` 由真实发布状态生成，不是硬编码 `synthetic_demo`。
- 不存在“未知 query 自动编造记录”的 fallback。

### Step 3 — 预测服务

推荐拆分为内部服务，不直接从 Next.js 路由触发 GPU：

```text
web (Next.js) → prediction API (auth + quota) → queue → GPU worker
                                              → object store (Parquet/Zarr)
```

验收：

- checkpoint hash、model version、panel version 写入每条 prediction 的 provenance。
- `cell×CpG` 请求有数量上限与超时；不向浏览器返回百万级原始记录。
- 未授权用户不能触发推理。

### Step 4 — 存储分层

保持四类数据分离：

1. cell metadata catalog（Postgres / columnar analytics）
2. RNA embeddings（只读对象存储）
3. group-level predictions（Parquet 索引）
4. cell×CpG on-demand inference（队列 + 缓存）

验收：

- 列表页只读 catalog，不加载表达矩阵。
- 图表读取聚合结果，不在浏览器端聚合百万细胞。
- `/downloads` 的每个产品有 manifest、checksum、license 与版本号。

### Step 5 — 前端切换

- 关闭 `DemoBanner` 的唯一条件是审计完成且真实 provider 已通过验收。
- 首页 coverage 由 `/api/v1/status` 的真实计数填充；在此之前保持 `null`/`—`。
- 数据集表继续使用同一 UI，只替换数据源。
- Atlas 大规模渲染改用 density tiles / decimation；保留现有 selection 语义。
- Genome track 通过 wrapper 挂载 JBrowse 2；没有 curated annotation 时不显示假轨道。

### Step 6 — 回归与治理

- 单元测试：schema、坐标转换、provider、API。
- 契约测试：真实 provider 必须满足同一组响应 schema。
- UI QA：1440/1024/390 三视口 + loading/empty/error/demo 四态。
- 安全：CSP、rate limit、auth、审计日志、依赖扫描。
- 法务：逐数据集 license/consent 审核；未通过者保持 `restricted`/`excluded`。

## 2. 不允许的做法

- 只把 `is_synthetic_demo` 改为 `false`。
- 用 UI 假数字填充生产 coverage。
- 把文件级记录数当独立细胞数。
- 为未知 probe 伪造 hg38 坐标。
- 在 Next.js route handler 内直接跑长 GPU 推理。
- 未审计就把数据标记为 public 或启用下载。

## 3. 可插拔插槽

| 插槽 | 当前实现 | 未来实现 |
| --- | --- | --- |
| `AtlasDataProvider` | SyntheticAtlasProvider | AuditedAtlasProvider + prediction service |
| Embedding renderer | SVG circles（360 cells） | density tiles / canvas / deck.gl |
| Genome track | 自绘示意轨道 | JBrowse 2 dynamic import |
| Downloads | 禁用按钮 | manifest + 签名 URL |
| Auth | 无 | 研究账号/API key + quota |
