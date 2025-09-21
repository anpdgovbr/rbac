import React, { createContext, useContext, useMemo } from "react"

/**
 * Tipo que define as mensagens de internacionalização para o componente RBAC Admin.
 * Inclui locale, títulos, abas, rótulos, ações, estados, dicas e cabeçalhos de tabelas.
 */
export type Messages = {
  locale: string
  title: string
  tabs: { profiles: string; users: string; permissions: string }
  labels: { selectedProfile: string }
  actions: { createProfile: string; createPermission: string; create: string }
  states: { loading: string; errorPrefix: string }
  hints: { selectProfile: string }
  tables: {
    action: string
    resource: string
    allowed: string
    email: string
    name: string
    profile: string
  }
}

/**
 * Constantes com mensagens em português brasileiro (pt-BR) para internacionalização.
 */
const PT_BR: Messages = {
  locale: "pt-BR",
  title: "RBAC Admin",
  tabs: { profiles: "Perfis", users: "Usuários", permissions: "Permissões" },
  labels: { selectedProfile: "Perfil selecionado" },
  actions: {
    createProfile: "Criar perfil",
    createPermission: "Criar permissão",
    create: "Criar",
  },
  states: { loading: "Carregando...", errorPrefix: "Erro" },
  hints: { selectProfile: "Selecione um perfil à esquerda" },
  tables: {
    action: "Ação",
    resource: "Recurso",
    allowed: "Permitido",
    email: "E-mail",
    name: "Nome",
    profile: "Perfil",
  },
}

/**
 * Constantes com mensagens em inglês (en-US) para internacionalização.
 */
const EN_US: Messages = {
  locale: "en",
  title: "RBAC Admin",
  tabs: { profiles: "Profiles", users: "Users", permissions: "Permissions" },
  labels: { selectedProfile: "Selected profile" },
  actions: {
    createProfile: "Create profile",
    createPermission: "Create permission",
    create: "Create",
  },
  states: { loading: "Loading...", errorPrefix: "Error" },
  hints: { selectProfile: "Select a profile on the left" },
  tables: {
    action: "Action",
    resource: "Resource",
    allowed: "Allowed",
    email: "Email",
    name: "Name",
    profile: "Profile",
  },
}

/**
 * Contexto React para fornecer mensagens de internacionalização aos componentes filhos.
 */
const I18nContext = createContext<Messages>(PT_BR)

/**
 * Provedor de contexto para internacionalização.
 * Permite sobrescrever mensagens padrão com base no locale fornecido.
 * @param overrides - Mensagens opcionais para sobrescrever as padrão.
 * @param children - Componentes filhos que terão acesso às mensagens.
 */
export function I18nProvider({
  overrides,
  children,
}: {
  overrides?: Partial<Messages>
  children: React.ReactNode
}) {
  const base = useMemo(
    () => (overrides?.locale?.startsWith("en") ? EN_US : PT_BR),
    [overrides?.locale]
  )
  const value = useMemo(
    () => ({
      ...base,
      ...overrides,
      tabs: { ...base.tabs, ...(overrides?.tabs ?? {}) },
      actions: { ...base.actions, ...(overrides?.actions ?? {}) },
      states: { ...base.states, ...(overrides?.states ?? {}) },
      hints: { ...base.hints, ...(overrides?.hints ?? {}) },
      labels: { ...base.labels, ...(overrides?.labels ?? {}) },
      tables: { ...base.tables, ...(overrides?.tables ?? {}) },
    }),
    [base, overrides]
  )

  return React.createElement(I18nContext.Provider, { value }, children)
}

/**
 * Hook para acessar as mensagens de internacionalização do contexto.
 * @returns As mensagens atuais de internacionalização.
 */
export function useI18n(): Messages {
  return useContext(I18nContext)
}
