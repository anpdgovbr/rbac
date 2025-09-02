# 🧑‍💻 Padrões de Desenvolvimento RBAC ANPD

[![Standards](https://img.shields.io/badge/Standards-TypeScript_Strict-blue.svg)]()
[![Quality](https://img.shields.io/badge/Quality-ESLint_Prettier-green.svg)]()
[![Testing](https://img.shields.io/badge/Testing-Jest_Vitest-orange.svg)]()

## 📋 Índice de Padrões

- [🎯 Visão Geral](#-visão-geral)
- [📝 Convenções de Código](#-convenções-de-código)
- [🏗️ Estrutura de Monorepo](#️-estrutura-de-monorepo)
- [🔧 Ferramentas de Desenvolvimento](#-ferramentas-de-desenvolvimento)
- [✅ Qualidade de Código](#-qualidade-de-código)
- [🚀 CI/CD e Deploy](#-cicd-e-deploy)
- [📦 Versionamento e Release](#-versionamento-e-release)
- [🧪 Estratégia de Testes](#-estratégia-de-testes)
- [📚 Documentação](#-documentação)

---

## 🎯 Visão Geral

### Objetivos dos Padrões

#### 1. **Consistência** 🎯

- Mesmo estilo de código em todos os pacotes
- Convenções padronizadas de nomenclatura
- Estrutura de arquivos uniforme

#### 2. **Qualidade** ✨

- Type safety completo com TypeScript
- Cobertura de testes adequada
- Documentação abrangente

#### 3. **Produtividade** 🚀

- Ferramentas automatizadas
- Feedback rápido no desenvolvimento
- CI/CD eficiente

#### 4. **Manutenibilidade** 🔧

- Código auto-documentado
- Refatorações seguras
- Dependências atualizadas

---

## 📝 Convenções de Código

### TypeScript Strict Mode

```json
// tsconfig.json (base para todos os pacotes)
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    // Modules e Resolution
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    // Output
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",

    // Quality
    "skipLibCheck": false,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### Convenções de Nomenclatura

#### 1. **Arquivos e Diretórios**

```bash
# Componentes React: PascalCase
UserCard.tsx
PermissionManager.tsx

# Hooks: camelCase com prefix 'use'
usePermissions.ts
useUserProfiles.ts

# Utilities e Libs: camelCase
apiClient.ts
permissionHelper.ts

# Types e Interfaces: kebab-case ou camelCase
user-types.ts
permissionTypes.ts

# Testes: mesmo nome + .test ou .spec
UserCard.test.tsx
permissionHelper.spec.ts

# Configuração: kebab-case
eslint.config.mjs
prettier.config.js
vitest.config.ts
```

#### 2. **Código TypeScript**

```typescript
// ✅ Interfaces e Types: PascalCase
interface UserPermissions {
  userId: string
  permissions: PermissionsMap
}

type PermissionProvider = {
  getUserPermissions(identity: string): Promise<PermissionsMap>
}

// ✅ Enums: PascalCase + valores PascalCase
enum Permission {
  Read = "Read",
  Write = "Write",
  Admin = "Admin",
}

// ✅ Classes: PascalCase
export class PrismaPermissionsProvider implements PermissionsProvider {
  // ✅ Métodos públicos: camelCase
  async getUserPermissions(identity: string): Promise<PermissionsMap> {
    // ✅ Variáveis: camelCase
    const userProfiles = await this.fetchUserProfiles(identity)
    return this.computePermissions(userProfiles)
  }

  // ✅ Métodos privados: camelCase com prefix _
  private async _fetchFromCache(key: string): Promise<any> {
    // implementação
  }
}

// ✅ Funções: camelCase
export function toPermissionsMap(permissions: Permissao[]): PermissionsMap {
  // implementação
}

// ✅ Constantes: UPPER_SNAKE_CASE
export const DEFAULT_CACHE_TTL = 300
export const MAX_HIERARCHY_DEPTH = 10

// ✅ Props de componentes: Readonly<>
type UserCardProps = Readonly<{
  userId: string
  onEdit?: (userId: string) => void
  className?: string
}>
```

#### 3. **Imports e Exports**

```typescript
// ✅ Imports: ordem específica
// 1. External libraries
import React from "react"
import { PrismaClient } from "@prisma/client"

// 2. Internal packages (org)
import { PermissionsProvider } from "@anpdgovbr/rbac-core"
import { withPermission } from "@anpdgovbr/rbac-react"

// 3. Relative imports (grouped)
import { UserService } from "../services/UserService"
import { validatePermission } from "../utils/validation"
import type { UserPermissions } from "../types/user-types"

// ✅ Exports: named exports preferidos
export { PrismaPermissionsProvider }
export { type PermissionsMap, type Permissao }

// ✅ Default export apenas para componentes React
export default function UserCard({ userId, onEdit }: UserCardProps) {
  // implementação
}
```

### TSDoc Obrigatório

````typescript
/**
 * @fileoverview Provider Prisma para sistema RBAC - implementa busca e cache
 * de permissões usando banco de dados Prisma com hierarquia de perfis.
 *
 * @author Divisão de Desenvolvimento e Sustentação de Sistemas (DDSS/CGTI/ANPD)
 * @since 2025-09
 */

/**
 * Provider de permissões que utiliza Prisma ORM para buscar e resolver
 * permissões de usuários considerando hierarquia de perfis.
 *
 * @example
 * ```typescript
 * const provider = new PrismaPermissionsProvider(prisma, cache)
 * const permissions = await provider.getUserPermissions('user@example.com')
 *
 * if (permissions['Editar:Usuario']) {
 *   // Usuário pode editar usuários
 * }
 * ```
 *
 * @see {@link PermissionsProvider} Interface base
 * @see {@link PermissionsMap} Formato do retorno
 */
export class PrismaPermissionsProvider implements PermissionsProvider {
  /**
   * Busca e computa as permissões efetivas de um usuário, considerando
   * hierarquia de perfis e cache para otimização de performance.
   *
   * @param identity - Email ou identificador único do usuário
   * @returns Promise com mapa de permissões no formato "Acao:Recurso": boolean
   *
   * @throws {Error} Quando falha ao acessar banco de dados
   * @throws {ValidationError} Quando identity é inválido
   *
   * @example
   * ```typescript
   * const permissions = await provider.getUserPermissions('admin@anpd.gov.br')
   *
   * // Verificar permissão específica
   * if (permissions['Administrar:Sistema']) {
   *   console.log('Usuário é administrador')
   * }
   * ```
   */
  async getUserPermissions(identity: string): Promise<PermissionsMap> {
    // implementação
  }

  /**
   * @internal
   * Método interno para resolver hierarquia de perfis usando algoritmo
   * de travessia DAG (Directed Acyclic Graph).
   *
   * @param profileIds - IDs dos perfis base do usuário
   * @returns Array com todos os perfis incluindo herança
   */
  private async _resolveProfileHierarchy(profileIds: string[]): Promise<string[]> {
    // implementação
  }
}
````

---

## 🏗️ Estrutura de Monorepo

### Organização de Workspace

```
rbac/
├── package.json                    # Root workspace config
├── tsconfig.json                   # Base TypeScript config
├── eslint.config.mjs              # ESLint flat config
├── prettier.config.js             # Prettier config
├── vitest.workspace.ts            # Vitest workspace
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # CI/CD pipeline
│   │   ├── release.yml            # Automated releases
│   │   └── security.yml           # Security scanning
├── docs/                          # Documentação centralizada
├── examples/                      # Exemplos de uso
│   ├── next-api/                  # Exemplo Next.js API
│   ├── react-components/          # Exemplos React
│   └── prisma-setup/              # Setup Prisma
└── packages/
    ├── rbac-core/                 # Core abstractions
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── types/
    │   │   ├── interfaces/
    │   │   └── utils/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vitest.config.ts
    │   └── README.md
    ├── rbac-provider/             # Base provider
    ├── rbac-prisma/               # Prisma integration
    ├── rbac-next/                 # Next.js integration
    ├── rbac-react/                # React hooks/components
    └── rbac-admin/                # Admin interface
```

### Configuração de Workspace

```json
// package.json (root)
{
  "name": "@anpdgovbr/rbac",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "turbo run build --filter=!@anpdgovbr/rbac-admin && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.7",
    "@typescript-eslint/eslint-plugin": "^7.18.0",
    "@typescript-eslint/parser": "^7.18.0",
    "eslint": "^9.9.0",
    "prettier": "^3.3.3",
    "turbo": "^2.0.14",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  },
  "packageManager": "npm@10.8.2"
}
```

### Template de Package

```json
// packages/*/package.json (template)
{
  "name": "@anpdgovbr/rbac-{PACKAGE}",
  "version": "0.1.0",
  "description": "RBAC {PACKAGE} para sistemas da ANPD",
  "keywords": ["rbac", "permissions", "anpd", "typescript"],
  "author": "Divisão de Desenvolvimento e Sustentação de Sistemas (DDSS/CGTI/ANPD)",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/anpd-gov-br/rbac.git",
    "directory": "packages/rbac-{PACKAGE}"
  },
  "bugs": {
    "url": "https://github.com/anpd-gov-br/rbac/issues"
  },
  "homepage": "https://github.com/anpd-gov-br/rbac/tree/main/packages/rbac-{PACKAGE}#readme",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "README.md", "CHANGELOG.md"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  }
}
```

---

## 🔧 Ferramentas de Desenvolvimento

### ESLint Configuração

```javascript
// eslint.config.mjs
import { defineConfig } from "eslint-define-config"
import tseslint from "@typescript-eslint/eslint-plugin"
import tsparser from "@typescript-eslint/parser"

export default defineConfig([
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // TypeScript specific
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",

      // Import organization
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],

      // Code quality
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",

      // React specific (when applicable)
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration" },
      ],
      "react/prop-types": "off", // Using TypeScript
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
])
```

### Prettier Configuração

```javascript
// prettier.config.js
/** @type {import('prettier').Config} */
export default {
  // Base formatting
  semi: false,
  singleQuote: true,
  quoteProps: "as-needed",
  trailingComma: "es5",

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Line wrapping
  printWidth: 100,
  proseWrap: "preserve",

  // Bracket spacing
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow functions
  arrowParens: "avoid",

  // File-specific overrides
  overrides: [
    {
      files: "*.json",
      options: {
        printWidth: 80,
      },
    },
    {
      files: "*.md",
      options: {
        proseWrap: "always",
        printWidth: 80,
      },
    },
  ],
}
```

### Turbo Configuração

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:coverage": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "lint:fix": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Husky Git Hooks

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Lint staged files
npx lint-staged

# Type check
echo "🏗️ Type checking..."
npm run typecheck

echo "✅ Pre-commit checks passed!"
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Validating commit message..."

# Validate conventional commits (optional)
npx commitlint --edit $1

echo "✅ Commit message is valid!"
```

```json
// lint-staged configuration in package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,jsx,json,md}": ["prettier --write"]
  }
}
```

---

## ✅ Qualidade de Código

### Métricas de Qualidade

#### 1. **Coverage Mínimo**

- **Packages Core**: 90%+ coverage
- **Providers**: 85%+ coverage
- **UI Components**: 70%+ coverage
- **Utils/Helpers**: 95%+ coverage

#### 2. **TypeScript Strict**

```json
// tsconfig.json - configuração obrigatória
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### 3. **ESLint Rules**

```javascript
// Regras obrigatórias
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": "error",
  "@typescript-eslint/prefer-nullish-coalescing": "error",
  "@typescript-eslint/strict-boolean-expressions": "error",
  "prefer-const": "error",
  "no-var": "error"
}
```

### Code Review Checklist

#### ✅ **Antes do PR**

- [ ] Todos os testes passando
- [ ] Coverage mantido ou melhorado
- [ ] Lint sem erros
- [ ] TypeScript sem erros
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado

#### ✅ **Durante Review**

- [ ] Lógica de negócio correta
- [ ] Performance adequada
- [ ] Segurança verificada
- [ ] Acessibilidade (se aplicável)
- [ ] Testes cobrem casos edge
- [ ] API design consistente

#### ✅ **Antes do Merge**

- [ ] Squash commits se necessário
- [ ] Message do commit seguindo padrão
- [ ] CI/CD pipeline verde
- [ ] Aprovação de pelo menos 1 reviewer

---

## 🚀 CI/CD e Deploy

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

  test:
    name: Test Suite
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [rbac-core, rbac-provider, rbac-prisma, rbac-next, rbac-react]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test --workspace=@anpdgovbr/${{ matrix.package }}
        env:
          CI: true

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/${{ matrix.package }}/coverage/lcov.info
          flags: ${{ matrix.package }}

  build:
    name: Build Packages
    runs-on: ubuntu-latest
    needs: [quality, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-packages
          path: packages/*/dist/

  release:
    name: Release
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
          registry-url: "https://registry.npmjs.org"

      - name: Install dependencies
        run: npm ci

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist-packages
          path: packages/

      - name: Create Release
        run: |
          npm run changeset -- version
          npm run changeset -- publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Security Workflow

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: "0 2 * * 1" # Weekly on Monday
  push:
    branches: [main]

jobs:
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level high

      - name: Check for vulnerabilities
        run: npx better-npm-audit audit

      - name: CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          languages: typescript
```

---

## 📦 Versionamento e Release

### Changeset Configuration

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@anpdgovbr/rbac-admin"]
}
```

### Conventional Commits

```bash
# Tipos de commit aceitos:
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Mudanças na documentação
style:    Formatação (não afeta lógica)
refactor: Refatoração sem mudança funcional
perf:     Melhoria de performance
test:     Adição ou correção de testes
chore:    Tarefas de build, configs, etc.

# Exemplos:
feat(rbac-core): adicionar suporte a permissions condicionais
fix(rbac-prisma): corrigir consulta de hierarquia circular
docs(rbac-react): atualizar exemplos de hooks
perf(rbac-provider): otimizar cache de permissions
```

### Semantic Versioning

```bash
# Major (BREAKING CHANGE): 1.0.0 -> 2.0.0
feat!: remover método depreciado getUserRole()
feat(rbac-core)!: alterar interface PermissionsProvider

# Minor (new feature): 1.0.0 -> 1.1.0
feat: adicionar hook usePermissionBatch()
feat(rbac-react): nova prop 'fallback' no PermissionGate

# Patch (bug fix): 1.0.0 -> 1.0.1
fix: corrigir validação de permissions null
fix(rbac-prisma): resolver problema de timeout em queries
```

### Release Process

```bash
# 1. Criar changeset para mudanças
npm run changeset

# 2. Preview das mudanças
npm run changeset -- version --snapshot

# 3. Build e test completo
npm run build
npm run test

# 4. Release (automático no CI)
git push origin main

# 5. Release manual (se necessário)
npm run changeset -- version
npm run changeset -- publish
```

---

## 🧪 Estratégia de Testes

### Tipos de Teste por Package

#### **rbac-core** (Unitários Extensivos)

```typescript
// packages/rbac-core/src/__tests__/permissions.test.ts
import { describe, it, expect } from "vitest"
import { toPermissionsMap, hasPermission } from "../permissions"

describe("Permission Utils", () => {
  describe("toPermissionsMap", () => {
    it("should convert permissions array to map", () => {
      const permissions = [
        { acao: "Editar", recurso: "Usuario", grant: true },
        { acao: "Excluir", recurso: "Usuario", grant: false },
      ]

      const map = toPermissionsMap(permissions)

      expect(map["Editar:Usuario"]).toBe(true)
      expect(map["Excluir:Usuario"]).toBe(false)
    })

    it("should handle empty permissions array", () => {
      expect(toPermissionsMap([])).toEqual({})
    })

    it("should override permissions with same key", () => {
      const permissions = [
        { acao: "Editar", recurso: "Usuario", grant: false },
        { acao: "Editar", recurso: "Usuario", grant: true },
      ]

      const map = toPermissionsMap(permissions)
      expect(map["Editar:Usuario"]).toBe(true)
    })
  })

  describe("hasPermission", () => {
    it("should return true for granted permissions", () => {
      const map = { "Editar:Usuario": true }
      expect(hasPermission(map, "Editar", "Usuario")).toBe(true)
    })

    it("should return false for missing permissions", () => {
      const map = {}
      expect(hasPermission(map, "Editar", "Usuario")).toBe(false)
    })
  })
})
```

#### **rbac-prisma** (Integração + Unit)

```typescript
// packages/rbac-prisma/src/__tests__/provider.integration.test.ts
import { describe, beforeEach, afterEach, it, expect } from "vitest"
import { PrismaClient } from "@prisma/client"
import { PrismaPermissionsProvider } from "../PrismaPermissionsProvider"

describe("PrismaPermissionsProvider Integration", () => {
  let prisma: PrismaClient
  let provider: PrismaPermissionsProvider

  beforeEach(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    })

    provider = new PrismaPermissionsProvider(prisma)

    // Setup test data
    await seedTestData(prisma)
  })

  afterEach(async () => {
    await cleanupTestData(prisma)
    await prisma.$disconnect()
  })

  it("should resolve user permissions with profile hierarchy", async () => {
    const permissions = await provider.getUserPermissions("test@example.com")

    expect(permissions["Editar:Usuario"]).toBe(true)
    expect(permissions["Administrar:Sistema"]).toBe(false)
  })

  it("should handle circular hierarchy gracefully", async () => {
    // Create circular reference
    await createCircularHierarchy(prisma)

    const permissions = await provider.getUserPermissions("circular@example.com")

    // Should not throw and return reasonable permissions
    expect(permissions).toBeDefined()
  })
})
```

#### **rbac-react** (Component Testing)

```typescript
// packages/rbac-react/src/__tests__/PermissionGate.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PermissionsProvider } from '../PermissionsProvider'
import { PermissionGate } from '../PermissionGate'

const mockProvider = {
  getUserPermissions: vi.fn()
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider
      provider={mockProvider}
      getIdentity={() => Promise.resolve('test@example.com')}
    >
      {children}
    </PermissionsProvider>
  )
}

describe('PermissionGate', () => {
  it('should render children when permission is granted', async () => {
    mockProvider.getUserPermissions.mockResolvedValue({
      'Editar:Usuario': true
    })

    render(
      <TestWrapper>
        <PermissionGate action="Editar" resource="Usuario">
          <div>Protected Content</div>
        </PermissionGate>
      </TestWrapper>
    )

    expect(await screen.findByText('Protected Content')).toBeInTheDocument()
  })

  it('should render fallback when permission is denied', async () => {
    mockProvider.getUserPermissions.mockResolvedValue({})

    render(
      <TestWrapper>
        <PermissionGate
          action="Editar"
          resource="Usuario"
          fallback={<div>Access Denied</div>}
        >
          <div>Protected Content</div>
        </PermissionGate>
      </TestWrapper>
    )

    expect(await screen.findByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
```

### Configuração de Teste

```typescript
// vitest.workspace.ts
import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
  {
    test: {
      name: "unit",
      include: ["packages/*/src/**/*.{test,spec}.ts"],
      environment: "node",
      coverage: {
        reporter: ["text", "lcov", "html"],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
    },
  },
  {
    test: {
      name: "integration",
      include: ["packages/*/src/**/*.integration.{test,spec}.ts"],
      environment: "node",
      setupFiles: ["./tests/setup-integration.ts"],
    },
  },
  {
    test: {
      name: "react",
      include: ["packages/rbac-react/src/**/*.{test,spec}.tsx"],
      environment: "jsdom",
      setupFiles: ["./tests/setup-react.ts"],
    },
  },
])
```

---

## 📚 Documentação

### Estrutura de Documentação

```
docs/
├── README.md                 # Overview e quick start
├── architecture.md           # Arquitetura do sistema
├── apis.md                  # Referência completa de APIs
├── faq.md                   # Perguntas frequentes
├── integration.md           # Guias de integração
├── migration-guide.md       # Guia de migração
├── data-strategy.md         # Estratégia de dados
├── dev-standards.md         # Este arquivo
└── examples/                # Exemplos práticos
    ├── basic-usage.md
    ├── advanced-patterns.md
    └── troubleshooting.md
```

### Padrão de README

```markdown
# @anpdgovbr/rbac-{package}

[![npm version](https://badge.fury.io/js/@anpdgovbr/rbac-{package}.svg)](https://www.npmjs.com/package/@anpdgovbr/rbac-{package})
[![Build Status](https://github.com/anpd-gov-br/rbac/workflows/CI/badge.svg)](https://github.com/anpd-gov-br/rbac/actions)
[![Coverage](https://codecov.io/gh/anpd-gov-br/rbac/branch/main/graph/badge.svg)](https://codecov.io/gh/anpd-gov-br/rbac)

## 📋 Descrição

[Descrição clara e concisa do package]

## 🚀 Instalação

\`\`\`bash
npm install @anpdgovbr/rbac-{package}
\`\`\`

## 💡 Uso Básico

\`\`\`typescript
// Exemplo prático mínimo
\`\`\`

## 📖 API Reference

### Classes

#### `ExampleClass`

[Documentação da classe]

### Functions

#### `exampleFunction()`

[Documentação da função]

## 🔗 Veja Também

- [@anpdgovbr/rbac-core](../rbac-core/) - Abstrações centrais
- [Guia de Integração](../../docs/integration.md) - Como usar com frameworks

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](../../CONTRIBUTING.md) para guidelines.

## 📄 Licença

MIT © [ANPD](LICENSE)
```

### JSDoc Standards

````typescript
/**
 * @fileoverview Utilitários para manipulação de permissões RBAC.
 *
 * Este módulo fornece funções auxiliares para conversão e verificação
 * de permissões no formato usado pelo sistema RBAC da ANPD.
 *
 * @example
 * ```typescript
 * import { toPermissionsMap, hasPermission } from '@anpdgovbr/rbac-core'
 *
 * const permissions = toPermissionsMap([
 *   { acao: 'Editar', recurso: 'Usuario', grant: true }
 * ])
 *
 * if (hasPermission(permissions, 'Editar', 'Usuario')) {
 *   console.log('Permission granted!')
 * }
 * ```
 *
 * @author Divisão de Desenvolvimento e Sustentação de Sistemas (DDSS/CGTI/ANPD)
 * @since 2025-09
 * @version 1.0.0
 */

/**
 * Converte um array de permissões para o formato de mapa usado internamente.
 *
 * @param permissions - Array de permissões com ação, recurso e grant
 * @returns Mapa de permissões no formato "Acao:Recurso": boolean
 *
 * @example
 * ```typescript
 * const permissions = [
 *   { acao: 'Editar', recurso: 'Usuario', grant: true },
 *   { acao: 'Excluir', recurso: 'Usuario', grant: false }
 * ]
 *
 * const map = toPermissionsMap(permissions)
 * // Result: { "Editar:Usuario": true, "Excluir:Usuario": false }
 * ```
 *
 * @throws {TypeError} Quando permissions não é um array
 * @throws {ValidationError} Quando alguma permissão tem formato inválido
 *
 * @see {@link hasPermission} Para verificar permissões no mapa
 * @see {@link Permissao} Interface da permissão
 *
 * @public
 */
export function toPermissionsMap(permissions: PermissionGrant[]): PermissionsMap {
  // implementação
}
````

---

## 📋 Checklist de Setup

### ✅ **Configuração Inicial** (Obrigatório)

- [ ] **EditorConfig**: Criar `.editorconfig` com padrões de formatação
- [ ] **Prettier**: Configurar `.prettierrc` ou `prettier.config.js`
- [ ] **ESLint**: Setup `eslint.config.mjs` com regras TypeScript
- [ ] **TypeScript**: `tsconfig.json` base com strict mode
- [ ] **Husky**: Hooks de pre-commit e commit-msg
- [ ] **Lint-staged**: Formatação automática em commits

### ✅ **Ferramentas de Build** (Obrigatório)

- [ ] **Turbo**: Configurar `turbo.json` para monorepo
- [ ] **tsup**: Build tool para packages
- [ ] **Vitest**: Framework de testes
- [ ] **Changeset**: Versionamento automático

### ✅ **CI/CD** (Obrigatório)

- [ ] **GitHub Actions**: Workflow de CI com test matrix
- [ ] **Security Scan**: Workflow de segurança automatizado
- [ ] **Release**: Automated releases com changeset
- [ ] **Coverage**: Integração com Codecov

### ✅ **Qualidade** (Obrigatório)

- [ ] **Coverage thresholds**: Mínimo 80% em packages core
- [ ] **TypeScript strict**: Sem `any` explícito
- [ ] **ESLint rules**: Zero warnings em production
- [ ] **TSDoc**: Documentação completa de APIs públicas

### ✅ **Documentação** (Obrigatório)

- [ ] **README principal**: Overview e quick start
- [ ] **Package READMEs**: Docs específicas de cada package
- [ ] **Examples**: Exemplos práticos funcionais
- [ ] **API docs**: Referência completa de APIs

### ✅ **Exemplos e Demos** (Recomendado)

- [ ] **Next.js API**: Exemplo de integração com API routes
- [ ] **React Components**: Exemplos de uso com React
- [ ] **Prisma Setup**: Configuração de banco de dados
- [ ] **Authentication**: Exemplo com NextAuth.js

---

**Status**: Padrões Estabelecidos | **Última Atualização**: Setembro 2025  
**Mantido por**: Divisão de Desenvolvimento e Sustentação de Sistemas (DDSS/CGTI/ANPD)
