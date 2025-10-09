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
export function toPermissionsMap(list) {
    var _a;
    // Prevent prototype-polluting keys
    function isSafeKey(key) {
        return key !== "__proto__" && key !== "constructor" && key !== "prototype";
    }
    const map = {};
    if (!Array.isArray(list))
        return map;
    for (const p of list) {
        if (!isSafeKey(p.acao) || !isSafeKey(p.recurso)) {
            continue; // skip dangerous keys
        }
        // Inicializa o objeto da ação se não existir
        map[_a = p.acao] ?? (map[_a] = {});
        // Define a permissão para o recurso (garante boolean)
        map[p.acao][p.recurso] = !!p.permitido;
    }
    return map;
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
export function pode(perms, acao, recurso) {
    return !!perms?.[acao]?.[recurso];
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
export function hasAny(perms, pairs) {
    for (const [acao, recurso] of pairs) {
        if (pode(perms, acao, recurso))
            return true;
    }
    return false;
}
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
export function toFlatKeyMap(list) {
    const out = {};
    if (!Array.isArray(list))
        return out;
    for (const p of list) {
        const key = `${p.acao}_${p.recurso}`;
        out[key] = !!p.permitido;
    }
    return out;
}
