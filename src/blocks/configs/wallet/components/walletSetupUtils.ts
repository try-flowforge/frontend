import {
  ChainProgress,
  OnboardingStepStatus,
} from "@/onboarding/context/OnboardingContext";

export type SetupStepKey =
  | "walletCreate"
  | "moduleSign"
  | "moduleEnable"
  | "moduleVerify";

export const DEFAULT_CHAIN_PROGRESS: ChainProgress = {
  walletCreate: "idle",
  moduleSign: "idle",
  moduleEnable: "idle",
  moduleVerify: "idle",
};

export const SETUP_STEPS: Array<{ key: SetupStepKey; label: string }> = [
  { key: "walletCreate", label: "Wallet creation" },
  { key: "moduleSign", label: "Sign module enable" },
  { key: "moduleEnable", label: "Enable module" },
  { key: "moduleVerify", label: "Verify module status" },
];

export function statusLabel(status: OnboardingStepStatus): string {
  if (status === "success") return "Done";
  if (status === "pending") return "In progress";
  if (status === "error") return "Failed";
  return "Pending";
}

export function getChainProgress(
  progressMap: Record<string, ChainProgress>,
  chainId: string,
): ChainProgress {
  return progressMap[chainId] || DEFAULT_CHAIN_PROGRESS;
}

export function isChainSetupComplete(chainProgress: ChainProgress): boolean {
  return (
    chainProgress.walletCreate === "success" &&
    chainProgress.moduleSign === "success" &&
    chainProgress.moduleEnable === "success" &&
    chainProgress.moduleVerify === "success"
  );
}

export function hasChainSetupError(chainProgress: ChainProgress): boolean {
  return (
    chainProgress.walletCreate === "error" ||
    chainProgress.moduleSign === "error" ||
    chainProgress.moduleEnable === "error" ||
    chainProgress.moduleVerify === "error"
  );
}
