# @anpdgovbr/rbac-admin

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Status: WIP](https://img.shields.io/badge/Status-WIP-orange.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Interface Administrativa para RBAC** — Componentes React para gerenciamento de perfis, usuários e permissões (em desenvolvimento).

## ⚠️ Status: Work In Progress

Este pacote está em desenvolvimento ativo e **não é recomendado para uso em produção**. A API pode mudar significativamente entre versões.

## 🎯 Visão Geral

O `@anpdgovbr/rbac-admin` fornecerá uma interface administrativa completa para:

- 👥 **Gerenciamento de Usuários** — CRUD de usuários e atribuição de perfis
- 🛡️ **Gestão de Perfis** — Criação e edição de perfis de acesso
- 🔗 **Herança de Perfis** — Interface visual para hierarquias complexas
- ✅ **Permissões** — Editor granular de ações e recursos
- 📊 **Auditoria** — Visualização de logs e atividades
- 📈 **Relatórios** — Analytics de uso e segurança

## 🏗️ Arquitetura Planejada

### Componentes Principais

```
rbac-admin/
├── components/
│   ├── UsersList.tsx           # Lista de usuários
│   ├── CreateUserForm.tsx      # Formulário de criação
│   ├── ProfilesList.tsx        # Lista de perfis
│   ├── CreateProfileForm.tsx   # Formulário de perfis
│   ├── PermissionsEditor.tsx   # Editor de permissões
│   ├── ProfileHierarchy.tsx    # Visualizador de herança
│   ├── AuditLog.tsx           # Log de auditoria
│   └── Dashboard.tsx          # Dashboard principal
├── hooks/
│   ├── useRbacApi.ts          # Hook para APIs RBAC
│   ├── useUsers.ts            # Gerenciamento de usuários
│   ├── useProfiles.ts         # Gerenciamento de perfis
│   └── usePermissions.ts      # Gerenciamento de permissões
└── utils/
    ├── rbac-client.ts         # Cliente para APIs
    └── permissions-utils.ts   # Utilitários
```

## 📦 Instalação (Futura)

```bash
# Quando estiver pronto para produção
npm install @anpdgovbr/rbac-admin@stable
```

**Dependencies Planejadas:**

```bash
npm install react@^18 @mui/material @mui/icons-material
npm install @anpdgovbr/rbac-core @anpdgovbr/rbac-react
```

## 🎯 Uso Previsto

### Dashboard Principal

```tsx
import { RbacAdminDashboard } from "@anpdgovbr/rbac-admin"

function AdminPage() {
  return (
    <RbacAdminDashboard
      apiEndpoint="/api/rbac"
      permissions={{
        users: { list: true, create: true, edit: true, delete: false },
        profiles: { list: true, create: true, edit: true, delete: true },
        permissions: { view: true, edit: true },
      }}
      onUserCreate={(user) => console.log("User created:", user)}
      onPermissionChange={(change) => audit.log(change)}
    />
  )
}
```

### Componentes Individuais

```tsx
import { UsersList, ProfilesEditor, PermissionsMatrix } from "@anpdgovbr/rbac-admin"

function CustomAdminPage() {
  return (
    <div>
      <h1>Administração RBAC</h1>

      {/* Lista de usuários com filtros */}
      <UsersList
        endpoint="/api/users"
        onEdit={handleUserEdit}
        filters={["ativo", "perfil", "setor"]}
      />

      {/* Editor de perfis com hierarquia visual */}
      <ProfilesEditor
        endpoint="/api/perfis"
        showHierarchy={true}
        onHierarchyChange={handleHierarchyUpdate}
      />

      {/* Matriz de permissões */}
      <PermissionsMatrix
        profileId="supervisor"
        endpoint="/api/permissoes"
        groupBy="recurso"
        editable={true}
      />
    </div>
  )
}
```

## 🎨 Features Planejadas

### ✅ Implementado (Skeleton)

- [x] Estrutura base de componentes
- [x] Types básicos
- [x] Setup de build

### 🚧 Em Desenvolvimento

- [ ] UsersList component
- [ ] CreateUserForm component
- [ ] ProfilesList component
- [ ] CreateProfileForm component
- [ ] PermissionsEditor component

### 📋 Roadmap

- [ ] **Dashboard Principal**
  - [ ] Métricas de usuários ativos
  - [ ] Gráficos de distribuição de perfis
  - [ ] Atividade recente
- [ ] **Gerenciamento de Usuários**
  - [ ] Lista paginada com filtros
  - [ ] Busca por nome/email/perfil
  - [ ] CRUD completo
  - [ ] Bulk operations
- [ ] **Gestão de Perfis**
  - [ ] Editor visual de hierarquia
  - [ ] Drag & drop para herança
  - [ ] Preview de permissões herdadas
  - [ ] Validação de ciclos
- [ ] **Editor de Permissões**
  - [ ] Matriz visual ação × recurso
  - [ ] Edição em lote
  - [ ] Import/export de configurações
  - [ ] Templates predefinidos
- [ ] **Auditoria e Logs**
  - [ ] Timeline de mudanças
  - [ ] Filtros avançados
  - [ ] Export de relatórios
  - [ ] Alertas de segurança

## 🛠️ Desenvolvimento

### Setup Local

```bash
cd packages/rbac-admin

# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Testes (quando implementados)
npm test
```

### Estrutura Atual

```
src/
├── index.tsx              # Entry point
├── types.ts               # Types do admin
├── components/
│   ├── CreateProfileForm.tsx    # [SKELETON]
│   ├── CreatePermissionForm.tsx # [SKELETON]
│   ├── PermissionsEditor.tsx    # [SKELETON]
│   ├── ProfilesList.tsx         # [SKELETON]
│   └── UsersList.tsx           # [SKELETON]
└── jsx-shim.d.ts         # Types React
```

## 🤝 Contribuindo

Como este pacote está em desenvolvimento, contribuições são especialmente bem-vindas:

1. **Feedback de UX** — Como você gostaria que a interface funcionasse?
2. **Component Design** — Sugestões de API e props dos componentes
3. **Feature Requests** — Funcionalidades que seriam úteis
4. **Code Contributions** — Implementação dos componentes

### Discussões em Aberto

- **Design System** — Usar MUI, Ant Design, ou componentes customizados?
- **State Management** — Context API, Zustand, ou Redux Toolkit?
- **Data Fetching** — SWR, React Query, ou fetch nativo?
- **Validação** — Zod, Yup, ou validação customizada?

## 📚 Documentação Relacionada

- 📖 [Documentação Completa](../../docs/)
- 🏛️ [Arquitetura do Sistema](../../docs/architecture.md)
- ⚛️ [rbac-react (client components)](../rbac-react/)
- 🎨 [Design System Guidelines](../../docs/design-guidelines.md) (futuro)
- 🚀 [Guia de Início Rápido](../../README.md)

## 📄 Licença

MIT © 2024 ANPD (Autoridade Nacional de Proteção de Dados)

---

**💡 Interessado em contribuir?** Entre em contato com a equipe SUPSE/ANPD ou abra uma issue para discussão.
