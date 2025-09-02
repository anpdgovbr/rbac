"use client"

import React, { useMemo, useState, useEffect } from "react"
import { createRbacAdminClient, type AdminClientConfig, type Profile } from "./types"
import { ProfilesList } from "./components/ProfilesList"
import { UsersList } from "./components/UsersList"
import { PermissionsEditor } from "./components/PermissionsEditor"
import { CreateProfileForm } from "./components/CreateProfileForm"
import { CreatePermissionForm } from "./components/CreatePermissionForm"

interface RbacAdminShellProps {
  config?: AdminClientConfig
}

export function RbacAdminShell({ config }: RbacAdminShellProps): React.ReactElement {
  const client = useMemo(() => createRbacAdminClient(config), [config])

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
    <div
      style={{ padding: 24, display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}
    >
      <div style={{ borderRight: "1px solid #eee", paddingRight: 16, minWidth: 260 }}>
        <h1>RBAC Admin</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setTab("perfis")} disabled={tab === "perfis"}>
            Perfis
          </button>
          <button onClick={() => setTab("usuarios")} disabled={tab === "usuarios"}>
            Usuários
          </button>
          <button onClick={() => setTab("permissoes")} disabled={tab === "permissoes"}>
            Permissões
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

      <div>
        {tab === "usuarios" ? (
          <UsersList client={client} availableProfiles={profiles} />
        ) : selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3>{`Perfil selecionado: ${selected.nome}`}</h3>
            <PermissionsEditor
              client={client}
              profileIdOrName={selected.id ?? selected.nome}
            />
            <div>
              <h4>Criar permissão</h4>
              <CreatePermissionForm
                client={client}
                profiles={profiles}
                onCreated={() => {}}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>Selecione um perfil à esquerda</div>
            <div>
              <h4>Criar perfil</h4>
              <CreateProfileForm client={client} onCreated={() => {}} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export * from "./types"
export * from "./components/ProfilesList"
export * from "./components/PermissionsEditor"

export default RbacAdminShell
