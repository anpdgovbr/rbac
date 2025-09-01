"use client"
import React, { useEffect, useState } from "react"
import type { AdminClient, Permission } from "../types"

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

  if (loading) return React.createElement("div", null, "Carregando permissões...")
  if (error)
    return React.createElement("div", { style: { color: "red" } }, `Erro: ${error}`)

  const rows = items.map((it, idx) =>
    React.createElement(
      "tr",
      { key: idx },
      React.createElement("td", null, it.acao),
      React.createElement("td", null, it.recurso),
      React.createElement(
        "td",
        null,
        React.createElement("input", {
          type: "checkbox",
          checked: !!it.permitido,
          disabled: saving === `${it.acao}:${it.recurso}`,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onToggle(it.acao, it.recurso, !!e.target?.checked),
        })
      )
    )
  )

  return React.createElement(
    "div",
    null,
    React.createElement("h2", null, "Permissões"),
    React.createElement(
      "table",
      { cellPadding: 6, style: { borderCollapse: "collapse" } },
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          React.createElement("th", { style: { textAlign: "left" } }, "Ação"),
          React.createElement("th", { style: { textAlign: "left" } }, "Recurso"),
          React.createElement("th", { style: { textAlign: "left" } }, "Permitido")
        )
      ),
      React.createElement("tbody", null, ...rows)
    )
  )
}
;("use client")
