"use client"
import React, { useEffect, useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Paper from "@mui/material/Paper"
import Alert from "@mui/material/Alert"
import Divider from "@mui/material/Divider"
import CircularProgress from "@mui/material/CircularProgress"
import type { AdminClient, Profile } from "../types.js"
import { useI18n } from "../i18n.js"

export function ProfilesList({
  client,
  onSelect,
}: Readonly<{
  client: AdminClient
  onSelect: (p: Profile) => void
}>): React.ReactElement {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const t = useI18n()

  useEffect(() => {
    let mounted = true
    client
      .listProfiles()
      .then((list) => {
        if (mounted) {
          setProfiles(list)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(String(e?.message ?? e))
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [client])

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress size={40} />
      </Box>
    )
  if (error)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {t.states.errorPrefix}: {error}
      </Alert>
    )

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ px: 2, pt: 2, fontWeight: 600 }}>
        {t.tabs.profiles}
      </Typography>
      <Paper elevation={1} sx={{ mt: 2 }}>
        <List sx={{ p: 0 }}>
          {profiles.map((p, index) => (
            <React.Fragment key={String(p.id)}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => onSelect(p)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ListItemText
                    primary={p.nome}
                    primaryTypographyProps={{
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  )
}
