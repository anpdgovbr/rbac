import React, { createContext, useContext, useMemo } from "react"

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

const I18nContext = createContext<Messages>(PT_BR)

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

export function useI18n(): Messages {
  return useContext(I18nContext)
}
