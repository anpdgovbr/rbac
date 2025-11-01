"use client"

import React, { useMemo, useState, useEffect } from "react"
import Box from "@mui/material/Box"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Paper from "@mui/material/Paper"
import CircularProgress from "@mui/material/CircularProgress"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import { createRbacAdminClient, type AdminClientConfig, type Profile } from "./types.js"
import { ProfilesList } from "./components/ProfilesList.js"
import { UsersList } from "./components/UsersList.js"
import { PermissionsEditor } from "./components/PermissionsEditor.js"
import { CreateProfileForm } from "./components/CreateProfileForm.js"
import { CreatePermissionForm } from "./components/CreatePermissionForm.js"
import { I18nProvider, type Messages, useI18n } from "./i18n.js"

/**
 * Propriedades para o componente RbacAdminShell.
 */
interface RbacAdminShellProps {
  config?: AdminClientConfig
  i18n?: Partial<Messages>
  className?: string
}

/**
 * Componente interno que renderiza o conteúdo do shell de administração RBAC.
 * @param client - Cliente de administração RBAC.
 * @param className - Classe CSS opcional para o componente.
 * @returns Elemento React.
 */
function ShellContent({
  client,
  className,
}: Readonly<{
  client: ReturnType<typeof createRbacAdminClient>
  className?: string
}>): React.ReactElement {
  const t = useI18n()

  const [selected, setSelected] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tab, setTab] = useState<number>(0)

  useEffect(() => {
    setLoading(true)
    setError(null)

    client
      .listProfiles()
      .then((data) => {
        setProfiles(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Falha ao carregar perfis:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setProfiles([])
        setLoading(false)
      })
  }, [client])

  return (
    <Container maxWidth="xl" className={className} sx={{ py: 4 }}>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (typeof window !== "undefined") {
                  // eslint-disable-next-line no-undef -- window é global do browser, checado para SSR
                  window.location.reload()
                }
              }}
            >
              {t.states.retry}
            </Button>
          }
        >
          <strong>{t.states.error}</strong>
          <br />
          {error.message}
        </Alert>
      ) : (
        <Box>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            {t.title}
          </Typography>

          <Paper elevation={3} sx={{ mt: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, newValue) => setTab(newValue)}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label={t.tabs.profiles} />
              <Tab label={t.tabs.users} />
              <Tab label={t.tabs.permissions} />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tab === 0 && (
                <Box>
                  <ProfilesList
                    client={client}
                    onSelect={(p: Profile) => {
                      setSelected(p)
                      setTab(2)
                    }}
                  />
                  <Divider sx={{ my: 3 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {t.actions.createProfile}
                    </Typography>
                    <CreateProfileForm
                      client={client}
                      onCreated={() => {
                        client.listProfiles().then(setProfiles)
                      }}
                    />
                  </Box>
                </Box>
              )}

              {tab === 1 && <UsersList client={client} availableProfiles={profiles} />}

              {tab === 2 && (
                <Box>
                  {selected ? (
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {t.labels.selectedProfile}: {selected.nome}
                      </Typography>
                      <PermissionsEditor
                        client={client}
                        profileIdOrName={selected.id ?? selected.nome}
                      />
                      <Divider sx={{ my: 3 }} />
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {t.actions.createPermission}
                        </Typography>
                        <CreatePermissionForm
                          client={client}
                          profiles={profiles}
                          onCreated={() => {}}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Alert severity="info">{t.hints.selectProfile}</Alert>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  )
}

/**
 * Componente principal do shell de administração RBAC.
 * Fornece uma interface para gerenciar perfis, usuários e permissões.
 * @param config - Configuração opcional do cliente de administração.
 * @param i18n - Mensagens de internacionalização opcionais.
 * @param className - Classe CSS opcional para o componente.
 * @returns Elemento React.
 */
export function RbacAdminShell({
  config,
  i18n,
  className,
}: Readonly<RbacAdminShellProps>): React.ReactElement {
  const client = useMemo(() => createRbacAdminClient(config), [config])
  return (
    <I18nProvider overrides={i18n}>
      <ShellContent client={client} className={className} />
    </I18nProvider>
  )
}

export * from "./types.js"
export * from "./components/ProfilesList.js"
export * from "./components/PermissionsEditor.js"
export * from "./i18n.js"
export * from "./hooks.js"

export default RbacAdminShell
