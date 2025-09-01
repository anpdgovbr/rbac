import type { Action, Resource } from '@anpdgovbr/rbac-core'
import { pode } from '@anpdgovbr/rbac-core'
import type { PermissionsProvider, IdentityResolver } from '@anpdgovbr/rbac-provider'

/** Opções de configuração para withApi/withApiForId. */
export type WithApiOptions<TParams extends object = object> = {
  tabela?: string | ((params: TParams) => string)
  acao?: string
  permissao?: { acao: Action; recurso: Resource }
  getIdentity: IdentityResolver<Request>
  provider: PermissionsProvider
  audit?: (args: { tabela?: string; acao?: string; userId?: string; email?: string; antes?: object; depois?: object; contexto?: string; req: Request }) => Promise<void> | void
}

/** Contexto passado ao handler da rota (Next API Route). */
export type HandlerContext<TParams extends object = object> = {
  req: Request
  email: string
  userId?: string
  params: TParams
}

/** Assinatura do handler suportado pelos wrappers withApi/withApiForId. */
export type Handler<TParams extends object = object> = (ctx: HandlerContext<TParams>) => Promise<Response | { response: Response; audit?: { antes?: object; depois?: object } }>

async function handle<TParams extends object = object>(
  req: Request,
  handler: Handler<TParams>,
  options: WithApiOptions<TParams>,
  params: TParams
): Promise<Response> {
  const identity = await options.getIdentity.resolve(req)
  const email = identity.email ?? identity.id
  const userId = identity.id

  if (options.permissao) {
    const perms = await options.provider.getPermissionsByIdentity(email)
    const { acao, recurso } = options.permissao
    if (!pode(perms, acao, recurso)) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 })
    }
  }

  const result = await handler({ req, email, userId, params })
  let response: Response
  let audit: { antes?: object; depois?: object } = {}
  if (result instanceof Response) response = result
  else { response = result.response; audit = result.audit ?? {} }

  if (options.audit) {
    const tabela = typeof options.tabela === 'function' ? options.tabela(params) : options.tabela
    await options.audit({ tabela, acao: options.acao, userId, email, contexto: req.url, req, ...audit })
  }
  return response
}

export function withApi<TParams extends object = object>(
  handler: Handler<TParams>,
  options: WithApiOptions<TParams>
) {
  return async function (req: Request): Promise<Response> {
    return handle<TParams>(req, handler, options, {} as TParams)
  }
}

export function withApiForId<TParams extends object = object>(
  handler: Handler<TParams>,
  options: WithApiOptions<TParams>
) {
  return async function (req: Request, ctx: { params: TParams | Promise<TParams> }): Promise<Response> {
    const params = await ctx.params
    return handle<TParams>(req, handler, options, params)
  }
}
