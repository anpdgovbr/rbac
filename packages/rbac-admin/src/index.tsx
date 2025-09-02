"use client"

/**
 * @fileoverview Interface administrativa React para gerenciamento RBAC
 * @version 0.1.0-beta.3 (WIP)
 * @author ANPD/DDSS/CGTI
 * @license MIT
 *
 * ⚠️ **WORK IN PROGRESS** ⚠️
 *
 * Este módulo está em desenvolvimento ativo e fornecerá:
 * - Interface web para gerenciamento de perfis e permissões
 * - Editor visual de hierarquia de perfis
 * - Gestão de usuários e atribuição de perfis
 * - Auditoria de mudanças em permissões
 * - Dashboard de analytics de uso de permissões
 *
 * Status atual: Interface básica funcional com limitações
 *
 * @example
 * ```tsx
 * import { RbacAdminShell } from "@anpdgovbr/rbac-admin"
 *
 * function AdminPage() {
 *   return (
 *     <RbacAdminShell
 *       config={{
 *         apiBaseUrl: "/api/rbac",
 *         theme: "dark"
 *       }}
 *     />
 *   )
 * }
 * ```
 */

import React, { useMemo, useState, useEffect } from "react"
import { createRbacAdminClient, type AdminClientConfig, type Profile } from "./types"
import { ProfilesList } from "./components/ProfilesList"
import { UsersList } from "./components/UsersList"
import { PermissionsEditor } from "./components/PermissionsEditor"
import { CreateProfileForm } from "./components/CreateProfileForm"
import { CreatePermissionForm } from "./components/CreatePermissionForm"

/**
 * Props para o shell administrativo principal.
 */
interface RbacAdminShellProps {
  /**
   * Configuração do cliente admin.
   * Se não fornecida, usa configuração padrão.
   */
  config?: AdminClientConfig
}

/**
 * Shell principal da interface administrativa RBAC.
 *
 * **Estado atual (WIP):**
 * - ✅ Interface básica funcional
 * - ✅ Navegação por abas (Perfis, Usuários, Permissões)
 * - ✅ Listagem e seleção de perfis
 * - ✅ Editor básico de permissões
 * - ✅ Formulários de criação
 * - 🚧 UI/UX precisa de melhorias
 * - 🚧 Validação de forms incompleta
 * - 🚧 Loading states ausentes
 * - 🚧 Error handling básico
 *
 * **Funcionalidades planejadas:**
 * - Drag & drop para hierarquia
 * - Bulk operations
 * - Search e filtering
 * - Export/import de configurações
 * - Audit trail visualização
 * - Dashboard analytics
 *
 * **Layout:**
 * - Sidebar esquerda: navegação e lista de perfis
 * - Área principal: editor baseado na seleção
 * - Grid responsivo com gap configurável
 *
 * @param props - Props de configuração
 * @returns Interface administrativa RBAC
 *
 * @example
 * ```tsx
 * // Uso básico
 * function AdminPage() {
 *   return <RbacAdminShell />
 * }
 *
 * // Com configuração customizada
 * function CustomAdminPage() {
 *   return (
 *     <RbacAdminShell
 *       config={{
 *         apiBaseUrl: process.env.NEXT_PUBLIC_API_URL + "/rbac",
 *         headers: {
 *           'Authorization': `Bearer ${token}`
 *         }
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export function RbacAdminShell({ config }: RbacAdminShellProps): React.ReactElement {
  // Cliente admin configurado com memoização
  const client = useMemo(() => createRbacAdminClient(config), [config])

  // Estado da interface
  const [selected, setSelected] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [tab, setTab] = useState<"perfis" | "usuarios" | "permissoes">("perfis")

  // Carregamento inicial de perfis
  useEffect(() => {
    client
      .listProfiles()
      .then(setProfiles)
      .catch(() => setProfiles([])) // TODO: melhorar error handling
  }, [client])

  return React.createElement(
    "div",
    {
      style: { padding: 24, display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 },
    },
    // Sidebar esquerda
    React.createElement(
      "div",
      { style: { borderRight: "1px solid #eee", paddingRight: 16, minWidth: 260 } },
      React.createElement("h1", null, "RBAC Admin"),

      // Navegação por abas
      React.createElement(
        "div",
        { style: { display: "flex", gap: 8, marginBottom: 12 } },
        React.createElement(
          "button",
          { onClick: () => setTab("perfis"), disabled: tab === "perfis" },
          "Perfis"
        ),
        React.createElement(
          "button",
          { onClick: () => setTab("usuarios"), disabled: tab === "usuarios" },
          "Usuários"
        ),
        React.createElement(
          "button",
          { onClick: () => setTab("permissoes"), disabled: tab === "permissoes" },
          "Permissões"
        )
      ),

      // Lista de perfis
      React.createElement(ProfilesList, {
        client,
        onSelect: (p: Profile) => {
          setSelected(p)
          setTab("permissoes")
        },
      })
    ),

    // Área principal
    React.createElement(
      "div",
      null,
      tab === "usuarios"
        ? // Aba de usuários
          React.createElement(UsersList, { client, availableProfiles: profiles })
        : selected
          ? // Perfil selecionado - editor de permissões
            React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 12 } },
              React.createElement("h3", null, `Perfil selecionado: ${selected.nome}`),
              React.createElement(PermissionsEditor, {
                client,
                profileIdOrName: selected.id ?? selected.nome,
              }),
              React.createElement(
                "div",
                null,
                React.createElement("h4", null, "Criar permissão"),
                React.createElement(CreatePermissionForm, {
                  client,
                  profiles,
                  onCreated: () => {}, // TODO: refresh data
                })
              )
            )
          : // Nenhum perfil selecionado - tela inicial
            React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 12 } },
              React.createElement("div", null, "Selecione um perfil à esquerda"),
              React.createElement(
                "div",
                null,
                React.createElement("h4", null, "Criar perfil"),
                React.createElement(CreateProfileForm, {
                  client,
                  onCreated: () => {}, // TODO: refresh profiles list
                })
              )
            )
    )
  )
}

// Re-exports para facilitar importação
export * from "./types"
export * from "./components/ProfilesList"
export * from "./components/PermissionsEditor"

/**
 * Export padrão do shell administrativo.
 * Permite import default além do named import.
 *
 * @example
 * ```tsx
 * import RbacAdmin from "@anpdgovbr/rbac-admin"
 * // ou
 * import { RbacAdminShell } from "@anpdgovbr/rbac-admin"
 * ```
 */
export default RbacAdminShell
