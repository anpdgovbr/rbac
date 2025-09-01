# Seeds e Ambiente — RBAC DEV

Para desenvolvimento rápido, utilize o seed atual (`prisma/seed.ts`) que já cria:
- Perfis: Leitor, Atendente, Supervisor, Administrador, SuperAdmin
- Herança: SuperAdmin > Administrador > Supervisor > Atendente > Leitor
- Permissões base por recurso (Processo, Responsavel, Metadados, Relatorios, Usuario, Permissoes, Auditoria, Admin)
- Usuários via `SEED_USERS_JSON` ou variáveis por perfil (e-mail/nome)

Como rodar:
1) Configure `DATABASE_URL` (docker-infra-pg)
2) Opcional: defina usuários
   - `SEED_USERS_JSON`: array de `{ email, nome, perfil }`
   - ou variáveis individuais: `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_NOME`, etc.
3) Execute `npx prisma db push` (ou `migrate`) e `npx tsx prisma/seed.ts`

Recomendações:
- Manter este seed como baseline de DEV. Nos apps, adicionar seeds complementares específicos de domínio.
- No monorepo RBAC, prover um “seed pack” mínimo focado em Perfis/Permissões para quem não usa este projeto base.

