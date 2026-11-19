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

const { safeDeadline, deadlineSeconds, DEFAULT_DEADLINE } = load("stores/settingsValidation.ts");

test("a stored fractional deadline falls back to 20 and seconds stay integral", () => {
  assert.equal(safeDeadline(4.1), DEFAULT_DEADLINE);
  assert.equal(safeDeadline("4.1"), DEFAULT_DEADLINE);
  assert.equal(safeDeadline(20), 20);
  assert.equal(safeDeadline(1), 1);
  assert.equal(safeDeadline(4000), 4000);
  assert.equal(safeDeadline(0), DEFAULT_DEADLINE);
  assert.equal(deadlineSeconds(20), 1200);
  assert.equal(deadlineSeconds(4.1), 246);
  assert.equal(typeof BigInt(deadlineSeconds(4.1)), "bigint");
});
