# 📚 Documentação RBAC ANPD — Índice Geral

## 🎯 Documentação por Categoria

### 📖 Fundamentos

- [**Arquitetura**](architecture.md) — Visão geral do sistema, decisões de design e padrões arquiteturais
- [**Estratégia de Dados**](data-strategy.md) — Modelagem do banco, schemas e estruturas de dados
- [**FAQ**](faq.md) — Perguntas frequentes e esclarecimentos técnicos

### 🚀 Implementação e Uso

- [**APIs Públicas**](apis.md) — Referência completa das APIs de todos os packages
- [**Integração**](integration.md) — Guias de integração com projetos existentes
- [**Migração**](migration-guide.md) — Como migrar sistemas legados para RBAC

### 🛠️ Desenvolvimento

- [**Padrões de Desenvolvimento**](dev-standards.md) — Convenções, boas práticas e code style
- [**Ambiente de Desenvolvimento**](dev-seed.md) — Setup local, seeds e dados de teste
- [**Gerenciamento de Dependências**](NCU_GUIDE.md) — Guia completo do npm-check-updates

### 📋 Gestão de Projeto

- [**Checklist de Release**](CHECKLIST.md) — Lista de verificação para publicação
- [**Roadmap**](roadmap.md) — Funcionalidades planejadas e cronograma
- [**Tarefas dos Repositórios**](repos-tasks.md) — Organização de tarefas entre repos

---

## 📦 Status dos Packages (Setembro 2025)

### ✅ Produção Estável

| Package                                                  | Versão         | Status     | Descrição                        |
| -------------------------------------------------------- | -------------- | ---------- | -------------------------------- |
| [`@anpdgovbr/rbac-core`](../packages/rbac-core/)         | `0.1.0-beta.3` | ✅ Estável | Tipos fundamentais e utilitários |
| [`@anpdgovbr/rbac-provider`](../packages/rbac-provider/) | `0.1.0-beta.3` | ✅ Estável | Contratos e cache TTL            |
| [`@anpdgovbr/rbac-prisma`](../packages/rbac-prisma/)     | `0.1.0-beta.3` | ✅ Estável | Provider Prisma com herança      |

### 🚧 Beta Ativo

| Package                                            | Versão         | Status  | Descrição              |
| -------------------------------------------------- | -------------- | ------- | ---------------------- |
| [`@anpdgovbr/rbac-next`](../packages/rbac-next/)   | `0.1.0-beta.3` | 🚧 Beta | Middleware Next.js API |
| [`@anpdgovbr/rbac-react`](../packages/rbac-react/) | `0.2.0-beta.1` | 🚧 Beta | Hooks e HOCs React 19+ |

### ⚠️ Desenvolvimento Ativo

| Package                                            | Versão         | Status | Descrição                |
| -------------------------------------------------- | -------------- | ------ | ------------------------ |
| [`@anpdgovbr/rbac-admin`](../packages/rbac-admin/) | `0.2.0-beta.1` | ⚠️ WIP | Interface administrativa |

---

## 🎯 Por Onde Começar?

### 👤 **Para Desenvolvedores Novos**

1. 📖 [Arquitetura](architecture.md) — Entenda os conceitos fundamentais
2. 🚀 [APIs](apis.md) — Veja exemplos práticos de uso
3. 🛠️ [Ambiente de Desenvolvimento](dev-seed.md) — Configure seu ambiente local

### 🔧 **Para Integração Existente**

1. 🔄 [Migração](migration-guide.md) — Estratégias para sistemas legados
2. 🔌 [Integração](integration.md) — Padrões de integração
3. 📋 [Checklist](CHECKLIST.md) — Validação antes da produção

### 🏗️ **Para Contribuidores**

1. 🛠️ [Padrões de Desenvolvimento](dev-standards.md) — Convenções do projeto
2. 📦 [Gerenciamento de Dependências](NCU_GUIDE.md) — Atualizações e manutenção
3. 🗺️ [Roadmap](roadmap.md) — Funcionalidades planejadas

---

## 🔄 Atualizações Recentes

### 📅 Setembro 2025

- ✅ **React 19+ Support**: rbac-react e rbac-admin atualizados
- ✅ **NCU Integration**: Sistema completo de gerenciamento de dependências
- ✅ **DDSS/CGTI**: Correção da unidade organizacional
- ✅ **TSDoc Enhancement**: Documentação inline completa
- ✅ **README Modernization**: Todos os READMEs reformulados

### 🎯 **Próximas Milestones**

- 🚧 **rbac-admin GA**: Interface administrativa completa
- 🚧 **Test Suite**: Cobertura de testes abrangente
- 🚧 **CI/CD Pipeline**: Automatização completa
- 🚧 **Performance Benchmarks**: Métricas de performance

---

## 📞 Suporte e Contribuição

**Desenvolvido por**: Divisão de Desenvolvimento e Sustentação de Sistemas (DDSS/CGTI/ANPD)

- 🐛 **Issues**: [GitHub Issues](https://github.com/anpdgovbr/rbac/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/anpdgovbr/rbac/discussions)
- 📧 **Contato**: DDSS/CGTI/ANPD

---

_Última atualização: 1 de setembro de 2025_
