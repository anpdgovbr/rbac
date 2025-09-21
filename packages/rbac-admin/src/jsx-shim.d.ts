/**
 * Namespace para elementos intrínsecos JSX.
 * Este é um shim temporário para garantir a compilação do JSX em ambientes sem resolução automática de tipos do React.
 */
declare namespace JSX {
  /**
   * Interface que define elementos intrínsecos JSX.
   * Permite qualquer nome de elemento com propriedades desconhecidas.
   */
  interface IntrinsicElements {
    [elemName: string]: unknown
  }
}
