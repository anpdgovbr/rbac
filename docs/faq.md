# FAQ — RBAC (@anpdgovbr)

- Monorepo vs multi-repo: monorepo com publicação por pacote; facilita evolução coordenada.
- Enums vs banco: usar enums mínimos para dev inicial; autoridade final no banco. Core trabalha com `string`.
- NextAuth obrigatório? Não — identidade via `getIdentity` injetável.
- Cliente substitui servidor? Não — cliente é UX; autorização forte no servidor.

