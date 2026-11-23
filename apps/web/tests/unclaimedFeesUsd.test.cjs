const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const viem = require("viem");

const root = path.join(__dirname, "..");

function load(file) {
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (id) => require(require.resolve(id, { paths: [root] })),
    mod,
    mod.exports,
  );
  return mod.exports;
}

const { unclaimedFeesUsd } = load("functions/unclaimedFeesUsd.ts");
const { formatFloat } = load("functions/formatFloat.ts");

function shownFee(amount, decimals) {
  return formatFloat(viem.formatUnits(amount, decimals));
}

test("fees that are only in token1 use token1's price", () => {
  const token0Fee = shownFee(0n, 18);
  const token1Fee = shownFee(1_000000n, 6);

  assert.equal(token0Fee, "0");
  assert.equal(token1Fee, "1.00");
  assert.equal(formatFloat(unclaimedFeesUsd(token0Fee, token1Fee, 2000, 1)), "1.00");
});

test("fees in both tokens are priced separately and match the two rows", () => {
  const token0Fee = shownFee(2n * 10n ** 18n, 18);
  const token1Fee = shownFee(3n * 10n ** 6n, 6);

  assert.equal(token0Fee, "2.00");
  assert.equal(token1Fee, "3.00");
  // 2.00 × $4 + 3.00 × $5. The old total priced the 2.00 token0 row a second time.
  assert.equal(unclaimedFeesUsd(token0Fee, token1Fee, 4, 5), 23);
  assert.equal(formatFloat(unclaimedFeesUsd(token0Fee, token1Fee, 4, 5)), "23.00");
});

test("a missing price leaves that leg out", () => {
  assert.equal(unclaimedFeesUsd("2.00", "3.00", 4, undefined), 8);
  assert.equal(unclaimedFeesUsd("2.00", "3.00", undefined, 5), 15);
  assert.equal(unclaimedFeesUsd("2.00", "3.00", undefined, undefined), 0);
});
