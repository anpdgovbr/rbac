import test from "node:test"
import assert from "node:assert/strict"
import { toPermissionsMap, pode, hasAny, hasAll } from "../src/index.js"

test("hasAll - should return true when all permissions are granted", () => {
  const perms = toPermissionsMap([
    { acao: "READ", recurso: "users", permitido: true },
    { acao: "WRITE", recurso: "users", permitido: true },
    { acao: "DELETE", recurso: "posts", permitido: true },
  ])

  assert.equal(
    hasAll(perms, [
      ["READ", "users"],
      ["WRITE", "users"],
    ]),
    true
  )
})

test("hasAll - should return false when any permission is missing", () => {
  const perms = toPermissionsMap([
    { acao: "READ", recurso: "users", permitido: true },
    { acao: "WRITE", recurso: "users", permitido: false },
  ])

  assert.equal(
    hasAll(perms, [
      ["READ", "users"],
      ["WRITE", "users"],
    ]),
    false
  )
})

test("hasAll - should return true for empty permissions list", () => {
  const perms = toPermissionsMap([])
  assert.equal(hasAll(perms, []), true)
})

test("hasAny - should return false when no permissions match", () => {
  const perms = toPermissionsMap([{ acao: "READ", recurso: "users", permitido: true }])

  assert.equal(
    hasAny(perms, [
      ["WRITE", "users"],
      ["DELETE", "users"],
    ]),
    false
  )
})

test("hasAny - should return false for empty permissions list", () => {
  const perms = toPermissionsMap([])
  assert.equal(hasAny(perms, [["READ", "users"]]), false)
})

test("pode - should handle case-sensitive action and resource", () => {
  const perms = toPermissionsMap([{ acao: "Read", recurso: "Users", permitido: true }])

  assert.equal(pode(perms, "Read", "Users"), true)
  assert.equal(pode(perms, "read", "Users"), false)
  assert.equal(pode(perms, "Read", "users"), false)
})

test("pode - should return false for non-existent permission", () => {
  const perms = toPermissionsMap([{ acao: "READ", recurso: "users", permitido: true }])

  assert.equal(pode(perms, "DELETE", "users"), false)
  assert.equal(pode(perms, "READ", "posts"), false)
})

test("toPermissionsMap - should handle duplicate permissions (last wins)", () => {
  const perms = toPermissionsMap([
    { acao: "READ", recurso: "users", permitido: false },
    { acao: "READ", recurso: "users", permitido: true },
  ])

  assert.equal(pode(perms, "READ", "users"), true)
})

test("toPermissionsMap - should handle multiple actions on same resource", () => {
  const perms = toPermissionsMap([
    { acao: "READ", recurso: "users", permitido: true },
    { acao: "WRITE", recurso: "users", permitido: false },
    { acao: "DELETE", recurso: "users", permitido: true },
  ])

  assert.equal(pode(perms, "READ", "users"), true)
  assert.equal(pode(perms, "WRITE", "users"), false)
  assert.equal(pode(perms, "DELETE", "users"), true)
})

test("toPermissionsMap - should handle multiple resources", () => {
  const perms = toPermissionsMap([
    { acao: "READ", recurso: "users", permitido: true },
    { acao: "READ", recurso: "posts", permitido: true },
    { acao: "READ", recurso: "comments", permitido: false },
  ])

  assert.equal(pode(perms, "READ", "users"), true)
  assert.equal(pode(perms, "READ", "posts"), true)
  assert.equal(pode(perms, "READ", "comments"), false)
})

test("toPermissionsMap - should return empty map for empty input", () => {
  const perms = toPermissionsMap([])
  assert.equal(Object.keys(perms).length, 0)
})

test("hasAny with complex permission combinations", () => {
  const perms = toPermissionsMap([
    { acao: "READ", recurso: "users", permitido: true },
    { acao: "WRITE", recurso: "posts", permitido: false },
    { acao: "DELETE", recurso: "comments", permitido: true },
  ])

  // At least one permission granted
  assert.equal(
    hasAny(perms, [
      ["WRITE", "posts"], // not granted
      ["DELETE", "comments"], // granted
    ]),
    true
  )

  // No permissions granted
  assert.equal(
    hasAny(perms, [
      ["WRITE", "posts"], // not granted
      ["ADMIN", "system"], // not exists
    ]),
    false
  )
})

test("hasAll with complex permission combinations", () => {
  const perms = toPermissionsMap([
    { acao: "READ", recurso: "users", permitido: true },
    { acao: "WRITE", recurso: "users", permitido: true },
    { acao: "DELETE", recurso: "users", permitido: false },
  ])

  // All required permissions granted
  assert.equal(
    hasAll(perms, [
      ["READ", "users"],
      ["WRITE", "users"],
    ]),
    true
  )

  // One permission not granted
  assert.equal(
    hasAll(perms, [
      ["READ", "users"],
      ["DELETE", "users"],
    ]),
    false
  )

  // One permission doesn't exist
  assert.equal(
    hasAll(perms, [
      ["READ", "users"],
      ["ADMIN", "system"],
    ]),
    false
  )
})
