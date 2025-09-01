# Exemplo — Proteção de componente no cliente

```tsx
import { withPermissao } from '@anpdgovbr/rbac-react'

function Relatorios() { return <div>Relatórios</div> }
export default withPermissao(Relatorios, 'Exibir', 'Relatorios')
```

