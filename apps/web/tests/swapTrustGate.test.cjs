// Review swap trust gate (bounty #142): Not verified and Lookalike tokens need a checkbox before the
// swap; Official, Core listed and native coins never gate; "Swap anyway" for lookalikes.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
function load(file) {
  const mod = { exports: {} };
  const localRequire = (spec) =>
    spec.startsWith("./")
      ? load(path.join(path.dirname(file), `${spec.slice(2)}.ts`))
      : require(spec);
  new Function(
    "module",
    "exports",
    "require",
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
  )(mod, mod.exports, localRequire);
  return mod.exports;
}
const { getSwapTrustGate, canConfirmSwap, isSwapAnyway } = load(
  path.join(root, "functions/swapTrustGate.ts"),
);
const { NOT_VERIFIED_GATES_SWAP } = load(path.join(root, "functions/tokenTrust.ts"));

const D223 = {
  address0: "0x675eB5922604F434bcaAC4B4B433D8668925DD67",
  symbol: "D223",
  name: "Dex223 Token",
};
const pay = (symbol, reason, official) => ({
  side: "pay",
  symbol,
  trust: reason && { reason, official },
});
const receive = (symbol, reason, official) => ({
  side: "receive",
  symbol,
  trust: reason && { reason, official },
});

test("Official, Core listed and native coins never gate", () => {
  const gate = getSwapTrustGate([pay("USDC", "official"), receive("MOON", "core")]);
  assert.equal(gate.required, false);
  assert.equal(getSwapTrustGate([undefined, receive("USDC", "official")]).required, false); // native pay side
});

test("a Not verified token gates with the 'I checked the RED contract address' label", () => {
  const gate = getSwapTrustGate([undefined, receive("RED", "unverified")]);
  assert.equal(gate.required, NOT_VERIFIED_GATES_SWAP);
  if (NOT_VERIFIED_GATES_SWAP) {
    assert.equal(gate.anyLookalike, false);
    assert.deepEqual(gate.ackSymbols, ["RED"]);
  }
});

test("a Lookalike always gates and takes over the checkbox label", () => {
  const gate = getSwapTrustGate([pay("RED", "unverified"), receive("D223", "lookalike", D223)]);
  assert.equal(gate.required, true);
  assert.equal(gate.anyLookalike, true);
  assert.deepEqual(gate.ackSymbols, ["D223"]);
  // One alert per flagged token, in card order: You pay, then You receive.
  assert.deepEqual(
    gate.flagged.map((t) => t.side),
    NOT_VERIFIED_GATES_SWAP ? ["pay", "receive"] : ["receive"],
  );
});

test("two Not verified tokens share one checkbox", () => {
  const gate = getSwapTrustGate([pay("RED", "unverified"), receive("XYZ", "unverified")]);
  if (NOT_VERIFIED_GATES_SWAP) assert.deepEqual(gate.ackSymbols, ["RED", "XYZ"]);
});

test("confirm needs every gate that applies to be checked", () => {
  const cases = [
    [false, false, false, false, true],
    [true, false, false, false, false],
    [true, true, false, false, true],
    [false, false, true, false, false],
    [true, true, true, false, false],
    [true, true, true, true, true],
  ];
  for (const [
    trustRequired,
    trustAcknowledged,
    priceImpactRequired,
    priceImpactAcknowledged,
    ok,
  ] of cases) {
    assert.equal(
      canConfirmSwap({
        trustRequired,
        trustAcknowledged,
        priceImpactRequired,
        priceImpactAcknowledged,
      }),
      ok,
    );
  }
});

test("'Swap anyway' for a Lookalike or very high price impact, otherwise 'Confirm swap'", () => {
  assert.equal(isSwapAnyway(true, false), true);
  assert.equal(isSwapAnyway(false, true), true);
  assert.equal(isSwapAnyway(false, false), false);
});

test("both review dialogs show the trust gate before the price-impact gate and pass it to the button", () => {
  for (const file of [
    "app/[locale]/swap/components/ConfirmSwapDialog.tsx",
    "app/[locale]/margin-swap/components/ConfirmMarginSwapDialog.tsx",
  ]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const trustAt = source.indexOf("<TrustAcknowledgement");
    const priceAt = source.indexOf("<PriceImpactWarning");
    assert.ok(trustAt > 0 && trustAt < priceAt, `${file}: trust alerts come before price impact`);
    assert.match(source, /isTrustAcknowledged=\{trustGate\.acknowledged\}/, file);
    assert.match(source, /<ReviewCardTrustBadge/, file);
    assert.match(source, /<ReviewCardAddress/, file);
  }
});
