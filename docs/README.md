# RBAC ANPD — Documentação e Roadmap

Esta página consolida a documentação do monorepo RBAC da ANPD, incluindo guias de uso, análises técnicas e roadmap de funcionalidades.

## 📚 Índice da Documentação

### Guias e Referências

- **[APIs](apis.md)** — Referência completa da API de todos os packages
- **[Arquitetura](architecture.md)** — Decisões arquiteturais e design patterns
- **[FAQ](faq.md)** — Perguntas frequentes e troubleshooting
- **[Integração](integration.md)** — Guias de integração com frameworks
- **[Migração](migration-guide.md)** — Guia de migração entre versões

### Análises Técnicas (Outubro 2025)

- **[Relatório de Análise Completo](relatorio-analise-completo.md)** — Visão geral da análise do monorepo
- **[Análise de Problemas Críticos](analise-problemas-criticos.md)** — Problemas identificados e recomendações
- **[Resumo de Correções Aplicadas](resumo-correcoes-aplicadas.md)** — Correções automáticas executadas

---

## Status dos Pacotes e Roadmap

Esta seção consolida o status de funcionalidades concluídas (DONE) e pendentes (TODO) por pacote, ordenadas por prioridade.

## Pacotes

### @anpdgovbr/rbac-core

- DONE:
  - Tipos e utilitários principais: `PermissionsMap` (mapa aninhado), `pode`, `hasAny`, `toPermissionsMap`, `toFlatKeyMap` (legado).
  - Proteção contra prototype pollution implementada
  - Testes unitários básicos cobrindo conversões e verificações.
- TODO (prioridade):
  1. Finalizar TSDoc e exemplos aprofundados de uso.
  2. Helpers para composição de regras (predicados/utilitários).
  3. Micro-benchmarks e micro-otimizações.

### @anpdgovbr/rbac-provider

- DONE:
  - Interfaces `PermissionsProvider` e `IdentityResolver`.
  - Decorator de cache: `withTTLCache(provider, ttlMs)` com invalidação seletiva/global.
  - Cache thread-safe e eficiente
- TODO (prioridade):
  1. Invalidação refinada (por grupos/eventos) e métricas de cache (hits/misses).
  2. Guia prático de resolvers (NextAuth, JWT, Headers) na documentação principal.

### @anpdgovbr/rbac-prisma

- DONE:
  - `createPrismaPermissionsProvider` com herança (BFS) e união por grant verdadeiro (true sobrepõe false).
  - Parametrização de tabelas (`perfil`, `permissao`, `perfilHeranca`, `user`) e `identityField` (email/id).
  - Testes unitários com mocks de hierarquia/consulta.
- TODO (prioridade):
  1. Opções avançadas de performance (SP/view materializada) e índices recomendados.
  2. Instrumentação (tempo de consulta, cache warm-up) e recomendações operacionais.
  3. Seeds/migrações de referência (dev) para adoção rápida.

### @anpdgovbr/rbac-next

- DONE:
  - Wrappers `withApi`/`withApiForId`, `checkPermission`, `protectPage`, e integração de auditoria via callback.
  - Testes de `checkPermission` e `protectPage`; exemplos no README do pacote.
- TODO (prioridade):
  1. Utilitários opcionais para padrões de middleware/params (se decidido manter no pacote).
  2. Exemplos avançados (rotas aninhadas/params compostos).
  3. Tipos utilitários para parâmetros derivados de rotas complexas.

### @anpdgovbr/rbac-react

- DONE:
  - `PermissionsProvider`, hooks `usePermissions`/`usePode`, HOC `withPermissao`; integração com SWR.
  - Exemplos de uso e padrões de UX básicos.
- TODO (prioridade):
  1. Exemplos/documentação de SSR + hidratação em Next.
  2. Componentes utilitários (Guard/Placeholder) e padrões de loading/erro.

### @anpdgovbr/rbac-admin

- DONE:
  - Admin client configurável; `ProfilesList`, `PermissionsEditor`, `UsersList`; formulários de criação; hooks `useAdminProfiles`/`useAdminPermissions`.
  - Tokens de texto (i18n básico) com sobrescrita opcional. Estilização delegada ao app consumidor.
- TODO (prioridade):
  1. Grid acessível, paginação e filtros por ação/recurso.
  2. Ações em lote (habilitar/desabilitar múltiplas permissões).
  3. Integração de auditoria: callbacks de change logging.
  4. Modo somente leitura e confirmações adicionais.
  5. Documentar personalização (tokens e integração com tema do app).

### Monorepo/Infra

- DONE:
  - Configuração de workspace, scripts de build/test/typecheck e CI (ESLint, format, build, tests).
  - Exemplos `examples/next-api` e `examples/react` (básicos).
- TODO (prioridade):
  1. Publicação por pacote (versionamento semântico e notas de release).
  2. Guia de migração consolidado (quando necessário) e observabilidade básica.

---

Observação: Documentos detalhados anteriores (arquitetura, integração, APIs, padrões de dev, estratégia de dados etc.) foram consolidados neste resumo focado em status e backlog. As instruções de uso e exemplos permanecem nos READMEs de cada pacote.
