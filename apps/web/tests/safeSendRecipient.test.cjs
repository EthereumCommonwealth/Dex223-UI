// Safe Send recipient check (bounty #171): the swap router and the position manager accept any
// ERC-223 transfer but keep it as a deposit of the sender. On the ERC-20 path the sender is
// SafeSendRouter, which cannot withdraw it, so the page must refuse them.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const file = path.resolve(__dirname, "../functions/safeSendRecipient.ts");
const mod = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
)(mod, mod.exports);
const { checkSafeSendRecipient, TOKEN_RECEIVED_SELECTOR } = mod.exports;

// Sepolia addresses from sdk_bi/addresses.ts and send/config.ts.
const SWAP_ROUTER = "0x6812B2784111B8b674773CC0F32b8a480563E71b";
const POSITION_MANAGER = "0x461AFb20bB4b8f330608Ea582E13B1a6A749A4D0";
const MARGIN = "0x05860334EAC4915fa678FCFa3e012d8c79641D18";
const CONVERTER = "0x5847f5C0E09182d9e75fE8B1617786F62fee0D9F";
const SAFE_SEND_ROUTER = "0x7b58D9B037C4AC84eE06208Bc0fF95Ba9b84AC7e";
const USER = "0x00000000000000000000000000000000000000aa";
const TOKEN223 = "0x4f7d649dd8026EBB42DFe161DB065DD7c8a8d711";
const WALLET = "0x00000000000000000000000000000000000000bb";
const MERCHANT = "0x32480C1Edc5e51eca39FfF766cDdd9087DfC34E9"; // PaymentReceiver
const OTHER_DEPOSITOR = "0x00000000000000000000000000000000000000cc"; // a PeripheryPayments fork
const REJECTER = "0x00000000000000000000000000000000000000dd";

/**
 * A chain where every contract's hook answers the ERC-223 selector for any sender, as the swap
 * router and the position manager do. `getters` lists the contracts with a deposit getter.
 */
function chain({ getters = {}, rejects = [] } = {}) {
  const calls = [];
  const client = {
    async getCode({ address }) {
      return address === WALLET ? "0x" : "0x6080";
    },
    async readContract({ address, functionName, args }) {
      calls.push({ kind: "read", address, functionName, args });
      if (getters[address] === functionName) return 0n;
      throw new Error("execution reverted");
    },
    async simulateContract({ address, args, account }) {
      calls.push({ kind: "hook", address, args, account });
      if (rejects.includes(address)) throw new Error("execution reverted");
      return { result: TOKEN_RECEIVED_SELECTOR };
    },
  };
  return { client, calls };
}

const check = (client, recipient, viaRouter) =>
  checkSafeSendRecipient(client, {
    recipient,
    user: USER,
    token223: TOKEN223,
    value: 100n,
    data: "0x",
    viaRouter,
    router: SAFE_SEND_ROUTER,
    depositHolders: [SWAP_ROUTER, POSITION_MANAGER, MARGIN],
    returnsToSender: [CONVERTER],
  });

test("the swap router, position manager and margin module are refused on both paths", async () => {
  const { client } = chain();
  for (const recipient of [SWAP_ROUTER, POSITION_MANAGER, MARGIN, POSITION_MANAGER.toLowerCase()]) {
    assert.equal(await check(client, recipient, true), "keeps_deposit", `${recipient} ERC-20`);
    assert.equal(await check(client, recipient, false), "keeps_deposit", `${recipient} ERC-223`);
  }
});

test("a contract with a per-sender deposit getter is refused even when not in the list", async () => {
  for (const getter of ["depositedTokens", "erc223deposit"]) {
    const { client, calls } = chain({ getters: { [OTHER_DEPOSITOR]: getter } });
    assert.equal(await check(client, OTHER_DEPOSITOR, true), "keeps_deposit", getter);
    // On the ERC-20 path the deposit would be recorded under SafeSendRouter.
    const read = calls.find((call) => call.kind === "read" && call.functionName === getter);
    assert.deepEqual(read.args, [SAFE_SEND_ROUTER, TOKEN223]);
  }
});

test("the converter is refused on the ERC-20 path only", async () => {
  const { client } = chain();
  assert.equal(await check(client, CONVERTER, true), "returns_to_router");
  // On the ERC-223 path the converter sends the ERC-20 back to the user.
  assert.equal(await check(client, CONVERTER, false), "accepts");
});

test("wallets and a merchant contract that accepts the token still pass", async () => {
  const { client, calls } = chain();
  assert.equal(await check(client, WALLET, true), "accepts");
  assert.equal(await check(client, MERCHANT, false), "accepts");
  assert.equal(await check(client, MERCHANT, true), "accepts");
  // The hook is asked about the sender the token will report: the router on the ERC-20 path.
  const hooks = calls.filter((call) => call.kind === "hook");
  assert.equal(hooks[0].args[0], USER);
  assert.equal(hooks[1].args[0], SAFE_SEND_ROUTER);
  assert.ok(hooks.every((call) => call.account === TOKEN223));
});

test("a contract whose hook reverts or answers something else is refused", async () => {
  const { client } = chain({ rejects: [REJECTER] });
  assert.equal(await check(client, REJECTER, false), "rejects");

  const odd = chain().client;
  odd.simulateContract = async () => ({ result: "0x12345678" });
  assert.equal(await check(odd, MERCHANT, false), "rejects");
});
