/**
 * @fileoverview Editor de permissões RBAC por perfil
 * @version 0.4.0-beta.0
 * @author DDSS/CGTI/ANPD
 * @license MIT
 */

"use client"
import React, { useEffect, useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Paper from "@mui/material/Paper"
import Alert from "@mui/material/Alert"
import Checkbox from "@mui/material/Checkbox"
import CircularProgress from "@mui/material/CircularProgress"
import type { AdminClient, Permission } from "../types.js"
import { useI18n } from "../i18n.js"

/**
 * Propriedades do componente PermissionsEditor.
 */
export interface PermissionsEditorProps {
  /** Instância do cliente de administração RBAC */
  client: AdminClient
  /** ID ou nome do perfil cujas permissões serão editadas */
  profileIdOrName: string | number
}

/**
 * Componente que permite visualizar e editar permissões de um perfil RBAC.
 *
 * Exibe uma tabela com todas as permissões do perfil, permitindo ativar/desativar
 * cada permissão individualmente através de checkboxes.
 *
 * **Funcionalidades:**
 * - Carregamento automático de permissões ao montar ou quando profileIdOrName muda
 * - Toggle otimista com feedback visual (checkbox disabled durante save)
 * - Recarregamento automático após cada alteração
 * - Estados de loading e error com feedback visual
 *
 * **Performance:**
 * - Recarrega todas as permissões após cada toggle (simplificado)
 * - Para alta performance, considere implementar optimistic updates
 *
 * @example
 * ```tsx
 * function ProfilePermissions() {
 *   const client = createRbacAdminClient({ baseUrl: '/api' })
 *   const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
 *
 *   if (!selectedProfile) {
 *     return <div>Selecione um perfil</div>
 *   }
 *
 *   return (
 *     <PermissionsEditor
 *       client={client}
 *       profileIdOrName={selectedProfile.id}
 *     />
 *   )
 * }
 * ```
 */
export function PermissionsEditor({
  client,
  profileIdOrName,
}: Readonly<PermissionsEditorProps>): React.ReactElement {
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

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  if (error)
    return (
      <Alert severity="error">
        {t.states.errorPrefix}: {error}
      </Alert>
    )

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        {t.tabs.permissions}
      </Typography>
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 600 }}>{t.tables.action}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t.tables.resource}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t.tables.allowed}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((it) => (
              <TableRow
                key={`${it.acao}:${it.recurso}`}
                sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
              >
                <TableCell>{it.acao}</TableCell>
                <TableCell>{it.recurso}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={!!it.permitido}
                    disabled={saving === `${it.acao}:${it.recurso}`}
                    onChange={(e) => onToggle(it.acao, it.recurso, e.target.checked)}
                    color="primary"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
