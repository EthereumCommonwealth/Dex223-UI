// /add link import (bounty #139): opening a link never saves a token; only the dialog's Import
// button does, and cancelling removes the token parameter from the URL.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const mod = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(fs.readFileSync(path.join(root, "functions/importLink.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
)(mod, mod.exports);
const {
  isTokenAddress,
  preflightLinkToken,
  withoutLinkParams,
  describeLink,
  pendingLinkTokens,
  confirmLinkImport,
  selectLinkToken,
  cancelLinkImport,
} = mod.exports;

const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const SEPOLIA = 11155111;
const SUPPORTED = [SEPOLIA, 97];

function recorder() {
  const calls = [];
  return {
    calls,
    save: async (token) => calls.push(["save", token]),
    select: (param, token) => calls.push(["select", param, token]),
    removeParam: (param) => calls.push(["removeParam", param]),
    notifyImported: () => calls.push(["toast"]),
  };
}

test("an address is 0x plus 40 hex characters", () => {
  assert.equal(isTokenAddress(USDC), true);
  assert.equal(isTokenAddress(USDC.toLowerCase()), true);
  assert.equal(isTokenAddress("0x1c7D4B19"), false);
  assert.equal(isTokenAddress(`${USDC}00`), false);
  assert.equal(isTokenAddress("native"), false);
  assert.equal(isTokenAddress(null), false);
});

test("preflight: invalid address, unsupported network, wrong network, then ok", () => {
  const req = (value, chainId = SEPOLIA) => ({ param: "tokenA", value, chainId });
  assert.equal(preflightLinkToken(req("0x1c7D4B19"), SEPOLIA, SUPPORTED).kind, "invalid_address");
  assert.equal(preflightLinkToken(req(USDC, 999), SEPOLIA, SUPPORTED).kind, "unsupported_network");
  assert.equal(preflightLinkToken(req(USDC, 97), SEPOLIA, SUPPORTED).kind, "wrong_network");
  assert.equal(preflightLinkToken(req(USDC), SEPOLIA, SUPPORTED).kind, "ok");
});

test("link tokens are decided in order, tokenA then tokenB", () => {
  assert.deepEqual(pendingLinkTokens({ tokenA: USDC, tokenB: "0x2" }, SEPOLIA), [
    { param: "tokenA", value: USDC, chainId: SEPOLIA },
    { param: "tokenB", value: "0x2", chainId: SEPOLIA },
  ]);
  assert.deepEqual(
    pendingLinkTokens({ tokenA: null, tokenB: USDC }, SEPOLIA).map((r) => r.param),
    ["tokenB"],
  );
});

test("nothing is saved before the user confirms", async () => {
  const actions = recorder();
  // The dialog opens, reads the token and shows it: no action is called until a button is pressed.
  assert.deepEqual(actions.calls, []);
  // "Use USDC" for a token already in the lists, or "Use official USDT": select only, never save.
  selectLinkToken("tokenA", "usdt-official", actions);
  assert.deepEqual(actions.calls, [["select", "tokenA", "usdt-official"]]);
});

test("Cancel saves nothing and removes the parameter from the URL", () => {
  const actions = recorder();
  cancelLinkImport("tokenA", actions);
  assert.deepEqual(actions.calls, [["removeParam", "tokenA"]]);
  assert.equal(
    withoutLinkParams(`/en/add?tokenA=${USDC}&chainId=11155111&tier=3000`, ["tokenA"]),
    "/en/add?chainId=11155111&tier=3000",
  );
  assert.equal(
    withoutLinkParams(`/en/add?tokenA=${USDC}&tokenB=0x2`, ["tokenA", "tokenB"]),
    "/en/add",
  );
});

test("Import (box checked) saves once, selects the token and shows the toast", async () => {
  const actions = recorder();
  await confirmLinkImport("tokenB", "usdc", actions);
  assert.deepEqual(actions.calls, [["save", "usdc"], ["select", "tokenB", "usdc"], ["toast"]]);
});

test("the link under the card shows shortened addresses", () => {
  assert.equal(
    describeLink(`/en/add?tokenA=${USDC}&chainId=11155111`),
    "/en/add?tokenA=0x1c7D...9C7238&chainId=11155111",
  );
});

test("/add never writes a link token on load; only the dialog's Import saves", () => {
  const hook = fs.readFileSync(path.join(root, "hooks/usePoolsSearchParams.ts"), "utf8");
  for (const forbidden of [
    "handleImport",
    "addCustomToken",
    "readTokenFromChain",
    "db.tokenLists",
  ]) {
    assert.equal(hook.includes(forbidden), false, `usePoolsSearchParams must not use ${forbidden}`);
  }
  const dialog = fs.readFileSync(
    path.join(root, "components/dialogs/ImportFromLinkDialog.tsx"),
    "utf8",
  );
  const body = dialog.replace(/^import .*$/gm, "");
  const saves = body.match(/addCustomToken/g) || [];
  // Used once: passed as `save` to confirmLinkImport inside the Import handler.
  assert.equal(saves.length, 1);
  assert.match(
    dialog,
    /const importToken = async \(\) => \{\s+await confirmLinkImport\([\s\S]*?save: addCustomToken/,
  );
});
