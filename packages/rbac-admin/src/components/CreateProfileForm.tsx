"use client"
import React, { useState } from "react"
import type { AdminClient } from "../types"

export function CreateProfileForm({
  client: _client,
  onCreated,
}: {
  client: AdminClient
  onCreated?: () => void
}): React.ReactElement {
  const [nome, setNome] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      // client genérico: usar fetch direto (mantemos via endpoints criando no client futuramente)
      const r = await fetch("/api/perfis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      })
      if (!r.ok) throw new Error("Falha ao criar perfil")
      setNome("")
      onCreated?.()
      setSuccess("Perfil criado com sucesso")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return React.createElement(
    "form",
    { onSubmit, style: { display: "flex", gap: 8, alignItems: "center" } },
    React.createElement("input", {
      placeholder: "Nome do perfil",
      value: nome,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNome(e.target?.value ?? ""),
    }),
    React.createElement(
      "button",
      { type: "submit", disabled: loading || !nome.trim() },
      "Criar"
    ),
    error ? React.createElement("span", { style: { color: "red" } }, error) : null,
    success ? React.createElement("span", { style: { color: "green" } }, success) : null
  )
}
