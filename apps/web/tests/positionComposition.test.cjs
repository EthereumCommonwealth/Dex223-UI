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

const { positionComposition } = load("functions/positionComposition.ts");

test("position composition keeps each token's share, including 0%", () => {
  assert.deepEqual(positionComposition(100, false), { token0: 100, token1: 0 });
  assert.deepEqual(positionComposition(0, false), { token0: 0, token1: 100 });
  assert.deepEqual(positionComposition(100, true), { token0: 0, token1: 100 });
  assert.deepEqual(positionComposition(0, true), { token0: 100, token1: 0 });
  assert.deepEqual(positionComposition(undefined, false), { token0: undefined, token1: undefined });
});
