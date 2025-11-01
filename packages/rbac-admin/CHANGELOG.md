## Unreleased

### Added

- **Testes abrangentes**: 18 novos testes cobrindo validação, error handling, custom configs
- **Adaptação ao tema**: RbacAdminShell agora se adapta automaticamente ao ThemeProvider do MUI
- **Customização avançada**: Nova prop `styleConfig` para customizar cores, elevação, maxWidth e estilos sx
- **Controle de layout**: Props `disableContainer` e `disableTitle` para embedding em layouts existentes
- **Controle de tab**: Props `initialTab` e `onTabChange` para controle programático das tabs
- **Suporte a cores customizadas**: `primaryColor` sobrescreve cor primária sem alterar tema global
- **Estilos sx granulares**: Customização de container, paper, tabs e content via sx props
- **TypeScript**: Tipos exportados `RbacAdminShellProps` e `RbacAdminStyleConfig`
- **Documentação**: Novo arquivo `USAGE-EXAMPLES.md` com 10 exemplos de uso

### Improved

- **Validação de inputs**: Todos os métodos do AdminClient agora validam entrada com Zod
- **Error messages**: Mensagens de erro mais descritivas e específicas
- **Flexibilidade**: Componente pode ser usado standalone ou embedded em layouts complexos
- **Developer Experience**: Autocomplete completo no TypeScript para todas as props

### Dependencies

- **Updated**: @anpdgovbr/shared-ui ^0.3.10-beta.0 → ^0.3.11-beta.0
  - Correção crítica de exports de componentes TypeScript

## 0.3.0-beta.0

- **BREAKING CHANGE**: Migração completa para Material-UI v7
- **Melhoria**: Todos os imports MUI agora são individuais para melhor tree shaking
- **Melhoria**: Interface moderna com componentes MUI (Table, Select, Button, TextField, etc)
- **Melhoria**: Navegação por abas no shell principal (Perfis, Usuários, Permissões)
- **Melhoria**: Feedback visual aprimorado com CircularProgress e Alert do MUI
- **Melhoria**: Adicionado @anpdgovbr/shared-ui como peer dependency
- **Correção**: Corrigido erro de tipo em UsersList (String conversion no Select value)
- **Melhoria**: Layout responsivo com Container, Paper e Stack do MUI

## 0.2.2-beta.0

- **BREAKING CHANGE**: Migração completa para Material-UI (MUI) v7
- **Nova Dependência**: Adicionado `@anpdgovbr/shared-ui ^0.3.10-beta.0` como peerDependency
- **Nova Dependência**: Adicionado `@mui/material ^7.3.4` como peerDependency
- **Atualização**: Compatibilidade com `@anpdgovbr/shared-types ^0.3.1-beta.0`
- **Melhoria**: Interface completamente redesenhada com componentes MUI
  - **RbacAdminShell**: Agora usa `Container`, `Tabs`, `Paper` para layout moderno em abas
  - **UsersList**: Migrado para MUI `Table`, `Select`, `FormControl`, `Alert`, `CircularProgress`
  - **ProfilesList**: Migrado para MUI `List`, `ListItem`, `ListItemButton`, `Paper`
  - **PermissionsEditor**: Migrado para MUI `Table`, `Checkbox` com estilização consistente
  - **CreateProfileForm**: Migrado para MUI `TextField`, `Button`, `Alert`, `Stack`
  - **CreatePermissionForm**: Migrado para MUI `Select`, `TextField`, `Checkbox`, `FormControl`, `Stack`
- **Melhoria**: Navegação intuitiva por abas (Perfis, Usuários, Permissões)
- **Melhoria**: Estados de loading e erro aprimorados com componentes MUI
- **Melhoria**: Formulários com layout vertical responsivo usando `Stack`
- **Correção**: Resolvido erro de tipo em `UsersList.tsx` (Select value comparison)
- **Melhoria**: Experiência de usuário aprimorada com feedback visual consistente
- **Melhoria**: Acessibilidade melhorada com componentes MUI nativos

## 0.2.2-beta.0

- **Melhoria**: Adicionada documentação JSDoc completa para todas as funções e componentes
- **Melhoria**: Aplicação consistente de `Readonly<>` em props de componentes para melhor type safety
- **Correção**: Removido teste duplicado (admin.test.ts) e consolidado em admin.test.tsx
- **Melhoria**: Adicionada configuração adequada de tipos TypeScript incluindo @types/node
- **Refatoração**: Melhorada estrutura condicional no componente principal (if/else para IIFE)
- **Melhoria**: Adicionada key única para mapeamento de permissões evitando warnings React
- **Melhoria**: Documentação melhorada em setup de testes com comentários explicativos
- **Correção**: Corrigidos imports ESM para incluir extensões .js (compatibilidade Node.js)
- **Melhoria**: Simplificados testes para focar em funcionalidades core sem dependência DOM complexa

## 0.2.0-beta.1

- **BREAKING CHANGE**: Requer React 19+ (atualização de peerDependency)
- Atualizado @types/react para ^18.3.24
- Bump de versão minor para refletir mudança de compatibilidade

## 0.1.0-beta.2

- AdminShell mínimo funcional com Client configurável (perfis, permissões, toggle).
- Componentes ProfilesList e PermissionsEditor.
- Build estável sem dependência de framework específico.

## 0.0.1-beta.1

- Ajustes de build/tsconfig e metadados npm.

## 0.2.1-beta.0

- Bump patch beta; tokens de texto (i18n), remoção de ThemeProvider interno e hooks internos adicionados.
