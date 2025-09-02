# Desenvolvimento local com submódulos — @anpdgovbr/rbac-prisma

Este arquivo documenta alterações temporárias feitas ao pacote durante o desenvolvimento local com submódulos.

Principais pontos temporários

- `resolveModel` e fallback para nomes (`usuario`, plurais) foram adicionados para permitir que os testes usem mocks com nomes diferentes dos modelos de produção.
- `getPerfisHerdadosNomes` contém um fallback `TODO: (TEMP)` para extrair herança a partir de estruturas aninhadas (útil para mocks simples).
- `package.json` pode conter `__local_dev_note__` indicando `file:` para dependências locais.

Ações recomendadas antes do publish

1. Reverter `file:` em `package.json` para dependências publicadas.
2. Remover os fallbacks temporários e garantir que os testes utilizem mocks explícitos/fixtures.
3. Garantir cobertura de testes contra um cliente Prisma real (ou um mock robusto) e remover a necessidade de heurísticas no código.
4. Atualizar CHANGELOG e criar PR com as reversões claramente documentadas.

---

> Nota: Este arquivo é temporário e deve ser removido antes da publicação pública do pacote.
