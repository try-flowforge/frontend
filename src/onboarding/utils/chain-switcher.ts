// Chain Switcher Module to switch chain
import type { ConnectedWallet } from "@privy-io/react-auth";

// Ensure wallet is on the target chain, switch if needed
export async function ensureChainSelected(
  wallet: ConnectedWallet | null,
  targetChainId: number,
): Promise<void> {
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  const currentChainId = parseInt(wallet.chainId.split(":")[1] || "0");
  if (currentChainId === targetChainId) {
    return;
  }

  try {
    await wallet.switchChain(targetChainId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to switch to chain ${targetChainId}: ${message}`);
  }
}

// Wait for chain to be active
export async function waitForChain(
  getCurrentChainId: () => (number | null) | Promise<number | null>,
  targetChainId: number,
  timeoutMs: number = 3000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const currentChainId = await getCurrentChainId();

    if (currentChainId === targetChainId) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Timeout waiting for chain ${targetChainId} to become active`,
  );
}
