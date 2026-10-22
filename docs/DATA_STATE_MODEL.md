# DATA_STATE_MODEL

## 1. 原则

网站把“文件存在”“细胞合格”“已编码”“已预测”“被排除”拆成独立状态。任何一个数字都必须能回溯到审计记录和计算脚本；不能把文件级记录数当成独立细胞数。

## 2. DataStatus

| 值 | 含义 | 是否可进入预测 |
| --- | --- | --- |
| `synthetic_demo` | 合成演示记录，不对应真实文件 | 仅 demo |
| `metadata_only` | 仅登记元数据，未通过 RNA QC | 否 |
| `rna_qc_passed` | 通过预设 RNA QC 阈值 | 候选 |
| `encoded` | 存在 latent representation | 候选 |
| `predicted` | 存在带 provenance 的 Full-S3 输出 | 已预测 |
| `restricted` | licence/consent 受限 | 否 |
| `excluded` | 明确排除 | 否 |

UI 用五个阶段展示：`Indexed`、`RNA-QC passed`、`Encoded`、`Predicted`、`Excluded`。`Excluded` 是终止分支，不是第五个递进阶段。

## 3. 计数器

`/api/v1/status` 的 `coverage` 字段：

| 字段 | 真实含义 | Phase 0 |
| --- | --- | --- |
| `indexed_cells` | 审计后可识别、去重后的细胞数 | `null` |
| `eligible_cells` | 满足 QC 与许可条件的细胞数 | `null` |
| `encoded_cells` | 已产生 latent representation 的细胞数 | `null` |
| `predicted_cells` | 有合格预测输出的细胞数 | `null` |

`null` 表示未建立，不是 0。首页和数据仪表盘在审计完成前显示 `—` 与 `Audit in progress`。

`catalogue.synthetic_datasets` 是 UI fixture（12），`catalogue.production_datasets` 为 `null`。

## 4. 数据集对象

```ts
type AtlasDataset = {
  dataset_id: string;
  collection_id?: string;
  title: string;
  species: "Homo sapiens";
  tissue?: string;
  disease?: string;
  assay?: string;
  n_cells?: number | null;
  n_donors?: number | null;
  source_url?: string;
  status: DataStatus;
  evidence_tier?: "A" | "B" | "C" | "unverified";
  license_status?: "approved" | "pending" | "restricted";
};
```

- `evidence_tier` 是 curator 质量分级，不是统计置信度。
- `license_status` 决定能否公开；`pending` 不等于允许。
- demo 的 `n_cells` 是 illustrative placeholder，页面用 `≈` 与 `*` 标注。

## 5. 预测对象

```ts
type PredictedMethylation = {
  model_id: string;
  dataset_id: string;
  cell_id?: string;
  group_id?: string;
  cpg_id: string;
  genome_build: "GRCh38";
  predicted_beta: number; // [0,1]
  n_cells_aggregated?: number;
  provenance_id: string;
  is_synthetic_demo: boolean;
};
```

- `predicted_beta` 是模型估计，不是 bisulfite 测序读数。
- `provenance_id` 必须能关联 model、checkpoint hash、输入数据集版本与审计记录。
- 组级值必须保留 `n_cells_aggregated`。

## 6. 合成/真实隔离

Phase 0：

- `DATA_MODE = "synthetic_demo"`。
- 所有响应 `data_mode = "synthetic_demo"`。
- 所有 `PredictedMethylation.is_synthetic_demo = true`。

未来切换真实数据：

1. 新建 `AuditedAtlasProvider`，从审计产物生成 dataset master 与 provenance。
2. 不修改 `SyntheticAtlasProvider` 的数据来“伪装”真实。
3. 不允许仅把 `is_synthetic_demo` 改成 `false`；必须替换 provider 并保留审计链。
4. CI 必须校验真实响应仍然通过 Zod schema，并新增 provenance 完整性检查。

## 7. 证据层级

| Tier | 用途 |
| --- | --- |
| A | 元数据、QC、来源最完整，优先用于公开 |
| B | 基本完整，需补充审计字段 |
| C | 信息不足或存在许可/来源风险 |
| unverified | 尚未审计，不得对外表述为合格 |

Demo 中的 tier 仅用于展示 UI 与筛选逻辑。
