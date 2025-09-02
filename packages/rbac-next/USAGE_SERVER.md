# Uso server-side (checkPermission)

Este documento mostra como usar o helper `checkPermission` exportado por `@anpdgovbr/rbac-next` para proteger páginas e rotas server-side.

## O que existe hoje

- `checkPermission(req, opts)` — função agnóstica que resolve identidade via `opts.getIdentity`, obtém permissões via `opts.provider` e verifica `opts.permissao`.
- Erros lançados:
  - `UnauthenticatedError` — usuário não autenticado
  - `ForbiddenError` — usuário autenticado mas sem permissão

> Observação: esta função não faz redirect; o caller decide como reagir aos erros. Isso mantém o pacote livre de acoplamento com frameworks.

## Exemplo (Next.js App Router - Server Component)

```tsx
import { redirect } from "next/navigation"
import {
  checkPermission,
  UnauthenticatedError,
  ForbiddenError,
} from "@anpdgovbr/rbac-next"
import { getIdentity, rbacProvider } from "@/rbac/server"

export default async function Page() {
  try {
    await checkPermission({
      getIdentity,
      provider: rbacProvider,
      permissao: { acao: "Exibir", recurso: "Permissoes" },
    })
  } catch (err) {
    if (err instanceof UnauthenticatedError) return redirect("/login")
    if (err instanceof ForbiddenError) return redirect("/acesso-negado")
    return redirect("/acesso-negado")
  }

  // Carrega client shell sem importar no servidor
  const ClientShell = (await import("@/app/rbac-admin/ClientRbacAdminShell")).default
  return <ClientShell />
}
```

## Padrão `protectPage` (opcional)

Se desejar conveniência, implemente um helper local `protectPage` que encapsula o padrão acima. Exemplo de assinatura:

```ts
export function protectPage(
  loader: () => Promise<{ default: React.ComponentType<any> }>,
  opts: CheckPermissionOptions,
  redirects: { unauth?: string; forbidden?: string } = {}
)
```

Ele deve:

1. Chamar `checkPermission` em server.
2. Em caso de sucesso, retornar um Server Component que importa dinamicamente o componente cliente.
3. Em caso de erro, realizar o redirect apropriado.

Implementar `protectPage` no pacote é opcional; este documento descreve o padrão recomendado para consumo.
