import { Button } from "@/components/ui/Button";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import { ChainProgress } from "@/onboarding/context/OnboardingContext";
import { ChainInfo } from "@/web3/config/chain-registry";
import { LuChevronDown, LuChevronUp, LuRefreshCw } from "react-icons/lu";
import { FaWallet, FaPlus } from "react-icons/fa";
import { SetupStatusIcon } from "./SetupStatusIcon";
import {
  SETUP_STEPS,
  getChainProgress,
  hasChainSetupError,
  isChainSetupComplete,
  statusLabel,
} from "./walletSetupUtils";

interface WalletSetupProgressCardProps {
  chainsToSetup: ChainInfo[];
  progress: Record<string, ChainProgress>;
  isOnboarding: boolean;
  currentSigningChainName: string | null;
  isSetupExpanded: boolean;
  readyChainCount: number;
  allChainsReady: boolean;
  hasUnsavedChainSelection: boolean;
  isSavingChains: boolean;
  hasLinkedWallet: boolean;
  onToggleExpanded: () => void;
  onRetryChain: (chainId: string) => void;
  onRunSetup: () => void;
  onConnectWallet?: () => void;
  onCreateWallet?: () => void;
  walletsReady?: boolean;
  isCreatingWallet?: boolean;
}

export function WalletSetupProgressCard({
  chainsToSetup,
  progress,
  isOnboarding,
  currentSigningChainName,
  isSetupExpanded,
  readyChainCount,
  allChainsReady,
  hasUnsavedChainSelection,
  isSavingChains,
  hasLinkedWallet,
  onToggleExpanded,
  onRetryChain,
  onRunSetup,
  onConnectWallet,
  onCreateWallet,
  walletsReady = true,
  isCreatingWallet = false,
}: WalletSetupProgressCardProps) {
  const hasWalletNotConnectedError = chainsToSetup.some(
    (chain) => getChainProgress(progress, chain.id).error?.toLowerCase().includes("wallet not connected"),
  );
  return (
    <SimpleCard className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="space-y-1">
          <Typography variant="bodySmall" className="font-semibold text-foreground">
            Setup Progress
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            Mirrors onboarding setup: create Safe wallet, sign module, enable module, and verify.
          </Typography>
        </div>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="shrink-0 w-8 h-8 rounded-md border border-white/20 bg-white/5 hover:bg-white/10 hover:border-amber-600/40 transition-all duration-200 flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={isSetupExpanded ? "Collapse setup progress" : "Expand setup progress"}
        >
          {isSetupExpanded ? (
            <LuChevronUp className="w-4 h-4" />
          ) : (
            <LuChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {!isSetupExpanded ? (
        <div className="p-3 rounded-lg bg-white/5 border border-white/15">
          <Typography variant="caption" className="text-muted-foreground">
            {chainsToSetup.length === 0
              ? "No networks selected yet."
              : `${readyChainCount}/${chainsToSetup.length} network${chainsToSetup.length !== 1 ? "s" : ""} ready.`}
          </Typography>
        </div>
      ) : chainsToSetup.length === 0 ? (
        <div className="p-4 rounded-lg bg-white/5 border border-white/15 text-center">
          <Typography variant="caption" className="text-muted-foreground">
            Save your network selection to initialize setup.
          </Typography>
        </div>
      ) : (
        <div className="space-y-3">
          {chainsToSetup.map((chain) => {
            const chainProgress = getChainProgress(progress, chain.id);
            const hasError = hasChainSetupError(chainProgress);
            const isComplete = isChainSetupComplete(chainProgress);
            const completeCount = SETUP_STEPS.filter(
              (step) => chainProgress[step.key] === "success",
            ).length;
            const completionPercent = Math.round(
              (completeCount / SETUP_STEPS.length) * 100,
            );

            return (
              <div
                key={chain.id}
                className={`rounded-lg border p-4 transition-all duration-200 ${
                  isComplete
                    ? "border-emerald-400/60 bg-emerald-500/10"
                    : hasError
                      ? "border-destructive/50 bg-destructive/10"
                      : "border-white/15 bg-white/5 hover:bg-white/10 hover:border-amber-500/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                      {chain.name}
                    </Typography>
                    <Typography variant="caption" className="text-muted-foreground">
                      {completionPercent}% complete
                    </Typography>
                  </div>

                  {hasError && (
                    <Button
                      onClick={() => onRetryChain(chain.id)}
                      disabled={isOnboarding}
                      className="h-8 px-3 text-xs bg-white/10 hover:bg-white/20 border border-destructive/40 text-destructive disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <LuRefreshCw className="w-3 h-3" />
                      Retry
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {SETUP_STEPS.map((step) => (
                    <div key={`${chain.id}-${step.key}`} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <SetupStatusIcon status={chainProgress[step.key]} />
                        <Typography variant="caption" className="text-foreground text-xs">
                          {step.label}
                        </Typography>
                      </div>
                      <Typography variant="caption" className="text-muted-foreground text-[11px]">
                        {statusLabel(chainProgress[step.key])}
                      </Typography>
                    </div>
                  ))}
                </div>

                {chainProgress.error && (
                  <div className="mt-3 space-y-2">
                    <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20">
                      <Typography variant="caption" className="text-destructive text-[11px]">
                        {chainProgress.error}
                      </Typography>
                    </div>
                    {chainProgress.error.toLowerCase().includes("wallet not connected") &&
                      onConnectWallet &&
                      onCreateWallet && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={onConnectWallet}
                            disabled={!walletsReady}
                            className="gap-2 h-8 text-xs"
                          >
                            <FaWallet className="w-3 h-3" />
                            Connect wallet
                          </Button>
                          <Button
                            onClick={onCreateWallet}
                            disabled={!walletsReady || isCreatingWallet}
                            className="gap-2 h-8 text-xs bg-transparent hover:bg-white/10 border border-white/20"
                          >
                            <FaPlus className="w-3 h-3" />
                            {isCreatingWallet ? "Creating…" : "Create wallet"}
                          </Button>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}

          {!hasLinkedWallet && hasWalletNotConnectedError && onConnectWallet && onCreateWallet && (
            <div className="p-4 rounded-lg border-2 border-amber-500/40 bg-amber-500/10 space-y-3">
              <Typography variant="caption" className="text-foreground text-xs font-medium">
                Wallet required
              </Typography>
              <Typography variant="caption" className="text-muted-foreground text-[11px] block">
                Connect or create a wallet to initialize your Safe on the selected networks.
              </Typography>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onConnectWallet} disabled={!walletsReady} className="gap-2 h-9 text-xs">
                  <FaWallet className="w-3.5 h-3.5" />
                  Connect external wallet
                </Button>
                <Button
                  onClick={onCreateWallet}
                  disabled={!walletsReady || isCreatingWallet}
                  className="gap-2 h-9 text-xs bg-transparent hover:bg-white/10 border border-white/20"
                >
                  <FaPlus className="w-3.5 h-3.5" />
                  {isCreatingWallet ? "Creating…" : "Create embedded wallet"}
                </Button>
              </div>
            </div>
          )}

          {currentSigningChainName && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40">
              <Typography variant="caption" className="text-primary text-xs">
                Signature required on {currentSigningChainName}. Check your wallet prompt.
              </Typography>
            </div>
          )}

          <Button
            onClick={onRunSetup}
            disabled={
              isOnboarding ||
              allChainsReady ||
              hasUnsavedChainSelection ||
              isSavingChains
            }
            className="w-full h-10 text-sm mt-1 bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {allChainsReady
              ? "All selected networks are ready"
              : isOnboarding
                ? "Setting up..."
                : "Initialize Selected Networks"}
          </Button>

          {hasUnsavedChainSelection && (
            <Typography variant="caption" className="text-amber-500 text-xs">
              Save your updated network selection before running setup.
            </Typography>
          )}
        </div>
      )}
    </SimpleCard>
  );
}
