RBAC Admin — Roadmap (Mínimo Funcional)

Done

- Client configurável (baseUrl + endpoints): listar perfis, listar permissões, alternar permitido.
- Composição no AdminShell: ProfilesList + PermissionsEditor.
- Build estável sem dependência de framework específico.

Doing

- Exportar temas/estilos leves e permitir sobrescrita.
- Adicionar i18n simples (pt-BR/en) para labels e mensagens.

Next

- Hooks internos (useProfiles/usePermissions) para maior flexibilidade.
- Grid acessível e paginação/filtragem por recurso/ação.
- Ações em lote (habilitar/desabilitar múltiplas permissões).
- Integração de auditoria: callbacks para registrar mudanças.
- Modo somente leitura e proteção adicional (ex.: confirmação dupla).

Design

- Não presume Prisma; consome endpoints via client configurável.
- Preparado para ser usado como subsistema de gestão interna (super-admin/segurança).
