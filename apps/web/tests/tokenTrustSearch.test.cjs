// Select token search (bounty #135): results ordered by trust, one lookalike warning per official
// token.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const file = path.resolve(__dirname, "../functions/tokenTrustSearch.ts");
const mod = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
)(mod, mod.exports);
const { sortByTrust, lookalikeGroups, trustRank } = mod.exports;

const d223 = { address0: "0x675eB5922604F434bcaAC4B4B433D8668925DD67", symbol: "D223" };
const usdt = { address0: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT" };
const row = (id, reason, official) => ({
  id,
  isNative: false,
  trust: reason ? { reason, official } : undefined,
});

test("results are ordered Official, Core listed, Not verified, Lookalike; ties keep their order", () => {
  const tokens = [
    row("fake1", "lookalike", d223),
    row("red", "unverified"),
    row("moon", "core"),
    row("d223", "official"),
    { id: "eth", isNative: true },
    row("fake2", "lookalike", d223),
    row("bridged", "unverified"),
    row("nolists"),
  ];
  assert.deepEqual(
    sortByTrust(tokens).map((t) => t.id),
    ["d223", "eth", "moon", "red", "bridged", "nolists", "fake1", "fake2"],
  );
  assert.equal(trustRank({ isNative: true }), 0);
});

test("one warning per copied official token, counting the official plus its lookalikes", () => {
  const groups = lookalikeGroups([
    row("d223", "official"),
    row("fake1", "lookalike", d223),
    row("fake2", "lookalike", { ...d223, address0: d223.address0.toLowerCase() }),
    row("fakeUsdt", "lookalike", usdt),
    row("red", "unverified"),
  ]);
  assert.deepEqual(
    groups.map((g) => [g.official.symbol, g.count]),
    [
      ["D223", 3],
      ["USDT", 2],
    ],
  );
});

test("no warning without a lookalike, e.g. a pasted official address", () => {
  assert.deepEqual(lookalikeGroups([row("d223", "official"), row("red", "unverified")]), []);
});
