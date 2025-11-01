#!/bin/bash

# Script para promover versões beta para latest
# Lê as versões automaticamente dos package.json

set -e

echo "🚀 Promovendo versões beta para latest..."
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

# Ler versões dos package.json e construir array
for package_dir in "${package_dirs[@]}"; do
  if [[ -f "$package_dir/package.json" ]]; then
    # Extrair nome e versão do package.json usando jq ou node
    if command -v jq &> /dev/null; then
      name=$(jq -r '.name' "$package_dir/package.json")
      version=$(jq -r '.version' "$package_dir/package.json")
    else
      # Fallback usando node se jq não estiver disponível
      name=$(node -p "require('./$package_dir/package.json').name")
      version=$(node -p "require('./$package_dir/package.json').version")
    fi
    
    packages+=("$name@$version")
    echo "📋 Encontrado: $name@$version"
  else
    echo "⚠️  Arquivo package.json não encontrado em $package_dir"
  fi
done

echo ""

# Verificar se encontrou pacotes
if [[ ${#packages[@]} -eq 0 ]]; then
  echo "❌ Nenhum pacote encontrado. Verifique se está no diretório correto."
  exit 1
fi

# Promover cada pacote
for package in "${packages[@]}"; do
  echo "📦 Promovendo $package para latest..."
  pnpm dist-tag add "$package" latest
  echo "✅ $package agora é latest"
  echo ""
done

echo "🎉 Todas as versões foram promovidas para latest!"
echo ""
echo "Verificando tags atuais:"
echo ""

# Verificar as tags de cada pacote (extrair nomes dos pacotes)
for package_info in "${packages[@]}"; do
  package_name="${package_info%@*}"  # Remove @version da string
  echo "📋 Tags para $package_name:"
  pnpm dist-tag ls "$package_name"
  echo ""
done
