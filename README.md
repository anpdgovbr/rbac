# ANPD GovBR RBAC — Sistema de Autorização por Papéis

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Beta](https://img.shields.io/badge/Status-Beta-orange.svg)]()

Sistema modular de autorização por papéis (RBAC) desenvolvido pela ANPD para projetos do Governo Federal. Desenhado para ser **opt-in**, **reutilizável** e **framework-agnostic**.

## 🎯 Características Principais

- **Desacoplado**: Core sem dependências de frameworks ou enums específicos
- **Modular**: Use apenas os pacotes necessários para seu projeto
- **Type-Safe**: Totalmente tipado com TypeScript
- **Plugável**: Adapters para Prisma, Next.js, React e outros
- **Cacheable**: Sistema de cache TTL integrado
- **Auditável**: Suporte nativo para logs de auditoria

## 📦 Arquitetura de Pacotes

### Core

- **`@anpdgovbr/rbac-core`** — Tipos fundamentais e utilitários (`PermissionsMap`, `pode`, `hasAny`)
- **`@anpdgovbr/rbac-provider`** — Contratos de provider e sistema de cache TTL

### Adapters de Framework

- **`@anpdgovbr/rbac-prisma`** — Provider Prisma com herança de perfis
- **`@anpdgovbr/rbac-next`** — Middleware para Next.js App Router
- **`@anpdgovbr/rbac-react`** — Hooks e HOCs para componentes React

### Ferramentas Administrativas

- **`@anpdgovbr/rbac-admin`** — Interface administrativa (WIP)

## 🚀 Início Rápido

### Instalação

Instale apenas os pacotes necessários para seu projeto:

```bash
# Core (obrigatório)
npm install @anpdgovbr/rbac-core@beta

# Provider contracts e cache
npm install @anpdgovbr/rbac-provider@beta

# Para projetos com Prisma
npm install @anpdgovbr/rbac-prisma@beta

# Para APIs Next.js
npm install @anpdgovbr/rbac-next@beta

# Para componentes React
npm install @anpdgovbr/rbac-react@beta
```

### Configuração Básica

#### 1. Provider Prisma

```typescript
import { createPrismaPermissionsProvider } from "@anpdgovbr/rbac-prisma"
import { withTTLCache } from "@anpdgovbr/rbac-provider"

const provider = withTTLCache(
  createPrismaPermissionsProvider({ prisma }),
  60_000 // cache de 1 minuto
)
```

#### 2. API Routes (Next.js)

```typescript
import { withApi } from "@anpdgovbr/rbac-next"

export const GET = withApi(
  async ({ email, userId }) => {
    // Sua lógica aqui
    return Response.json({ data: "exemplo" })
  },
  {
    provider,
    getIdentity: myIdentityResolver,
    permissao: { acao: "Exibir", recurso: "Relatorios" },
    audit: myAuditLogger,
  }
)
```

#### 3. Componentes React

```tsx
import { PermissionsProvider, withPermissao } from "@anpdgovbr/rbac-react"

// No layout principal
function App() {
  return (
    <PermissionsProvider value={permissionsMap}>
      <Dashboard />
    </PermissionsProvider>
  )
}

// Proteção de componente
const ProtectedReport = withPermissao(ReportComponent, "Exibir", "Relatorios")
```

## 🏗️ Conceitos Arquiteturais

### Sistema de Permissões

- **Ação**: Operação a ser realizada (`string` genérica)
- **Recurso**: Entidade sobre a qual a ação é executada (`string` genérica)
- **Permissão**: Combinação de ação + recurso + estado (permitido/negado)

### Herança de Perfis

- Suporte a hierarquias complexas (DAG - Directed Acyclic Graph)
- União por grant verdadeiro (se qualquer perfil ancestral permite, a permissão é concedida)
- Validação automática de perfis ativos

### Cache e Performance

- Cache TTL configurável em memória
- Invalidação seletiva por identidade
- Otimizado para alta concorrência

## 📖 Documentação Completa

### Guias Principais

- 🏛️ **[Arquitetura](docs/architecture.md)** — Visão geral do sistema e decisões de design
- 🔌 **[APIs Públicas](docs/apis.md)** — Referência completa das APIs de todos os pacotes
- 🚚 **[Guia de Migração](docs/migration-guide.md)** — Como migrar sistemas existentes
- 💾 **[Estratégia de Dados](docs/data-strategy.md)** — Modelagem do banco e estruturas

### Desenvolvimento

- 🛠️ **[Padrões de Desenvolvimento](docs/dev-standards.md)** — Convenções e boas práticas
- 🌱 **[Seeds e Ambiente](docs/dev-seed.md)** — Setup do ambiente de desenvolvimento
- ✅ **[Checklist](docs/CHECKLIST.md)** — Lista de verificação para releases
- 🗺️ **[Roadmap](docs/roadmap.md)** — Funcionalidades planejadas e status

### Exemplos Práticos

- 📁 **[examples/next-api/](examples/next-api/)** — Implementação completa em Next.js
- ⚛️ **[examples/react/](examples/react/)** — Componentes e hooks em React

## 🔧 Status de Desenvolvimento

### ✅ Completo

- Core de permissões e utilitários
- Contratos de provider e cache TTL
- Provider Prisma com herança
- Middleware Next.js para APIs
- Hooks e HOCs React básicos
- Rota piloto (`GET /api/perfis`)

### 🚧 Em Desenvolvimento

- Consolidação de APIs públicas
- Documentação TSDoc completa
- Suite de testes abrangente
- Exemplos de integração
- Setup de CI/CD

### 📋 Próximos Passos

- Publicação individual de pacotes
- Interface administrativa (`@anpdgovbr/rbac-admin`)
- Adapters para outros frameworks
- Métricas e observabilidade

## 🤝 Contribuição

Este é um projeto interno da ANPD, mas contribuições são bem-vindas:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/anpdgovbr/rbac.git
cd rbac

# Instale dependências
npm install

# Build todos os pacotes
npm run build

# Execute testes
npm test

# Lint e formatting
npm run lint
npm run prettier
```

## 📄 Licença

MIT © 2024 ANPD (Autoridade Nacional de Proteção de Dados)

---

**Desenvolvimento**: Superintendência de Sistemas e Produtos (SUPSE) - ANPD
