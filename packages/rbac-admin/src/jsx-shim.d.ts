// Temporário: garantir compilação do JSX em ambientes sem resolução automática de tipos do React
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}
