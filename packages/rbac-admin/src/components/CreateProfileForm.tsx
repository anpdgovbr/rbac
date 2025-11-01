"use client"
import React, { useState } from "react"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Alert from "@mui/material/Alert"
import Stack from "@mui/material/Stack"
import type { AdminClient } from "../types.js"
import { useI18n } from "../i18n.js"

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
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2}>
        <TextField
          placeholder={t.actions.createProfile}
          label={t.tables.profile}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={loading}
          fullWidth
          size="small"
          variant="outlined"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !nome.trim()}
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
