#!/bin/bash

# Script avançado para promover versões beta para latest
# Com verificações de login, existência de versões e confirmação

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo -e "${BLUE}🚀 Script avançado para promoção de versões beta para latest${NC}"
echo ""

# Verificar se está logado no npm
print_info "Verificando login no npm..."
if ! npm whoami &> /dev/null; then
    print_error "Você não está logado no npm. Execute 'npm login' primeiro."
    exit 1
fi

current_user=$(npm whoami)
print_success "Logado como: $current_user"
echo ""

# Lista de diretórios dos pacotes
package_dirs=(
  "packages/rbac-core"
  "packages/rbac-provider"
  "packages/rbac-prisma"
  "packages/rbac-next"
  "packages/rbac-react"
  "packages/rbac-admin"
)

# Array para armazenar pacotes com suas versões
packages=()
package_names=()

# Ler versões dos package.json
print_info "Lendo versões dos package.json..."
for package_dir in "${package_dirs[@]}"; do
  if [[ -f "$package_dir/package.json" ]]; then
    # Extrair nome e versão do package.json
    if command -v jq &> /dev/null; then
      name=$(jq -r '.name' "$package_dir/package.json")
      version=$(jq -r '.version' "$package_dir/package.json")
    else
      # Fallback usando node se jq não estiver disponível
      name=$(node -p "require('./$package_dir/package.json').name")
      version=$(node -p "require('./$package_dir/package.json').version")
    fi
    
    packages+=("$name@$version")
    package_names+=("$name")
    echo "  📋 $name@$version"
  else
    print_warning "Arquivo package.json não encontrado em $package_dir"
  fi
done

echo ""

# Verificar se encontrou pacotes
if [[ ${#packages[@]} -eq 0 ]]; then
  print_error "Nenhum pacote encontrado. Verifique se está no diretório correto."
  exit 1
fi

# Verificar se as versões existem no registry
print_info "Verificando se as versões existem no registry npm..."
for package_info in "${packages[@]}"; do
  package_name="${package_info%@*}"
  version="${package_info#*@}"
  
  if npm view "$package_info" version &> /dev/null; then
    print_success "$package_info existe no registry"
  else
    print_error "$package_info NÃO existe no registry. Publique primeiro!"
    exit 1
  fi
done

echo ""

# Mostrar resumo e pedir confirmação
echo -e "${YELLOW}📋 RESUMO: As seguintes versões serão promovidas para 'latest':${NC}"
for package_info in "${packages[@]}"; do
  echo "  • $package_info"
done

echo ""
read -p "Deseja continuar? (s/N): " confirm
if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
  print_warning "Operação cancelada pelo usuário."
  exit 0
fi

echo ""

# Promover cada pacote
print_info "Promovendo versões para latest..."
for package_info in "${packages[@]}"; do
  echo -n "📦 Promovendo $package_info para latest... "
  if npm dist-tag add "$package_info" latest &> /dev/null; then
    print_success "OK"
  else
    print_error "FALHOU"
    print_error "Erro ao promover $package_info"
    exit 1
  fi
done

echo ""
print_success "Todas as versões foram promovidas para latest!"
echo ""

# Verificar tags finais
print_info "Verificando tags atuais:"
echo ""
for package_name in "${package_names[@]}"; do
  echo -e "${BLUE}📋 Tags para $package_name:${NC}"
  npm dist-tag ls "$package_name"
  echo ""
done

print_success "🎉 Processo concluído com sucesso!"
