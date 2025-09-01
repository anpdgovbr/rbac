# 💾 Estratégia de Dados RBAC ANPD

[![Dados](https://img.shields.io/badge/Dados-Banco_Authoritative-blue.svg)]()
[![Performance](https://img.shields.io/badge/Performance-Cache_Otimizado-green.svg)]()
[![Flexibilidade](https://img.shields.io/badge/Flexibilidade-Runtime_Admin-orange.svg)]()

## 📋 Índice de Estratégia

- [🎯 Visão Geral](#-visão-geral)
- [🚀 Fase de Desenvolvimento](#-fase-de-desenvolvimento)
- [🏭 Fase de Produção](#-fase-de-produção)
- [🔄 Estratégia de Transição](#-estratégia-de-transição)
- [📊 Estrutura de Dados](#-estrutura-de-dados)
- [⚡ Performance e Cache](#-performance-e-cache)
- [🛠️ Administração e UI](#️-administração-e-ui)
- [🔧 Implementação Técnica](#-implementação-técnica)

---

## 🎯 Visão Geral

### Objetivo Estratégico

**Permitir uso imediato no desenvolvimento e evoluir para autoridade 100% em banco de dados, com administração runtime via interface web.**

### Princípios Arquiteturais

#### 1. **Flexibilidade sem Acoplamento** 🔗
- `Action` e `Resource` são `string` no core
- Sem dependência de enums rígidos
- Extensibilidade total via banco de dados

#### 2. **Performance First** ⚡
- Cache inteligente de permissões
- Consultas otimizadas com índices
- Invalidação granular de cache

#### 3. **Developer Experience** 👨‍💻
- Type safety em desenvolvimento
- Auto-complete de permissões
- Validação em tempo de build

#### 4. **Runtime Administration** 🎛️
- Interface web para gestão
- Alterações sem redeploy
- Auditoria de mudanças

---

## 🚀 Fase de Desenvolvimento

### Estratégia Inicial: **Enums + Type Safety**

```typescript
// shared-types/src/permissions.ts
export enum Action {
  Criar = "Criar",
  Exibir = "Exibir", 
  Editar = "Editar",
  Excluir = "Excluir",
  Gerenciar = "Gerenciar",
  Administrar = "Administrar"
}

export enum Resource {
  Usuario = "Usuario",
  Perfil = "Perfil",
  Processo = "Processo",
  Relatorio = "Relatorio",
  Dashboard = "Dashboard",
  Sistema = "Sistema"
}

// Type-safe permissions para desenvolvimento
export interface TypedPermissao {
  acao: Action
  recurso: Resource
}

// União de strings para uso com core RBAC
export type ActionString = `${Action}`
export type ResourceString = `${Resource}`
```

### Desenvolvimento com Type Safety

```typescript
// Durante desenvolvimento - type safe
import { Action, Resource } from '@anpdgovbr/shared-types'
import { usePode } from '@anpdgovbr/rbac-react'

function UserManagement() {
  const { pode } = usePode()
  
  // Type-safe durante desenvolvimento
  const canCreateUser = pode(Action.Criar, Resource.Usuario)
  const canEditUser = pode(Action.Editar, Resource.Usuario)
  
  return (
    <>
      {canCreateUser && <CreateUserButton />}
      {canEditUser && <EditUserButton />}
    </>
  )
}

// Provider configurado com strings
const permissions: Permissao[] = [
  { acao: Action.Criar, recurso: Resource.Usuario },
  { acao: Action.Editar, recurso: Resource.Usuario }
]
```

### Transição para Strings

```typescript
// helpers/permission-mapper.ts
export function enumToString(action: Action, resource: Resource): [string, string] {
  return [action as string, resource as string]
}

export function typedPermissionToCore(typed: TypedPermissao): Permissao {
  return {
    acao: typed.acao as string,
    recurso: typed.recurso as string
  }
}

// Uso em providers
export class DevelopmentPermissionsProvider implements PermissionsProvider {
  async getUserPermissions(identity: string): Promise<PermissionsMap> {
    const typedPermissions = await this.getTypedPermissions(identity)
    
    // Converter para formato string do core
    const corePermissions = typedPermissions.map(typedPermissionToCore)
    
    return toPermissionsMap(corePermissions.map(p => ({ ...p, grant: true })))
  }
}
```

---

## 🏭 Fase de Produção

### Estratégia Final: **Database Authority**

#### Schema de Banco Completo

```sql
-- Permissions são completamente dinâmicas
CREATE TABLE permissoes (
  id VARCHAR(255) PRIMARY KEY,
  acao VARCHAR(255) NOT NULL,
  recurso VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(255), -- Para agrupamento na UI
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_acao_recurso (acao, recurso),
  INDEX idx_categoria (categoria),
  INDEX idx_ativo (ativo)
);

-- Hierarquia complexa de perfis
CREATE TABLE perfis (
  id VARCHAR(255) PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  cor VARCHAR(7), -- Hex color para UI
  icone VARCHAR(255), -- Material Icon name
  categoria VARCHAR(255),
  ativo BOOLEAN DEFAULT TRUE,
  perfil_pai_id VARCHAR(255),
  nivel_hierarquia INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (perfil_pai_id) REFERENCES perfis(id) ON DELETE SET NULL,
  INDEX idx_categoria (categoria),
  INDEX idx_nivel (nivel_hierarquia),
  INDEX idx_pai (perfil_pai_id)
);

-- Permissões com grant/revoke granular
CREATE TABLE perfil_permissoes (
  id VARCHAR(255) PRIMARY KEY,
  perfil_id VARCHAR(255) NOT NULL,
  permissao_id VARCHAR(255) NOT NULL,
  grant_permission BOOLEAN DEFAULT TRUE,
  contexto JSON, -- Contexto adicional (ex: filtros, limitações)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE CASCADE,
  FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_perfil_permissao (perfil_id, permissao_id),
  INDEX idx_grant (grant_permission)
);

-- Auditoria de mudanças
CREATE TABLE permission_audit (
  id VARCHAR(255) PRIMARY KEY,
  entity_type ENUM('Usuario', 'Perfil', 'Permissao') NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'GRANT', 'REVOKE') NOT NULL,
  old_values JSON,
  new_values JSON,
  changed_by VARCHAR(255) NOT NULL,
  reason TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_changed_by (changed_by),
  INDEX idx_created_at (created_at)
);
```

#### Provider de Produção

```typescript
// lib/production-permissions-provider.ts
export class ProductionPermissionsProvider implements PermissionsProvider {
  constructor(
    private prisma: PrismaClient,
    private cache: PermissionCache
  ) {}
  
  async getUserPermissions(identity: string): Promise<PermissionsMap> {
    // Tentar cache primeiro
    const cached = await this.cache.get(identity)
    if (cached) return cached
    
    // Buscar permissões com hierarquia
    const permissions = await this.computeEffectivePermissions(identity)
    
    // Cache com TTL apropriado
    await this.cache.set(identity, permissions, { ttl: 300 }) // 5 minutos
    
    return permissions
  }
  
  private async computeEffectivePermissions(identity: string): Promise<PermissionsMap> {
    // Query otimizada que resolve hierarquia em uma consulta
    const result = await this.prisma.$queryRaw`
      WITH RECURSIVE profile_hierarchy AS (
        -- Buscar perfis diretos do usuário
        SELECT p.id, p.nome, p.perfil_pai_id, 0 as level
        FROM perfis p
        INNER JOIN usuario_perfis up ON p.id = up.perfil_id
        INNER JOIN usuarios u ON up.usuario_id = u.id
        WHERE u.email = ${identity} AND up.ativo = true AND p.ativo = true
        
        UNION ALL
        
        -- Recursão para perfis pai
        SELECT p.id, p.nome, p.perfil_pai_id, ph.level + 1
        FROM perfis p
        INNER JOIN profile_hierarchy ph ON p.id = ph.perfil_pai_id
        WHERE p.ativo = true AND ph.level < 10 -- Prevenir loops infinitos
      )
      SELECT 
        perm.acao,
        perm.recurso,
        pp.grant_permission,
        pp.contexto,
        ph.level,
        p.nome as perfil_nome
      FROM profile_hierarchy ph
      INNER JOIN perfis p ON ph.id = p.id
      INNER JOIN perfil_permissoes pp ON p.id = pp.perfil_id
      INNER JOIN permissoes perm ON pp.permissao_id = perm.id
      WHERE perm.ativo = true
      ORDER BY ph.level ASC, pp.grant_permission DESC
    `
    
    // Resolver conflitos (grant vs revoke)
    const resolved = this.resolvePermissionConflicts(result)
    
    return this.toPermissionsMap(resolved)
  }
  
  private resolvePermissionConflicts(rawPermissions: any[]): Array<{
    acao: string
    recurso: string
    grant: boolean
    contexto?: any
  }> {
    const permissionMap = new Map<string, any>()
    
    for (const perm of rawPermissions) {
      const key = `${perm.acao}:${perm.recurso}`
      const existing = permissionMap.get(key)
      
      if (!existing) {
        permissionMap.set(key, perm)
      } else {
        // Hierarquia: nível mais baixo tem precedência
        // Grant vs Revoke: revoke explícito tem precedência
        if (perm.level < existing.level || 
           (perm.level === existing.level && !perm.grant_permission)) {
          permissionMap.set(key, perm)
        }
      }
    }
    
    return Array.from(permissionMap.values()).map(p => ({
      acao: p.acao,
      recurso: p.recurso,
      grant: p.grant_permission,
      contexto: p.contexto
    }))
  }
}
```

---

## 🔄 Estratégia de Transição

### Abordagem Gradual Segura

#### Fase 1: **Dual Mode** (Desenvolvimento + Produção)

```typescript
// config/permission-strategy.ts
export class PermissionStrategy {
  static isDevelopment = process.env.NODE_ENV === 'development'
  static useStaticPermissions = process.env.RBAC_USE_STATIC === 'true'
  
  static getProvider(): PermissionsProvider {
    if (this.isDevelopment || this.useStaticPermissions) {
      return new StaticPermissionsProvider()
    } else {
      return new ProductionPermissionsProvider(prisma, cache)
    }
  }
}

// Provider híbrido para transição
export class HybridPermissionsProvider implements PermissionsProvider {
  constructor(
    private staticProvider: StaticPermissionsProvider,
    private dbProvider: ProductionPermissionsProvider
  ) {}
  
  async getUserPermissions(identity: string): Promise<PermissionsMap> {
    if (PermissionStrategy.useStaticPermissions) {
      return this.staticProvider.getUserPermissions(identity)
    }
    
    try {
      return await this.dbProvider.getUserPermissions(identity)
    } catch (error) {
      console.warn('Database permissions failed, falling back to static:', error)
      return this.staticProvider.getUserPermissions(identity)
    }
  }
}
```

#### Fase 2: **Migration Scripts**

```typescript
// scripts/migrate-static-to-db.ts
export class StaticToDbMigration {
  async migrateEnumsToDatabase() {
    console.log('Migrating static enums to database...')
    
    // Migrar Actions
    for (const [key, value] of Object.entries(Action)) {
      await this.prisma.permissao.upsert({
        where: { acao_recurso: { acao: value, recurso: 'PLACEHOLDER' } },
        update: {},
        create: {
          id: uuidv4(),
          acao: value,
          recurso: 'PLACEHOLDER',
          descricao: `Ação migrada: ${key}`,
          categoria: 'core'
        }
      })
    }
    
    // Migrar Resources
    for (const [key, value] of Object.entries(Resource)) {
      await this.createResourcePermissions(value, key)
    }
    
    // Migrar perfis padrão
    await this.createDefaultProfiles()
    
    console.log('Migration completed!')
  }
  
  private async createResourcePermissions(resource: string, displayName: string) {
    const standardActions = [
      Action.Criar, Action.Exibir, Action.Editar, Action.Excluir
    ]
    
    for (const action of standardActions) {
      await this.prisma.permissao.upsert({
        where: { acao_recurso: { acao: action, recurso: resource } },
        update: {},
        create: {
          id: uuidv4(),
          acao: action,
          recurso: resource,
          descricao: `${action} ${displayName}`,
          categoria: 'crud'
        }
      })
    }
  }
  
  private async createDefaultProfiles() {
    const defaultProfiles = [
      {
        nome: 'Administrador',
        descricao: 'Acesso completo ao sistema',
        cor: '#f44336',
        icone: 'AdminPanelSettings',
        categoria: 'system'
      },
      {
        nome: 'Gerente',
        descricao: 'Gestão de usuários e relatórios',
        cor: '#ff9800',
        icone: 'ManageAccounts', 
        categoria: 'management'
      },
      {
        nome: 'Usuario',
        descricao: 'Acesso básico ao sistema',
        cor: '#4caf50',
        icone: 'Person',
        categoria: 'user'
      }
    ]
    
    for (const profile of defaultProfiles) {
      await this.prisma.perfil.upsert({
        where: { nome: profile.nome },
        update: {},
        create: {
          id: uuidv4(),
          ...profile
        }
      })
    }
  }
}
```

#### Fase 3: **Code Generation** (Opcional)

```typescript
// scripts/generate-types-from-db.ts
export class TypesCodegen {
  async generatePermissionTypes() {
    const permissions = await this.prisma.permissao.findMany({
      where: { ativo: true },
      distinct: ['acao', 'recurso']
    })
    
    const actions = [...new Set(permissions.map(p => p.acao))]
    const resources = [...new Set(permissions.map(p => p.recurso))]
    
    const typeDefinitions = `
// Auto-generated from database - DO NOT EDIT MANUALLY
// Generated at: ${new Date().toISOString()}

export type DatabaseAction = ${actions.map(a => `"${a}"`).join(' | ')}
export type DatabaseResource = ${resources.map(r => `"${r}"`).join(' | ')}

export interface DatabasePermission {
  acao: DatabaseAction
  recurso: DatabaseResource
}

// Compatibility with old enums
export const ActionValues = {
  ${actions.map(a => `${this.toPascalCase(a)}: "${a}" as const`).join(',\n  ')}
} as const

export const ResourceValues = {
  ${resources.map(r => `${this.toPascalCase(r)}: "${r}" as const`).join(',\n  ')}
} as const
`
    
    await writeFile('src/generated/database-types.ts', typeDefinitions)
    console.log('Types generated successfully!')
  }
  
  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}
```

---

## 📊 Estrutura de Dados

### Modelo de Dados Completo

```mermaid
erDiagram
    Usuario ||--o{ UsuarioPerfil : "tem"
    Perfil ||--o{ UsuarioPerfil : "atribuido"
    Perfil ||--o{ PerfilPermissao : "possui"
    Permissao ||--o{ PerfilPermissao : "concedida"
    Perfil ||--o{ Perfil : "herda de"
    
    Usuario {
        string id PK
        string email UK
        string nome
        boolean ativo
        timestamp created_at
        timestamp updated_at
    }
    
    Perfil {
        string id PK
        string nome UK
        text descricao
        string cor
        string icone
        string categoria
        boolean ativo
        string perfil_pai_id FK
        int nivel_hierarquia
        timestamp created_at
        timestamp updated_at
    }
    
    Permissao {
        string id PK
        string acao
        string recurso
        text descricao
        string categoria
        boolean ativo
        timestamp created_at
        timestamp updated_at
    }
    
    UsuarioPerfil {
        string id PK
        string usuario_id FK
        string perfil_id FK
        boolean ativo
        timestamp created_at
    }
    
    PerfilPermissao {
        string id PK
        string perfil_id FK
        string permissao_id FK
        boolean grant_permission
        json contexto
        string created_by
        timestamp created_at
    }
```

### Categorização de Permissões

```typescript
// config/permission-categories.ts
export enum PermissionCategory {
  // Sistema
  SYSTEM = 'system',
  ADMIN = 'admin',
  
  // CRUD Básico
  CRUD = 'crud',
  READ_ONLY = 'read-only',
  
  // Funcional
  WORKFLOW = 'workflow',
  REPORTING = 'reporting',
  USER_MANAGEMENT = 'user-management',
  
  // Contextual
  DEPARTMENT = 'department',
  PROJECT = 'project',
  TEMPORAL = 'temporal'
}

export const categoryConfig = {
  [PermissionCategory.SYSTEM]: {
    name: 'Sistema',
    description: 'Permissões de sistema e administração',
    color: '#f44336',
    icon: 'Settings'
  },
  [PermissionCategory.CRUD]: {
    name: 'CRUD',
    description: 'Operações básicas de criar, ler, atualizar, deletar',
    color: '#2196f3',
    icon: 'DataObject'
  },
  [PermissionCategory.WORKFLOW]: {
    name: 'Fluxo de Trabalho', 
    description: 'Permissões de processos e workflows',
    color: '#4caf50',
    icon: 'AccountTree'
  }
}
```

---

## ⚡ Performance e Cache

### Sistema de Cache Inteligente

```typescript
// lib/permission-cache.ts
export class PermissionCache {
  constructor(
    private redis: Redis,
    private metrics: CacheMetrics
  ) {}
  
  async get(identity: string): Promise<PermissionsMap | null> {
    const startTime = Date.now()
    
    try {
      const cached = await this.redis.get(`permissions:${identity}`)
      
      if (cached) {
        this.metrics.recordHit(Date.now() - startTime)
        return JSON.parse(cached)
      }
      
      this.metrics.recordMiss(Date.now() - startTime)
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      this.metrics.recordError()
      return null
    }
  }
  
  async set(
    identity: string, 
    permissions: PermissionsMap, 
    options: { ttl?: number } = {}
  ): Promise<void> {
    const ttl = options.ttl || 300 // 5 minutos default
    
    try {
      await this.redis.setex(
        `permissions:${identity}`,
        ttl,
        JSON.stringify(permissions)
      )
      
      // Indexar para invalidação por perfil/permissão
      await this.indexForInvalidation(identity, permissions)
      
    } catch (error) {
      console.error('Cache set error:', error)
      this.metrics.recordError()
    }
  }
  
  async invalidateUser(identity: string): Promise<void> {
    await this.redis.del(`permissions:${identity}`)
  }
  
  async invalidateByProfile(profileId: string): Promise<void> {
    // Buscar usuários afetados
    const users = await this.redis.smembers(`profile_users:${profileId}`)
    
    if (users.length > 0) {
      const pipeline = this.redis.pipeline()
      
      for (const user of users) {
        pipeline.del(`permissions:${user}`)
      }
      
      await pipeline.exec()
    }
  }
  
  private async indexForInvalidation(
    identity: string, 
    permissions: PermissionsMap
  ): Promise<void> {
    // Extrair perfis usados para criar índices de invalidação
    const profileIds = await this.getProfilesForUser(identity)
    
    const pipeline = this.redis.pipeline()
    
    for (const profileId of profileIds) {
      pipeline.sadd(`profile_users:${profileId}`, identity)
      pipeline.expire(`profile_users:${profileId}`, 3600) // 1 hora
    }
    
    await pipeline.exec()
  }
  
  async getMetrics(): Promise<CacheMetrics> {
    return this.metrics.getReport()
  }
}

export class CacheMetrics {
  private hits = 0
  private misses = 0
  private errors = 0
  private hitTimes: number[] = []
  private missTimes: number[] = []
  
  recordHit(duration: number) {
    this.hits++
    this.hitTimes.push(duration)
  }
  
  recordMiss(duration: number) {
    this.misses++
    this.missTimes.push(duration)
  }
  
  recordError() {
    this.errors++
  }
  
  getReport() {
    const total = this.hits + this.misses
    const hitRate = total > 0 ? this.hits / total : 0
    
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      hitRate: hitRate,
      avgHitTime: this.average(this.hitTimes),
      avgMissTime: this.average(this.missTimes)
    }
  }
  
  private average(numbers: number[]): number {
    return numbers.length > 0 ? 
      numbers.reduce((a, b) => a + b, 0) / numbers.length : 0
  }
}
```

### Otimizações de Query

```typescript
// lib/query-optimizations.ts
export class OptimizedQueries {
  // Query pré-compilada para permissões
  private static PERMISSIONS_QUERY = `
    WITH RECURSIVE profile_hierarchy AS (
      SELECT DISTINCT p.id, p.nome, p.perfil_pai_id, 0 as level
      FROM perfis p
      INNER JOIN usuario_perfis up ON p.id = up.perfil_id
      INNER JOIN usuarios u ON up.usuario_id = u.id
      WHERE u.email = ? AND up.ativo = true AND p.ativo = true
      
      UNION ALL
      
      SELECT p.id, p.nome, p.perfil_pai_id, ph.level + 1
      FROM perfis p
      INNER JOIN profile_hierarchy ph ON p.id = ph.perfil_pai_id
      WHERE p.ativo = true AND ph.level < 10
    ),
    effective_permissions AS (
      SELECT DISTINCT
        perm.acao,
        perm.recurso,
        pp.grant_permission,
        pp.contexto,
        ph.level,
        ROW_NUMBER() OVER (
          PARTITION BY perm.acao, perm.recurso 
          ORDER BY ph.level ASC, pp.grant_permission DESC
        ) as precedence
      FROM profile_hierarchy ph
      INNER JOIN perfil_permissoes pp ON ph.id = pp.perfil_id
      INNER JOIN permissoes perm ON pp.permissao_id = perm.id
      WHERE perm.ativo = true
    )
    SELECT acao, recurso, grant_permission, contexto
    FROM effective_permissions 
    WHERE precedence = 1
  `
  
  async getOptimizedPermissions(identity: string): Promise<any[]> {
    // Usar prepared statement para melhor performance
    return await this.prisma.$queryRawUnsafe(
      OptimizedQueries.PERMISSIONS_QUERY,
      identity
    )
  }
  
  // Batch loading para múltiplos usuários
  async batchGetPermissions(identities: string[]): Promise<Map<string, PermissionsMap>> {
    if (identities.length === 0) return new Map()
    
    const placeholders = identities.map(() => '?').join(',')
    
    const query = `
      WITH user_profiles AS (
        SELECT 
          u.email,
          p.id as profile_id,
          p.perfil_pai_id,
          ROW_NUMBER() OVER (PARTITION BY u.email ORDER BY p.id) as rn
        FROM usuarios u
        INNER JOIN usuario_perfis up ON u.id = up.usuario_id
        INNER JOIN perfis p ON up.perfil_id = p.id
        WHERE u.email IN (${placeholders}) 
          AND up.ativo = true 
          AND p.ativo = true
      ),
      -- Continue with recursive CTE for batch...
    `
    
    const results = await this.prisma.$queryRawUnsafe(query, ...identities)
    
    // Agrupar resultados por usuário
    return this.groupPermissionsByUser(results)
  }
}
```

---

## 🛠️ Administração e UI

### Interface de Administração

```typescript
// rbac-admin/src/components/PermissionManager.tsx
import { useState, useEffect } from 'react'
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowParams
} from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

interface Permission {
  id: string
  acao: string
  recurso: string
  descricao: string
  categoria: string
  ativo: boolean
  createdAt: string
}

export function PermissionManager() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  
  const columns: GridColDef[] = [
    { field: 'acao', headerName: 'Ação', width: 150 },
    { field: 'recurso', headerName: 'Recurso', width: 150 },
    { field: 'descricao', headerName: 'Descrição', width: 300, flex: 1 },
    { 
      field: 'categoria', 
      headerName: 'Categoria', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value}
          color={getCategoryColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'ativo',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => togglePermissionStatus(params.row.id, e.target.checked)}
        />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Editar"
          onClick={() => openEditDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Excluir"
          onClick={() => handleDelete(params.row.id)}
        />
      ]
    }
  ]
  
  useEffect(() => {
    loadPermissions()
  }, [])
  
  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions')
      const data = await response.json()
      setPermissions(data)
    } catch (error) {
      console.error('Error loading permissions:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const togglePermissionStatus = async (id: string, ativo: boolean) => {
    try {
      await fetch(`/api/admin/permissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo })
      })
      
      // Atualizar estado local
      setPermissions(prev => 
        prev.map(p => p.id === id ? { ...p, ativo } : p)
      )
    } catch (error) {
      console.error('Error toggling permission:', error)
    }
  }
  
  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h5">Gerenciar Permissões</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openCreateDialog()}
        >
          Nova Permissão
        </Button>
      </Box>
      
      <DataGrid
        rows={permissions}
        columns={columns}
        loading={loading}
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } }
        }}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  )
}
```

### API de Administração

```typescript
// rbac-admin/src/pages/api/admin/permissions.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { withAuth } from '@/lib/auth-middleware'

const prisma = new PrismaClient()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { categoria, ativo } = req.query
    
    const where: any = {}
    if (categoria) where.categoria = categoria
    if (ativo !== undefined) where.ativo = ativo === 'true'
    
    const permissions = await prisma.permissao.findMany({
      where,
      orderBy: [
        { categoria: 'asc' },
        { recurso: 'asc' },
        { acao: 'asc' }
      ]
    })
    
    res.json(permissions)
  } catch (error) {
    console.error('Error fetching permissions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { acao, recurso, descricao, categoria } = req.body
    
    // Validar dados
    if (!acao || !recurso) {
      return res.status(400).json({ 
        error: 'Ação e recurso são obrigatórios' 
      })
    }
    
    // Verificar se já existe
    const existing = await prisma.permissao.findUnique({
      where: { acao_recurso: { acao, recurso } }
    })
    
    if (existing) {
      return res.status(409).json({ 
        error: 'Permissão já existe' 
      })
    }
    
    const permission = await prisma.permissao.create({
      data: {
        id: uuidv4(),
        acao,
        recurso,
        descricao,
        categoria: categoria || 'custom'
      }
    })
    
    // Auditar criação
    await auditPermissionChange('CREATE', permission, req.user)
    
    res.status(201).json(permission)
  } catch (error) {
    console.error('Error creating permission:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Middleware de autenticação que verifica permissão administrativa
export default withAuth(handler, {
  requiredPermission: { acao: 'Administrar', recurso: 'Permissoes' }
})
```

---

## 🔧 Implementação Técnica

### Checklist de Implementação

#### ✅ **Fase 1: Preparação** (Semana 1-2)
- [ ] Criar schema de banco completo
- [ ] Implementar scripts de migração
- [ ] Configurar cache Redis
- [ ] Preparar queries otimizadas
- [ ] Setup de métricas

#### ✅ **Fase 2: Provider de Produção** (Semana 3-4)
- [ ] Implementar ProductionPermissionsProvider
- [ ] Sistema de cache inteligente
- [ ] Resolução de hierarquia
- [ ] Testes de performance
- [ ] Fallback para modo estático

#### ✅ **Fase 3: Interface Admin** (Semana 5-6)
- [ ] UI para gestão de permissões
- [ ] CRUD de perfis e usuários
- [ ] Sistema de auditoria
- [ ] Visualização de hierarquias
- [ ] Exportar/importar configurações

#### ✅ **Fase 4: Transição** (Semana 7-8)
- [ ] Mode híbrido funcional
- [ ] Migração de dados legados
- [ ] Validação de consistência
- [ ] Documentação de uso
- [ ] Treinamento de administradores

### Configuração de Ambiente

```bash
# .env.production
RBAC_MODE=database
RBAC_CACHE_ENABLED=true
RBAC_CACHE_TTL=300
RBAC_ADMIN_ENABLED=true
RBAC_AUDIT_ENABLED=true

# Redis para cache
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=rbac:

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/rbac"

# Monitoring
RBAC_METRICS_ENABLED=true
RBAC_DEBUG_MODE=false
```

### Monitoramento e Métricas

```typescript
// lib/rbac-metrics.ts
export class RBACMetrics {
  private permissionChecks = 0
  private cacheHits = 0
  private cacheMisses = 0
  private dbQueries = 0
  private errors = 0
  
  async recordPermissionCheck(
    identity: string,
    action: string, 
    resource: string,
    result: boolean,
    duration: number,
    source: 'cache' | 'database'
  ) {
    this.permissionChecks++
    
    if (source === 'cache') {
      this.cacheHits++
    } else {
      this.cacheMisses++
      this.dbQueries++
    }
    
    // Enviar para sistema de métricas (Prometheus, etc.)
    await this.sendMetric('rbac_permission_check', {
      identity,
      action,
      resource,
      result: result ? 'granted' : 'denied',
      duration,
      source
    })
  }
  
  getHealthStatus() {
    const cacheHitRate = this.permissionChecks > 0 ? 
      this.cacheHits / this.permissionChecks : 0
    
    return {
      healthy: this.errors < 10, // Max 10 errors
      permissionChecks: this.permissionChecks,
      cacheHitRate,
      errorRate: this.errors / Math.max(this.permissionChecks, 1)
    }
  }
}
```

---

**Status**: Estratégia Completa | **Última Atualização**: Setembro 2025  
**Mantido por**: Divisão de Desenvolvimento e Sustentação de Sistemas (DDSS/CGTI/ANPD)
