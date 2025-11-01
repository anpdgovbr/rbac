/**
 * @fileoverview Formulário de criação de perfis RBAC
 * @version 0.4.0-beta.0
 * @author ANPD/DDSS/CGTI
 * @license MIT
 */

"use client"
import React, { useState } from "react"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Alert from "@mui/material/Alert"
import Stack from "@mui/material/Stack"
import type { AdminClient } from "../types.js"
import { useI18n } from "../i18n.js"

/**
 * Propriedades do componente CreateProfileForm.
 */
export interface CreateProfileFormProps {
  /** Instância do cliente de administração RBAC */
  client: AdminClient
  /** Callback opcional chamado quando um perfil é criado com sucesso */
  onCreated?: () => void
}

/**
 * Formulário para criação de novos perfis RBAC.
 *
 * Fornece uma interface simples com validação de input para criar
 * novos perfis no sistema de controle de acesso.
 *
 * **Funcionalidades:**
 * - Validação client-side (nome não vazio)
 * - Estados de loading com botão disabled
 * - Feedback de sucesso/erro com alerts dismissíveis
 * - Limpa o formulário após criação bem-sucedida
 * - Callback opcional para notificar componente pai
 *
 * **Validação:**
 * - Nome é obrigatório (validado via Zod no AdminClient)
 * - Tamanho máximo: 100 caracteres
 *
 * @example
 * ```tsx
 * function ProfilesAdmin() {
 *   const client = createRbacAdminClient({ baseUrl: '/api' })
 *   const [profiles, setProfiles] = useState<Profile[]>([])
 *
 *   return (
 *     <div>
 *       <ProfilesList profiles={profiles} />
 *       <CreateProfileForm
 *         client={client}
 *         onCreated={async () => {
 *           // Recarrega lista de perfis após criar novo
 *           const updated = await client.listProfiles()
 *           setProfiles(updated)
 *         }}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function CreateProfileForm({
  client,
  onCreated,
}: Readonly<CreateProfileFormProps>): React.ReactElement {
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
