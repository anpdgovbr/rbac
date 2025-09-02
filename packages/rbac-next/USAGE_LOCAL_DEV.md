# Desenvolvimento local com submódulos — @anpdgovbr/rbac-next

Este arquivo documenta alterações temporárias aplicadas ao pacote durante desenvolvimento local com submódulos dentro de um projeto consumidor (por exemplo `backlog-dim`).

O que foi alterado temporariamente

- `package.json` pode conter `__local_dev_note__` indicando uso de `file:` para dependências locais.
- Scripts de `test` foram ajustados para rodar arquivos JS compilados diretamente (`node --test dist/src/test/*.js`).
- Algumas APIs oferecem fallbacks ou comportamentos adicionais para facilitar mocks em testes.

Marcas a revisar antes do publish

- `__local_dev_note__` no `package.json` — revert to published versions.
- Comentários `TODO: (TEMP)` no código — remover e mover lógica de teste para a suíte de testes.

Como reverter para publicação

1. Remova `__local_dev_note__` do `package.json`.
2. Substitua dependências `file:` pelas versões publicadas (ex.: `^0.1.1-beta.3`).
3. Remova fallbacks marcados com `TODO: (TEMP)` e garanta que testes usem mocks explícitos.
4. Rode `npm run build` e `npm test` para validar.

---

# Nota

Este arquivo é temporário e serve como lembrete para equipe; não deve ser publicado como parte da documentação do pacote final.
