"use client"

import React, { useMemo, useState, useEffect } from "react"
import { createRbacAdminClient, type AdminClientConfig, type Profile } from "./types"
import { ProfilesList } from "./components/ProfilesList"
import { UsersList } from "./components/UsersList"
import { PermissionsEditor } from "./components/PermissionsEditor"
import { CreateProfileForm } from "./components/CreateProfileForm"
import { CreatePermissionForm } from "./components/CreatePermissionForm"
import { I18nProvider, type Messages, useI18n } from "./i18n"

interface RbacAdminShellProps {
  config?: AdminClientConfig
  i18n?: Partial<Messages>
  className?: string
}

function ShellContent({
  client,
  className,
}: {
  client: ReturnType<typeof createRbacAdminClient>
  className?: string
}): React.ReactElement {
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
          {tab === "usuarios" ? (
            <UsersList client={client} availableProfiles={profiles} />
          ) : selected ? (
            <div className="rbac-admin-stack">
              <h3>{t.labels.selectedProfile}: {selected.nome}</h3>
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
          ) : (
            <div className="rbac-admin-stack">
              <div>{t.hints.selectProfile}</div>
              <div>
                <h4>{t.actions.createProfile}</h4>
                <CreateProfileForm client={client} onCreated={() => {}} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function RbacAdminShell({ config, i18n, className }: RbacAdminShellProps): React.ReactElement {
  const client = useMemo(() => createRbacAdminClient(config), [config])
  return (
    <I18nProvider overrides={i18n}>
      <ShellContent client={client} className={className} />
    </I18nProvider>
  )
}

export * from "./types"
export * from "./components/ProfilesList"
export * from "./components/PermissionsEditor"
export * from "./i18n"
export * from "./hooks"

export default RbacAdminShell
