// Ethereum mainnet trading pause until the relaunch (2026-11-22): mainnet is paused, every other chain is open.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
function load(file) {
  const mod = { exports: {} };
  new Function(
    "module",
    "exports",
    "require",
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
  )(mod, mod.exports, require);
  return mod.exports;
}
const { isTradingPaused, TRADING_PAUSED_CHAIN_IDS } = load(
  path.join(root, "functions/tradingPause.ts"),
);

test("Ethereum mainnet is paused", () => {
  assert.equal(isTradingPaused(1), true);
  assert.deepEqual([...TRADING_PAUSED_CHAIN_IDS], [1]);
});

test("Sepolia, BSC testnet and unknown chains stay open", () => {
  for (const id of [11155111, 97, 56, 137, undefined])
    assert.equal(isTradingPaused(id), false, String(id));
});
