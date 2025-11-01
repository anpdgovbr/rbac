# Guia de Publicação dos Pacotes RBAC

## 📋 Pré-requisitos

Antes de publicar, certifique-se de:

1. ✅ Estar autenticado no npm: `npm login`
2. ✅ Ter permissões para publicar no escopo `@anpdgovbr`
3. ✅ Ter feito build de todos os pacotes: `pnpm run build`
4. ✅ Todos os testes passando: `pnpm test`
5. ✅ Versões atualizadas nos package.json

## 🚀 Comandos de Publicação

### Publicar TODOS os pacotes de uma vez

```bash
pnpm run publish:all
```

Isso publicará todos os 6 pacotes que não são privados.

### Publicar pacotes individuais

```bash
# Core (base de todos)
pnpm run publish:core

# Provider (contratos)
pnpm run publish:provider

# Prisma adapter
pnpm run publish:prisma

# Next.js adapter
pnpm run publish:next

# React hooks
pnpm run publish:react

# Admin UI (beta)
pnpm run publish:admin
```

## 📦 Ordem Recomendada de Publicação

Devido às dependências entre pacotes, publique nesta ordem:

1. **rbac-core** (não tem dependências)
2. **rbac-provider** (depende de rbac-core)
3. **rbac-prisma**, **rbac-next**, **rbac-react** (podem ser em paralelo)
4. **rbac-admin** (depende de shared-ui e shared-types)

```bash
pnpm run publish:core
pnpm run publish:provider
pnpm run publish:prisma & pnpm run publish:next & pnpm run publish:react
wait
pnpm run publish:admin
```

## 🏷️ Tags de Publicação

### Pacotes Estáveis (latest)

- `@anpdgovbr/rbac-core@0.2.0`
- `@anpdgovbr/rbac-provider@0.2.0`
- `@anpdgovbr/rbac-prisma@0.2.0`
- `@anpdgovbr/rbac-next@0.2.0`
- `@anpdgovbr/rbac-react@0.3.0`

Estes serão publicados com tag `latest` automaticamente.

### Pacote Beta

- `@anpdgovbr/rbac-admin@0.4.0-beta.0`

Este será publicado com tag `beta` (configurado no publishConfig).

## 🔍 Verificação Pós-Publicação

Após publicar, verifique:

```bash
# Verificar versão publicada
npm view @anpdgovbr/rbac-core version
npm view @anpdgovbr/rbac-admin version

# Verificar dist-tags
npm dist-tag ls @anpdgovbr/rbac-core
npm dist-tag ls @anpdgovbr/rbac-admin
```

## ⚠️ IMPORTANTE

**NÃO tente publicar o pacote raiz!**

```bash
# ❌ ERRADO - vai falhar
npm publish

# ✅ CORRETO - use os scripts do monorepo
pnpm run publish:all
# ou
pnpm run publish:core
```

O pacote raiz (`rbac-monorepo`) é `private: true` e não deve ser publicado.

## 🔄 Atualizando Versões

Antes de publicar, atualize as versões:

```bash
# Para bump minor em todos os pacotes
pnpm -r exec npm version minor

# Para bump patch em todos os pacotes
pnpm -r exec npm version patch

# Para bump em pacote específico
cd packages/rbac-core
npm version patch
```

## 📝 Checklist de Publicação

- [ ] Build completo executado: `pnpm run build`
- [ ] Testes passando: `pnpm test`
- [ ] TypeCheck sem erros: `pnpm run typecheck`
- [ ] Lint sem erros: `pnpm run lint`
- [ ] Format check: `pnpm run format:check`
- [ ] Versões atualizadas nos package.json
- [ ] CHANGELOG.md atualizado em cada pacote
- [ ] Autenticado no npm: `npm whoami`
- [ ] Git commit e push realizados
- [ ] Tag git criada (opcional mas recomendado)

## 🎯 Exemplo Completo

```bash
# 1. Garantir que tudo está OK
pnpm run build
pnpm test
pnpm run format:check

# 2. Fazer login no npm (se necessário)
npm login

# 3. Publicar na ordem correta
pnpm run publish:core
pnpm run publish:provider
pnpm run publish:prisma
pnpm run publish:next
pnpm run publish:react
pnpm run publish:admin

# 4. Verificar publicação
npm view @anpdgovbr/rbac-core
npm view @anpdgovbr/rbac-admin

# 5. Criar tag git
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```
