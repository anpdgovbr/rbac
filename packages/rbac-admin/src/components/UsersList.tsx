"use client"

import React, { useEffect, useState, useCallback } from "react"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Paper from "@mui/material/Paper"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Alert from "@mui/material/Alert"
import FormControl from "@mui/material/FormControl"
import CircularProgress from "@mui/material/CircularProgress"
import type { AdminClient, Profile } from "../types.js"
import { useI18n } from "../i18n.js"

type UserRow = {
  id: string
  email: string
  nome?: string | null
  perfilId?: number | null
}

export function UsersList({
  client,
  availableProfiles,
}: Readonly<{
  client: AdminClient
  availableProfiles: Profile[]
}>): React.ReactElement {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useI18n()

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
        {t.tabs.users}
      </Typography>
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 600 }}>{t.tables.email}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t.tables.name}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t.tables.profile}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow
                key={u.id}
                sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
              >
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.nome ?? "—"}</TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth sx={{ minWidth: 200 }}>
                    <Select
                      value={u.perfilId ?? ""}
                      onChange={(e) => {
                        const val = String(e.target.value)
                        onAssign(u.id, val === "" ? null : Number(val))
                      }}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>— sem perfil —</em>
                      </MenuItem>
                      {availableProfiles.map((p) => (
                        <MenuItem key={String(p.id)} value={Number(p.id)}>
                          {p.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
