"use client"
import React, { useState } from "react"
import type { TogglePermissionPayload } from "@anpdgovbr/shared-types"
import type { AdminClient, Profile } from "../types"
import { useI18n } from "../i18n"

export function CreatePermissionForm({
  client,
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
  const t = useI18n()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const body: TogglePermissionPayload = {
        perfilId: Number(perfilId),
        acao,
        recurso,
        permitido,
      }
      const { ok } = await client.createPermission(body)
      if (!ok) throw new Error("Falha ao criar permissão")
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

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
    >
      <select value={perfilId} onChange={(e) => setPerfilId(e.target?.value ?? "")}>
        <option value="">{t.tables.profile}</option>
        {profiles.map((p) => (
          <option key={String(p.id)} value={String(p.id)}>
            {p.nome}
          </option>
        ))}
      </select>
      <input
        placeholder="Ação"
        value={acao}
        onChange={(e) => setAcao(e.target?.value ?? "")}
      />
      <input
        placeholder="Recurso"
        value={recurso}
        onChange={(e) => setRecurso(e.target?.value ?? "")}
      />
      <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <input
          type="checkbox"
          checked={permitido}
          onChange={(e) => setPermitido(!!e.target?.checked)}
        />
        Permitido
      </label>
      <button type="submit" disabled={loading || !perfilId || !acao || !recurso}>
        {t.actions.create}
      </button>
      {error && <span style={{ color: "red" }}>{error}</span>}
      {success && <span style={{ color: "green" }}>{success}</span>}
    </form>
  )
}
