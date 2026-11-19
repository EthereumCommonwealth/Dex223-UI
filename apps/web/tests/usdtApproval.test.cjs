const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const viem = require("viem");

const root = path.resolve(__dirname, "..");
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const spender = "0x2222222222222222222222222222222222222222";
const account = "0x3333333333333333333333333333333333333333";
const tenUsdt = 10_000000n;
const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);

function compile(source) {
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}

function expression(file, find) {
  const filename = path.join(root, file);
  const source = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  let found;
  function visit(node) {
    if (find(node)) found = node;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(found, `Missing expression in ${file}`);
  return found;
}

function callback(file, name, dependencies) {
  const declaration = expression(
    file,
    (node) => ts.isVariableDeclaration(node) && node.name.getText() === name,
  );
  const fn = declaration.initializer.arguments[0];
  return new Function(...Object.keys(dependencies), compile(`return (${fn.getText()});`))(
    ...Object.values(dependencies),
  );
}

function harness({
  tokenAddress = USDT,
  allowance = 1n,
  amount = tenUsdt,
  isAllowed = false,
  estimateFails = false,
  receiptStatus = "success",
  waitThrows = false,
  rejectZero = false,
  symbol = "USDT",
  decimals = 6,
} = {}) {
  const calls = [];
  const toasts = [];
  const recent = [];
  let writes = 0;
  const walletClient = {
    writeContract: async (tx) => {
      if (rejectZero && tx.args[1] === 0n) {
        const error = new Error("User rejected the request");
        error.name = "UserRejectedRequestError";
        throw error;
      }
      writes += 1;
      const hash = `0x${writes.toString(16).padStart(64, "0")}`;
      calls.push({
        op: "write",
        amount: tx.args[1],
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        hash,
        account: tx.account,
      });
      return hash;
    },
  };
  const publicClient = {
    estimateContractGas: async (tx) => {
      calls.push({ op: "estimate", amount: tx.args[1] });
      if (estimateFails) throw new Error("estimate failed");
      return 100000n;
    },
    waitForTransactionReceipt: async ({ hash }) => {
      calls.push({ op: "wait", hash });
      if (waitThrows) throw new Error("receipt timeout");
      return { status: receiptStatus };
    },
    simulateContract: async (tx) => {
      calls.push({ op: "simulate", amount: tx.args[1], gasPrice: tx.gasPrice });
      return {
        request: {
          address: tx.address,
          abi: tx.abi,
          functionName: tx.functionName,
          args: tx.args,
          gas: tx.gas,
          gasPrice: tx.gasPrice,
        },
      };
    },
    getTransaction: async () => ({ nonce: 4 }),
  };
  const dependencies = {
    amountToCheck: amount,
    contractAddress: spender,
    token: { isNative: false, address0: tokenAddress, decimals, symbol, logoURI: "" },
    walletClient,
    address: account,
    chainId: 1,
    publicClient,
    gasLimit: 62000n,
    isAllowed,
    currentAllowanceData: allowance,
    addRecentTransaction: (tx) => recent.push(tx),
    waitAndReFetch: async (hash) => {
      calls.push({ op: "refetch", hash });
    },
    formatUnits: viem.formatUnits,
    getAbiItem: viem.getAbiItem,
    ERC20_ABI: [],
    USDT_ADDRESS_ERC_20: USDT,
    getTransactionWithRetries: async () => ({ nonce: 4 }),
    addToast: (...args) => toasts.push(args),
    GasFeeModel: { EIP1559: "EIP1559" },
    RecentTransactionTitleTemplate: { APPROVE: "approve" },
    stringifyObject: (value) => value,
  };
  const approve = callback("hooks/useAllowance.ts", "writeTokenApprove", dependencies);
  return {
    run: (customAmount = amount, customGasSettings) => approve({ customAmount, customGasSettings }),
    calls,
    recent,
    toasts,
  };
}

test("an existing USDT allowance is cleared and mined before the shown amount is approved", async () => {
  const flow = harness({ allowance: 5_000000n });
  const result = await flow.run(tenUsdt, { gasPrice: 9n });
  const writes = flow.calls.filter((call) => call.op === "write");

  assert.deepEqual(
    flow.calls.map((call) => call.op),
    ["estimate", "write", "wait", "estimate", "write", "refetch"],
  );
  assert.equal(writes[0].amount, 0n);
  assert.equal(writes[0].gas, 120000n);
  assert.equal(flow.calls[2].hash, writes[0].hash);
  assert.equal(writes[1].amount, tenUsdt);
  assert.notEqual(writes[1].amount, maxSafe);
  assert.equal(writes[1].gasPrice, 9n);
  assert.equal(writes[1].account, undefined);
  assert.deepEqual(result, { success: true, hash: writes[1].hash });
  assert.equal(flow.recent[0].title.amount, "10");
  assert.equal(
    flow.calls.some((call) => call.op === "simulate"),
    false,
  );
});

test("USDT with no allowance approves only the shown amount", async () => {
  const flow = harness({ allowance: 0n });
  const result = await flow.run();
  const writes = flow.calls.filter((call) => call.op === "write");

  assert.equal(writes.length, 1);
  assert.equal(writes[0].amount, tenUsdt);
  assert.equal(
    flow.calls.some((call) => call.op === "wait" || call.op === "simulate"),
    false,
  );
  assert.equal(result.success, true);
  assert.equal(result.hash, writes[0].hash);
});

test("a checksum-insensitive USDT address still resets a non-zero allowance", async () => {
  const flow = harness({ tokenAddress: USDT.toLowerCase(), allowance: 1n });
  await flow.run();
  const writes = flow.calls.filter((call) => call.op === "write");
  assert.deepEqual(
    writes.map((call) => call.amount),
    [0n, tenUsdt],
  );
});

test("a reverted or rejected USDT reset does not send the new approval", async (t) => {
  t.mock.method(console, "log", () => {});

  const reverted = harness({ allowance: 1n, receiptStatus: "reverted" });
  assert.deepEqual(await reverted.run(), { success: false });
  assert.deepEqual(
    reverted.calls.filter((call) => call.op === "write").map((call) => call.amount),
    [0n],
  );
  assert.equal(reverted.recent.length, 0);
  assert.equal(reverted.toasts.length, 0);

  const rejected = harness({ allowance: 1n, rejectZero: true });
  assert.deepEqual(await rejected.run(), { success: false });
  assert.equal(
    rejected.calls.some((call) => call.op === "write"),
    false,
  );
  assert.equal(rejected.toasts.length, 0);

  const timedOut = harness({ allowance: 1n, waitThrows: true });
  assert.deepEqual(await timedOut.run(), { success: false });
  assert.deepEqual(
    timedOut.calls.filter((call) => call.op === "write").map((call) => call.amount),
    [0n],
  );
  assert.equal(timedOut.toasts.length, 1);
});

test("other tokens still approve the shown amount in one simulated transaction", async () => {
  const flow = harness({ tokenAddress: USDC, allowance: 5n, symbol: "USDC" });
  const result = await flow.run(tenUsdt, { gasPrice: 9n });
  const writes = flow.calls.filter((call) => call.op === "write");

  assert.equal(
    flow.calls.some((call) => call.op === "wait"),
    false,
  );
  assert.equal(flow.calls.find((call) => call.op === "simulate").amount, tenUsdt);
  assert.equal(flow.calls.find((call) => call.op === "simulate").gasPrice, 9n);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].amount, tenUsdt);
  assert.equal(writes[0].gasPrice, 9n);
  assert.deepEqual(result, { success: true, hash: writes[0].hash });
  assert.equal(flow.recent[0].title.amount, "10");
});

test("an already sufficient allowance is not reset when approve is called again", async () => {
  const flow = harness({ allowance: 20_000000n, isAllowed: true });
  await flow.run(tenUsdt);
  const writes = flow.calls.filter((call) => call.op === "write");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].amount, tenUsdt);
  assert.equal(
    flow.calls.some((call) => call.op === "wait"),
    false,
  );
});

test("an estimate failure still asks the wallet for the shown USDT amount", async () => {
  const flow = harness({ allowance: 0n, estimateFails: true });
  await flow.run();
  const write = flow.calls.find((call) => call.op === "write");
  assert.equal(write.amount, tenUsdt);
  assert.equal(write.gas, 62000n);
});
