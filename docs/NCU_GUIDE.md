# npm-check-updates (ncu) - Guia para Monorepo RBAC

## Scripts Disponíveis

### Scripts Raiz (executar na pasta `/rbac`)

```bash
# Verificar atualizações em todos os packages (sem aplicar)
npm run ncu:check

# Atualizar dependências em todos os packages
npm run ncu:update

# Modo interativo para escolher quais dependências atualizar
npm run ncu:interactive

# Atualizar apenas dependências do package.json raiz
npm run ncu:root

# Executar ncu em todos os packages individualmente
npm run ncu:packages
```

### Scripts Individuais (executar dentro de cada package)

```bash
# Verificar atualizações do package atual
npm run ncu:check

# Atualizar dependências do package atual
npm run ncu:update

# ncu básico (mesmo que ncu:check)
npm run ncu
```

## Exemplos de Uso

### 1. Verificar Atualizações Globalmente

```bash
cd /home/luciano/backlog-dim/rbac
npm run ncu:check
```

### 2. Atualizar um Package Específico

```bash
cd /home/luciano/backlog-dim/rbac/packages/rbac-core
npm run ncu:update
```

### 3. Modo Interativo (Recomendado)

```bash
cd /home/luciano/backlog-dim/rbac
npm run ncu:interactive
```

### 4. Verificar Dependências Transitivas (Deep)

```bash
cd /home/luciano/backlog-dim/rbac
npm run ncu:deep
```

### 5. Atualizar Apenas Minor/Patch

```bash
cd /home/luciano/backlog-dim/rbac
ncu --target minor -u --workspaces
```

## Configuração (.ncurc.json)

```json
{
  "target": "minor",        // Apenas atualizações minor/patch (seguro)
  "upgrade": false,         // Não aplicar por padrão (apenas mostrar)  
  "workspaces": true        // Incluir workspaces
}
```

**Nota:** Configurações mais complexas podem causar erros. Manter simples.

## Comandos Úteis

### Verificar Versões Específicas

```bash
# Verificar apenas TypeScript
ncu typescript --workspace --deep

# Verificar apenas dependências de desenvolvimento
ncu --dep dev --workspace --deep

# Verificar apenas dependências de produção
ncu --dep prod --workspace --deep
```

### Filtros e Exclusões

```bash
# Excluir dependências específicas
ncu --reject "@types/node,eslint" --workspace -u

# Incluir apenas dependências específicas
ncu --filter "typescript,prettier" --workspace -u

# Atualizar apenas para latest (não beta/alpha)
ncu --target latest --workspace -u
```

### Análise de Impacto

```bash
# Ver o que mudaria sem aplicar
ncu --workspace --deep

# Ver changelog das atualizações
ncu --format repo --workspace

# Ver apenas breaking changes
ncu --target major --workspace
```

## Workflow Recomendado

1. **Verificação semanal:**
   ```bash
   npm run ncu:check
   ```

2. **Atualizações seguras (minor/patch):**
   ```bash
   npm run ncu:update
   ```

3. **Atualizações major (cuidado):**
   ```bash
   npm run ncu:interactive
   # ou
   ncu --target major -i --workspace --deep
   ```

4. **Após atualizações:**
   ```bash
   npm run build
   npm run typecheck
   npm run test
   ```

## Troubleshooting

### Conflitos de Dependências Internas

Se houver conflitos entre packages do monorepo:

```bash
# Atualizar dependências internas primeiro
npm run build:core
npm run build:provider
# etc...

# Depois atualizar dependências externas
npm run ncu:update
```

### Cache Issues

```bash
# Limpar cache npm
npm cache clean --force

# Limpar node_modules e reinstalar
rm -rf node_modules packages/*/node_modules
npm install
```

## Integração com CI/CD

Adicionar verificação no CI:

```yaml
- name: Check for outdated dependencies
  run: |
    cd rbac
    npm run ncu:check
    # Falhar se houver muitas dependências desatualizadas
```
