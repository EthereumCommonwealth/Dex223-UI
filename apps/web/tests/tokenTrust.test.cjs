// Token trust levels (bounty #140): only the default list and the current Core autolisting can
// confirm a token; free autolisting, custom, imported and retired lists never change trust.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const file = path.resolve(__dirname, "../functions/tokenTrust.ts");
const mod = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
)(mod, mod.exports);
const {
  getTokenTrust,
  normalizeTokenText,
  swapNeedsAcknowledgement,
  CORE_LISTED_IS_HIGH,
  NOT_VERIFIED_GATES_SWAP,
} = mod.exports;

const CHAIN = 11155111;
const CORE = "0x6BB287ab1a02Aa8Bb43Ed98D3Bb1DE824E062b35";
const FREE = "0xD46566B0682dccD55BBfCAF45C848086143F5a14";
const RETIRED_CORE = "0x8a1839e6b7b4538a15de8865891fce6e24a27dda";

const addr = (n) => `0x${n.toString(16).padStart(40, "0")}`;
const token = (n, name, symbol, address1 = addr(n + 1000)) => ({
  address0: addr(n),
  address1,
  name,
  symbol,
});

const D223 = token(1, "Dex223 Token", "D223");
const USDC = token(2, "USD Coin", "USDC");
const USDT = token(3, "Tether USD", "USDT");

const list = (id, tokens, extra = {}) => ({ id, enabled: true, list: { tokens }, ...extra });
const defaultList = (tokens = [D223, USDC, USDT]) => list(`default-${CHAIN}`, tokens);
const coreList = (tokens, contract = CORE.toLowerCase()) =>
  list(`core-autolisting-${CHAIN}`, tokens, { autoListingContract: contract });
const freeList = (tokens) =>
  list(`free-autolisting-${CHAIN}`, tokens, { autoListingContract: FREE.toLowerCase() });
const customList = (tokens) => list(`custom-${CHAIN}`, tokens);

const trust = (t, lists) => getTokenTrust(t, lists, CHAIN, CORE);

test("names and symbols compare after NFKC, trimming, collapsed spaces and lowercase", () => {
  assert.equal(normalizeTokenText("  Dex223   Token "), "dex223 token");
  assert.equal(normalizeTokenText("ＵＳＤＣ"), "usdc"); // fullwidth letters fold under NFKC
  assert.equal(normalizeTokenText("Ｄｅｘ２２３ token"), "dex223 token");
  assert.equal(normalizeTokenText(undefined), "");
});

test("rule 1: a default-list token is Official (high), matched by either address", () => {
  const byErc20 = trust({ ...D223 }, [defaultList()]);
  assert.equal(byErc20.reason, "official");
  assert.equal(byErc20.level, "high");

  const byErc223 = trust(
    {
      address0: addr(999),
      address1: D223.address1.toUpperCase().replace("0X", "0x"),
      name: "x",
      symbol: "y",
    },
    [defaultList()],
  );
  assert.equal(byErc223.reason, "official");
});

test("rule 1 wins over the lookalike check for the official token itself", () => {
  const result = trust(D223, [defaultList(), freeList([D223]), customList([D223])]);
  assert.equal(result.reason, "official");
  assert.deepEqual(result.alsoIn, [`free-autolisting-${CHAIN}`, `custom-${CHAIN}`]);
});

test("rule 2: same name or symbol as a default-list token is a Lookalike (low), case-insensitive", () => {
  // The old check at useTokenLists.ts:80 compared names case-sensitively, so this passed as Medium.
  const copycat = token(50, "Dex223 token", "D22320");
  const result = trust(copycat, [defaultList(), freeList([copycat])]);
  assert.equal(result.reason, "lookalike");
  assert.equal(result.level, "low");
  assert.equal(result.official.address0, D223.address0);
  assert.equal(result.match, "name");

  const both = trust(token(51, "dex223 TOKEN", "d223"), [defaultList()]);
  assert.equal(both.match, "name_and_symbol");

  const symbolOnly = trust(token(52, "Totally Different", " usdt "), [defaultList()]);
  assert.equal(symbolOnly.reason, "lookalike");
  assert.equal(symbolOnly.match, "symbol");
  assert.equal(symbolOnly.official.symbol, "USDT");
});

test("rule 2 normalizes Unicode (NFKC) and spaces", () => {
  const fullwidth = trust(token(60, "Fake", "ＵＳＤＣ"), [defaultList()]);
  assert.equal(fullwidth.reason, "lookalike");
  assert.equal(fullwidth.official.symbol, "USDC");

  const spaced = trust(token(61, "  Tether   USD ", "TUSD"), [defaultList()]);
  assert.equal(spaced.reason, "lookalike");
  assert.equal(spaced.match, "name");
});

test("rule 2 needs an exact match after normalizing: containing a name is not enough", () => {
  const bridged = token(70, "Dex223 Bridged", "D223B");
  assert.equal(trust(bridged, [defaultList(), freeList([bridged])]).reason, "unverified");
});

test("rule 2 wins over a paid Core listing", () => {
  const paidCopycat = token(80, "Dex223 Token", "D223");
  const result = trust(paidCopycat, [defaultList(), coreList([paidCopycat])]);
  assert.equal(result.reason, "lookalike");
  assert.equal(result.onCoreList, true);
});

test("rule 3: the current Core autolisting gives Core listed", () => {
  const moon = token(90, "Moon Token", "MOON");
  const result = trust(moon, [defaultList(), coreList([moon]), freeList([moon])]);
  assert.equal(result.reason, "core");
  assert.equal(result.level, CORE_LISTED_IS_HIGH ? "high" : "medium");
  assert.equal(result.onCoreList, true);
  assert.deepEqual(result.alsoIn, [`free-autolisting-${CHAIN}`]);
});

test("a retired Core contract stored under the Core id does not count", () => {
  const moon = token(91, "Moon Token", "MOON");
  const result = trust(moon, [defaultList(), coreList([moon], RETIRED_CORE)]);
  assert.equal(result.reason, "unverified");
  assert.equal(result.onCoreList, false);
});

test("rule 4: free autolisting, custom, imported and retired lists never raise trust", () => {
  const red = token(100, "Red Token", "RED");
  const lists = [
    defaultList(),
    freeList([red]),
    customList([red]),
    list(7, [red]), // imported list (numeric id)
    list(8, [red], { autoListingContract: RETIRED_CORE }), // retired autolisting
  ];
  const result = trust(red, lists);
  assert.equal(result.reason, "unverified");
  assert.equal(result.level, "medium");
  assert.equal(result.alsoIn.length, 4);
});

test("free and other lists never lower trust either", () => {
  // A different token with the same name in the free list used to cost points.
  const moon = token(110, "Moon Token", "MOON");
  const otherMoon = token(111, "Moon Token", "MOON");
  assert.equal(
    trust(moon, [defaultList(), coreList([moon]), freeList([otherMoon])]).reason,
    "core",
  );
});

test("the default and Core lists count even when switched off in Manage tokens", () => {
  const moon = token(120, "Moon Token", "MOON");
  const off = (l) => ({ ...l, enabled: false });
  assert.equal(trust(D223, [off(defaultList())]).reason, "official");
  assert.equal(trust(moon, [off(defaultList()), off(coreList([moon]))]).reason, "core");
});

test("empty names and zero addresses never match", () => {
  const zero = "0x0000000000000000000000000000000000000000";
  const nameless = { address0: addr(130), address1: zero, name: "", symbol: "" };
  const withZero = list(`default-${CHAIN}`, [
    { address0: addr(131), address1: zero, name: "", symbol: "" },
  ]);
  assert.equal(trust(nameless, [withZero]).reason, "unverified");
});

test("examples from the Figma before/after table", () => {
  const sepoliaDual = token(140, "Test 110526", "T11052620");
  assert.equal(
    trust(sepoliaDual, [defaultList(), coreList([sepoliaDual]), freeList([sepoliaDual])]).reason,
    "core",
  );
  const freeOnly = token(141, "Test 110826", "T110826");
  assert.equal(trust(freeOnly, [defaultList(), freeList([freeOnly])]).reason, "unverified");
  const staleOnly = token(142, "Old Listing", "OLD");
  assert.equal(
    trust(staleOnly, [
      defaultList(),
      list(9, [staleOnly], { autoListingContract: RETIRED_CORE }),
      list(10, [staleOnly]),
    ]).reason,
    "unverified",
  );
  assert.equal(
    trust(USDC, [defaultList(), customList([USDC]), freeList([USDC])]).reason,
    "official",
  );
});

test("the swap gate: Lookalike always, Not verified per NOT_VERIFIED_GATES_SWAP, never Official or Core", () => {
  assert.equal(swapNeedsAcknowledgement({ reason: "lookalike" }), true);
  assert.equal(swapNeedsAcknowledgement({ reason: "unverified" }), NOT_VERIFIED_GATES_SWAP);
  assert.equal(swapNeedsAcknowledgement({ reason: "official" }), false);
  assert.equal(swapNeedsAcknowledgement({ reason: "core" }), false);
  assert.equal(swapNeedsAcknowledgement(undefined), false); // native coins
});
