// Setup DOM environment for testing
// Configuração mínima de DOM para testes React
if (typeof globalThis.window === "undefined") {
  ;(globalThis as unknown as { window: unknown }).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { href: "http://localhost" },
    document: {
      createElement: () => ({
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        appendChild: () => {},
        removeChild: () => {},
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
      body: { appendChild: () => {}, removeChild: () => {} },
      head: { appendChild: () => {}, removeChild: () => {} },
      querySelector: () => null,
      querySelectorAll: () => [],
    },
  }
  ;(globalThis as unknown as { document: unknown }).document = (
    globalThis as unknown as { window: { document: unknown } }
  ).window.document
  ;(globalThis as unknown as { HTMLElement: unknown }).HTMLElement = class {}
  ;(globalThis as unknown as { Text: unknown }).Text = class {}
  ;(globalThis as unknown as { DocumentFragment: unknown }).DocumentFragment = class {}
}
