# API_CONTRACT

Base path：`/api/v1`  
数据模式：`synthetic_demo`  
响应头：`X-Data-Mode: synthetic_demo`、`Cache-Control: no-store`

## 1. 通用不变量

1. 每个响应体都包含 `data_mode: "synthetic_demo"`。
2. 每个预测值都包含 `is_synthetic_demo: true`。
3. preview 响应必须包含 `checkpoint_loaded: false`。
4. 没有任何真实数据、donor identifier、上传内容或 GPU 调用。
5. 所有响应在返回前通过 Zod schema 校验；校验失败由统一错误处理返回 500。

## 2. 错误格式

```json
{
  "data_mode": "synthetic_demo",
  "error": {
    "code": "dataset_not_found",
    "message": "Unknown dataset: DEMO_MISSING",
    "details": {}
  }
}
```

| HTTP | code | 场景 |
| --- | --- | --- |
| 400 | `invalid_request` | Zod 校验失败 |
| 400 | `invalid_limit` | `limit` 非正整数 |
| 400 | `unsupported_assembly` | `assembly != GRCh38` |
| 404 | `dataset_not_found` | 未知 dataset ID |
| 404 | `cpg_not_found` | 未知 CpG ID |
| 409 | `dataset_excluded` | 对 excluded 数据集请求预测 |
| 500 | `internal_error` | 未预期异常 |

## 3. 读端点

### `GET /status`

返回审计中状态。`coverage` 的四个计数全部为 `null`，不是 0。

```json
{
  "data_mode": "synthetic_demo",
  "status": "prototype",
  "audit_state": "in_progress",
  "catalogue": { "synthetic_datasets": 12, "production_datasets": null },
  "coverage": {
    "indexed_cells": null,
    "eligible_cells": null,
    "encoded_cells": null,
    "predicted_cells": null
  }
}
```

### `GET /datasets`

参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `search` | string | 标题、ID、tissue、disease、assay、cell type 的子串匹配 |
| `tissue` | repeatable string | 多选 OR |
| `disease` | repeatable string | 多选 OR |
| `assay` | repeatable string | 多选 OR |
| `cursor` | opaque string | base64url offset；客户端不得解析 |
| `limit` | integer | 1–50，默认 10 |

响应包含 `items`、`total`、`limit`、`next_cursor`、`facets`。`items` 与 `DatasetDetail` 同构。

### `GET /datasets/{id}`

返回 `{ data_mode, generated_at, dataset }`。未知 ID 返回 404。

### `GET /cpgs`

参数：

| 参数 | 说明 |
| --- | --- |
| `query`（或 `q`） | `TP53` / `cg00000029` / `chr17:7,668,001-7,690,000` |
| `assembly` | 固定 `GRCh38` |

响应：

```json
{
  "data_mode": "synthetic_demo",
  "query": "TP53",
  "query_type": "gene",
  "gene": { "gene_symbol": "TP53", "coordinate_status": "illustrative" },
  "items": [
    {
      "cpg_id": "cgDEMO0001",
      "annotation_status": "synthetic_window",
      "start": 7668400,
      "end": 7668402
    }
  ],
  "empty_reason": null
}
```

`annotation_withheld` 的 probe 返回 `chrom/start/end = null`，不伪造真实坐标；`empty_reason` 解释原因。未知 query 返回空数组和明确原因。

### `GET /groups`

参数：`dataset_id`、`tissue`、`cell_type`、`cpg_id`（可选）。

返回按 cell type 分组的合成均值：

```json
{
  "group_id": "cell_type:Epithelial",
  "n_cells": 34,
  "cpg_id": "cgDEMO0001",
  "mean_predicted_beta": 0.314,
  "aggregation": "mean_of_synthetic_cell_predictions",
  "is_synthetic_demo": true
}
```

### `GET /models`

返回 CPGMoE 的 metadata；`checkpoint_hash: null`，`release_status: "research_preview"`，`prediction_semantics: "predicted_beta"`。

### `GET /schema`

返回坐标约定和字段字典：

```json
{
  "coordinate_convention": {
    "internal": "0-based half-open",
    "ui": "1-based inclusive",
    "genome_build": "GRCh38"
  }
}
```

## 4. Preview 端点

### `POST /preview/predictions`

请求：

```json
{
  "dataset_id": "DEMO_LUNG_ADENO_01",
  "cpg_ids": ["cgDEMO0001"],
  "cell_ids": ["DEMO_LUNG_ADENO_01_C001"]
}
```

约束：`cpg_ids` 1–24 个；`cell_ids` 最多 100 个，可省略（默认前 24 个细胞）。

响应：

```json
{
  "data_mode": "synthetic_demo",
  "is_synthetic_demo": true,
  "model_id": "CPGMoE (demo specification)",
  "checkpoint_loaded": false,
  "provenance_id": "DEMO_PROV_DEMO_LUNG_ADENO_01",
  "predictions": [
    {
      "cpg_id": "cgDEMO0001",
      "predicted_beta": 0.267,
      "genome_build": "GRCh38",
      "is_synthetic_demo": true
    }
  ],
  "caveat": "Synthetic preview only. No checkpoint was loaded and no model inference was executed."
}
```

### `POST /preview/compare`

请求：

```json
{
  "group_a": { "dimension": "dataset", "value": "DEMO_LUNG_NORMAL_02" },
  "group_b": { "dimension": "dataset", "value": "DEMO_LUNG_ADENO_01" },
  "cpg_ids": ["cgDEMO0001"]
}
```

`dimension` 仅允许 `dataset` / `tissue` / `cell_type`。

响应包含两组 `n_cells`、逐 CpG 均值、`deltas`（B − A）和：

```json
{
  "statistical_tests": "unavailable_in_demo",
  "caveat": "Comparisons are based on predicted methylation, not experimentally observed DMRs. No p-values or FDR estimates are produced in this demo."
}
```

## 5. 坐标与分页

- 内部：0-based half-open `[start, end)`。
- UI：1-based inclusive `[start, end]`。
- 转换：`src/lib/coordinate-utils.ts` 的 `toDisplayRange` / `toInternalRange`。
- `cursor` 是不透明 base64url offset；变更实现时不得让客户端依赖其内部格式。

## 6. 示例

```bash
curl http://localhost:3000/api/v1/status
curl "http://localhost:3000/api/v1/datasets?limit=3&tissue=Lung"
curl "http://localhost:3000/api/v1/cpgs?query=TP53&assembly=GRCh38"
curl "http://localhost:3000/api/v1/groups?dataset_id=DEMO_LUNG_ADENO_01&cpg_id=cgDEMO0001"

curl -X POST http://localhost:3000/api/v1/preview/compare \
  -H "Content-Type: application/json" \
  -d '{"group_a":{"dimension":"dataset","value":"DEMO_LUNG_NORMAL_02"},"group_b":{"dimension":"dataset","value":"DEMO_LUNG_ADENO_01"},"cpg_ids":["cgDEMO0001"]}'
```

## 7. 兼容性

- API 版本为 `v1`；破坏性字段变化必须升版本。
- 真实 provider 必须继续满足 `src/lib/schemas.ts` 中的响应 schema。
- 不允许只把 `is_synthetic_demo` 改成 `false`；真实值必须由审计/provenance 生成，见 `docs/INTEGRATION_PLAN.md`。
