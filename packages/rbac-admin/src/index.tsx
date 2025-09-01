import React from 'react'

export function RbacAdminShell(): React.ReactElement {
  return React.createElement(
    'div',
    { style: { padding: 24 } },
    React.createElement('h1', null, 'RBAC Admin (esqueleto)'),
    React.createElement(
      'p',
      null,
      'Pacote inicial para telas de administração de Perfis, Herança e Permissões.'
    ),
    React.createElement(
      'ul',
      null,
      React.createElement('li', null, 'Listagem de Perfis'),
      React.createElement('li', null, 'Herança entre Perfis'),
      React.createElement('li', null, 'Permissões por Perfil')
    )
  )
}

export default RbacAdminShell
