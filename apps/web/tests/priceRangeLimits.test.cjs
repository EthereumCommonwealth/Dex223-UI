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

const { displayedRangeLimits } = load("functions/priceRangeLimits.ts");

test("inverted range limits follow the displayed bound", () => {
  assert.deepEqual(displayedRangeLimits(false, true, true), {
    lowIsZero: true,
    highIsInfinity: true,
  });
  assert.deepEqual(displayedRangeLimits(true, true, true), {
    lowIsZero: true,
    highIsInfinity: true,
  });
  assert.deepEqual(displayedRangeLimits(false, true, false), {
    lowIsZero: true,
    highIsInfinity: false,
  });
  assert.deepEqual(displayedRangeLimits(true, true, false), {
    lowIsZero: false,
    highIsInfinity: true,
  });
});
