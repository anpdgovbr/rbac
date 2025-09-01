import React, { useEffect, useState } from 'react'
import type { AdminClient, Profile } from '../types'

export function ProfilesList({ client, onSelect }: { client: AdminClient; onSelect: (p: Profile) => void }): React.ReactElement {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    client
      .listProfiles()
      .then((list) => {
        if (mounted) {
          setProfiles(list)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(String(e?.message ?? e))
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [client])

  if (loading) return React.createElement('div', null, 'Carregando perfis...')
  if (error) return React.createElement('div', { style: { color: 'red' } }, `Erro: ${error}`)

  return React.createElement(
    'div',
    null,
    React.createElement('h2', null, 'Perfis'),
    React.createElement(
      'ul',
      { style: { listStyle: 'none', padding: 0 } },
      ...profiles.map((p) =>
        React.createElement(
          'li',
          { key: String(p.id), style: { marginBottom: 8 } },
          React.createElement(
            'button',
            {
              onClick: () => onSelect(p),
              style: { padding: '6px 10px', cursor: 'pointer' },
              title: p.active === false ? 'Inativo' : 'Ativo',
            },
            p.nome
          )
        )
      )
    )
  )
}

