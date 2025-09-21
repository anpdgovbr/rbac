"use client"

import React, { useMemo, useState, useEffect } from "react"
import { createRbacAdminClient, type AdminClientConfig, type Profile } from "./types.js"
import { ProfilesList } from "./components/ProfilesList.js"
import { UsersList } from "./components/UsersList.js"
import { PermissionsEditor } from "./components/PermissionsEditor.js"
import { CreateProfileForm } from "./components/CreateProfileForm.js"
import { CreatePermissionForm } from "./components/CreatePermissionForm.js"
import { I18nProvider, type Messages, useI18n } from "./i18n.js"

/**
 * Propriedades para o componente RbacAdminShell.
 */
interface RbacAdminShellProps {
  config?: AdminClientConfig
  i18n?: Partial<Messages>
  className?: string
}

/**
 * Componente interno que renderiza o conteúdo do shell de administração RBAC.
 * @param client - Cliente de administração RBAC.
 * @param className - Classe CSS opcional para o componente.
 * @returns Elemento React.
 */
function ShellContent({
  client,
  className,
}: Readonly<{
  client: ReturnType<typeof createRbacAdminClient>
  className?: string
}>): React.ReactElement {
  const t = useI18n()

  const [selected, setSelected] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [tab, setTab] = useState<"perfis" | "usuarios" | "permissoes">("perfis")

  useEffect(() => {
    client
      .listProfiles()
      .then(setProfiles)
      .catch(() => setProfiles([])) // TODO: melhorar error handling
  }, [client])

  return (
    <div className={className} data-rbac-admin-root="">
      <div className="rbac-admin-grid">
        <div className="rbac-admin-sidebar">
          <h1>{t.title}</h1>

          <div className="rbac-admin-tabs">
            <button onClick={() => setTab("perfis")} disabled={tab === "perfis"}>
              {t.tabs.profiles}
            </button>
            <button onClick={() => setTab("usuarios")} disabled={tab === "usuarios"}>
              {t.tabs.users}
            </button>
            <button onClick={() => setTab("permissoes")} disabled={tab === "permissoes"}>
              {t.tabs.permissions}
            </button>
          </div>

          <ProfilesList
            client={client}
            onSelect={(p: Profile) => {
              setSelected(p)
              setTab("permissoes")
            }}
          />
        </div>

        <div className="rbac-admin-content">
          {(() => {
            if (tab === "usuarios") {
              return <UsersList client={client} availableProfiles={profiles} />
            } else if (selected) {
              return (
                <div className="rbac-admin-stack">
                  <h3>
                    {t.labels.selectedProfile}: {selected.nome}
                  </h3>
                  <PermissionsEditor
                    client={client}
                    profileIdOrName={selected.id ?? selected.nome}
                  />
                  <div>
                    <h4>{t.actions.createPermission}</h4>
                    <CreatePermissionForm
                      client={client}
                      profiles={profiles}
                      onCreated={() => {}}
                    />
                  </div>
                </div>
              )
            } else {
              return (
                <div className="rbac-admin-stack">
                  <div>{t.hints.selectProfile}</div>
                  <div>
                    <h4>{t.actions.createProfile}</h4>
                    <CreateProfileForm client={client} onCreated={() => {}} />
                  </div>
                </div>
              )
            }
          })()}
        </div>
      </div>
    </div>
  )
}

/**
 * Componente principal do shell de administração RBAC.
 * Fornece uma interface para gerenciar perfis, usuários e permissões.
 * @param config - Configuração opcional do cliente de administração.
 * @param i18n - Mensagens de internacionalização opcionais.
 * @param className - Classe CSS opcional para o componente.
 * @returns Elemento React.
 */
export function RbacAdminShell({
  config,
  i18n,
  className,
}: Readonly<RbacAdminShellProps>): React.ReactElement {
  const client = useMemo(() => createRbacAdminClient(config), [config])
  return (
    <I18nProvider overrides={i18n}>
      <ShellContent client={client} className={className} />
    </I18nProvider>
  )
}

export * from "./types.js"
export * from "./components/ProfilesList.js"
export * from "./components/PermissionsEditor.js"
export * from "./i18n.js"
export * from "./hooks.js"

export default RbacAdminShell
