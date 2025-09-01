/**
 * Ação de permissão (genérica). Manter como string para desacoplar do app.
 */
export type Action = string
/**
 * Recurso de permissão (genérico). Manter como string para desacoplar do app.
 */
export type Resource = string

/**
 * Mapa de permissões indexado por {acao -> recurso -> boolean}.
 */
export type PermissionsMap = Partial<Record<Action, Partial<Record<Resource, boolean>>>>

/**
 * Forma canônica de entrada para conversão em mapa de permissões.
 */
export type PermissionDto = { acao: Action; recurso: Resource; permitido: boolean }

/**
 * Converte uma lista de permissões em PermissionsMap.
 */
export function toPermissionsMap(list?: Array<PermissionDto> | null): PermissionsMap {
  // Prevent prototype-polluting keys
  function isSafeKey(key: string): boolean {
    return key !== '__proto__' && key !== 'constructor' && key !== 'prototype'
  }
  const map: PermissionsMap = {}
  if (!Array.isArray(list)) return map
  for (const p of list) {
    if (!isSafeKey(p.acao) || !isSafeKey(p.recurso)) {
      continue // skip dangerous keys
    }
    map[p.acao] ??= {}
    map[p.acao]![p.recurso] = !!p.permitido
  }
  return map
}

/**
 * Verifica se o par {acao,recurso} está permitido.
 */
export function pode(perms: PermissionsMap, acao: Action, recurso: Resource): boolean {
  return !!perms?.[acao]?.[recurso]
}

/**
 * Retorna true se qualquer um dos pares informados estiver permitido.
 */
export function hasAny(
  perms: PermissionsMap,
  pairs: Array<readonly [Action, Resource]>
): boolean {
  for (const [acao, recurso] of pairs) {
    if (pode(perms, acao, recurso)) return true
  }
  return false
}

// Compat opcional: chave plana "Acao_Recurso" (evitar uso em novos projetos)
/**
 * Compatibilidade opcional: mapa plano por chave concatenada "Acao_Recurso".
 */
export type FlatKey = `${Action}_${Resource}`
export function toFlatKeyMap(list?: Array<PermissionDto> | null): Partial<Record<FlatKey, boolean>> {
  const out: Partial<Record<FlatKey, boolean>> = {}
  if (!Array.isArray(list)) return out
  for (const p of list) {
    const key = `${p.acao}_${p.recurso}` as FlatKey
    out[key] = !!p.permitido
  }
  return out
}
