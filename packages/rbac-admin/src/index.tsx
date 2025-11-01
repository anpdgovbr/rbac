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
import { useTheme } from "@mui/material/styles"
import type { Theme, SxProps } from "@mui/material/styles"
import { createRbacAdminClient, type AdminClientConfig, type Profile } from "./types.js"
import { ProfilesList } from "./components/ProfilesList.js"
import { UsersList } from "./components/UsersList.js"
import { PermissionsEditor } from "./components/PermissionsEditor.js"
import { CreateProfileForm } from "./components/CreateProfileForm.js"
import { CreatePermissionForm } from "./components/CreatePermissionForm.js"
import { I18nProvider, type Messages, useI18n } from "./i18n.js"

/**
 * Configuração de estilo customizável para o RbacAdminShell.
 */
export interface RbacAdminStyleConfig {
  /** Container principal - usa maxWidth do MUI Container */
  containerMaxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false
  /** Espaçamento vertical do container (em theme.spacing units) */
  containerPadding?: number
  /** Elevação do Paper (0-24) */
  paperElevation?: number
  /** Cor primária customizada (sobrescreve theme) */
  primaryColor?: string
  /** Cor secundária customizada (sobrescreve theme) */
  secondaryColor?: string
  /** Estilos customizados via sx prop */
  sx?: {
    container?: SxProps<Theme>
    paper?: SxProps<Theme>
    tabs?: SxProps<Theme>
    content?: SxProps<Theme>
  }
}

/**
 * Propriedades para o componente RbacAdminShell.
 */
export interface RbacAdminShellProps {
  config?: AdminClientConfig
  i18n?: Partial<Messages>
  className?: string
  /** Configuração de estilos e tema */
  styleConfig?: RbacAdminStyleConfig
  /** Se true, não renderiza Container (útil quando já está dentro de um layout) */
  disableContainer?: boolean
  /** Se true, não renderiza o título */
  disableTitle?: boolean
  /** Tab inicial (0=Perfis, 1=Usuários, 2=Permissões) */
  initialTab?: number
  /** Callback quando tab muda */
  onTabChange?: (tab: number) => void
}

/**
 * Componente interno que renderiza o conteúdo do shell de administração RBAC.
 */
function ShellContent({
  client,
  className,
  styleConfig = {},
  disableContainer = false,
  disableTitle = false,
  initialTab = 0,
  onTabChange,
}: Readonly<{
  client: ReturnType<typeof createRbacAdminClient>
  className?: string
  styleConfig?: RbacAdminStyleConfig
  disableContainer?: boolean
  disableTitle?: boolean
  initialTab?: number
  onTabChange?: (tab: number) => void
}>): React.ReactElement {
  const t = useI18n()
  const theme = useTheme()

  const [selected, setSelected] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tab, setTab] = useState<number>(initialTab)

  // Extrair configurações de estilo com defaults
  const {
    containerMaxWidth = "lg",
    containerPadding = 4,
    paperElevation = 1,
    primaryColor,
    sx = {},
  } = styleConfig

  // Handler de mudança de tab
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue)
    onTabChange?.(newValue)
  }

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

  // Wrapper condicional para Container
  const ContentWrapper = disableContainer
    ? ({ children }: { children: React.ReactNode }) => <>{children}</>
    : ({ children }: { children: React.ReactNode }) => (
        <Container
          maxWidth={containerMaxWidth}
          className={className}
          sx={{ py: containerPadding, ...sx.container }}
        >
          {children}
        </Container>
      )

  return (
    <ContentWrapper>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
        <Box sx={sx.content}>
          {!disableTitle && (
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: primaryColor || theme.palette.primary.main,
              }}
            >
              {t.title}
            </Typography>
          )}

          <Paper
            elevation={paperElevation}
            sx={{ mt: disableTitle ? 0 : 3, ...sx.paper }}
          >
            <Tabs
              value={tab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTab-root": primaryColor
                  ? {
                      "&.Mui-selected": { color: primaryColor },
                    }
                  : {},
                "& .MuiTabs-indicator": primaryColor
                  ? { backgroundColor: primaryColor }
                  : {},
                ...sx.tabs,
              }}
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
    </ContentWrapper>
  )
}

/**
 * Componente principal do shell de administração RBAC.
 * Fornece uma interface para gerenciar perfis, usuários e permissões.
 *
 * @example
 * ```tsx
 * // Uso básico
 * <RbacAdminShell config={{ baseUrl: '/api' }} />
 *
 * // Com customização de tema
 * <RbacAdminShell
 *   config={{ baseUrl: '/api' }}
 *   styleConfig={{
 *     primaryColor: '#1976d2',
 *     paperElevation: 2,
 *     containerMaxWidth: 'xl'
 *   }}
 * />
 *
 * // Sem container (para usar dentro de um layout existente)
 * <RbacAdminShell
 *   config={{ baseUrl: '/api' }}
 *   disableContainer
 *   disableTitle
 * />
 * ```
 */
export function RbacAdminShell({
  config,
  i18n,
  className,
  styleConfig,
  disableContainer,
  disableTitle,
  initialTab,
  onTabChange,
}: Readonly<RbacAdminShellProps>): React.ReactElement {
  const client = useMemo(() => createRbacAdminClient(config), [config])
  return (
    <I18nProvider overrides={i18n}>
      <ShellContent
        client={client}
        className={className}
        styleConfig={styleConfig}
        disableContainer={disableContainer}
        disableTitle={disableTitle}
        initialTab={initialTab}
        onTabChange={onTabChange}
      />
    </I18nProvider>
  )
}

export * from "./types.js"
export * from "./components/ProfilesList.js"
export * from "./components/PermissionsEditor.js"
export * from "./i18n.js"
export * from "./hooks.js"

export default RbacAdminShell
