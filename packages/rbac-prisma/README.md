# @anpdgovbr/rbac-prisma

[![npm version](https://img.shields.io/npm/v/@anpdgovbr/rbac-prisma.svg)](https://www.npmjs.com/package/@anpdgovbr/rbac-prisma)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Provider Prisma para RBAC** — Implementação completa do sistema de permissões com herança de perfis e união por grant verdadeiro.

## ✨ Características

- 🏗️ **Herança de Perfis** — Suporte completo a hierarquias complexas (DAG)
- ✅ **União por Grant Verdadeiro** — Se qualquer perfil ancestral permite, a permissão é concedida
- 🎯 **Type Safety** — Integração tipada com Prisma Client
- ⚡ **Performance** — Queries otimizadas com eager loading
- 🔧 **Configurável** — Nomes de tabelas customizáveis

## 📦 Instalação

```bash
npm install @anpdgovbr/rbac-prisma@beta
```

**Peer Dependencies:**

```bash
npm install @prisma/client
```

## 🗄️ Schema de Banco

### Estrutura Mínima Requerida

```prisma
model User {
  id       String  @id @default(cuid())
  email    String  @unique
  perfilId String?
  perfil   Perfil? @relation(fields: [perfilId], references: [id])
}

model Perfil {
  id         String           @id @default(cuid())
  nome       String           @unique
  active     Boolean          @default(true)
  users      User[]
  permissoes Permissao[]

  // Herança: este perfil herda de (parents)
  parents    PerfilHeranca[]  @relation("PerfilChild")
  // Herança: este perfil é herdado por (children)
  children   PerfilHeranca[]  @relation("PerfilParent")
}

model Permissao {
  id        String  @id @default(cuid())
  acao      String
  recurso   String
  permitido Boolean @default(true)
  perfilId  String
  perfil    Perfil  @relation(fields: [perfilId], references: [id])

  @@unique([acao, recurso, perfilId])
}

model PerfilHeranca {
  parentId String
  childId  String
  parent   Perfil @relation("PerfilParent", fields: [parentId], references: [id])
  child    Perfil @relation("PerfilChild", fields: [childId], references: [id])

  @@id([parentId, childId])
}
```

## 🎯 Uso Básico

### Configuração Simples

```typescript
import { createPrismaPermissionsProvider } from "@anpdgovbr/rbac-prisma"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const provider = createPrismaPermissionsProvider({
  prisma,
  // Configuração padrão:
  // identityField: "email"
  // tables: { user: "user", perfil: "perfil", etc. }
})

// Uso
const permissions = await provider.getPermissionsByIdentity("user@gov.br")
```

### Com Cache TTL

```typescript
import { withTTLCache } from "@anpdgovbr/rbac-provider"

const cachedProvider = withTTLCache(
  createPrismaPermissionsProvider({ prisma }),
  5 * 60 * 1000 // 5 minutos
)
```

### Configuração Customizada

```typescript
const provider = createPrismaPermissionsProvider({
  prisma,
  identityField: "id", // usar ID em vez de email
  tables: {
    user: "usuarios",
    perfil: "perfis",
    permissao: "permissoes",
    perfilHeranca: "perfil_heranca",
  },
})
```

## 🔧 API Completa

### `createPrismaPermissionsProvider(options)`

Cria um provider baseado em Prisma Client.

```typescript
interface PrismaRbacOptions {
  prisma: PrismaLike
  tables?: {
    perfil?: string // padrão: "perfil"
    permissao?: string // padrão: "permissao"
    perfilHeranca?: string // padrão: "perfilHeranca"
    user?: string // padrão: "user"
  }
  identityField?: "email" | "id" // padrão: "email"
}
```

**Parâmetros:**

- `prisma: PrismaLike` — Instância do Prisma Client
- `tables?` — Mapeamento de nomes de tabelas customizados
- `identityField?` — Campo usado para identificar usuário

### `getPerfisHerdadosNomes(prisma, perfilNome, tables?)`

Resolve hierarquia de herança de um perfil específico.

```typescript
const perfisHerdados = await getPerfisHerdadosNomes(prisma, "Administrador")
// ["Administrador", "Supervisor", "Usuario"]
```

**Algoritmo:**

1. Busca perfil base por nome
2. Valida se está ativo
3. Traversa grafo de herança (BFS)
4. Previne ciclos infinitos
5. Retorna lista de nomes válidos

### `getPermissoesPorPerfil(prisma, perfilNome, tables?)`

Obtém permissões efetivas considerando herança.

```typescript
const permissoes = await getPermissoesPorPerfil(prisma, "Supervisor")
// [
//   { acao: "Exibir", recurso: "Relatorios", permitido: true },
//   { acao: "Criar", recurso: "Relatorios", permitido: false },
//   ...
// ]
```

**Lógica de União:**

- Se qualquer perfil ancestral **permite** → permissão é `true`
- Se todos **negam** ou não existe → permissão é `false`
- Última regra vence em caso de conflito

## 🧪 Exemplos Avançados

### Hierarquia Complexa

```
Administrador
├── Supervisor
│   ├── Analista Senior
│   └── Analista Pleno
└── Auditor
    └── Auditor Junior
```

```typescript
// Setup da hierarquia
await prisma.perfilHeranca.createMany({
  data: [
    { parentId: adminId, childId: supervisorId },
    { parentId: adminId, childId: auditorId },
    { parentId: supervisorId, childId: analistaSeniorId },
    { parentId: supervisorId, childId: analistaPlenoId },
    { parentId: auditorId, childId: auditorJuniorId },
  ],
})

// Analista Pleno herda de: Supervisor → Administrador
const permissoes = await getPermissoesPorPerfil(prisma, "Analista Pleno")
```

### Provider com Logging

```typescript
import { PermissionsProvider } from "@anpdgovbr/rbac-provider"

class LoggedPrismaProvider implements PermissionsProvider {
  constructor(private base: PermissionsProvider) {}

  async getPermissionsByIdentity(identity: string) {
    console.log(`[RBAC] Resolving permissions for: ${identity}`)
    const start = Date.now()

    try {
      const result = await this.base.getPermissionsByIdentity(identity)
      const duration = Date.now() - start

      console.log(
        `[RBAC] ✅ Resolved ${Object.keys(result).length} actions in ${duration}ms`
      )
      return result
    } catch (error) {
      console.error(`[RBAC] ❌ Failed to resolve permissions:`, error)
      throw error
    }
  }

  invalidate(identity?: string) {
    console.log(
      `[RBAC] 🗑️  Invalidating cache${identity ? ` for ${identity}` : " (all)"}`
    )
    this.base.invalidate(identity)
  }
}

const provider = new LoggedPrismaProvider(createPrismaPermissionsProvider({ prisma }))
```

### Validação de Schema

```typescript
// Verificar se schema está correto
async function validateSchema(prisma: PrismaClient) {
  try {
    // Testa se todas as tabelas/campos existem
    await prisma.user.findFirst()
    await prisma.perfil.findFirst()
    await prisma.permissao.findFirst()
    await prisma.perfilHeranca.findFirst()

    console.log("✅ Schema RBAC válido")
  } catch (error) {
    console.error("❌ Schema RBAC inválido:", error)
    throw new Error("Schema incompatível com @anpdgovbr/rbac-prisma")
  }
}
```

## 🚀 Performance

### Query Optimization

O provider executa queries otimizadas:

```sql
-- Busca usuário com perfil (eager loading)
SELECT u.*, p.* FROM users u
LEFT JOIN perfis p ON u.perfilId = p.id
WHERE u.email = ?

-- Busca herança completa (single query)
SELECT ph.parentId, parent.nome, parent.active
FROM perfil_heranca ph
JOIN perfis parent ON ph.parentId = parent.id
WHERE ph.childId IN (?, ?, ...)

-- Busca permissões em batch
SELECT acao, recurso, permitido
FROM permissoes
WHERE perfilId IN (?, ?, ...)
```

### Benchmarks

| Operação                    | Tempo Típico | Observações             |
| --------------------------- | ------------ | ----------------------- |
| Usuario → Permissões        | ~50ms        | Com 3 níveis de herança |
| Cache Hit                   | ~1ms         | Com TTL cache           |
| Herança Complexa (5 níveis) | ~100ms       | Primeira execução       |

## 🔧 Desenvolvimento

```bash
# Build
npm run build

# Type checking
npm run typecheck

# Testes
npm test
```

## 📚 Documentação Relacionada

- 📖 [Consolidação de Features e Roadmap](../../docs/README.md)
- 🔌 [Provider Contracts](../rbac-provider/)
- 🚀 [Guia de Início Rápido](../../README.md)

## 📄 Licença

MIT © 2024 ANPD (Agência Nacional de Proteção de Dados)
