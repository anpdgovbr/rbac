import { createContext, useContext } from 'react'
import useSWR from 'swr'
import type { PermissionsMap, Action, Resource } from '@anpdgovbr/rbac-core'
import { toPermissionsMap, pode as podeFn } from '@anpdgovbr/rbac-core'

/** Contexto para injeção/hidratação de PermissionsMap no cliente. */
const PermissionsContext = createContext<PermissionsMap | null>(null)

/** Provider para injetar permissões já resolvidas (hydration). */
export function PermissionsProvider({ children, value }: { children: React.ReactNode; value: PermissionsMap }) {
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

export type PermissionsClientOptions = {
  endpoint?: string
  fetcher?: (url: string) => Promise<any>
  initial?: PermissionsMap
}

/** Hook para obter PermissionsMap via contexto ou endpoint (SWR). */
export function usePermissions(opts: PermissionsClientOptions = {}) {
  const { endpoint = '/api/permissoes', fetcher = (url) => fetch(url).then((r) => r.json()), initial } = opts
  const ctx = useContext(PermissionsContext)
  const { data, error, isLoading } = useSWR<any>(ctx ? null : endpoint, fetcher)
  const permissoes = ctx ?? initial ?? toPermissionsMap(data)
  return { permissoes, loading: !!(ctx ? false : isLoading), error }
}

/** Hook para checar permissão via `pode(acao,recurso)`. */
export function usePode() {
  const { permissoes, loading } = usePermissions()
  function pode(acao: Action, recurso: Resource) {
    return podeFn(permissoes, acao, recurso)
  }
  return { pode, loading }
}

/** HOC simples de proteção de componente no cliente (UX). */
export function withPermissao<TProps extends object>(
  Component: React.ComponentType<TProps>,
  acao: Action,
  recurso: Resource,
  { redirect = true }: { redirect?: boolean } = {}
): React.FC<TProps> {
  return function Wrapped(props: TProps) {
    const { permissoes, loading } = usePermissions()
    if (loading) return null
    if (!podeFn(permissoes, acao, recurso)) {
      return redirect ? null : <div>Acesso negado</div>
    }
    return <Component {...props} />
  }
}
