#!/usr/bin/env bash
set -euo pipefail

# Configs
TAG="${TAG:-latest}"
ACCESS="${ACCESS:-public}"
PACKAGES_DIR="${PACKAGES_DIR:-./packages}"

# Ordem explícita (a mesma que você usou)
PACKAGES=(
  "rbac-core"
  "rbac-provider"
  "rbac-prisma"
  "rbac-next"
  "rbac-react"
  "rbac-admin"
)

log() { printf "\n\033[1m%s\033[0m\n" "$*"; }
warn() { printf "\033[33m%s\033[0m\n" "$*" >&2; }
err() { printf "\033[31m%s\033[0m\n" "$*" >&2; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Comando '$1' não encontrado."; exit 127; }
}

# 1) Pré-checagens
require_cmd npm
require_cmd node

if [[ ! -d "$PACKAGES_DIR" ]]; then
  err "Diretório $PACKAGES_DIR não existe. Ajuste PACKAGES_DIR ou rode da raiz do monorepo."
  exit 1
fi

# 2) Autenticação/2FA (faz login via web se necessário)
if ! npm whoami >/dev/null 2>&1; then
  log "Você não está logado no npm. Abrindo login via web para 2FA..."
  # Isto vai pausar para você autenticar no navegador (o mesmo comportamento do seu primeiro publish)
  # Detecta WSL / macOS / Linux e define BROWSER automaticamente (zsh/WSL friendly)
  if grep -qi microsoft /proc/version 2>/dev/null || [ -n "${WSL_INTEROP-}" ]; then
    # Estamos em WSL
    if command -v wslview >/dev/null 2>&1; then
      BROWSER="${BROWSER:-wslview}"
    else
      # Fallback para abrir pelo Windows se wslview não estiver instalado
      BROWSER="${BROWSER:-cmd.exe /C start ""}"
    fi
  elif command -v xdg-open >/dev/null 2>&1; then
    BROWSER="${BROWSER:-xdg-open}"
  elif command -v open >/dev/null 2>&1; then
    # macOS
    BROWSER="${BROWSER:-open}"
  else
    # último recurso: tente abrir com PowerShell/Windows start
    BROWSER="${BROWSER:-cmd.exe /C start ""}"
  fi
  export BROWSER
  npm login --auth-type=web
  log "Login concluído."
else
  log "Já autenticado no npm como: $(npm whoami)"
fi

# 3) Função de publish com tolerância a 'já publicado'
publish_pkg() {
  local pkg="$1"
  local pkg_dir="$PACKAGES_DIR/$pkg"

  if [[ ! -d "$pkg_dir" ]]; then
    warn "Pasta não encontrada: $pkg_dir. Pulando."
    return 0
  fi

  pushd "$pkg_dir" >/dev/null

  # pula pacotes privados
  if grep -q '"private"[[:space:]]*:[[:space:]]*true' package.json 2>/dev/null; then
    warn "$pkg está 'private': pulando."
    popd >/dev/null
    return 0
  fi

  # extrai nome e versão
  local name ver
  name="$(node -p "require('./package.json').name" 2>/dev/null || echo "$pkg")"
  ver="$(node -p "require('./package.json').version" 2>/dev/null || echo "?")"

  # Define tag por pacote (rbac-admin continua em beta por padrão)
  local tag_for_pkg="$TAG"
  if [[ "$name" == "@anpdgovbr/rbac-admin" && -z "${FORCE_LATEST_TAG:-}" ]]; then
    tag_for_pkg="beta"
  fi

  log "Publicando $name@$ver  (tag=$tag_for_pkg, access=$ACCESS)"

  # build antes de publicar
  if npm run --silent build >/dev/null 2>&1; then
    :
  else
    warn "Build falhou em $name@$ver. Tentando prosseguir mesmo assim."
  fi

  # tenta publicar
  if npm publish --access "$ACCESS" --tag "$tag_for_pkg"; then
    log "OK: $name@$ver publicado."
  else
    # Se falhar, verifica se a versão já existe; se sim, apenas informa e segue
    if npm view "$name@$ver" version >/dev/null 2>&1; then
      warn "Já publicado no registry: $name@$ver. Pulando."
    else
      err "Falha ao publicar $name@$ver."
      popd >/dev/null
      return 1
    fi
  fi

  popd >/dev/null
  return 0
}

# 4) Loop principal
overall_rc=0
for pkg in "${PACKAGES[@]}"; do
  if ! publish_pkg "$pkg"; then
    overall_rc=1
  fi
done

if [[ $overall_rc -eq 0 ]]; then
  log "✅ Pipeline de publicação concluído."
else
  err "⚠️ Pipeline concluído com erros em um ou mais pacotes."
fi
