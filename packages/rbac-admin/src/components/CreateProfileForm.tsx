"use client"
import React, { useState } from "react"
import type { AdminClient } from "../types"
import { useI18n } from "../i18n"

export function CreateProfileForm({
  client,
  onCreated,
}: Readonly<{
  client: AdminClient
  onCreated?: () => void
}>): React.ReactElement {
  const [nome, setNome] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const t = useI18n()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const { ok } = await client.createProfile({ nome })
      if (!ok) throw new Error("Falha ao criar perfil")
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

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        placeholder={`${t.actions.createProfile}`}
        value={nome}
        onChange={(e) => setNome(e.target?.value ?? "")}
      />
      <button type="submit" disabled={loading || !nome.trim()}>
        {t.actions.create}
      </button>
      {error && <span style={{ color: "red" }}>{error}</span>}
      {success && <span style={{ color: "green" }}>{success}</span>}
    </form>
  )
}
