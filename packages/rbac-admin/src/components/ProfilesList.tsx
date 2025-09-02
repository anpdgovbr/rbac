"use client"
import React, { useEffect, useState } from "react"
import type { AdminClient, Profile } from "../types"
import { useI18n } from "../i18n"

export function ProfilesList({
  client,
  onSelect,
}: {
  client: AdminClient
  onSelect: (p: Profile) => void
}): React.ReactElement {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const t = useI18n()

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

  if (loading) return <div className="rbac-muted">{t.states.loading}</div>
  if (error) return <div style={{ color: "red" }}>{`${t.states.errorPrefix}: ${error}`}</div>

  return (
    <div>
      <h2>{t.tabs.profiles}</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {profiles.map((p) => (
          <li key={String(p.id)} style={{ marginBottom: 8 }}>
            <button
              onClick={() => onSelect(p)}
              style={{ padding: "6px 10px", cursor: "pointer" }}
            >
              {p.nome}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
