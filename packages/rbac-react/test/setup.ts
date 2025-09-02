// Setup para testes React com DOM environment
import { Window } from "happy-dom"

const window = new Window()
const document = window.document

// @ts-ignore - Define globais para o ambiente de teste
globalThis.window = window as Window & typeof globalThis
// @ts-ignore
globalThis.document = document

// Navigator é readonly, então precisamos definir de forma diferente
Object.defineProperty(globalThis, "navigator", {
  value: window.navigator,
  writable: true,
  configurable: true,
})
