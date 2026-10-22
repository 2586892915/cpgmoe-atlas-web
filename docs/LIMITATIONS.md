# LIMITATIONS

1. **没有真实数据。** 所有数据集、细胞、QC、CpG 坐标和甲基化值都是合成的。没有读取、清洗、下载或重新发布真实人类 scRNA 文件。
2. **没有模型输出。** CPGMoE 未加载、未运行。preview API 的 `checkpoint_loaded` 恒为 `false`。
3. **只有 panel 目标空间。** 模型面向指定 Illumina 450K panel CpG；不是 genome-wide 测量，不宣称 unseen CpG 或全基因组优越性。
4. **bulk → single-cell 域迁移未验证。** 训练数据为 bulk multi-omics；单细胞预测的可迁移性仍需独立评估。
5. **没有统计推断。** 不产生 p-values、FDR、DMR 或因果结论；Compare 页只展示 Δ 的布局与聚合口径。
6. **坐标是说明性的。** `cgDEMO*` 是 demo probe；`cg00000029` 等真实格式 probe 的 annotation 被有意 withheld，不伪造 hg38 坐标。Gene window 是 illustrative demo model。
7. **没有生产级规模。** 当前 360 cells、12 datasets、8 CpGs；未验证百万级渲染、查询延迟或存储。
8. **没有下载产品。** 生产 TSV/Parquet、cell×CpG 矩阵、API key 均未开放。
9. **不是临床工具。** 不得用于诊断、治疗决策或任何临床用途。
10. **可访问性是基础检查。** 有 label、focus、键盘表格替代和文字说明，但未做完整 WCAG 2.2 AA 审计与屏幕阅读器实测。
11. **浏览器覆盖有限。** UI QA 只在 Windows Edge/Chromium 上完成，未验证 Firefox/Safari。
12. **无真实引用/联系方式。** About 页的 citation 与 contact 是占位，不构成论文、DOI、机构或联系人声明。
13. **无生产安全加固。** 没有账号、rate limit、CSP、审计日志或 secret 管理；上线前必须补齐。
14. **Demo 数据仅用于界面评估。** 不得引用、再分发或作为生物学证据。
15. **残留构建期依赖公告。** Next 15.5.28 内置的 PostCSS 版本仍命中 2 条构建期公告（见 `REPO_AUDIT.md`）。当前站点不接受用户 CSS，暴露面有限；修复需跨到 Next 16.4.2 并重新做完整回归。
16. **首页粒子染色体是风格化示意。** 两条姐妹染色单体、着丝粒、黏连桥、内部纤维和粒子分布是为了入口识别度而程序化生成的，不是实验结构重建，也不代表真实染色体形态或分子坐标。
17. **3D 依赖按需加载。** Three.js + EffectComposer/UnrealBloomPass 通过动态 import 加载；WebGL 不可用或用户启用 `prefers-reduced-motion` 时使用静态 2D 粒子封面；低配设备帧率未做系统基准测试。
