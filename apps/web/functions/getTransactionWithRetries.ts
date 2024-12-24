import { Address, PublicClient } from "viem";

type GetTransactionWithRetriesOptions = {
  hash: Address;
  publicClient: PublicClient; // Replace `any` with the actual type of your publicClient
  maxRetries?: number;
  delay?: number;
};

export async function getTransactionWithRetries({
  hash,
  publicClient,
  maxRetries = 10,
  delay = 500,
}: GetTransactionWithRetriesOptions): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const transaction = await publicClient.getTransaction({ hash });
      if (transaction) {
        return transaction;
      }
    } catch (err) {
      console.log(`Attempt ${attempt + 1}: Transaction not found yet.`);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Transaction not found after retries.");
}
