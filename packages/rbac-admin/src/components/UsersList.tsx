"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react"
import type { AdminClient, Profile } from "../types"

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
  const profilesById = useMemo(
    () => new Map(availableProfiles.map((p) => [Number(p.id), p])),
    [availableProfiles]
  )

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

  if (loading) return React.createElement("div", null, "Carregando usuários...")
  if (error)
    return React.createElement("div", { style: { color: "red" } }, `Erro: ${error}`)

  const header = React.createElement(
    "tr",
    null,
    React.createElement("th", { style: { textAlign: "left" } }, "E-mail"),
    React.createElement("th", { style: { textAlign: "left" } }, "Nome"),
    React.createElement("th", { style: { textAlign: "left" } }, "Perfil")
  )

  const rows = users.map((u) =>
    React.createElement(
      "tr",
      { key: u.id },
      React.createElement("td", null, u.email),
      React.createElement("td", null, u.nome ?? ""),
      React.createElement(
        "td",
        null,
        React.createElement(
          "select",
          {
            value: u.perfilId ?? "",
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
              const val = e.target?.value
              onAssign(u.id, val === "" ? null : Number(val))
            },
          },
          React.createElement("option", { value: "" }, "— sem perfil —"),
          ...availableProfiles.map((p) =>
            React.createElement(
              "option",
              { key: String(p.id), value: Number(p.id) },
              p.nome
            )
          )
        ),
        profilesById.get(Number(u.perfilId)) ? null : null
      )
    )
  )

  return React.createElement(
    "div",
    null,
    React.createElement("h2", null, "Usuários"),
    React.createElement(
      "table",
      { cellPadding: 6, style: { borderCollapse: "collapse", width: "100%" } },
      React.createElement("thead", null, header),
      React.createElement("tbody", null, ...rows)
    )
  )
}
