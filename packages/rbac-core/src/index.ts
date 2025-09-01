/**
 * @fileoverview Core de RBAC da ANPD - Tipos fundamentais e utilitários para autorização por papéis
 * @version 0.1.0-beta.3
 * @author ANPD/DDSS/CGTI
 * @license MIT
 *
 * Este módulo fornece os tipos e funções fundamentais para o sistema RBAC:
 * - Tipos genéricos Action e Resource (strings para desacoplamento)
 * - PermissionsMap para consulta O(1)
 * - Utilitários de conversão e verificação
 * - Compatibilidade com formato flat key legado
 */

/**
 * Representa uma ação genérica no sistema RBAC.
 * Usar string permite total desacoplamento de enums específicos do domínio.
 *
 * @example
 * ```typescript
 * const acao: Action = "Exibir"
 * const outraAcao: Action = "Criar"
 * ```
 */
export type Action = string

/**
 * Representa um recurso genérico no sistema RBAC.
 * Usar string permite total desacoplamento de enums específicos do domínio.
 *
 * @example
 * ```typescript
 * const recurso: Resource = "Relatorios"
 * const outroRecurso: Resource = "Usuarios"
 * ```
 */
export type Resource = string

/**
 * Mapa otimizado de permissões para consulta O(1).
 * Estrutura: { [acao]: { [recurso]: boolean } }
 *
 * @example
 * ```typescript
 * const mapa: PermissionsMap = {
 *   "Exibir": {
 *     "Relatorios": true,
 *     "Usuarios": false
 *   },
 *   "Criar": {
 *     "Relatorios": true
 *   }
 * }
 * ```
 */
export type PermissionsMap = Partial<Record<Action, Partial<Record<Resource, boolean>>>>

/**
 * DTO padrão para representar uma permissão individual.
 * Usado como entrada para funções de conversão.
 *
 * @example
 * ```typescript
 * const permissao: PermissionDto = {
 *   acao: "Exibir",
 *   recurso: "Relatorios",
 *   permitido: true
 * }
 * ```
 */
export type PermissionDto = {
  /** Ação a ser executada */
  acao: Action
  /** Recurso sobre o qual a ação será executada */
  recurso: Resource
  /** Se a ação é permitida (true) ou negada (false) */
  permitido: boolean
}

/**
 * Converte uma lista de permissões em PermissionsMap otimizado.
 *
 * @param list - Array de PermissionDto, pode ser null/undefined
 * @returns Mapa indexado para consulta O(1)
 *
 * @example
 * ```typescript
 * const permissoes = toPermissionsMap([
 *   { acao: "Exibir", recurso: "Relatorios", permitido: true },
 *   { acao: "Editar", recurso: "Relatorios", permitido: false },
 * ])
 *
 * // Resultado: { "Exibir": { "Relatorios": true }, "Editar": { "Relatorios": false } }
 * ```
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
    // Inicializa o objeto da ação se não existir
    map[p.acao] ??= {}
    // Define a permissão para o recurso (garante boolean)
    map[p.acao]![p.recurso] = !!p.permitido
  }
  return map
}

/**
 * Verifica se uma ação específica é permitida em um recurso.
 * Operação O(1) usando o PermissionsMap.
 *
 * @param perms - Mapa de permissões
 * @param acao - Ação a verificar
 * @param recurso - Recurso a verificar
 * @returns true se a permissão existe e está permitida, false caso contrário
 *
 * @example
 * ```typescript
 * const permitido = pode(permissoes, "Exibir", "Relatorios")
 * if (permitido) {
 *   // Usuário pode exibir relatórios
 * }
 * ```
 */
export function pode(perms: PermissionsMap, acao: Action, recurso: Resource): boolean {
  return !!perms?.[acao]?.[recurso]
}

/**
 * Verifica se QUALQUER dos pares ação/recurso informados está permitido.
 * Útil para verificações de acesso onde múltiplas permissões podem dar acesso.
 *
 * @param perms - Mapa de permissões
 * @param pairs - Array de tuplas [acao, recurso] para verificar
 * @returns true se pelo menos uma permissão estiver permitida
 *
 * @example
 * ```typescript
 * const podeAcessar = hasAny(permissoes, [
 *   ["Exibir", "Relatorios"],
 *   ["Criar", "Relatorios"],
 *   ["Editar", "Relatorios"]
 * ])
 *
 * // true se o usuário tiver qualquer uma dessas permissões
 * ```
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

// =============================================================================
// COMPATIBILIDADE LEGADA - Evitar uso em novos projetos
// =============================================================================

/**
 * @deprecated Formato legado para compatibilidade com sistemas antigos.
 * Usar PermissionsMap em novos projetos.
 *
 * Chave plana concatenada no formato "Acao_Recurso".
 *
 * @example
 * ```typescript
 * const chave: FlatKey = "Exibir_Relatorios"
 * ```
 */
export type FlatKey = `${Action}_${Resource}`

/**
 * @deprecated Função de compatibilidade para sistemas legados.
 * Converte lista de permissões em mapa com chaves concatenadas.
 *
 * **AVISO**: Este formato é menos eficiente e deve ser evitado em novos projetos.
 * Use `toPermissionsMap()` e `pode()` para melhor performance.
 *
 * @param list - Array de PermissionDto
 * @returns Mapa com chaves no formato "Acao_Recurso"
 *
 * @example
 * ```typescript
 * const flatMap = toFlatKeyMap([
 *   { acao: "Exibir", recurso: "Relatorios", permitido: true }
 * ])
 * // { "Exibir_Relatorios": true }
 * ```
 */
export function toFlatKeyMap(
  list?: Array<PermissionDto> | null
): Partial<Record<FlatKey, boolean>> {
  const out: Partial<Record<FlatKey, boolean>> = {}
  if (!Array.isArray(list)) return out

  for (const p of list) {
    const key = `${p.acao}_${p.recurso}` as FlatKey
    out[key] = !!p.permitido
  }
  return out
}
