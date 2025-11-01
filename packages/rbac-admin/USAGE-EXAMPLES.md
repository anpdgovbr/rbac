# Exemplos de Uso Avançado do RBAC Admin

## 🎨 Adaptação ao Tema do Consumidor

O `RbacAdminShell` foi projetado para se adaptar perfeitamente ao tema e layout da aplicação que o consome.

### Exemplo 1: Uso Básico (Standalone)

```tsx
import { RbacAdminShell } from "@anpdgovbr/rbac-admin"

function AdminPage() {
  return <RbacAdminShell config={{ baseUrl: "/api" }} i18n={{ locale: "pt-BR" }} />
}
```

### Exemplo 2: Integração com Tema MUI Existente

O componente automaticamente usa o tema MUI do contexto:

```tsx
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { RbacAdminShell } from "@anpdgovbr/rbac-admin"

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* RbacAdminShell usa automaticamente o tema acima */}
      <RbacAdminShell config={{ baseUrl: "/api" }} />
    </ThemeProvider>
  )
}
```

### Exemplo 3: Customização de Cores sem Alterar Tema Global

```tsx
import { RbacAdminShell } from "@anpdgovbr/rbac-admin"

function AdminPage() {
  return (
    <RbacAdminShell
      config={{ baseUrl: "/api" }}
      styleConfig={{
        primaryColor: "#00796b", // Teal
        paperElevation: 3,
        containerMaxWidth: "xl",
      }}
    />
  )
}
```

### Exemplo 4: Integração com Layout Existente

Quando você já tem um container/layout e quer apenas o conteúdo:

```tsx
import { Box, Container } from "@mui/material"
import { RbacAdminShell } from "@anpdgovbr/rbac-admin"

function DashboardPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <h1>Painel Administrativo</h1>

        {/* Sem container próprio - usa o layout existente */}
        <RbacAdminShell config={{ baseUrl: "/api" }} disableContainer disableTitle />
      </Box>
    </Container>
  )
}
```

### Exemplo 5: Customização Avançada com sx Props

```tsx
import { RbacAdminShell } from "@anpdgovbr/rbac-admin"

function AdminPage() {
  return (
    <RbacAdminShell
      config={{ baseUrl: "/api" }}
      styleConfig={{
        containerMaxWidth: "lg",
        containerPadding: 6,
        paperElevation: 0, // Sem sombra
        primaryColor: "#1976d2",
        sx: {
          container: {
            backgroundColor: "background.default",
          },
          paper: {
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          },
          tabs: {
            "& .MuiTab-root": {
              textTransform: "none", // Sem caps
              fontWeight: 600,
            },
          },
          content: {
            minHeight: "600px",
          },
        },
      }}
    />
  )
}
```

### Exemplo 6: Controle de Tab Inicial e Callback

```tsx
import { useState } from "react"
import { RbacAdminShell } from "@anpdgovbr/rbac-admin"

function AdminPage() {
  const [currentTab, setCurrentTab] = useState(0)

  return (
    <div>
      <nav>
        <button onClick={() => setCurrentTab(0)}>Perfis</button>
        <button onClick={() => setCurrentTab(1)}>Usuários</button>
        <button onClick={() => setCurrentTab(2)}>Permissões</button>
      </nav>

      <RbacAdminShell
        config={{ baseUrl: "/api" }}
        initialTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab)
          console.log("Tab mudou para:", tab)
        }}
      />
    </div>
  )
}
```

### Exemplo 7: Integração com Next.js App Router

```tsx
// app/admin/rbac/page.tsx
"use client"

import { RbacAdminShell } from "@anpdgovbr/rbac-admin"
import { useTheme } from "@mui/material/styles"

export default function RbacAdminPage() {
  const theme = useTheme()

  return (
    <RbacAdminShell
      config={{
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        headers: {
          "X-App-Version": "1.0.0",
        },
      }}
      styleConfig={{
        // Usa cores do tema Next.js/MUI
        primaryColor: theme.palette.primary.main,
        containerMaxWidth: "xl",
      }}
    />
  )
}
```

### Exemplo 8: Tema Dark Mode

```tsx
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { RbacAdminShell } from "@anpdgovbr/rbac-admin"
import { useState } from "react"

function App() {
  const [darkMode, setDarkMode] = useState(false)

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#90caf9" : "#1976d2",
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <button onClick={() => setDarkMode(!darkMode)}>Toggle Dark Mode</button>

      {/* Automaticamente se adapta ao tema dark/light */}
      <RbacAdminShell config={{ baseUrl: "/api" }} />
    </ThemeProvider>
  )
}
```

### Exemplo 9: Integração com @anpdgovbr/shared-ui

```tsx
import { GovBRThemeProvider } from "@anpdgovbr/shared-ui"
import { RbacAdminShell } from "@anpdgovbr/rbac-admin"

function App() {
  return (
    <GovBRThemeProvider>
      {/* Usa automaticamente o tema Gov.BR da ANPD */}
      <RbacAdminShell
        config={{ baseUrl: "/api" }}
        styleConfig={{
          // Sobrescreve apenas o necessário
          containerMaxWidth: "lg",
        }}
      />
    </GovBRThemeProvider>
  )
}
```

### Exemplo 10: Custom Fetch com Autenticação

```tsx
import { RbacAdminShell } from "@anpdgovbr/rbac-admin"

function AdminPage() {
  const customFetch = async (url: RequestInfo, init?: RequestInit) => {
    const token = localStorage.getItem("auth_token")

    return fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    })
  }

  return (
    <RbacAdminShell
      config={{
        baseUrl: "/api",
        fetchImpl: customFetch,
      }}
    />
  )
}
```

## 📊 Propriedades Disponíveis

### RbacAdminShellProps

| Propriedade        | Tipo                    | Padrão  | Descrição                                        |
| ------------------ | ----------------------- | ------- | ------------------------------------------------ |
| `config`           | `AdminClientConfig`     | `{}`    | Configuração do cliente de API                   |
| `i18n`             | `Partial<Messages>`     | -       | Sobrescritas de i18n                             |
| `className`        | `string`                | -       | Classe CSS para o container                      |
| `styleConfig`      | `RbacAdminStyleConfig`  | -       | Configuração de estilos                          |
| `disableContainer` | `boolean`               | `false` | Não renderiza Container MUI                      |
| `disableTitle`     | `boolean`               | `false` | Não renderiza título                             |
| `initialTab`       | `number`                | `0`     | Tab inicial (0=Perfis, 1=Usuários, 2=Permissões) |
| `onTabChange`      | `(tab: number) => void` | -       | Callback quando tab muda                         |

### RbacAdminStyleConfig

| Propriedade         | Tipo                                  | Padrão | Descrição                              |
| ------------------- | ------------------------------------- | ------ | -------------------------------------- |
| `containerMaxWidth` | `'xs'\|'sm'\|'md'\|'lg'\|'xl'\|false` | `'lg'` | Largura máxima do container            |
| `containerPadding`  | `number`                              | `4`    | Padding vertical (theme.spacing units) |
| `paperElevation`    | `number` (0-24)                       | `1`    | Elevação do Paper                      |
| `primaryColor`      | `string`                              | -      | Cor primária (sobrescreve tema)        |
| `sx.container`      | `SxProps<Theme>`                      | -      | Estilos customizados do Container      |
| `sx.paper`          | `SxProps<Theme>`                      | -      | Estilos customizados do Paper          |
| `sx.tabs`           | `SxProps<Theme>`                      | -      | Estilos customizados das Tabs          |
| `sx.content`        | `SxProps<Theme>`                      | -      | Estilos customizados do conteúdo       |

## 🎯 Casos de Uso

### Caso 1: Aplicação com Design System Próprio

```tsx
<RbacAdminShell
  config={{ baseUrl: "/api" }}
  styleConfig={{
    primaryColor: "#custom-brand-color",
    sx: {
      paper: {
        border: "2px solid currentColor",
        borderRadius: "16px",
      },
    },
  }}
/>
```

### Caso 2: Embedded em Dashboard Complexo

```tsx
<DashboardLayout>
  <Sidebar />
  <MainContent>
    <RbacAdminShell
      config={{ baseUrl: "/api" }}
      disableContainer
      disableTitle
      styleConfig={{
        sx: {
          paper: {
            boxShadow: "none",
            backgroundColor: "transparent",
          },
        },
      }}
    />
  </MainContent>
</DashboardLayout>
```

### Caso 3: Modal/Dialog de Administração

```tsx
<Dialog open={open} maxWidth="lg" fullWidth>
  <DialogContent>
    <RbacAdminShell
      config={{ baseUrl: "/api" }}
      disableContainer
      styleConfig={{
        paperElevation: 0,
      }}
    />
  </DialogContent>
</Dialog>
```

## 🚀 Benefícios

1. **Adaptação Automática**: Usa automaticamente o tema MUI do contexto
2. **Zero Config**: Funciona out-of-the-box com configuração mínima
3. **Altamente Customizável**: Permite sobrescrever praticamente tudo
4. **TypeScript First**: Tipos completos para autocomplete e type safety
5. **Responsive**: Adapta-se a diferentes tamanhos de tela
6. **Acessível**: Componentes MUI seguem WCAG 2.1
7. **Flexível**: Pode ser usado standalone ou embedded em layouts complexos

## 📝 Notas

- O componente se adapta automaticamente ao `ThemeProvider` do MUI
- Todas as props `sx` seguem a mesma API do MUI
- O `primaryColor` sobrescreve apenas a cor primária, mantendo o resto do tema
- Use `disableContainer` quando já tiver um layout/container próprio
- O `onTabChange` é útil para sincronizar com navegação externa
