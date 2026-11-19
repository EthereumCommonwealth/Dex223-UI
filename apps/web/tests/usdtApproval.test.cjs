const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../hooks/useAllowance.ts"), "utf8");
const start = source.indexOf("const amountToApprove = customAmount || amountToCheck;");
const marker = source.lastIndexOf('addToast((e as any).toString(), "error");');
const retLine = "return { success: false as const };";
const ret = source.indexOf(retLine, marker);
const body = source.slice(start, source.indexOf("}", ret + retLine.length) + 1);
const { outputText } = ts.transpileModule(
  `async function writeTokenApprove(env, input) {
  const {
    amountToCheck, contractAddress, token, walletClient, address, chainId, publicClient,
    isAllowed, currentAllowanceData, gasLimit, addRecentTransaction, waitAndReFetch, addToast,
    USDT_ADDRESS_ERC_20, ERC20_ABI, getTransactionWithRetries, GasFeeModel,
    RecentTransactionTitleTemplate,
    stringifyObject, getAbiItem, formatUnits,
  } = env;
  const { customAmount, customGasSettings } = input;
  ${body}
}
module.exports = { writeTokenApprove };`,
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
);
const mod = { exports: {} };
new Function("require", "module", "exports", outputText)(require, mod, mod.exports);
const { writeTokenApprove } = mod.exports;

const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const SPENDER = "0x1111111111111111111111111111111111111111";
const ACCOUNT = "0x2222222222222222222222222222222222222222";
const tenUsdt = 10_000000n;

function harness({ allowance = 5_000000n, waitStatus = "success", failAt, address = USDT } = {}) {
  const writes = [];
  const waits = [];
  const simulations = [];
  const toasts = [];
  const env = {
    amountToCheck: tenUsdt,
    contractAddress: SPENDER,
    token: { address0: address, symbol: "USDT", decimals: 6, isNative: false },
    address: ACCOUNT,
    chainId: 1,
    isAllowed: false,
    currentAllowanceData: allowance,
    gasLimit: 62000n,
    USDT_ADDRESS_ERC_20: USDT,
    ERC20_ABI: [],
    GasFeeModel: { EIP1559: "eip1559" },
    RecentTransactionTitleTemplate: { APPROVE: "approve" },
    stringifyObject: (value) => value,
    getAbiItem: () => ({}),
    formatUnits: (value, decimals) => String(Number(value) / 10 ** decimals),
    getTransactionWithRetries: async () => ({ nonce: 1 }),
    addRecentTransaction: () => {},
    waitAndReFetch: () => {},
    addToast: (message) => toasts.push(String(message)),
    publicClient: {
      estimateContractGas: async () => 100000n,
      simulateContract: async (request) => {
        simulations.push(request.args[1]);
        return { request };
      },
      waitForTransactionReceipt: async ({ hash }) => {
        waits.push(hash);
        if (failAt === "timeout") throw new Error("timed out");
        return { status: waitStatus };
      },
      getTransaction: async () => ({ nonce: 1 }),
    },
    walletClient: {
      writeContract: async (request) => {
        writes.push({ amount: request.args[1], gas: request.gas, gasPrice: request.gasPrice });
        if (request.args[1] === 0n && failAt === "reject") {
          const error = new Error("User rejected the request");
          error.name = "UserRejectedRequestError";
          throw error;
        }
        return request.args[1] === 0n ? "0xreset" : "0xapprove";
      },
    },
  };
  return {
    writes,
    waits,
    simulations,
    toasts,
    run: (amount = tenUsdt) =>
      writeTokenApprove(env, { customAmount: amount, customGasSettings: { gasPrice: 1n } }),
  };
}

test("an existing USDT allowance is reset, mined, then approved for the shown amount", async () => {
  const { writes, waits, simulations, run } = harness();
  const result = await run();
  assert.deepEqual(result, { success: true, hash: "0xapprove" });
  assert.deepEqual(writes, [
    { amount: 0n, gas: 120000n, gasPrice: 1n },
    { amount: tenUsdt, gas: 120000n, gasPrice: 1n },
  ]);
  assert.deepEqual(waits, ["0xreset"]);
  assert.equal(simulations.length, 0);
});

test("a zero USDT allowance is one approval of the shown amount", async () => {
  const { writes, waits, run } = harness({ allowance: 0n });
  const result = await run();
  assert.deepEqual(result, { success: true, hash: "0xapprove" });
  assert.deepEqual(writes, [{ amount: tenUsdt, gas: 120000n, gasPrice: 1n }]);
  assert.equal(waits.length, 0);
});

test("a rejected, reverted, or timed-out USDT reset does not send the new approval", async () => {
  const rejected = harness({ failAt: "reject" });
  assert.equal((await rejected.run()).success, false);
  assert.equal(rejected.writes.length, 1);
  assert.equal(rejected.toasts.length, 0);

  const reverted = harness({ waitStatus: "reverted" });
  assert.equal((await reverted.run()).success, false);
  assert.equal(reverted.writes.length, 1);
  assert.equal(reverted.waits.length, 1);

  const timedOut = harness({ failAt: "timeout" });
  assert.equal((await timedOut.run()).success, false);
  assert.equal(timedOut.writes.length, 1);
  assert.equal(timedOut.toasts.length, 1);
});

test("another token keeps one simulated approval of the shown amount", async () => {
  const { writes, simulations, waits, run } = harness({
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  });
  const result = await run();
  assert.deepEqual(result, { success: true, hash: "0xapprove" });
  assert.deepEqual(simulations, [tenUsdt]);
  assert.equal(writes[0].amount, tenUsdt);
  assert.equal(waits.length, 0);
});
