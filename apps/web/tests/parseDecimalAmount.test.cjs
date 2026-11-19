const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const viem = require("viem");

const root = path.join(__dirname, "..");
const PoolState = {
  LOADING: 0,
  NOT_EXISTS: 1,
  EXISTS: 2,
  EXISTS_WITH_NO_LIQUIDITY: 3,
  INVALID: 4,
  IDLE: 5,
};

function load(file) {
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (id) => {
      if (id === "@/hooks/usePools") return { PoolState };
      if (id === "viem") return viem;
      return require(require.resolve(id, { paths: [path.dirname(path.join(root, file))] }));
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}

const { parseDecimalAmount } = load("functions/parseDecimalAmount.ts");

test("withdraw text that is not one decimal number does not throw", () => {
  assert.equal(parseDecimalAmount("", 6), undefined);
  assert.equal(parseDecimalAmount(".", 6), undefined);
  assert.equal(parseDecimalAmount("abc", 6), undefined);
  assert.equal(parseDecimalAmount("1.2.3", 6), undefined);
  assert.equal(parseDecimalAmount("1e18", 6), undefined);
  assert.equal(parseDecimalAmount(" ", 6), undefined);
  assert.equal(parseDecimalAmount("1,000", 6), undefined);
  assert.equal(parseDecimalAmount("1.5", 6), 1_500000n);
  assert.equal(parseDecimalAmount("10", 6), 10_000000n);
});
