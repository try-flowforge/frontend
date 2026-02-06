/**
 * Onboarding Module
 * Centralized Safe wallet onboarding orchestration
 */

export {
  fetchBackendRuntimeConfig,
  getOnboardingChains,
  validateAndGetOnboardingChains,
  type BackendRuntimeConfig,
} from "./config";

export { ensureChainSelected, waitForChain } from "./chain-switcher";

export { verifyModuleEnabled } from "./safemodule-verifier";
