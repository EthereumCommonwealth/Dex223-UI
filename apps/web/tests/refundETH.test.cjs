// Calls that send native ETH end with refundETH() (bounty #106, #107): the router and the position
// manager wrap only the ETH a swap or mint uses, and refundETH() pays the contract's whole ETH
// balance to any caller, so the unused ETH must come back in the same transaction.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const { test } = require("node:test");
const ts = require("typescript");
const viem = require("viem");

const root = path.resolve(__dirname, "..");

function compile(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
}

function load(file, mocks = {}) {
  const filename = path.join(root, file);
  const module = { exports: {} };
  const requireReal = createRequire(filename);
  new Function("require", "module", "exports", compile(fs.readFileSync(filename, "utf8")))(
    (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      const local = name.startsWith("@/")
        ? path.join(root, name.slice(2))
        : name.startsWith(".")
          ? path.resolve(path.dirname(filename), name)
          : null;
      if (local) {
        for (const candidate of [
          `${local}.ts`,
          `${local}.tsx`,
          path.join(local, "index.ts"),
          local,
        ]) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return load(path.relative(root, candidate), mocks);
          }
        }
      }
      return requireReal(name);
    },
    module,
    module.exports,
  );
  return module.exports;
}

const SEPOLIA = 11155111;
const USER = "0x00000000000000000000000000000000000000aa";
const WETH = "0x00000000000000000000000000000000000000e1";
const TOKEN = "0x00000000000000000000000000000000000000f2";
const REFUND_SELECTOR = viem.toFunctionSelector("refundETH()");

const { ROUTER_ABI } = load("config/abis/router.ts");
const { NONFUNGIBLE_POSITION_MANAGER_ABI } = load("config/abis/nonfungiblePositionManager.ts");
const { ROUTER_ADDRESS, NONFUNGIBLE_POSITION_MANAGER_ADDRESS } = load("sdk_bi/addresses.ts");
const { REFUND_ETH_CALLDATA, withRefundETH } = load("functions/refundETH.ts");

function token(address, { isNative = false } = {}) {
  const wrapped = {
    address0: address,
    address1: address,
    decimals: 18,
    symbol: "T",
    equals: (other) => (other.wrapped ?? other).address0 === address,
    sortsBefore: (other) => address.toLowerCase() < other.address0.toLowerCase(),
  };
  const self = { isNative, decimals: 18, symbol: "T", wrapped, address0: address };
  self.equals = (other) => other === self;
  return self;
}

const hooks = {
  react: {
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useEffect: () => {},
  },
  wagmi: {
    useAccount: () => ({ address: USER }),
    usePublicClient: () => ({}),
    useWalletClient: () => ({ data: {} }),
  },
  "next-intl": { useTranslations: () => (key) => key },
  "@/hooks/useCurrentChainId": { default: () => SEPOLIA, __esModule: true },
  "@/hooks/useTransactionDeadline": { default: () => BigInt(2_000_000_000), __esModule: true },
  "@/hooks/useDeepEffect": { default: () => {}, __esModule: true },
  "@/hooks/useAllowance": { useStoreAllowance: () => ({ isAllowed: true }) },
  "@/other/toast": { default: () => {}, __esModule: true },
  "@/stores/useRecentTransactionsStore": {
    useRecentTransactionsStore: () => ({}),
    stringifyObject: (o) => o,
    RecentTransactionTitleTemplate: {},
  },
  "@/stores/useConfirmInWalletAlertStore": { useConfirmInWalletAlertStore: () => ({}) },
  "@/stores/usePoolsStore": { _usePoolsStore: () => ({}) },
  "@/shared/hooks/useGlobalFees": { useGlobalFees: () => ({}) },
  "@/shared/hooks/useGlobalBlockNumber": { useGlobalBlockNumber: () => ({}) },
  "@/stores/useTransactionSettingsStore": {
    useTransactionSettingsStore: () => ({ slippage: 0.5, deadline: 20 }),
  },
};

function loadSwapParams({ tokenA, tokenB }) {
  const { useSwapParams } = load("app/[locale]/swap/hooks/useSwap.tsx", {
    ...hooks,
    "@/app/[locale]/swap/hooks/useTrade": { useTrade: () => ({}) },
    "@/app/[locale]/swap/lib/readSwapReceipt": {},
    "@/app/[locale]/swap/stores/useSwapAmountsStore": {
      useSwapAmountsStore: () => ({ typedValue: "20" }),
    },
    "@/app/[locale]/swap/stores/useSwapGasSettings": {},
    "@/app/[locale]/swap/stores/useSwapSettingsStore": {
      useSwapSettingsStore: () => ({ slippage: 0.5, deadline: 20 }),
    },
    "@/app/[locale]/swap/stores/useSwapStatusStore": {},
    "@/app/[locale]/swap/stores/useSwapTokensStore": {
      useSwapTokensStore: () => ({
        tokenA,
        tokenB,
        tokenAStandard: "ERC-20",
        tokenBStandard: "ERC-20",
      }),
    },
    "@/sdk_bi/utils/computePoolAddress": {
      useComputePoolAddressDex: () => ({
        poolAddress: "0x0000000000000000000000000000000000000001",
      }),
    },
  });
  const trade = {
    outputAmount: {},
    swaps: [{ route: { pools: [{ fee: 3000 }] } }],
    minimumAmountOut: () => ({ quotient: { toString: () => "5" } }),
  };
  return useSwapParams({ trade }).swapParams;
}

function loadAddLiquidityParams({ nativeSide, increase, createPool }) {
  const token0 = token(WETH, { isNative: nativeSide === 0 });
  const token1 = token(TOKEN, { isNative: nativeSide === 1 });
  const { useAddLiquidityParams } = load("app/[locale]/add/hooks/useAddLiquidity.ts", {
    ...hooks,
    "@/app/[locale]/add/hooks/useERC20WrapperExists": { default: () => ({}), __esModule: true },
    "@/app/[locale]/add/stores/useAddLiquidityAmountsStore": {
      useLiquidityAmountsStore: () => ({}),
    },
    "@/app/[locale]/add/stores/useAddLiquidityTokensStore": {
      useAddLiquidityTokensStore: () => ({ tokenA: token0, tokenB: token1 }),
    },
    "@/app/[locale]/create-token/stores/useCreateTokenStatusStore": { CreateTokenStatus: {} },
    "../stores/useAddLiquidityGasSettings": {},
    "../stores/useAddLiquidityStatusStore": {},
    "./useSortedTokens": { useSortedTokens: () => ({ token0, token1 }) },
  });
  const position = {
    tickLower: -600,
    tickUpper: 600,
    mintAmounts: { amount0: BigInt(10e18), amount1: BigInt(7e18) },
    mintAmountsWithSlippage: () => ({ amount0: BigInt(9e18), amount1: BigInt(6e18) }),
    pool: { token0, token1, fee: 3000, sqrtRatioX96: BigInt(2) ** BigInt(96) },
  };
  return useAddLiquidityParams({
    position,
    increase,
    createPool,
    tokenId: increase ? "7" : undefined,
  }).addLiquidityParams;
}

function decodeCalls(abi, calls) {
  return calls.map((data) =>
    data === REFUND_ETH_CALLDATA
      ? "refundETH"
      : viem.decodeFunctionData({ abi, data }).functionName,
  );
}

test("refundETH calldata is the refundETH() selector both contracts expose", () => {
  assert.equal(REFUND_ETH_CALLDATA, REFUND_SELECTOR);
  for (const abi of [ROUTER_ABI, NONFUNGIBLE_POSITION_MANAGER_ABI]) {
    const refund = abi.find((item) => item.name === "refundETH");
    const multicall = abi.find((item) => item.name === "multicall");
    assert.equal(refund?.stateMutability, "payable");
    assert.equal(multicall?.stateMutability, "payable");
  }
  const calls = ["0x01", "0x02"];
  assert.deepEqual(withRefundETH(calls), ["0x01", "0x02", REFUND_SELECTOR]);
  assert.deepEqual(calls, ["0x01", "0x02"], "input is not mutated");
});

test("a native-ETH swap is a router multicall that ends with refundETH", () => {
  const params = loadSwapParams({ tokenA: token(WETH, { isNative: true }), tokenB: token(TOKEN) });
  assert.equal(params.address, ROUTER_ADDRESS[SEPOLIA]);
  assert.equal(params.functionName, "multicall");
  assert.equal(params.value, viem.parseUnits("20", 18));
  assert.deepEqual(decodeCalls(ROUTER_ABI, params.args[0]), ["exactInputSingle", "refundETH"]);
  const swap = viem.decodeFunctionData({ abi: ROUTER_ABI, data: params.args[0][0] });
  assert.equal(swap.args[0].amountIn, params.value);
  assert.equal(swap.args[0].recipient.toLowerCase(), USER);
});

test("control: an ERC-20 swap sends no ETH and needs no refund", () => {
  const params = loadSwapParams({ tokenA: token(TOKEN), tokenB: token(WETH) });
  assert.equal(params.functionName, "exactInputSingle");
  assert.equal(params.value, undefined);
});

for (const [label, opts, expected] of [
  ["mint", {}, ["mint", "refundETH"]],
  ["increaseLiquidity", { increase: true }, ["increaseLiquidity", "refundETH"]],
  [
    "create and mint",
    { createPool: true },
    ["createAndInitializePoolIfNecessary", "mint", "refundETH"],
  ],
]) {
  for (const nativeSide of [0, 1]) {
    test(`${label} with native token${nativeSide} ends with refundETH`, () => {
      const params = loadAddLiquidityParams({ nativeSide, ...opts });
      assert.equal(params.address, NONFUNGIBLE_POSITION_MANAGER_ADDRESS[SEPOLIA]);
      assert.equal(params.functionName, "multicall");
      assert.equal(params.value, nativeSide === 0 ? BigInt(10e18) : BigInt(7e18));
      assert.deepEqual(decodeCalls(NONFUNGIBLE_POSITION_MANAGER_ABI, params.args[0]), expected);
    });
  }
}

test("control: adding liquidity without native ETH keeps the direct call and sends no ETH", () => {
  assert.equal(loadAddLiquidityParams({ nativeSide: -1 }).functionName, "mint");
  assert.equal(
    loadAddLiquidityParams({ nativeSide: -1, increase: true }).functionName,
    "increaseLiquidity",
  );
  const create = loadAddLiquidityParams({ nativeSide: -1, createPool: true });
  assert.deepEqual(decodeCalls(NONFUNGIBLE_POSITION_MANAGER_ABI, create.args[0]), [
    "createAndInitializePoolIfNecessary",
    "mint",
  ]);
  assert.equal(create.value, undefined);
});
