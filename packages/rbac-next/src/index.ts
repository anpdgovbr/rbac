/**
 * @fileoverview Middleware Next.js para proteção de rotas API com RBAC
 * @version 0.1.0-beta.3
 * @author ANPD/DDSS/CGTI
 * @license MIT
 *
 * Este módulo fornece:
 * - Higher-order functions para proteção de API routes
 * - Integração automática com audit logging
 * - Resolução de identidade via providers configuráveis
 * - Suporte para rotas dinâmicas com parâmetros tipados
 * - Context typing para TypeScript intellisense
 */

import React from "react"
import type { Action, Resource } from "@anpdgovbr/rbac-core"
import { pode } from "@anpdgovbr/rbac-core"
import type { PermissionsProvider, IdentityResolver } from "@anpdgovbr/rbac-provider"

/**
 * Opções de configuração para withApi/withApiForId.
 *
 * Permite customização de comportamento de auditoria, permissões e resolução de identidade.
 *
 * @template TParams - Tipo dos parâmetros extraídos da rota (ex: { id: string })
 */
export type WithApiOptions<TParams extends object = object> = {
  /**
   * Nome da tabela para auditoria.
   * Pode ser string fixa ou função que calcula baseada nos parâmetros.
   *
   * @example
   * ```ts
   * // Tabela fixa
   * tabela: "usuarios"
   *
   * // Tabela dinâmica baseada em parâmetros
   * tabela: (params) => `${params.tipo}_historico`
   * ```
   */
  tabela?: string | ((params: TParams) => string)

  /**
   * Ação sendo executada para auditoria.
   * String descritiva do que está sendo feito (ex: "Criar", "Atualizar", "Deletar").
   */
  acao?: string

  /**
   * Configuração de permissão RBAC requerida.
   * Se não fornecida, apenas autenticação será verificada.
   *
   * @example
   * ```ts
   * permissao: { acao: "Editar", recurso: "Usuarios" }
   * ```
   */
  permissao?: { acao: Action; recurso: Resource }

  /**
   * Resolver de identidade para extrair informações do usuário da requisição.
   * Implementa estratégia de autenticação (NextAuth, JWT, headers, etc).
   */
  getIdentity: IdentityResolver<Request>

  /**
   * Provider de permissões para consulta RBAC.
   * Implementa interface para buscar permissões do usuário.
   */
  provider: PermissionsProvider

  /**
   * Callback opcional para logging de auditoria.
   * Recebe dados estruturados sobre a operação realizada.
   *
   * @param args - Dados de auditoria da operação
   *
   * @example
   * ```ts
   * audit: async (args) => {
   *   await auditLogger.log({
   *     table: args.tabela,
   *     action: args.acao,
   *     userId: args.userId,
   *     userEmail: args.email,
   *     beforeData: args.antes,
   *     afterData: args.depois,
   *     context: args.contexto,
   *     timestamp: new Date().toISOString(),
   *     clientIp: getClientIp(args.req)
   *   })
   * }
   * ```
   */
  audit?: (args: {
    /** Nome da tabela/entidade afetada */
    tabela?: string
    /** Ação executada (CRUD ou custom) */
    acao?: string
    /** ID do usuário que executou a ação */
    userId?: string
    /** Email do usuário que executou a ação */
    email?: string
    /** Estado anterior da entidade (para updates/deletes) */
    antes?: object
    /** Estado posterior da entidade (para creates/updates) */
    depois?: object
    /** Contexto adicional (URL, etc) */
    contexto?: string
    /** Requisição original */
    req: Request
  }) => Promise<void> | void
}

/**
 * Contexto enriquecido passado ao handler da rota API.
 *
 * Contém informações de autenticação, parâmetros da rota e requisição original.
 *
 * @template TParams - Tipo dos parâmetros extraídos da rota
 */
export type HandlerContext<TParams extends object = object> = {
  /** Requisição Next.js original */
  req: Request

  /** Email do usuário autenticado */
  email: string

  /** ID do usuário autenticado (pode ser undefined se identity resolver não fornecer) */
  userId?: string

  /**
   * Parâmetros extraídos da rota dinâmica.
   * Para rotas como /api/users/[id], params = { id: "123" }
   */
  params: TParams
}

/**
 * Assinatura do handler suportado pelos wrappers withApi/withApiForId.
 *
 * O handler pode retornar:
 * - Response direta: para casos simples
 * - Objeto com response + audit: para incluir dados de auditoria específicos
 *
 * @template TParams - Tipo dos parâmetros da rota
 * @param ctx - Contexto da requisição com auth e parâmetros
 * @returns Response ou objeto com response + dados de auditoria
 *
 * @example
 * ```ts
 * // Response simples
 * const handler: Handler = async (ctx) => {
 *   const data = await fetchData(ctx.params.id)
 *   return Response.json(data)
 * }
 *
 * // Com auditoria customizada
 * const handler: Handler = async (ctx) => {
 *   const oldData = await getOldData(ctx.params.id)
 *   const newData = await updateData(ctx.params.id, updates)
 *
 *   return {
 *     response: Response.json(newData),
 *     audit: {
 *       antes: oldData,
 *       depois: newData
 *     }
 *   }
 * }
 * ```
 */
export type Handler<TParams extends object = object> = (
  ctx: HandlerContext<TParams>
) => Promise<
  Response | { response: Response; audit?: { antes?: object; depois?: object } }
>

/**
 * Função interna que executa o pipeline de proteção e auditoria.
 *
 * **Fluxo de execução:**
 * 1. Resolve identidade via IdentityResolver
 * 2. Verifica permissões RBAC (se configurado)
 * 3. Executa handler do usuário
 * 4. Processa dados de auditoria
 * 5. Executa callback de audit logging
 *
 * @template TParams - Tipo dos parâmetros da rota
 * @param req - Requisição Next.js
 * @param handler - Handler do usuário
 * @param options - Configurações de proteção
 * @param params - Parâmetros extraídos da rota
 * @returns Response final
 *
 * @internal
 */
async function handle<TParams extends object = object>(
  req: Request,
  handler: Handler<TParams>,
  options: WithApiOptions<TParams>,
  params: TParams
): Promise<Response> {
  // 1. Resolução de identidade
  const identity = await options.getIdentity.resolve(req)
  const email = identity.email ?? identity.id
  const userId = identity.id

  // 2. Verificação de permissões RBAC
  if (options.permissao) {
    const perms = await options.provider.getPermissionsByIdentity(email)
    const { acao, recurso } = options.permissao
    if (!pode(perms, acao, recurso)) {
      return Response.json({ error: "Acesso negado" }, { status: 403 })
    }
  }

  // 3. Execução do handler do usuário
  const result = await handler({ req, email, userId, params })
  let response: Response
  let audit: { antes?: object; depois?: object } = {}

  if (result instanceof Response) {
    response = result
  } else {
    response = result.response
    audit = result.audit ?? {}
  }

  // 4. Logging de auditoria
  if (options.audit) {
    const tabela =
      typeof options.tabela === "function" ? options.tabela(params) : options.tabela
    await options.audit({
      tabela,
      acao: options.acao,
      userId,
      email,
      contexto: req.url,
      req,
      ...audit,
    })
  }

  return response
}

/**
 * Higher-order function para proteção de API routes sem parâmetros de rota.
 *
 * Ideal para endpoints como `/api/users`, `/api/health`, etc.
 * Fornece autenticação, autorização e auditoria automáticas.
 *
 * @template TParams - Tipo dos parâmetros (geralmente vazio {})
 * @param handler - Handler que processará a requisição
 * @param options - Configurações de proteção e auditoria
 * @returns Function que pode ser exportada como API route
 *
 * @example
 * ```ts
 * // /api/users/route.ts - Lista todos os usuários
 * export const GET = withApi(
 *   async (ctx) => {
 *     const users = await listUsers()
 *     return Response.json(users)
 *   },
 *   {
 *     permissao: { acao: "Listar", recurso: "Usuarios" },
 *     getIdentity: authResolver,
 *     provider: permissionsProvider,
 *     acao: "Listar Usuários",
 *     tabela: "usuarios"
 *   }
 * )
 *
 * // /api/users/route.ts - Criar novo usuário
 * export const POST = withApi(
 *   async (ctx) => {
 *     const userData = await ctx.req.json()
 *     const newUser = await createUser(userData)
 *
 *     return {
 *       response: Response.json(newUser, { status: 201 }),
 *       audit: {
 *         depois: newUser
 *       }
 *     }
 *   },
 *   {
 *     permissao: { acao: "Criar", recurso: "Usuarios" },
 *     getIdentity: authResolver,
 *     provider: permissionsProvider,
 *     acao: "Criar Usuário",
 *     tabela: "usuarios",
 *     audit: auditLogger.log
 *   }
 * )
 * ```
 */
export function withApi<TParams extends object = object>(
  handler: Handler<TParams>,
  options: WithApiOptions<TParams>
) {
  return async function (req: Request): Promise<Response> {
    return handle<TParams>(req, handler, options, {} as TParams)
  }
}

/**
 * Higher-order function para proteção de API routes com parâmetros dinâmicos.
 *
 * Específico para rotas como `/api/users/[id]`, `/api/posts/[slug]`, etc.
 * Os parâmetros são automaticamente extraídos e tipados.
 *
 * @template TParams - Tipo dos parâmetros da rota (ex: { id: string })
 * @param handler - Handler que receberá parâmetros tipados
 * @param options - Configurações de proteção e auditoria
 * @returns Function que pode ser exportada como API route
 *
 * @example
 * ```ts
 * // /api/users/[id]/route.ts - Buscar usuário por ID
 * export const GET = withApiForId<{ id: string }>(
 *   async (ctx) => {
 *     const user = await getUserById(ctx.params.id)
 *     if (!user) {
 *       return Response.json(
 *         { error: "Usuário não encontrado" },
 *         { status: 404 }
 *       )
 *     }
 *     return Response.json(user)
 *   },
 *   {
 *     permissao: { acao: "Exibir", recurso: "Usuario" },
 *     getIdentity: authResolver,
 *     provider: permissionsProvider,
 *     acao: "Exibir Usuário",
 *     tabela: "usuarios"
 *   }
 * )
 *
 * // /api/users/[id]/route.ts - Atualizar usuário
 * export const PATCH = withApiForId<{ id: string }>(
 *   async (ctx) => {
 *     const userId = ctx.params.id
 *     const updates = await ctx.req.json()
 *
 *     const oldUser = await getUserById(userId)
 *     const updatedUser = await updateUser(userId, updates)
 *
 *     return {
 *       response: Response.json(updatedUser),
 *       audit: {
 *         antes: oldUser,
 *         depois: updatedUser
 *       }
 *     }
 *   },
 *   {
 *     permissao: { acao: "Editar", recurso: "Usuario" },
 *     getIdentity: authResolver,
 *     provider: permissionsProvider,
 *     acao: "Atualizar Usuário",
 *     tabela: "usuarios",
 *     audit: auditLogger.log
 *   }
 * )
 *
 * // /api/categories/[slug]/posts/[postId]/route.ts - Rotas complexas
 * export const DELETE = withApiForId<{ slug: string; postId: string }>(
 *   async (ctx) => {
 *     await deletePost(ctx.params.slug, ctx.params.postId)
 *     return new Response(null, { status: 204 })
 *   },
 *   {
 *     permissao: { acao: "Excluir", recurso: "Posts" },
 *     getIdentity: authResolver,
 *     provider: permissionsProvider,
 *     acao: "Excluir Post",
 *     tabela: (params) => `posts_${params.slug}`
 *   }
 * )
 * ```
 */
export function withApiForId<TParams extends object = object>(
  handler: Handler<TParams>,
  options: WithApiOptions<TParams>
) {
  return async function (
    req: Request,
    ctx: { params: TParams | Promise<TParams> }
  ): Promise<Response> {
    const params = await ctx.params
    return handle<TParams>(req, handler, options, params)
  }
}

// ---------------------------------------------------------------------------
// Utilitário exportado: checkPermission
// ---------------------------------------------------------------------------

/** Erro lançado quando não há identidade autenticada */
export class UnauthenticatedError extends Error {
  constructor(message = "Usuário não autenticado") {
    super(message)
    this.name = "UnauthenticatedError"
  }
}

/** Erro lançado quando usuário é autenticado mas não tem permissão */
export class ForbiddenError extends Error {
  constructor(message = "Acesso negado") {
    super(message)
    this.name = "ForbiddenError"
  }
}

/**
 * Opções para checkPermission
 */
export type CheckPermissionOptions = {
  getIdentity: IdentityResolver<Request>
  provider: PermissionsProvider
  permissao: { acao: Action; recurso: Resource }
}

/**
 * Verifica permissões server-side de forma genérica.
 * - Resolve identidade via `getIdentity`
 * - Consulta permissões via `provider`
 * - Lança `UnauthenticatedError` ou `ForbiddenError` conforme o caso
 * - Retorna `{ email, userId, perms }` quando autorizado
 *
 * Esta função é framework-agnóstica; o caller decide como tratar os erros
 * (ex: `redirect('/login')` ou `redirect('/acesso-negado')` no Next).
 */
export async function checkPermission(
  opts: CheckPermissionOptions,
  req?: Request
): Promise<{ email: string; userId?: string; perms: any }> {
  const identity = await opts.getIdentity.resolve(req)
  const email = identity.email ?? identity.id
  if (!email) throw new UnauthenticatedError()
  const userId = identity.id
  const perms = await opts.provider.getPermissionsByIdentity(email)
  const { acao, recurso } = opts.permissao
  if (!pode(perms, acao, recurso)) throw new ForbiddenError()
  return { email, userId, perms }
}

/**
 * Opções para o helper convenience `protectPage` (Next-specific).
 */
export type ProtectPageOptions = {
  redirects?: { unauth?: string; forbidden?: string }
  /**
   * Função opcional de redirect que será invocada no servidor.
   * Se fornecida, deverá executar o redirect (ex: `redirect` do Next).
   */
  redirectFn?: (url: string) => never
}

/**
 * Helper convenience Next-specific para proteger páginas com mínimo boilerplate.
 *
 * Uso:
 * ```ts
 * // app/rbac-admin/page.tsx
 * import ClientRbacAdminShell from '@/app/rbac-admin/ClientRbacAdminShell' // client wrapper
 * import { protectPage } from '@anpdgovbr/rbac-next'
 * import { getIdentity, rbacProvider } from '@/rbac/server'
 *
 * export default protectPage(ClientRbacAdminShell, {
 *   getIdentity,
 *   provider: rbacProvider,
 *   permissao: { acao: 'Exibir', recurso: 'Permissoes' }
 * }, { redirects: { unauth: '/login', forbidden: '/acesso-negado' } })
 * ```
 *
 * Implementação:
 * - É um wrapper Next-specific que chama `checkPermission` server-side.
 * - Em caso de erro realiza `redirect()` para os destinos configurados.
 * - Se autorizado, renderiza o componente cliente (que deve ser um Client Component
 *   ou um wrapper client-side que carrega o componente real dinamicamente).
 *
 * Observações de segurança/mitigação:
 * - `protectPage` usa `checkPermission` (a função agnóstica) para garantir consistência
 *   entre usos server-side e outros ambientes.
 * - Errors diferentes são mantidos (`UnauthenticatedError`, `ForbiddenError`) e
 *   tratados explicitamente para evitar redirecionamentos errôneos.
 * - O caller deve fornecer um componente client-only (ou wrapper) para evitar
 *   a importação de componentes client-side no servidor (o que causaria erro/hydration).
 */
export function protectPage<ClientProps extends Record<string, unknown> = {}>(
  ClientComponent: React.ComponentType<ClientProps>,
  opts: CheckPermissionOptions,
  { redirects, redirectFn }: ProtectPageOptions = {
    redirects: { unauth: "/login", forbidden: "/acesso-negado" },
  }
): any {
  const unauth = redirects?.unauth ?? "/login"
  const forbidden = redirects?.forbidden ?? "/acesso-negado"

  // Retorna um async Server Component para uso no App Router.
  return async function ProtectedPage(props: ClientProps) {
    try {
      await checkPermission(opts)
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        if (redirectFn) return redirectFn(unauth)
        throw err
      }
      if (err instanceof ForbiddenError) {
        if (redirectFn) return redirectFn(forbidden)
        throw err
      }
      throw err
    }

    // Se autorizado, renderiza o componente cliente (deve ser Client Component).
    return React.createElement(ClientComponent as React.ComponentType<ClientProps>, props)
  }
}
