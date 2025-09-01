# Padrões de Dev — Monorepo RBAC (@anpdgovbr)

- Linguagem: TypeScript com TSDoc nos tipos públicos e funções exportadas.
- Formatação: Prettier (config padrão do org). Lint: ESLint (TS + import order).
- Hooks de commit: Husky (pre-commit: lint+format; commit-msg: conventional commits opcional).
- CI: GitHub Actions com matrizes por pacote (build + typecheck) e publicação por tag/branch (semantic-release opcional).
- Testes: unitários nos pacotes core/provider/prisma/next; smoke em react.
- Versionamento: SemVer por pacote, changelog gerado.

Checklist inicial do novo repo:

- [ ] Adicionar `.editorconfig`, `.prettierrc`, `eslint.config.mjs` (ou `.eslintrc.*`).
- [ ] Configurar Husky e scripts de `lint`, `format`, `typecheck` nos pacotes.
- [ ] Configurar workflow do GitHub Actions.
- [ ] Adicionar examples (Next API + React) consumindo os pacotes.
