"use client"

import { useCallback, useEffect, useState } from "react"
import type { AdminClient, Permission, Profile } from "./types.js"

/**
 * Hook personalizado para gerenciar a lista de perfis de administração.
 * Carrega os perfis do cliente, gerencia estados de carregamento e erro, e fornece uma função para atualizar os dados.
 * @param client - Instância do cliente de administração RBAC.
 * @returns Objeto contendo a lista de perfis, estados de carregamento e erro, e função de atualização.
 */
export function useAdminProfiles(client: AdminClient) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await client.listProfiles()
      setProfiles(list)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { profiles, loading, error, refresh }
}

/**
 * Hook personalizado para gerenciar as permissões de um perfil específico.
 * Carrega as permissões do perfil fornecido, gerencia estados de carregamento e erro, e fornece uma função para atualizar os dados.
 * @param client - Instância do cliente de administração RBAC.
 * @param profileIdOrName - ID ou nome do perfil para o qual carregar as permissões (opcional).
 * @returns Objeto contendo a lista de permissões, estados de carregamento e erro, e função de atualização.
 */
export function useAdminPermissions(
  client: AdminClient,
  profileIdOrName?: string | number
) {
  const [items, setItems] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (profileIdOrName == null) return
    setLoading(true)
    setError(null)
    try {
      const list = await client.listPermissions(profileIdOrName)
      setItems(list)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [client, profileIdOrName])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { permissions: items, loading, error, refresh }
}
