import test from "node:test";
import assert from "node:assert/strict";
import { getPermissoesPorPerfil } from "../src/index.js";
import type { PrismaLike } from "../src/index.js";

test("getPermissoesPorPerfil with complex hierarchy", async () => {
  const prismaMock: PrismaLike = {
    perfil: {
      findUnique: async ({ where }: any) => {
        const perfis: any = {
          Admin: { id: 1, nome: "Admin", active: true },
          Supervisor: { id: 2, nome: "Supervisor", active: true },
          Analista: { id: 3, nome: "Analista", active: true },
          Inativo: { id: 4, nome: "Inativo", active: false },
        };
        return perfis[where.nome] ?? null;
      },
    },
    perfilHeranca: {
      findMany: async ({ where }: any) => {
        const childId = where.childId.in[0];
        if (childId === 3) { // Analista herda de Supervisor
          return [
            {
              parentId: 2,
              parent: { id: 2, nome: "Supervisor", active: true },
            },
          ];
        }
        if (childId === 2) { // Supervisor herda de Admin
          return [
            {
              parentId: 1,
              parent: { id: 1, nome: "Admin", active: true },
            },
          ];
        }
        return [];
      },
    },
    permissao: {
      findMany: async ({ where }: any) => {
        const nomesPerfis = where.perfil.nome.in;
        const todas = [
          // Admin (nível mais alto)
          { acao: "Excluir", recurso: "Usuarios", permitido: true, perfil: { nome: "Admin" } },
          { acao: "Exibir", recurso: "Logs", permitido: true, perfil: { nome: "Admin" } },
          // Supervisor (nível intermediário)
          { acao: "Criar", recurso: "Usuarios", permitido: true, perfil: { nome: "Supervisor" } },
          { acao: "Excluir", recurso: "Usuarios", permitido: false, perfil: { nome: "Supervisor" } }, // Nega o que o Admin permite
          // Analista (nível mais baixo)
          { acao: "Exibir", recurso: "Usuarios", permitido: true, perfil: { nome: "Analista" } },
        ];
        return todas.filter(p => nomesPerfis.includes(p.perfil.nome));
      },
    },
  };

  const permissoes = await getPermissoesPorPerfil(prismaMock, "Analista");
  const mapa = new Map(permissoes.map(p => [`${p.acao}:${p.recurso}`, p.permitido]));

  assert.strictEqual(mapa.get("Exibir:Usuarios"), true, "Analista deve poder Exibir Usuários");
  assert.strictEqual(mapa.get("Criar:Usuarios"), true, "Deve herdar Criar:Usuarios de Supervisor");
  assert.strictEqual(mapa.get("Exibir:Logs"), true, "Deve herdar Exibir:Logs de Admin");
  assert.strictEqual(mapa.get("Excluir:Usuarios"), true, "Grant verdadeiro: Admin (true) deve sobrescrever Supervisor (false)");
});
