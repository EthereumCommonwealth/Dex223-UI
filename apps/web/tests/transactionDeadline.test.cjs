const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../stores/settingsValidation.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function("module", "exports", compiled)(loaded, loaded.exports);
const { safeDeadline, deadlineSeconds, DEFAULT_DEADLINE } = loaded.exports;

test("a stored fractional deadline falls back to 20 minutes", () => {
  assert.equal(safeDeadline(4.1), DEFAULT_DEADLINE);
  assert.equal(safeDeadline("4.1"), DEFAULT_DEADLINE);
  assert.equal(safeDeadline(1.5), DEFAULT_DEADLINE);
  assert.equal(DEFAULT_DEADLINE, 20);
});

test("a whole deadline from 1 to 4000 minutes is kept", () => {
  assert.equal(safeDeadline(1), 1);
  assert.equal(safeDeadline(20), 20);
  assert.equal(safeDeadline(4000), 4000);
  assert.equal(safeDeadline("30"), 30);
});

test("an out-of-range deadline falls back to 20 minutes", () => {
  assert.equal(safeDeadline(0), DEFAULT_DEADLINE);
  assert.equal(safeDeadline(4001), DEFAULT_DEADLINE);
  assert.equal(safeDeadline(""), DEFAULT_DEADLINE);
  assert.equal(safeDeadline(undefined), DEFAULT_DEADLINE);
});

test("deadline seconds are a whole number BigInt can accept", () => {
  assert.equal(deadlineSeconds(20), 1200);
  assert.equal(deadlineSeconds(4.1), 246);
  assert.equal(deadlineSeconds(Number.NaN), 1200);
  assert.doesNotThrow(() => BigInt(deadlineSeconds(4.1)));
  assert.doesNotThrow(() => BigInt(deadlineSeconds(20)));
});
