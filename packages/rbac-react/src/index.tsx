/**
 * @fileoverview Hooks e HOCs React para integração client-side do RBAC
 * @version 0.1.0-beta.3
 * @author DDSS/CGTI/ANPD
 * @license MIT
 *
 * Este módulo fornece:
 * - Context provider para injeção de permissões
 * - Hooks para consumo de permissões via contexto ou API
 * - HOC para proteção declarativa de componentes
 * - Integração com SWR para cache inteligente
 */

import { createContext, useContext, useMemo } from "react"
import useSWR from "swr"
import type {
  PermissionsMap,
  Action,
  Resource,
  PermissionDto,
} from "@anpdgovbr/rbac-core"
import { toPermissionsMap, pode as podeFn } from "@anpdgovbr/rbac-core"

/**
 * Contexto React para injeção de PermissionsMap pré-resolvido.
 *
 * Usado principalmente para hidratação de permissões vindas do servidor (SSR/SSG).
 * @internal
 */
const PermissionsContext = createContext<PermissionsMap | null>(null)

/**
 * Props do PermissionsProvider.
 */
interface PermissionsProviderProps {
  /** Componentes filhos que terão acesso às permissões */
  children: React.ReactNode
  /** Mapa de permissões pré-resolvido (ex: do servidor) */
  value: PermissionsMap
}

/**
 * Provider para injetar permissões já resolvidas no contexto React.
 *
 * **Casos de uso:**
 * - Hidratação de permissões vindas do servidor (SSR/SSG)
 * - Injeção de permissões pré-calculadas
 * - Testing com permissões mockadas
 *
 * **Quando usar:**
 * - App com SSR que já resolve permissões no servidor
 * - Aplicação SPA que carrega permissões no boot
 * - Tests que precisam de permissões específicas
 *
 * @example
 * ```tsx
 * // Em layout raiz (pages/_app.tsx ou app/layout.tsx)
 * function RootLayout({ children, permissions }) {
 *   return (
 *     <PermissionsProvider value={permissions}>
 *       {children}
 *     </PermissionsProvider>
 *   )
 * }
 *
 * // Para testing
 * function TestWrapper({ children }) {
 *   const mockPermissions = toPermissionsMap([
 *     { acao: "Exibir", recurso: "TestResource", permitido: true }
 *   ])
 *
 *   return (
 *     <PermissionsProvider value={mockPermissions}>
 *       {children}
 *     </PermissionsProvider>
 *   )
 * }
 * ```
 */
export function PermissionsProvider({
  children,
  value,
}: Readonly<PermissionsProviderProps>) {
  return (
    <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
  )
}

/**
 * Opções de configuração para usePermissions.
 */
export type PermissionsClientOptions = {
  /**
   * Endpoint da API para buscar permissões.
   * @default "/api/permissoes"
   */
  endpoint?: string

  /**
   * Função customizada para fazer fetch das permissões.
   * @default fetch nativo
   */
  fetcher?: (url: string) => Promise<PermissionDto[] | null | undefined>

  /**
   * Permissões iniciais para usar como fallback.
   * Útil durante loading ou quando contexto não está disponível.
   */
  initial?: PermissionsMap
}

/**
 * Resultado do hook usePermissions.
 */
interface UsePermissionsReturn {
  /** Mapa de permissões resolvido */
  permissoes: PermissionsMap
  /** Indica se está carregando permissões da API */
  loading: boolean
  /** Erro durante fetch (se houver) */
  error?: Error
}

/**
 * Hook para obter PermissionsMap via contexto ou endpoint.
 *
 * **Estratégia de resolução:**
 * 1. **Contexto**: Se PermissionsProvider estiver presente, usa o valor do contexto
 * 2. **Initial**: Se `initial` for fornecido, usa como fallback durante loading
 * 3. **Endpoint**: Faz fetch via SWR se contexto não estiver disponível
 *
 * **SWR Integration:**
 * - Cache automático de responses
 * - Revalidação em background
 * - Retry em caso de erro
 * - Sincronização entre tabs
 *
 * @param opts - Opções de configuração
 * @returns Objeto com permissões, loading state e erro
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { permissoes, loading, error } = usePermissions({
 *     endpoint: "/api/user-permissions",
 *     initial: defaultPermissions
 *   })
 *
 *   if (loading) return <DashboardSkeleton />
 *   if (error) return <ErrorBoundary error={error} />
 *
 *   return (
 *     <div>
 *       {pode(permissoes, "Exibir", "Dashboard") && (
 *         <DashboardContent />
 *       )}
 *     </div>
 *   )
 * }
 *
 * // Com contexto (no loading)
 * function AppWithContext() {
 *   return (
 *     <PermissionsProvider value={serverPermissions}>
 *       <Dashboard /> // loading será false
 *     </PermissionsProvider>
 *   )
 * }
 * ```
 */
export function usePermissions(
  opts: PermissionsClientOptions = {}
): UsePermissionsReturn {
  const {
    endpoint = "/api/permissoes",
    fetcher = (url: string) =>
      fetch(url).then((r) => r.json() as Promise<PermissionDto[] | null | undefined>),
    initial,
  } = opts

  const ctx = useContext(PermissionsContext)

  // SWR é chamado apenas se não houver contexto
  const { data, error, isLoading } = useSWR<PermissionDto[] | null | undefined>(
    ctx ? null : endpoint,
    fetcher
  )

  // Prioridade: contexto > initial > data da API
  const permissoes = ctx ?? initial ?? toPermissionsMap(data ?? null)

  return {
    permissoes,
    loading: !!(ctx ? false : isLoading),
    error,
  }
}

/**
 * Resultado do hook usePode.
 */
interface UsePodeReturn {
  /** Função para verificar permissões individuais */
  pode: (acao: Action, recurso: Resource) => boolean
  /** Indica se ainda está carregando permissões */
  loading: boolean
}

/**
 * Hook para verificação reativa de permissões.
 *
 * Fornece função `pode` otimizada com memoização automática.
 * A função retornada é estável entre re-renders quando as permissões não mudam.
 *
 * @returns Objeto com função pode e loading state
 *
 * @example
 * ```tsx
 * function ActionButtons() {
 *   const { pode, loading } = usePode()
 *
 *   if (loading) return <ButtonsSkeleton />
 *
 *   return (
 *     <div>
 *       {pode("Criar", "Relatorios") && (
 *         <CreateButton />
 *       )}
 *       {pode("Exibir", "Relatorios") && (
 *         <ViewButton />
 *       )}
 *       {pode("Editar", "Relatorios") && (
 *         <EditButton />
 *       )}
 *     </div>
 *   )
 * }
 *
 * // Exemplo com múltiplas verificações
 * function ConditionalMenu() {
 *   const { pode } = usePode()
 *
 *   const menuItems = useMemo(() => [
 *     { key: "reports", show: pode("Exibir", "Relatorios"), label: "Relatórios" },
 *     { key: "users", show: pode("Gerenciar", "Usuarios"), label: "Usuários" },
 *     { key: "admin", show: pode("Acessar", "Admin"), label: "Administração" },
 *   ], [pode])
 *
 *   return (
 *     <Menu>
 *       {menuItems.filter(item => item.show).map(item => (
 *         <MenuItem key={item.key}>{item.label}</MenuItem>
 *       ))}
 *     </Menu>
 *   )
 * }
 * ```
 */
export function usePode(): UsePodeReturn {
  const { permissoes, loading } = usePermissions()

  // Memoiza função pode para evitar re-renders desnecessários
  const pode = useMemo(() => {
    return (acao: Action, recurso: Resource) => {
      return podeFn(permissoes, acao, recurso)
    }
  }, [permissoes])

  return { pode, loading }
}

/**
 * Opções para o HOC withPermissao.
 */
interface WithPermissaoOptions {
  /**
   * Se true, retorna null quando não autorizado (redirect).
   * Se false, mostra mensagem "Acesso negado".
   * @default true
   */
  redirect?: boolean
}

/**
 * HOC para proteção declarativa de componentes no client-side.
 *
 * **Comportamento:**
 * - Durante loading: retorna `null`
 * - Sem permissão + `redirect: true`: retorna `null` (componente não renderiza)
 * - Sem permissão + `redirect: false`: mostra mensagem "Acesso negado"
 * - Com permissão: renderiza componente normal
 *
 * **Nota importante:**
 * Este é um mecanismo de UX, não de segurança. A segurança real deve estar no servidor.
 *
 * @template TProps - Tipo das props do componente protegido
 * @param Component - Componente React a ser protegido
 * @param acao - Ação requerida para acessar o componente
 * @param recurso - Recurso requerido para acessar o componente
 * @param options - Opções de comportamento
 * @returns Componente protegido
 *
 * @example
 * ```tsx
 * // Proteção básica (redirect)
 * function AdminPanel() {
 *   return <div>Painel Administrativo</div>
 * }
 *
 * export default withPermissao(
 *   AdminPanel,
 *   "Acessar",
 *   "PainelAdmin"
 * )
 *
 * // Proteção com mensagem de erro
 * const RestrictedComponent = withPermissao(
 *   MyComponent,
 *   "Gerenciar",
 *   "Usuarios",
 *   { redirect: false }
 * )
 *
 * // Proteção de página inteira
 * function ReportsPage() {
 *   return (
 *     <div>
 *       <h1>Relatórios</h1>
 *       <ReportsList />
 *     </div>
 *   )
 * }
 *
 * export default withPermissao(ReportsPage, "Exibir", "Relatorios")
 *
 * // Composição com outros HOCs
 * const ProtectedAndThemed = withTheme(
 *   withPermissao(MyComponent, "Exibir", "Theme")
 * )
 * ```
 */
export function withPermissao<TProps extends object>(
  Component: React.ComponentType<TProps>,
  acao: Action,
  recurso: Resource,
  { redirect = true }: WithPermissaoOptions = {}
): React.FC<TProps> {
  return function WrappedWithPermission(props: TProps) {
    const { permissoes, loading } = usePermissions()

    // Durante loading, não renderiza nada
    if (loading) return null

    // Verifica permissão
    const isAllowed = podeFn(permissoes, acao, recurso)

    if (!isAllowed) {
      // Comportamento configurável: redirect ou mensagem
      return redirect ? null : <div>Acesso negado</div>
    }

    // Renderiza componente normal
    return <Component {...props} />
  }
}
