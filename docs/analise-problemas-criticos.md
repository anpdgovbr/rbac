# Análise de Problemas Críticos - Monorepo RBAC ANPD

**Data da Análise:** 08 de outubro de 2025  
**Versão do Projeto:** Beta (0.1.x - 0.2.x)  
**Analista:** GitHub Copilot

---

## 📋 Sumário Executivo

Este documento apresenta uma análise completa do monorepo RBAC da ANPD, identificando problemas encontrados, sua severidade e recomendações de correção.

### Estatísticas da Análise

- **Total de Problemas Identificados:** 6
- **Críticos:** 1 (corrigido)
- **Moderados:** 3
- **Baixa Prioridade:** 2 (corrigidos)
- **Vulnerabilidades de Segurança (npm audit):** 0 ✅

---

## 🔴 PROBLEMA CRÍTICO (Corrigido)

### 1. Inconsistência de Versões entre Dependências Internas

**Severidade:** 🔴 CRÍTICA  
**Status:** ✅ CORRIGIDO AUTOMATICAMENTE  
**Pacotes Afetados:** rbac-provider, rbac-next, rbac-prisma, rbac-react

#### Descrição do Problema

Os packages dependiam de `@anpdgovbr/rbac-core` versão `^0.1.2`, porém o package `rbac-core` atual estava na versão `0.1.3`. Isso poderia causar:

- Instalação de versões antigas do npm registry em produção
- Comportamentos inconsistentes entre desenvolvimento e produção
- Dificuldade em debugar problemas relacionados a versões

#### Evidências

```json
// packages/rbac-core/package.json
"version": "0.1.3"

// packages/rbac-provider/package.json
"@anpdgovbr/rbac-core": "^0.1.2"  // ❌ DESATUALIZADO

// packages/rbac-next/package.json
"@anpdgovbr/rbac-core": "^0.1.2"  // ❌ DESATUALIZADO

// packages/rbac-prisma/package.json
"@anpdgovbr/rbac-core": "^0.1.2"  // ❌ DESATUALIZADO

// packages/rbac-react/package.json
"@anpdgovbr/rbac-core": "^0.1.2"  // ❌ DESATUALIZADO
```

#### Correção Aplicada

✅ Todas as referências foram atualizadas para `^0.1.3`

**Arquivos Modificados:**

- `packages/rbac-provider/package.json`
- `packages/rbac-next/package.json`
- `packages/rbac-prisma/package.json`
- `packages/rbac-react/package.json`

---

## 🟡 PROBLEMAS MODERADOS (Requerem Ação)

### 2. Error Handling Inadequado

**Severidade:** 🟡 MODERADA  
**Status:** ⚠️ REQUER IMPLEMENTAÇÃO  
**Pacotes Afetados:** rbac-admin

#### Descrição do Problema

Existe um tratamento de erro genérico que silencia exceções sem logging apropriado:

```typescript
// packages/rbac-admin/src/index.tsx (linha 44)
useEffect(() => {
  client
    .listProfiles()
    .then(setProfiles)
    .catch(() => setProfiles([])) // TODO: melhorar error handling
}, [client])
```

#### Impactos

- Erros de rede/API não são reportados ao usuário
- Debugging dificultado em produção
- Experiência do usuário prejudicada (tela vazia sem feedback)
- Violação de boas práticas de error handling

#### Recomendação

Implementar tratamento de erro apropriado:

```typescript
const [error, setError] = useState<Error | null>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  setLoading(true)
  setError(null)

  client
    .listProfiles()
    .then(setProfiles)
    .catch((err) => {
      console.error('Falha ao carregar perfis:', err)
      setError(err)
      setProfiles([])
    })
    .finally(() => setLoading(false))
}, [client])

// No render:
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
```

---

### 3. Falta de Validação de Input em APIs

**Severidade:** 🟡 MODERADA  
**Status:** ⚠️ REQUER IMPLEMENTAÇÃO  
**Pacotes Afetados:** rbac-admin

#### Descrição do Problema

O cliente da API não valida inputs antes de enviar ao servidor:

```typescript
// packages/rbac-admin/src/types.ts
async createProfile(data: { nome: string }) {
  const r = await doFetch(withBase(endpoints.createProfile), {
    method: "POST",
    headers,
    body: JSON.stringify(data),  // ❌ SEM VALIDAÇÃO
  })
  // ...
}
```

#### Riscos

- Envio de dados inválidos ao servidor
- Mensagens de erro confusas para o usuário
- Possível exploração se servidor não validar adequadamente
- Experiência ruim do desenvolvedor

#### Recomendação

Implementar validação com schema (exemplo com Zod):

```typescript
import { z } from 'zod'

const CreateProfileSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo')
})

async createProfile(data: { nome: string }) {
  // Validação client-side
  const validated = CreateProfileSchema.parse(data)

  const r = await doFetch(withBase(endpoints.createProfile), {
    method: "POST",
    headers,
    body: JSON.stringify(validated),
  })
  // ...
}
```

---

### 4. Ausência de Testes de Integração

**Severidade:** 🟡 MODERADA  
**Status:** ℹ️ MELHORIA RECOMENDADA  
**Pacotes Afetados:** Todos

#### Descrição do Problema

Embora existam testes unitários, não há testes de integração entre os packages do monorepo. Especificamente:

- Não há testes de integração entre `rbac-next` e `rbac-provider`
- Não há testes de integração entre `rbac-prisma` e `rbac-core`
- Não há testes end-to-end do fluxo completo de autorização

#### Impactos

- Risco de breaking changes entre packages
- Dificuldade em garantir compatibilidade de versões
- Regressões não detectadas em mudanças

#### Recomendação

Criar suite de testes de integração:

```typescript
// tests/integration/rbac-flow.test.ts

describe("RBAC Integration Tests", () => {
  it("should resolve permissions end-to-end", async () => {
    // Setup: Create test user with profile
    // Action: Resolve permissions via provider
    // Assert: Correct permissions map returned
  })

  it("should enforce permissions in Next.js middleware", async () => {
    // Setup: Mock request with auth
    // Action: Call withApi wrapper
    // Assert: Correct 403/200 response
  })
})
```

---

## 🟢 PROBLEMAS DE BAIXA PRIORIDADE (Corrigidos)

### 5. Configuração de TSConfig Inconsistente

**Severidade:** 🟢 BAIXA  
**Status:** ✅ CORRIGIDO  
**Pacotes Afetados:** Todos

#### Descrição do Problema

Configurações TypeScript duplicadas em todos os packages sem base compartilhada.

#### Correção Aplicada

✅ Criado `tsconfig.base.json` na raiz do monorepo  
✅ Atualizados todos os `tsconfig.json` para estender a base  
✅ Mantidos overrides específicos (React packages)

**Estrutura Implementada:**

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "declaration": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}

// packages/rbac-core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*", "test/**/*"]
}
```

---

### 6. Falta de .npmignore em Packages

**Severidade:** 🟢 BAIXA  
**Status:** ✅ CORRIGIDO  
**Pacotes Afetados:** Todos

#### Descrição do Problema

Nenhum package possuía arquivo `.npmignore`. Confiavam apenas no campo `files` do `package.json`.

#### Correção Aplicada

✅ Adicionado `.npmignore` em todos os 6 packages

**Conteúdo:**

```ignore
# Source files
src/
test/

# TypeScript config
tsconfig.json

# Test files
*.test.ts
*.test.tsx
*.test.js

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store

# IDE
.vscode/
.idea/

# Build artifacts
*.tsbuildinfo
```

---

## ✅ ASPECTOS POSITIVOS IDENTIFICADOS

1. **Segurança de Dependências:** ✅ Zero vulnerabilidades no npm audit
2. **Proteção contra Prototype Pollution:** ✅ Implementada em `toPermissionsMap`
3. **Type Safety:** ✅ Forte uso de TypeScript em todos os packages
4. **Documentação:** ✅ Comentários JSDoc extensivos e bem escritos
5. **Arquitetura Modular:** ✅ Separação clara de responsabilidades
6. **Cache TTL:** ✅ Implementação eficiente e thread-safe
7. **Dependências:** ✅ Todas disponíveis e funcionais (@anpdgovbr/shared-types confirmado)

---

## 📊 MATRIZ DE PRIORIZAÇÃO

| #   | Problema               | Severidade  | Status       | Prioridade | Auto-Fix   |
| --- | ---------------------- | ----------- | ------------ | ---------- | ---------- |
| 1   | Versões Inconsistentes | 🔴 CRÍTICA  | ✅ CORRIGIDO | P0         | ✅ SIM     |
| 2   | Error Handling         | 🟡 MODERADA | ⚠️ PENDENTE  | P1         | ⚠️ PARCIAL |
| 3   | Validação de Input     | 🟡 MODERADA | ⚠️ PENDENTE  | P1         | ❌ NÃO     |
| 4   | Testes de Integração   | 🟡 MODERADA | ⚠️ PENDENTE  | P2         | ❌ NÃO     |
| 5   | TSConfig Inconsistente | 🟢 BAIXA    | ✅ CORRIGIDO | P2         | ✅ SIM     |
| 6   | Falta .npmignore       | 🟢 BAIXA    | ✅ CORRIGIDO | P3         | ✅ SIM     |

---

## 📝 RECOMENDAÇÕES FINAIS

### Ações Imediatas (Esta Semana)

1. ⚠️ **Implementar error handling adequado** (problema #2)
2. ⚠️ **Adicionar validação de inputs** (problema #3)
3. ✅ **Fazer commit das correções aplicadas**

### Ações de Curto Prazo (Próximo Sprint)

4. ⚠️ **Criar suite de testes de integração** (problema #4)
5. ⚠️ **Code review para remover TODOs** e completar features
6. ⚠️ **Configurar CI/CD** para monorepo

### Ações de Médio Prazo (Próximo Trimestre)

7. ⚠️ **Review de segurança completo**
8. ⚠️ **Performance testing**
9. ⚠️ **Adicionar rate limiting** e CSRF protection

---

## 🔐 ANÁLISE DE SEGURANÇA

### Vulnerabilidades Conhecidas

✅ **NENHUMA** vulnerabilidade encontrada via `npm audit`

### Boas Práticas de Segurança Implementadas

1. ✅ **Prototype Pollution Prevention:** Função `isSafeKey` em `toPermissionsMap`
2. ✅ **No uso de eval/Function:** Código livre de execução dinâmica
3. ✅ **No innerHTML/dangerouslySetInnerHTML:** Sem XSS client-side
4. ✅ **Type Safety:** TypeScript strict mode em todos os packages

---

**Documento gerado por:** GitHub Copilot  
**Última atualização:** 08/10/2025 22:10 BRT
