// Invisible characters in token names and symbols (bounty #168, #169): "USDT" followed by a zero
// width space is drawn as "USDT", so it is a Lookalike like an exact copy, also with a Core listing.
// Letters of other scripts that look Latin are a separate follow-up (Unicode confusables).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

function load(name) {
  const file = path.resolve(__dirname, `../functions/${name}.ts`);
  const mod = { exports: {} };
  new Function(
    "module",
    "exports",
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
  )(mod, mod.exports);
  return mod.exports;
}
const { getTokenTrust, normalizeTokenText, swapNeedsAcknowledgement } = load("tokenTrust");
const { normalizeListingName, orderListingContracts } = load("listingContracts");

const CHAIN = 11155111;
const CORE = "0x6BB287ab1a02Aa8Bb43Ed98D3Bb1DE824E062b35";

const addr = (n) => `0x${n.toString(16).padStart(40, "0")}`;
const token = (n, name, symbol) => ({ address0: addr(n), address1: addr(n + 1000), name, symbol });

const D223 = token(1, "Dex223 Token", "D223");
const USDC = token(2, "USD Coin", "USDC");
const USDT = token(3, "Tether USD", "USDT");

const list = (id, tokens, extra = {}) => ({ id, enabled: true, list: { tokens }, ...extra });
const defaultList = () => list(`default-${CHAIN}`, [D223, USDC, USDT]);
const coreList = (tokens) =>
  list(`core-autolisting-${CHAIN}`, tokens, { autoListingContract: CORE.toLowerCase() });
const freeList = (tokens) => list(`free-autolisting-${CHAIN}`, tokens);
const trust = (t, lists) => getTokenTrust(t, lists, CHAIN, CORE);

// Each one is drawn as nothing in the app's font.
const INVISIBLE = {
  "zero width space": "​",
  "zero width non-joiner": "‌",
  "zero width joiner": "‍",
  "word joiner": "⁠",
  "soft hyphen": "­",
  "byte order mark": "﻿",
  "right-to-left override": "‮",
  "variation selector 16": "️",
  "Hangul filler": "ㅤ",
  "halfwidth Hangul filler": "ﾠ",
  "tag letter": "\u{E0041}",
};

test("the normalizer removes invisible characters anywhere in the text", () => {
  for (const [label, ch] of Object.entries(INVISIBLE)) {
    assert.equal(normalizeTokenText(`USDT${ch}`), "usdt", `${label} after`);
    assert.equal(normalizeTokenText(`${ch}US${ch}DT`), "usdt", `${label} inside`);
    assert.equal(normalizeTokenText(`Tether${ch} USD`), "tether usd", `${label} in a name`);
  }
  assert.equal(normalizeTokenText("​‌"), "");
});

test("a copy of USDT with one invisible character is a Lookalike, also when Core listed", () => {
  for (const [label, ch] of Object.entries(INVISIBLE)) {
    const copy = token(100, `Tether USD${ch}`, `USDT${ch}`);

    const free = trust(copy, [defaultList(), freeList([copy])]);
    assert.equal(free.reason, "lookalike", `${label}: free list`);
    assert.equal(free.level, "low");
    assert.equal(free.official.address0, USDT.address0);
    assert.equal(free.match, "name_and_symbol");

    // Rule 2 wins over a paid Core listing.
    const core = trust(copy, [defaultList(), coreList([copy])]);
    assert.equal(core.reason, "lookalike", `${label}: Core list`);
    assert.equal(core.onCoreList, true);
    assert.equal(swapNeedsAcknowledgement(core), true);
  }
});

test("only the symbol or only the name with an invisible character is still a Lookalike", () => {
  const symbol = trust(token(110, "Something Else", "D2​23"), [defaultList()]);
  assert.equal(symbol.reason, "lookalike");
  assert.equal(symbol.match, "symbol");
  assert.equal(symbol.official.address0, D223.address0);

  const name = trust(token(111, "USD⁠ Coin", "XYZ"), [defaultList()]);
  assert.equal(name.reason, "lookalike");
  assert.equal(name.match, "name");
});

test("Dex223's own wrapper symbols and the official tokens are not flagged", () => {
  // The ERC-20 / ERC-223 wrapper symbols differ from the official symbol by visible characters.
  for (const symbol of ["D22320", "D223223", "USDT20", "USDC223"]) {
    const wrapper = trust(token(120, `${symbol} wrapper`, symbol), [defaultList()]);
    assert.equal(wrapper.reason, "unverified", symbol);
  }
  // The official token stays Official by either of its addresses.
  assert.equal(trust({ ...D223, address0: D223.address1 }, [defaultList()]).reason, "official");
  assert.equal(trust(USDT, [defaultList(), coreList([USDT])]).reason, "official");
});

test("a token whose text is only invisible characters is not a Lookalike of anything", () => {
  const blank = trust(token(130, "​", "‌"), [defaultList()]);
  assert.equal(blank.reason, "unverified");
});

test("listing names: invisible characters and fullwidth letters do not hide an impostor", () => {
  const CORE_LISTING = { id: CORE.toLowerCase(), name: "Dex223 Core Autolisting" };
  const zeroWidth = { id: addr(1), name: "Dex223 Core​ Autolisting" };
  const fullwidth = { id: addr(2), name: "Ｄｅｘ２２３ Core Autolisting" };
  const thirdParty = { id: addr(3), name: "Community Gaming List" };

  assert.equal(normalizeListingName(zeroWidth.name), "dex223coreautolisting");
  assert.equal(normalizeListingName(fullwidth.name), "dex223coreautolisting");

  const shown = orderListingContracts(
    [CORE_LISTING.id],
    [CORE_LISTING],
    [zeroWidth, fullwidth, thirdParty],
  );
  assert.deepEqual(
    shown.map((listing) => listing.id),
    [CORE_LISTING.id, thirdParty.id],
  );
});
