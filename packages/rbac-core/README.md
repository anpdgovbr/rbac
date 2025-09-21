# @anpdgovbr/rbac-core

[![npm version](https://img.shields.io/npm/v/@anpdgovbr/rbac-core.svg)](https://www.npmjs.com/package/@anpdgovbr/rbac-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Core de RBAC para projetos ANPD** — Tipos fundamentais e utilitários para sistema de autorização por papéis.

## ✨ Características

- 🎯 **Zero dependências** — Biblioteca pura TypeScript
- 🔗 **Framework agnostic** — Funciona com qualquer stack
- 📝 **Type-safe** — Tipos rigorosos para máxima segurança
- 🚀 **Performance** — Operações O(1) para verificação de permissões
- 🧪 **Testável** — APIs simples e previsíveis

## 📦 Instalação

```bash
npm install @anpdgovbr/rbac-core@beta
```

## 🎯 Uso Básico

### Verificação Simples de Permissões

```typescript
import { toPermissionsMap, pode } from "@anpdgovbr/rbac-core"

// Converte lista de permissões em mapa eficiente
const permissoes = toPermissionsMap([
  { acao: "Exibir", recurso: "Relatorios", permitido: true },
  { acao: "Editar", recurso: "Relatorios", permitido: false },
  { acao: "Criar", recurso: "Usuarios", permitido: true },
])

// Verificação O(1)
const podeExibirRelatorios = pode(permissoes, "Exibir", "Relatorios") // true
const podeEditarRelatorios = pode(permissoes, "Editar", "Relatorios") // false
```

### Verificação Múltipla

```typescript
import { hasAny } from "@anpdgovbr/rbac-core"

// Verifica se possui QUALQUER uma das permissões
const podeAcessarRelatorios = hasAny(permissoes, [
  ["Exibir", "Relatorios"],
  ["Criar", "Relatorios"],
  ["Editar", "Relatorios"],
]) // true (possui "Exibir")
```

### Formato Legado (Compatibilidade)

```typescript
import { toFlatKeyMap } from "@anpdgovbr/rbac-core"

// Para sistemas que usam chaves concatenadas
const flatMap = toFlatKeyMap([{ acao: "Exibir", recurso: "Relatorios", permitido: true }])
// { "Exibir_Relatorios": true }
```

## 🔧 API Completa

### Tipos Principais

```typescript
/** Ação genérica (string para desacoplamento) */
type Action = string

/** Recurso genérico (string para desacoplamento) */
type Resource = string

/** Mapa otimizado de permissões */
type PermissionsMap = Partial<Record<Action, Partial<Record<Resource, boolean>>>>

/** DTO de entrada para conversão */
type PermissionDto = {
  acao: Action
  recurso: Resource
  permitido: boolean
}
```

### Funções Utilitárias

#### `toPermissionsMap(list)`

Converte array de permissões em mapa indexado para consulta O(1).

**Parâmetros:**

- `list: Array<PermissionDto> | null | undefined` — Lista de permissões

**Retorna:** `PermissionsMap` — Mapa otimizado

```typescript
const mapa = toPermissionsMap([{ acao: "Ler", recurso: "Docs", permitido: true }])
// { "Ler": { "Docs": true } }
```

#### `pode(perms, acao, recurso)`

Verifica se uma ação específica é permitida em um recurso.

**Parâmetros:**

- `perms: PermissionsMap` — Mapa de permissões
- `acao: Action` — Ação a verificar
- `recurso: Resource` — Recurso a verificar

**Retorna:** `boolean` — `true` se permitido

```typescript
const permitido = pode(mapa, "Ler", "Docs") // true
```

#### `hasAny(perms, pairs)`

Verifica se QUALQUER dos pares ação/recurso é permitido.

**Parâmetros:**

- `perms: PermissionsMap` — Mapa de permissões
- `pairs: Array<readonly [Action, Resource]>` — Pares a verificar

**Retorna:** `boolean` — `true` se pelo menos um for permitido

```typescript
const temAlguma = hasAny(mapa, [
  ["Ler", "Docs"],
  ["Escrever", "Docs"],
]) // true se tiver qualquer uma
```

## 🧪 Testes

```bash
npm test
```

## 🏗️ Build

```bash
npm run build
npm run typecheck
```

## 📚 Documentação Relacionada

- 📖 [Consolidação de Features e Roadmap](../../docs/README.md)
- 🚀 [Guia de Início Rápido](../../README.md)

## 📄 Licença

MIT © 2024 ANPD (Agência Nacional de Proteção de Dados)
