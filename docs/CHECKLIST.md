# RBAC — Checklist de Migração

1. Core

- [x] Importar `@anpdgovbr/rbac-core` e substituir checks manuais por `pode()`/`hasAny()`.

2. Provider/Prisma

- [x] Instanciar `createPrismaPermissionsProvider({ prisma })` no servidor.
- [x] Decorar com `withTTLCache(provider, 60_000)` e invalidar após mudanças administrativas.

3. Next API

- [x] Proteger rotas com `withApi(handler, { provider, getIdentity, permissao })`.
- [x] Expor `/api/permissoes` para o cliente quando necessário.

4. React (UX)

- [x] Usar `withPermissao`/`usePode` em componentes sensíveis.
- [x] Hidratar permissões via `PermissionsProvider` quando disponível.

5. Enums (Shared Types)

- [x] Converter enums locais para `string` no consumo do RBAC.

6. Infra (Docker PG)

- [x] Configurar `docker-infra-pg` e `DATABASE_URL`.
- [x] Rodar seeds RBAC de desenvolvimento.

7. CI/Docs

- [ ] Adicionar testes mínimos por pacote.
- [ ] Configurar CI para build/typecheck/test.
- [x] Manter docs atualizadas em `rbac/docs/*`.
