# Linting options

这个模板默认用 **ESLint 9 flat config**，因为 React / TanStack / 自定义规则的兼容性仍然最好。

更现代的替代路线有两条：

## 1. Biome

适合想把 formatter 和 linter 合并成一个工具的团队。

优点：
- 配置量小
- 速度快
- 新仓库迁移成本低

做法：
- 安装 `@biomejs/biome`
- 把 `biome.jsonc.example` 复制成 `biome.jsonc`
- 把 `package.json` 里的 `lint` / `format` 脚本切到 `biome check .`

## 2. Oxlint

适合想要更高速度、但暂时不想完全离开 ESLint 生态的团队。

优点：
- 很快
- 对 ESLint 规则生态兼容度持续提升
- 可以先和 ESLint 并行运行，再逐步替换

建议：
- 先保留这个模板里的 ESLint
- 在 CI 里额外加一条 `oxlint` 试跑
- 当规则覆盖足够时，再决定是否彻底迁移
