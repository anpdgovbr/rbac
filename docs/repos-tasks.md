# Tarefas por Repositório (@anpdgovbr)

Status: plano inicial

## Novo monorepo: `anpdgovbr/rbac`
- Criar repo e mover `rbac/` (workspaces) para lá.
- Configurar CI (build + publish por pacote) e Semantic Release (opcional).
- Publicar pacotes: `@anpdgovbr/rbac-core`, `rbac-provider`, `rbac-prisma`, `rbac-next`, `rbac-react`.
- (Futuro) `@anpdgovbr/rbac-admin`: UI de administração (Next/React) para perfis, herança e permissões.

## `shared-types`
- Curto prazo: manter enums atuais (mínimos) para dev; apps podem continuar usando-os internamente.
- Médio prazo: migrar consumidores para strings (`Action`/`Resource`) ao chamar funções do RBAC.
- Longo prazo: opcional gerar tipos (string unions) a partir dos dados do banco (codegen) — manter retrocompat via aliases.

## `docker-infra-pg`
- Garantir disponibilidade de tabelas `Perfil`, `Permissao`, `PerfilHeranca` (ou mapeamento via adapter).
- Documentar variáveis de ambiente e `DATABASE_URL` padrão.
- Opcional: seed mínimo de perfis/permissões para dev.

## Apps (Next.js e outros)
- Integrar `@anpdgovbr/rbac-next` nas rotas sensíveis (injeção `provider` + `getIdentity`).
- Substituir `invalidatePermissionsCache()` por `provider.invalidate()` após alterações administrativas.
- Usar `@anpdgovbr/rbac-react` para UX (ocultar/mostrar ações), mantendo checagem no servidor.
- Validação gradual: migrar rotas por módulo (ex.: permissões, usuários, metadados).

## Retrocompatibilidade
- Onde houver enums, converter para strings ao chamar o RBAC (mapeamento 1:1).
- Manter endpoints atuais de listagem de permissões; apenas trocar backend para o provider.
- Em mudanças mais drásticas, documentar claramente com deprecações e roteiros de migração.

