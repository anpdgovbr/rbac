"use client"
import React, { useState } from "react"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Alert from "@mui/material/Alert"
import Stack from "@mui/material/Stack"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import FormControlLabel from "@mui/material/FormControlLabel"
import Checkbox from "@mui/material/Checkbox"
import type { TogglePermissionPayload } from "@anpdgovbr/shared-types"
import type { AdminClient, Profile } from "../types.js"
import { useI18n } from "../i18n.js"

export function CreatePermissionForm({
  client,
  profiles,
  onCreated,
}: Readonly<{
  client: AdminClient
  profiles: Profile[]
  onCreated?: () => void
}>): React.ReactElement {
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
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2}>
        <FormControl fullWidth size="small" required>
          <InputLabel>{t.tables.profile}</InputLabel>
          <Select
            value={perfilId}
            onChange={(e) => setPerfilId(e.target.value)}
            label={t.tables.profile}
            disabled={loading}
          >
            <MenuItem value="">
              <em>Selecione um perfil</em>
            </MenuItem>
            {profiles.map((p) => (
              <MenuItem key={String(p.id)} value={String(p.id)}>
                {p.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          placeholder="Ação"
          label={t.tables.action}
          value={acao}
          onChange={(e) => setAcao(e.target.value)}
          disabled={loading}
          fullWidth
          size="small"
          required
        />
        <TextField
          placeholder="Recurso"
          label={t.tables.resource}
          value={recurso}
          onChange={(e) => setRecurso(e.target.value)}
          disabled={loading}
          fullWidth
          size="small"
          required
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={permitido}
              onChange={(e) => setPermitido(e.target.checked)}
              disabled={loading}
            />
          }
          label="Permitido"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !perfilId || !acao || !recurso}
          fullWidth
        >
          {loading ? "Criando..." : t.actions.create}
        </Button>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
      </Stack>
    </Box>
  )
}
