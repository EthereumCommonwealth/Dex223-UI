// Subgraph list fields default to 100 rows ordered by id (bounty #172): listing tokens past the
// 100th were dropped from the Core and Free lists, and a token's price froze at its 100th day.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const web = path.resolve(__dirname, "..");
const file = path.join(web, "functions/subgraphPages.ts");
const mod = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
)(mod, mod.exports);
const { collectPages, latestDayPrice, pricesByToken, SUBGRAPH_PAGE_SIZE } = mod.exports;

// A listing contract's rows as the subgraph serves them: by id, `first` rows from `skip`.
function listing(total) {
  const rows = Array.from({ length: total }, (_, i) => ({
    id: `row-${String(i).padStart(6, "0")}`,
  }));
  const reads = [];
  return {
    rows,
    reads,
    page: (skip, first = SUBGRAPH_PAGE_SIZE) => {
      reads.push(skip);
      return rows.slice(skip, skip + first);
    },
  };
}

test("every listed token is kept, past the first page", async () => {
  for (const total of [0, 1, 100, 101, 999, 1000, 1001, 2500, 3000]) {
    const l = listing(total);
    const all = await collectPages(l.page(0), total, async (skip) => l.page(skip));
    assert.equal(all.length, total, `total ${total}`);
    assert.deepEqual(all, l.rows);
  }
});

test("only the pages that are needed are read", async () => {
  const short = listing(150);
  await collectPages(short.page(0), 150, async (skip) => short.page(skip));
  assert.deepEqual(short.reads, [0]);

  const long = listing(2500);
  await collectPages(long.page(0), 2500, async (skip) => long.page(skip));
  assert.deepEqual(long.reads, [0, 1000, 2000]);
});

test("a total that is behind or ahead of the rows does not loop or drop rows", async () => {
  const l = listing(1200);
  // totalTokens says less than what is there: stop at the count the first pages cover.
  const behind = await collectPages(l.page(0), 1000, async (skip) => l.page(skip));
  assert.equal(behind.length, 1000);
  // totalTokens says more than what is there: stop at the short page.
  const ahead = await collectPages(l.page(0), 5000, async (skip) => l.page(skip));
  assert.equal(ahead.length, 1200);
  // A failed page read returns what was loaded.
  const failed = await collectPages(l.page(0), 1200, async () => undefined);
  assert.equal(failed.length, 1000);
});

test("the newest day price is taken, also after 100 active days", () => {
  // tokenDayData(first: 1, orderBy: date, orderDirection: desc): the newest row is first.
  assert.equal(latestDayPrice({ tokenDayData: [{ priceUSD: "2.5" }] }), "2.5");
  assert.equal(latestDayPrice({ tokenDayData: [] }), undefined);
  assert.equal(latestDayPrice(null), undefined);
});

test("one token without a day row does not stop the other prices from loading", () => {
  const prices = pricesByToken([
    { id: "0xa", tokenDayData: [{ priceUSD: "1.0001" }] },
    { id: "0xb", tokenDayData: [] }, // pool created, never funded
    { id: "0xc", tokenDayData: [{ priceUSD: 3200 }] },
  ]);
  assert.deepEqual(prices, { "0xa": 1.0001, "0xc": 3200 });
  assert.deepEqual(pricesByToken(undefined), {});
});

test("the queries ask for a page size instead of the default 100", () => {
  const read = (rel) => fs.readFileSync(path.join(web, rel), "utf8");
  const listingFiles = [
    "hooks/useInitializeDB.ts",
    "app/[locale]/token-listing/add/hooks/useAutoListingContracts.ts",
    "components/manage-tokens/ImportListWithContract.tsx",
  ];
  for (const rel of listingFiles) {
    const source = read(rel);
    assert.ok(!/\btokens\s*\{/.test(source), `${rel}: tokens without first`);
    assert.match(source, /tokens\(first: 1000/, rel);
  }
  const usd = read("hooks/useUSDPrice.ts");
  assert.ok(!/tokenDayData\s*\{/.test(usd), "useUSDPrice: tokenDayData without first");
  assert.ok(!/\btokens\s*\{/.test(usd), "useUSDPrice: tokens without first");
  assert.match(read("hooks/useInitializeDB.ts"), /collectPages\(/);
});
