"use client"
import React, { useState } from "react"
import type { TogglePermissionPayload } from "@anpdgovbr/shared-types"
import type { AdminClient, Profile } from "../types"

export function CreatePermissionForm({
  client: _client,
  profiles,
  onCreated,
}: {
  client: AdminClient
  profiles: Profile[]
  onCreated?: () => void
}): React.ReactElement {
  const [perfilId, setPerfilId] = useState<string>("")
  const [acao, setAcao] = useState("")
  const [recurso, setRecurso] = useState("")
  const [permitido, setPermitido] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      // Criar permissão explicitamente via endpoint genérico (mantém retrocompat com toggle)
      const body: TogglePermissionPayload = {
        perfilId: Number(perfilId),
        acao,
        recurso,
        permitido,
      }
      const r = await fetch("/api/permissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error("Falha ao criar permissão")
      setAcao("")
      setRecurso("")
      setPermitido(true)
      onCreated?.()
      setSuccess("Permissão criada/atualizada com sucesso")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return React.createElement(
    "form",
    {
      onSubmit,
      style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
    },
    React.createElement(
      "select",
      {
        value: perfilId,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
          setPerfilId(e.target?.value ?? ""),
      },
      React.createElement("option", { value: "" }, "Perfil"),
      ...profiles.map((p) =>
        React.createElement("option", { key: String(p.id), value: String(p.id) }, p.nome)
      )
    ),
    React.createElement("input", {
      placeholder: "Ação",
      value: acao,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setAcao(e.target?.value ?? ""),
    }),
    React.createElement("input", {
      placeholder: "Recurso",
      value: recurso,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setRecurso(e.target?.value ?? ""),
    }),
    React.createElement(
      "label",
      { style: { display: "inline-flex", alignItems: "center", gap: 4 } },
      React.createElement("input", {
        type: "checkbox",
        checked: permitido,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setPermitido(!!e.target?.checked),
      }),
      "Permitido"
    ),
    React.createElement(
      "button",
      { type: "submit", disabled: loading || !perfilId || !acao || !recurso },
      "Criar"
    ),
    error ? React.createElement("span", { style: { color: "red" } }, error) : null,
    success ? React.createElement("span", { style: { color: "green" } }, success) : null
  )
}
