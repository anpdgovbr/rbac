# Estratégia de Dados — Permissões e Enums

Objetivo: permitir uso imediato no desenvolvimento e evoluir para autoridade 100% em banco.

1. Desenvolvimento (inicial)

- Manter enums mínimos no app/shared-types para acelerar DX.
- Sem acoplamento no core: `Action`/`Resource` são `string`.

2. Runtime (produção)

- Fonte de verdade no banco (tabelas de Perfil/Permissão/Herança).
- Provider Prisma consolidando permissões efetivas.
- UI administrativa (futuro `@anpdgovbr/rbac-admin`) para gerenciar perfis e permissões.

3. Transição segura

- Consumidores que usam enums: mapear para `string` ao chamar RBAC.
- Opcional: gerar unions de tipos a partir do banco (codegen) e publicá-los (ou hidratá-los no build).
- Deprecar enums rígidos quando a UI/admin estiver estável.
