"use client"

import React, { useEffect, useState, useCallback } from "react"
import type { AdminClient, Profile } from "../types"
import { useI18n } from "../i18n"

type UserRow = {
  id: string
  email: string
  nome?: string | null
  perfilId?: number | null
}

export function UsersList({
  client,
  availableProfiles,
}: {
  client: AdminClient
  availableProfiles: Profile[]
}): React.ReactElement {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useI18n()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await client.listUsers()
      setUsers(list)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function onAssign(userId: string, perfilId: number | null) {
    await client.assignUserProfile(userId, perfilId)
    await refresh()
  }

  if (loading) return <div className="rbac-muted">{t.states.loading}</div>
  if (error)
    return <div style={{ color: "red" }}>{`${t.states.errorPrefix}: ${error}`}</div>

  return (
    <div>
      <h2>{t.tabs.users}</h2>
      <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>{t.tables.email}</th>
            <th style={{ textAlign: "left" }}>{t.tables.name}</th>
            <th style={{ textAlign: "left" }}>{t.tables.profile}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.nome ?? ""}</td>
              <td>
                <select
                  value={u.perfilId ?? ""}
                  onChange={(e) => {
                    const val = e.target?.value
                    onAssign(u.id, val === "" ? null : Number(val))
                  }}
                >
                  <option value="">— sem perfil —</option>
                  {availableProfiles.map((p) => (
                    <option key={String(p.id)} value={Number(p.id)}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
