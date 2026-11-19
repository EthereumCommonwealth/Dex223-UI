// Onramp widget events are accepted only from the widget's origin (bounty #110). Runs the real
// Onramp SDK against a minimal window, so an SDK upgrade that moves the handler fails here.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const listeners = new Map();
globalThis.window = {
  addEventListener: (type, fn) => listeners.set(type, [...(listeners.get(type) || []), fn]),
  removeEventListener: (type, fn) =>
    listeners.set(
      type,
      (listeners.get(type) || []).filter((f) => f !== fn),
    ),
  dispatchEvent: () => true,
  location: { origin: "https://test-app.dex223.io" },
  innerHeight: 800,
};
// The constructor only adds a font link to the head.
globalThis.document = {
  querySelector: () => null,
  createElement: () => ({ setAttribute: () => {} }),
  head: { appendChild: () => {} },
};
globalThis.CustomEvent ??= class CustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
};

function loadEsm(filename) {
  const mod = { exports: {} };
  new Function(
    "module",
    "exports",
    "require",
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
  )(mod, mod.exports, require);
  return mod.exports;
}

// The package is "type": "module"; load its ES build the same way in every Node version.
const sdkPackage = path.dirname(require.resolve("@onramp.money/onramp-web-sdk/package.json"));
const { OnrampWebSDK } = loadEsm(
  path.join(sdkPackage, require(path.join(sdkPackage, "package.json")).module),
);

const file = path.resolve(__dirname, "../app/[locale]/buy-crypto/components/onrampMessages.ts");
const { guardOnrampWidgetMessages } = loadEsm(file);

function widget({ guard, sandbox = false }) {
  listeners.clear();
  const sdk = new OnrampWebSDK({ appId: 1, flowType: 1, sandbox });
  const received = [];
  sdk.on("TX_EVENTS", (e) => received.push(e.type));
  const guarded = guard ? guardOnrampWidgetMessages(sdk) : false;
  sdk._registerSDKEvents(); // what show() runs before it renders the widget
  const [onMessage] = listeners.get("message");
  const post = (origin) =>
    onMessage({
      origin,
      data: { eventData: { isOnramp: true, type: "ONRAMP_WIDGET_TX_COMPLETED" } },
    });
  return { sdk, received, guarded, post };
}

test("a forged completion from another origin is dropped", () => {
  const { received, guarded, post } = widget({ guard: true });
  assert.equal(guarded, true);
  post("https://attacker.example");
  post("null");
  assert.deepEqual(received, []);
});

test("the widget's own origin still reports transactions", () => {
  const { received, post } = widget({ guard: true });
  post("https://onramp.money");
  assert.deepEqual(received, ["ONRAMP_WIDGET_TX_COMPLETED"]);
});

test("the sandbox widget is trusted from its own origin only", () => {
  const { received, post } = widget({ guard: true, sandbox: true });
  post("https://onramp.money");
  post("https://test.onramp.money");
  assert.deepEqual(received, ["ONRAMP_WIDGET_TX_COMPLETED"]);
});

test("close() removes the guarded handler it registered", () => {
  const { sdk } = widget({ guard: true });
  sdk._teardownSDKEvents();
  assert.deepEqual(listeners.get("message"), []);
});

test("control: the SDK on its own accepts a completion from any origin", () => {
  const { received, post } = widget({ guard: false });
  post("https://attacker.example");
  assert.deepEqual(received, ["ONRAMP_WIDGET_TX_COMPLETED"]);
});

test("an SDK without the handler is reported, so completions are not trusted", () => {
  assert.equal(guardOnrampWidgetMessages({}), false);
});
