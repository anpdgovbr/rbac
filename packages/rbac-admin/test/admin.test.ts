import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen } from "@testing-library/react";
import { RbacAdminShell } from "../src/index.js";

test("rbac-admin component tests", () => {
  test("RbacAdminShell should render the main title", () => {
    // Mock do client para evitar chamadas de API reais no teste
    const mockClient = {
      listProfiles: async () => [],
      listPermissions: async () => [],
      togglePermission: async () => ({ ok: true }),
      createPermission: async () => ({ ok: true }),
      listUsers: async () => [],
      assignUserProfile: async () => ({ ok: true }),
      createProfile: async () => ({ ok: true, profile: { id: "1", nome: "test" } }),
    };

    render(<RbacAdminShell config={{ fetchImpl: () => Promise.resolve(new Response("[]")) }} />);

    assert.ok(screen.getByText("RBAC Admin"));
  });
});