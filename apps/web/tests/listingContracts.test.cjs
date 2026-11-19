// Token-listing pages: the official lists come first and impostors under their names are left out
// (bounty #108).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const file = path.resolve(__dirname, "../functions/listingContracts.ts");
const mod = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
)(mod, mod.exports);
const { orderListingContracts, normalizeListingName } = mod.exports;

const CORE = { id: "0x6bb287ab1a02aa8bb43ed98d3bb1de824e062b35", name: "Dex223 Core Autolisting" };
const FREE = { id: "0xd46566b0682dccd55bbfcaf45c848086143f5a14", name: "Dex223 Free Auto-listing" };
const OFFICIAL_IDS = [CORE.id, FREE.id.toUpperCase().replace("0X", "0x")];
const impostorCore = {
  id: "0x0000000000000000000000000000000000000001",
  name: "Dex223 Core Autolisting",
};
const impostorFree = {
  id: "0x0000000000000000000000000000000000000002",
  name: "dex223 free autolisting",
};
const impostorSpaced = {
  id: "0x0000000000000000000000000000000000000003",
  name: "DEX223 Core Auto-Listing ",
};
const thirdParty = {
  id: "0x0000000000000000000000000000000000000004",
  name: "Community Gaming List",
};

test("names compare without case, spaces or punctuation", () => {
  assert.equal(normalizeListingName("Dex223 Free Auto-listing"), "dex223freeautolisting");
  assert.equal(normalizeListingName(" DEX223 core AUTO listing"), "dex223coreautolisting");
});

test("the official lists come first, core then free, whatever their addresses", () => {
  const ordered = orderListingContracts(OFFICIAL_IDS, [FREE, CORE], [thirdParty]);
  assert.deepEqual(
    ordered.map((l) => l.id),
    [CORE.id, FREE.id, thirdParty.id],
  );
});

test("contracts under an official name are left out; other third-party lists stay", () => {
  const ordered = orderListingContracts(
    OFFICIAL_IDS,
    [CORE, FREE],
    [impostorCore, impostorFree, impostorSpaced, thirdParty],
  );
  assert.deepEqual(
    ordered.map((l) => l.id),
    [CORE.id, FREE.id, thirdParty.id],
  );
});

test("an official list returned twice is shown once", () => {
  const ordered = orderListingContracts(OFFICIAL_IDS, [CORE, FREE], [CORE, thirdParty]);
  assert.deepEqual(
    ordered.map((l) => l.id),
    [CORE.id, FREE.id, thirdParty.id],
  );
});

test("the reserved names still apply while the official lists have not loaded", () => {
  const ordered = orderListingContracts(
    OFFICIAL_IDS,
    [],
    [impostorCore, thirdParty],
    ["Dex223 Core Autolisting", "Dex223 Free Auto-listing"],
  );
  assert.deepEqual(
    ordered.map((l) => l.id),
    [thirdParty.id],
  );
});

test("control: without the official ids or names, every contract passes through", () => {
  const ordered = orderListingContracts([], [], [impostorCore, thirdParty]);
  assert.deepEqual(
    ordered.map((l) => l.id),
    [impostorCore.id, thirdParty.id],
  );
});
