<!--
感谢提交 PR！请保持描述简洁——审阅者应在 30 秒内理解变更的*内容*和*原因*。

关联 Issue：如果此 PR 解决了某个现有 Issue，请使用下方的关闭关键字
（`Closes #NN` / `Fixes #NN` / `Resolves #NN`）。单纯的 `(#NN)` 引用
不会自动关闭 Issue。这对 PR 合并和直接提交到主分支都适用——
GitHub 仅通过关键字自动关闭 Issue。
-->

## 摘要

<!-- 1-3 句话。说明变更内容和原因。 -->

## 关联 Issue

<!-- 例如：Closes #79 — 如果没有关联 Issue 请删除此部分 -->

## 检查清单

- [ ] 已添加/更新测试以覆盖变更
- [ ] `make test-short` 本地通过
- [ ] `make lint` 通过（golangci-lint）
- [ ] 提交信息遵循 `type(scope): summary` 格式（不超过 72 个字符）
- [ ] 使用 `Closes #NN` 关联了 Issue（如果存在关联 Issue）