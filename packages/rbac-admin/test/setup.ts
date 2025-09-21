/**
 * Configura um ambiente DOM mínimo para testes React em ambientes Node.js.
 * Este arquivo garante que objetos globais como window, document e classes DOM estejam disponíveis durante os testes.
 */
// Setup DOM environment for testing
// Configuração mínima de DOM para testes React
if (typeof globalThis.window === "undefined") {
  // Mock mais completo do HTMLElement
  class MockHTMLElement {
    setAttribute(_name: string, _value: string) {}
    getAttribute(_name: string) { return null }
    addEventListener() {}
    removeEventListener() {}
    appendChild() {}
    removeChild() {}
    style = {}
  }

  class MockDocument {
    createElement(_tag: string) {
      return new MockHTMLElement()
    }
    createTextNode(text: string) {
      return { nodeValue: text }
    }
    addEventListener() {}
    removeEventListener() {}
    querySelector() { return null }
    querySelectorAll() { return [] }
    body = new MockHTMLElement()
    head = new MockHTMLElement()
  }

  const mockDocument = new MockDocument()
  
  ;(globalThis as unknown as { window: unknown }).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { href: "http://localhost" },
    document: mockDocument,
  }
  ;(globalThis as unknown as { document: unknown }).document = mockDocument
  ;(globalThis as unknown as { HTMLElement: unknown }).HTMLElement = MockHTMLElement
  ;(globalThis as unknown as { Text: unknown }).Text = class {}
  ;(globalThis as unknown as { DocumentFragment: unknown }).DocumentFragment = class {}
}
