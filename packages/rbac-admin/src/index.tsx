import React, { useMemo, useState } from 'react'
import { createRbacAdminClient, type AdminClientConfig, type Profile } from './types'
import { ProfilesList } from './components/ProfilesList'
import { PermissionsEditor } from './components/PermissionsEditor'

export function RbacAdminShell({ config }: { config?: AdminClientConfig }): React.ReactElement {
  const client = useMemo(() => createRbacAdminClient(config), [config])
  const [selected, setSelected] = useState<Profile | null>(null)

  return React.createElement(
    'div',
    { style: { padding: 24, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 } },
    React.createElement(
      'div',
      { style: { borderRight: '1px solid #eee', paddingRight: 16 } },
      React.createElement('h1', null, 'RBAC Admin'),
      React.createElement(ProfilesList, {
        client,
        onSelect: (p: Profile) => setSelected(p),
      })
    ),
    React.createElement(
      'div',
      null,
      selected
        ? React.createElement(
            'div',
            null,
            React.createElement('h3', null, `Perfil selecionado: ${selected.nome}`),
            React.createElement(PermissionsEditor, {
              client,
              profileIdOrName: selected.id ?? selected.nome,
            })
          )
        : React.createElement('div', null, 'Selecione um perfil à esquerda')
    )
  )
}

export * from './types'
export * from './components/ProfilesList'
export * from './components/PermissionsEditor'
export default RbacAdminShell
