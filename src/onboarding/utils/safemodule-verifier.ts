// Check for on-chain module verification with retry logic
import { ethers } from "ethers";
import SafeArtifact from "@/web3/artifacts/Safe.json";
import { getContractAddress } from "@/web3/config/contract-registry";

// Verify that module is enabled for a Safe (with retry logic)
export async function verifyModuleEnabled(
  safeAddress: string,
  identifier: string | number,
  provider: ethers.Eip1193Provider,
  maxRetries: number = 3,
  delayMs: number = 2000,
): Promise<boolean> {
  const moduleAddress = getContractAddress(identifier, "safeModule");

  if (!moduleAddress) {
    throw new Error(`Module address not configured for chain ${identifier}`);
  }

  const ethersProvider = new ethers.BrowserProvider(provider);
  const safeContract = new ethers.Contract(
    safeAddress,
    SafeArtifact.abi,
    ethersProvider,
  );

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const isEnabled: boolean =
        await safeContract.isModuleEnabled(moduleAddress);

      if (isEnabled) return true;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Wait and retry
    if (attempt < maxRetries - 1) {
      const waitTime = delayMs * Math.pow(1.5, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(
    `Failed to verify module status after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`,
  );
}
