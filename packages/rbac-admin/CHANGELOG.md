## Unreleased

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
