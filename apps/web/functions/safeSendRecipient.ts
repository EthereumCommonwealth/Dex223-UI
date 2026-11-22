/**
 * Safe Send recipient check (bounty #171).
 *
 * Asking a contract recipient's `tokenReceived` hook is not enough. DEX223's swap router, position
 * manager and margin module accept any ERC-223 transfer and record it as a deposit of `_from`, which
 * only `_from` can withdraw. On the ERC-223 path `_from` is the user, so the tokens become the user's
 * deposit in that contract instead of a payment. On the ERC-20 path SafeSendRouter makes the
 * transfer, so the deposit is recorded under the router, which cannot withdraw it: the tokens are
 * lost. The converter likewise sends the ERC-20 origin back to `_from`, which on the ERC-20 path is
 * the router again.
 *
 * This module has no runtime imports so the node tests can load it directly.
 */

type Address = `0x${string}`;
type Hex = `0x${string}`;

/** The parts of viem's public client the check uses. */
export interface RecipientCheckClient {
  getCode(args: { address: Address }): Promise<Hex | undefined>;
  simulateContract(args: {
    address: Address;
    abi: readonly unknown[];
    functionName: "tokenReceived";
    args: readonly [Address, bigint, Hex];
    account: Address;
  }): Promise<{ result: unknown }>;
  readContract(args: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: readonly [Address, Address];
  }): Promise<unknown>;
}

export type RecipientVerdict =
  /** A wallet, or a contract that accepts the token as a payment. */
  | "accepts"
  /** The hook reverts or answers anything but the ERC-223 selector. */
  | "rejects"
  /** The contract keeps ERC-223 transfers as deposits of whoever sent them. */
  | "keeps_deposit"
  /** The contract sends the tokens back to the sender, which on the ERC-20 path is the router. */
  | "returns_to_router";

export const TOKEN_RECEIVED_SELECTOR = "0x8943ec02";

const tokenReceivedAbi = [
  {
    type: "function",
    name: "tokenReceived",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_from", type: "address" },
      { name: "_value", type: "uint256" },
      { name: "_data", type: "bytes" },
    ],
    outputs: [{ type: "bytes4" }],
  },
] as const;

/**
 * Per-sender ERC-223 deposit getters: PeripheryPayments (swap router, position manager) and the
 * margin module. A contract that answers one of them keeps deposits per sender.
 */
const depositGetters = [
  { name: "depositedTokens", user: "_user", token: "_token" },
  { name: "erc223deposit", user: "user", token: "token" },
].map(({ name, user, token }) => ({
  name,
  abi: [
    {
      type: "function",
      name,
      stateMutability: "view",
      inputs: [
        { name: user, type: "address" },
        { name: token, type: "address" },
      ],
      outputs: [{ type: "uint256" }],
    },
  ] as const,
}));

export interface RecipientCheck {
  recipient: Address;
  /** The connected user. */
  user: Address;
  /** The ERC-223 version of the token; the hook is called as this token would call it. */
  token223: Address;
  value: bigint;
  data: Hex;
  /** True on the ERC-20 path, where SafeSendRouter makes the transfer to the recipient. */
  viaRouter: boolean;
  router: Address;
  /** DEX223 contracts on this chain that keep ERC-223 deposits per sender. */
  depositHolders?: readonly string[];
  /** DEX223 contracts on this chain that send what they receive back to the sender (converter). */
  returnsToSender?: readonly string[];
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export async function checkSafeSendRecipient(
  client: RecipientCheckClient,
  check: RecipientCheck,
): Promise<RecipientVerdict> {
  const { recipient, user, token223, value, data, viaRouter, router } = check;
  const code = await client.getCode({ address: recipient });
  if (!code || code === "0x") return "accepts";

  if (check.depositHolders?.some((address) => same(address, recipient))) return "keeps_deposit";
  if (viaRouter && check.returnsToSender?.some((address) => same(address, recipient))) {
    return "returns_to_router";
  }

  const sender = viaRouter ? router : user;
  for (const getter of depositGetters) {
    try {
      const deposit = await client.readContract({
        address: recipient,
        abi: getter.abi,
        functionName: getter.name,
        args: [sender, token223],
      });
      if (typeof deposit === "bigint") return "keeps_deposit";
    } catch {
      // Not a deposit getter of this contract.
    }
  }

  try {
    const { result } = await client.simulateContract({
      address: recipient,
      abi: tokenReceivedAbi,
      functionName: "tokenReceived",
      args: [sender, value, data],
      account: token223,
    });
    return result === TOKEN_RECEIVED_SELECTOR ? "accepts" : "rejects";
  } catch {
    return "rejects";
  }
}
