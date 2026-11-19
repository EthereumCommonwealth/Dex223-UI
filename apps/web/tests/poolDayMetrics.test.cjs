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

const { fees1d, volume1d } = load("app/[locale]/pools/poolMetrics.ts");

test("a day bucket older than yesterday is not 24h volume or fees", () => {
  const stale = [{ date: 1, volumeUSD: "100", feesUSD: "4" }];
  const fresh = [{ date: Math.floor(Date.now() / 1000), volumeUSD: "12", feesUSD: "1" }];
  assert.equal(volume1d(stale), 0);
  assert.equal(fees1d(stale), 0);
  assert.equal(volume1d(fresh), 12);
  assert.equal(fees1d(fresh), 1);
});
