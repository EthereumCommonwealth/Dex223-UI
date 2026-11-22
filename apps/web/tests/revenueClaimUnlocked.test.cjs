// Revenue claims are not lock-gated (bounty #167). RevenueV2.claim() has no unlock_time check: the
// lock that stake() sets for claim_delay gates withdraw, withdraw_all and emergency_withdraw only.
// RevenueV1 did lock claim ("Claim locked."), which is where the old UI gate came from.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const revenue = path.resolve(__dirname, "../app/[locale]/revenue");
const read = (file) => fs.readFileSync(path.join(revenue, file), "utf8");

// The claim entry points: the rewards table (desktop and mobile) and both claim dialogs.
const CLAIM_FILES = [
  "components/Claims/index.tsx",
  "dialogs/SingleClaimDialog.tsx",
  "dialogs/MultipleClaimDialog.tsx",
];

// Anything that ties a claim to the stake lock.
const LOCK_GATES = [
  /\bcanUnstake\b/,
  /\bunstakeCountdown\b/,
  /\bclaimLocked\b/,
  /["']claim_locked["']/,
  /["']rewards_locked["']/,
  /["']claims_locked_for["']/,
  /Rewards stay locked/,
];

test("no claim entry point waits for the stake lock", () => {
  for (const file of CLAIM_FILES) {
    const source = read(file);
    for (const gate of LOCK_GATES) {
      assert.ok(!gate.test(source), `${file} still uses ${gate}`);
    }
  }
});

test("the claim buttons are only disabled for reasons the contract or wallet enforces", () => {
  for (const file of ["dialogs/SingleClaimDialog.tsx", "dialogs/MultipleClaimDialog.tsx"]) {
    assert.match(read(file), /disabled=\{cannotReceive\}/, file);
  }
});

test("unstake still waits for the lock, as withdraw does on chain", () => {
  const page = read("revenue.tsx");
  assert.match(page, /disabled=\{!canUnstake \|\| !hasStaked \|\| !!searchAddress\}/);
});

test("the page talks to RevenueV2, whose claim takes the reward token list", () => {
  const abi = fs.readFileSync(path.resolve(__dirname, "../config/abis/revenue.ts"), "utf8");
  assert.match(abi, /name: "claim"/);
  assert.match(abi, /name: "unlock_time"/);
});
