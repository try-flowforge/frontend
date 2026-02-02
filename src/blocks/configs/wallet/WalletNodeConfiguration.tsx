"use client";

import { Typography } from "@/components/ui/Typography";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSafeWalletContext } from "@/contexts/SafeWalletContext";
import {
  LuCircleCheck,
  LuCircleX,
  LuLoader,
} from "react-icons/lu";
import { HiCog } from "react-icons/hi2";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Dropdown } from "@/components/ui/Dropdown";
import { AuthenticationStatus } from "@/components/workspace/AuthenticationStatus";

function WalletNodeConfigurationInner() {
  const { wallets } = useWallets();
  const { authenticated } = usePrivy();
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const isConnected = authenticated && embeddedWallet !== undefined;
  const address = embeddedWallet?.address;
  const { selection, creation } = useSafeWalletContext();

  if (!isConnected) {
    return <AuthenticationStatus />;
  }

  return (
    <div className="space-y-4">
      {/* Section A: Safe Wallet Info (shown after connect) */}
      {isConnected && address && (
        <SimpleCard className="p-5">
          <div className="space-y-1 mb-4">
            <Typography
              variant="h5"
              className="font-semibold text-foreground"
            >
              Safe Wallet
            </Typography>
            <Typography
              variant="bodySmall"
              className="text-muted-foreground"
            >
              Multi-signature wallet for secure transaction execution
            </Typography>
          </div>

          {/* Loading state */}
          {selection.isLoading && (
            <div className="flex items-center justify-center py-6">
              <LuLoader className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading safes...
              </span>
            </div>
          )}

          {/* Error state */}
          {selection.error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <Typography variant="caption" className="text-destructive">
                {selection.error}
              </Typography>
            </div>
          )}

          {/* Safe wallet info */}
          {!selection.isLoading && !selection.error && (
            <div className="space-y-3">
              {selection.safeWallets.length > 0 ? (
                <>
                  <Dropdown
                    value={selection.selectedSafe || ""}
                    onChange={(e) =>
                      selection.selectSafe(e.target.value || null)
                    }
                    placeholder="Select a Safe wallet..."
                    aria-label="Select Safe wallet"
                    options={selection.safeWallets.map((safe) => ({
                      value: safe,
                      label: `${safe.slice(0, 10)}...${safe.slice(-4)}`,
                    }))}
                  />
                  {selection.selectedSafe && (
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                      <Typography variant="caption" className="text-muted-foreground text-xs mb-1">
                        Selected Safe
                      </Typography>
                      <Typography variant="caption" className="text-foreground font-mono text-xs break-all">
                        {selection.selectedSafe}
                      </Typography>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border">
                    <Typography variant="caption" className="text-muted-foreground text-xs">
                      {selection.safeWallets.length} Safe wallet{selection.safeWallets.length !== 1 ? "s" : ""} available
                    </Typography>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-lg bg-secondary/20 border border-border text-center">
                  <Typography variant="caption" className="text-muted-foreground">
                    No Safe wallets found. Use the toolbar to create a new Safe wallet.
                  </Typography>
                </div>
              )}
            </div>
          )}
        </SimpleCard>
      )}

      {/* Section B: Module Status (when a Safe selected) */}
      {isConnected && selection.selectedSafe && (
        <SimpleCard className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <HiCog className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <Typography
                variant="bodySmall"
                className="font-semibold text-foreground mb-1"
              >
                TriggerX Module
              </Typography>
              <Typography
                variant="caption"
                className="text-muted-foreground"
              >
                Module status for automated transaction execution
              </Typography>
            </div>
          </div>

          {selection.checkingModule ? (
            <div className="flex items-center justify-center py-6">
              <LuLoader className="w-5 h-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">
                Checking module status...
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Status display */}
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-secondary/30 border border-border">
                <span className="text-sm font-medium text-foreground">
                  Status
                </span>
                <div className="flex items-center gap-2">
                  {selection.moduleEnabled === true && (
                    <>
                      <LuCircleCheck className="w-5 h-5 text-success" />
                      <span className="text-sm text-success font-semibold">
                        Enabled
                      </span>
                    </>
                  )}
                  {selection.moduleEnabled === false && (
                    <>
                      <LuCircleX className="w-5 h-5 text-destructive" />
                      <span className="text-sm text-destructive font-semibold">
                        Disabled
                      </span>
                    </>
                  )}
                  {selection.moduleEnabled === null && (
                    <span className="text-sm text-muted-foreground">
                      Unknown
                    </span>
                  )}
                </div>
              </div>

              {selection.moduleEnabled === false && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Typography variant="caption" className="text-amber-500 text-xs">
                    Module is disabled. Use the toolbar to enable it.
                  </Typography>
                </div>
              )}

              {selection.moduleEnabled === true && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <Typography variant="caption" className="text-success text-xs">
                    Module is enabled and ready for automated transactions.
                  </Typography>
                </div>
              )}
            </div>
          )}
        </SimpleCard>
      )}

      {/* Creation flow status */}
      {creation.showCreateFlow && (
        <SimpleCard className="p-5 bg-white/5 border border-white/20">
          <Typography
            variant="bodySmall"
            className="font-semibold text-foreground mb-4"
          >
            Creating Safe Wallet...
          </Typography>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {creation.createStep === "pending" && (
                <LuLoader className="w-4 h-4 animate-spin text-primary" />
              )}
              {creation.createStep === "success" && (
                <LuCircleCheck className="w-4 h-4 text-success" />
              )}
              {creation.createStep === "error" && (
                <LuCircleX className="w-4 h-4 text-destructive" />
              )}
              <Typography variant="caption" className="text-foreground">
                Creating Safe contract
              </Typography>
            </div>

            <div className="flex items-center gap-3">
              {creation.signStep === "pending" && (
                <LuLoader className="w-4 h-4 animate-spin text-primary" />
              )}
              {creation.signStep === "success" && (
                <LuCircleCheck className="w-4 h-4 text-success" />
              )}
              {creation.signStep === "error" && (
                <LuCircleX className="w-4 h-4 text-destructive" />
              )}
              <Typography variant="caption" className="text-foreground">
                Signing module enable
              </Typography>
            </div>

            <div className="flex items-center gap-3">
              {creation.enableStep === "pending" && (
                <LuLoader className="w-4 h-4 animate-spin text-primary" />
              )}
              {creation.enableStep === "success" && (
                <LuCircleCheck className="w-4 h-4 text-success" />
              )}
              {creation.enableStep === "error" && (
                <LuCircleX className="w-4 h-4 text-destructive" />
              )}
              <Typography variant="caption" className="text-foreground">
                Enabling module
              </Typography>
            </div>
          </div>

          {(creation.createError ||
            creation.signError ||
            creation.enableError) && (
              <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Typography variant="caption" className="text-destructive text-xs">
                  {creation.createError ||
                    creation.signError ||
                    creation.enableError}
                </Typography>
              </div>
            )}
        </SimpleCard>
      )}
    </div>
  );
}

export function WalletNodeConfiguration() {
  return (
    <ErrorBoundary>
      <WalletNodeConfigurationInner />
    </ErrorBoundary>
  );
}
