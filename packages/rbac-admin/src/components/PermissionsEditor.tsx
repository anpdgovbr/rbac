"use client"
import React, { useEffect, useState } from "react"
import type { AdminClient, Permission } from "../types"
import { useI18n } from "../i18n"

export function PermissionsEditor({
  client,
  profileIdOrName,
}: {
  client: AdminClient
  profileIdOrName: string | number
}): React.ReactElement {
  const [items, setItems] = useState<Permission[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const t = useI18n()

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const list = await client.listPermissions(profileIdOrName)
      setItems(list)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileIdOrName])

  async function onToggle(acao: string, recurso: string, value: boolean) {
    setSaving(`${acao}:${recurso}`)
    try {
      const res = await client.togglePermission({
        profileIdOrName,
        acao,
        recurso,
        permitido: value,
      })
      if (res.ok) await refresh()
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="rbac-muted">{t.states.loading}</div>
  if (error)
    return <div style={{ color: "red" }}>{`${t.states.errorPrefix}: ${error}`}</div>

  return (
    <div>
      <h2>{t.tabs.permissions}</h2>
      <table cellPadding={6} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>{t.tables.action}</th>
            <th style={{ textAlign: "left" }}>{t.tables.resource}</th>
            <th style={{ textAlign: "left" }}>{t.tables.allowed}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td>{it.acao}</td>
              <td>{it.recurso}</td>
              <td>
                <input
                  type="checkbox"
                  checked={!!it.permitido}
                  disabled={saving === `${it.acao}:${it.recurso}`}
                  onChange={(e) => onToggle(it.acao, it.recurso, !!e.target?.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
