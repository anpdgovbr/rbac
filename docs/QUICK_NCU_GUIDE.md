# RBAC - Comandos Essenciais

## 🚀 Quick Start

```bash
# Setup inicial
cd /home/luciano/backlog-dim/rbac
npm install
npm run build

# Verificação de dependências
npm run ncu:check
```

## 📦 NCU (npm-check-updates) - Comandos Mais Usados

### Scripts npm

```bash
# Verificar atualizações (recomendado antes de qualquer atualização)
npm run ncu:check

# Modo interativo - escolher o que atualizar (RECOMENDADO)
npm run ncu:interactive

# Atualizar todas as dependências automaticamente
npm run ncu:update

# Verificar dependências transitivas (deep)
npm run ncu:deep

# Atualizar apenas dependências do package.json raiz
npm run ncu:root
```

### Script Helper (Mais Conveniente)

```bash
# Verificação rápida
./ncu-helper.sh check
# ou
./ncu-helper.sh c

# Modo interativo (RECOMENDADO)
./ncu-helper.sh interactive
# ou
./ncu-helper.sh i

# Atualizações seguras (apenas patch)
./ncu-helper.sh safe
# ou
./ncu-helper.sh s

# Atualizar apenas TypeScript
./ncu-helper.sh typescript
# ou
./ncu-helper.sh ts

# Ver todos os comandos
./ncu-helper.sh help
```

## 🛠️ Workflow Recomendado

### 1. Verificação Semanal

```bash
./ncu-helper.sh check
```

### 2. Atualizações Controladas

```bash
# Para atualizações seguras (patch versions)
./ncu-helper.sh safe

# Para atualizações maiores (escolha manual)
./ncu-helper.sh interactive
```

### 3. Após Atualizações

```bash
npm run build
npm run typecheck
npm run test
```

## 🎯 Casos de Uso Específicos

### Atualizar apenas TypeScript

```bash
./ncu-helper.sh typescript
```

### Ver dependências específicas

```bash
ncu typescript @types/react --workspaces
```

### Atualizar para latest (incluindo betas)

```bash
ncu --target latest --workspaces -i
```

### Excluir dependências específicas

```bash
ncu --reject "@types/node,eslint" --workspaces
```

## 📋 Arquivos de Configuração

- `.ncurc.json` - Configuração global do ncu
- `package.json` - Scripts npm
- `ncu-helper.sh` - Script shell com comandos úteis

## 🚨 Dicas Importantes

1. **SEMPRE** use modo interativo para atualizações major
2. **SEMPRE** execute `npm run build` após atualizações
3. **PREFERENCIALMENTE** use atualizações seguras (`safe`) para CI/CD
4. **VERIFIQUE** os changelogs antes de atualizar dependências importantes
