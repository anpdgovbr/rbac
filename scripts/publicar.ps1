<#
.SYNOPSIS
  Publica pacotes do monorepo @anpdgovbr/*

.PARAMETER Tag
  Tag default (default: latest)

.PARAMETER Access
  npm access (default: public)

#>
param(
  [string]$Tag = "latest",
  [string]$Access = "public",
  [string]$PackagesDir = "./packages"
)

# Lista explícita de pacotes (ordem)
$Packages = @("rbac-core","rbac-provider","rbac-prisma","rbac-next","rbac-react","rbac-admin")

function Log { Write-Host ""; Write-Host $_ -ForegroundColor White -NoNewline; Write-Host "" }
function Warn { param($m); Write-Host $m -ForegroundColor Yellow }
function Err { param($m); Write-Host $m -ForegroundColor Red; exit 1 }

# checa comandos
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { Err "Comando 'pnpm' não encontrado." }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Err "Comando 'node' não encontrado." }

if (-not (Test-Path $PackagesDir)) { Err "Diretório $PackagesDir não existe. Rode da raiz do monorepo ou ajuste PackagesDir." }

# login npm (web auth) se necessário
try {
  pnpm whoami > $null 2>&1
} catch {
  Write-Host "Você não está logado no npm. Abrindo login via web para 2FA..."
  pnpm login
  Write-Host "Login concluído."
}

function Publish-Pkg {
  param([string]$pkg)

  $pkgDir = Join-Path $PackagesDir $pkg
  if (-not (Test-Path $pkgDir)) { Warn "Pasta não encontrada: $pkgDir. Pulando."; return 0 }

  Push-Location $pkgDir
  try {
    $pkgJson = Get-Content package.json -Raw | ConvertFrom-Json
    $name = $pkgJson.name
    $ver  = $pkgJson.version
  } catch {
    Warn "Falha ao ler package.json em $pkgDir. Pulando."
    Pop-Location
    return 0
  }

  if ($pkgJson.private -eq $true) {
    Warn "$name está 'private': pulando."
    Pop-Location
    return 0
  }

  $tagForPkg = $Tag
  if ($name -eq "@anpdgovbr/rbac-admin" -and -not $env:FORCE_LATEST_TAG) { $tagForPkg = "beta" }

  Write-Host "`nPublicando $name@$ver  (tag=$tagForPkg, access=$Access)`n"

  # build (tenta, mas prossegue se falhar)
  $buildOk = $true
  try {
    pnpm run --silent build > $null 2>&1
  } catch {
    $buildOk = $false
    Warn "Build falhou em $name@$ver. Tentando prosseguir mesmo assim."
  }

  # tenta publicar
  pnpm publish --access $Access --tag $tagForPkg --no-git-checks
  if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: $name@$ver publicado."
  } else {
    # checa se versão já existe
    pnpm view "$name@$ver" version > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
      Warn "Já publicado no registry: $name@$ver. Pulando."
    } else {
      Err "Falha ao publicar $name@$ver."
    }
  }

  Pop-Location
  return 0
}

$overallRc = 0
foreach ($p in $Packages) {
  try {
    Publish-Pkg -pkg $p
  } catch {
    $overallRc = 1
  }
}

if ($overallRc -eq 0) { Write-Host "`n✅ Pipeline de publicação concluído." } else { Write-Host "`n⚠️ Pipeline concluído com erros." -ForegroundColor Yellow; exit 1 }