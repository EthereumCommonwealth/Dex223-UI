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

const { isListablePoolState } = load("functions/isListablePool.ts");

test("token listing ignores a pool that is still loading", () => {
  assert.equal(isListablePoolState(PoolState.LOADING), false);
  assert.equal(isListablePoolState(PoolState.NOT_EXISTS), false);
  assert.equal(isListablePoolState(PoolState.INVALID), false);
  assert.equal(isListablePoolState(PoolState.IDLE), false);
  assert.equal(isListablePoolState(PoolState.EXISTS), true);
  assert.equal(isListablePoolState(PoolState.EXISTS_WITH_NO_LIQUIDITY), true);
});
