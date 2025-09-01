#!/bin/bash

# Script para gerenciar atualizações do npm-check-updates no monorepo RBAC
# Uso: ./ncu-helper.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 RBAC NCU Helper${NC}"

case "${1:-check}" in
  "check"|"c")
    echo -e "${YELLOW}📋 Verificando atualizações disponíveis...${NC}"
    npm run ncu:check
    ;;
    
  "update"|"u")
    echo -e "${GREEN}⬆️ Atualizando dependências...${NC}"
    npm run ncu:update
    echo -e "${BLUE}🔨 Executando build para verificar compatibilidade...${NC}"
    npm run build
    echo -e "${GREEN}✅ Atualização concluída!${NC}"
    ;;
    
  "interactive"|"i")
    echo -e "${YELLOW}🎮 Modo interativo...${NC}"
    npm run ncu:interactive
    ;;
    
  "deep"|"d")
    echo -e "${YELLOW}🔍 Verificação profunda (dependências transitivas)...${NC}"
    npm run ncu:deep
    ;;
    
  "typescript"|"ts")
    echo -e "${YELLOW}📝 Atualizando apenas TypeScript...${NC}"
    ncu typescript --workspaces -u
    npm install
    npm run typecheck
    ;;
    
  "safe"|"s")
    echo -e "${GREEN}🛡️ Atualizações seguras (patch only)...${NC}"
    ncu --target patch --workspaces -u
    npm install
    npm run build
    npm run test
    ;;
    
  "help"|"h"|*)
    echo -e "${BLUE}Comandos disponíveis:${NC}"
    echo "  check, c       - Verificar atualizações disponíveis"
    echo "  update, u      - Atualizar todas as dependências"
    echo "  interactive, i - Modo interativo para escolher atualizações"
    echo "  deep, d        - Verificação profunda (dependências transitivas)"
    echo "  typescript, ts - Atualizar apenas TypeScript"
    echo "  safe, s        - Apenas atualizações patch (seguras)"
    echo "  help, h        - Mostrar esta ajuda"
    echo ""
    echo -e "${YELLOW}Exemplos:${NC}"
    echo "  ./ncu-helper.sh check"
    echo "  ./ncu-helper.sh interactive"
    echo "  ./ncu-helper.sh safe"
    ;;
esac
