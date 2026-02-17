import { Dropdown } from "@/components/ui/Dropdown";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import { SafeWalletSelection } from "@/context/SafeWalletContext";
import { LuLoader } from "react-icons/lu";

interface WalletSafeInfoCardProps {
  address?: string;
  selection: SafeWalletSelection;
}

export function WalletSafeInfoCard({
  address,
  selection,
}: WalletSafeInfoCardProps) {
  if (!address) {
    return null;
  }

  return (
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

      {selection.isLoading && (
        <div className="flex items-center justify-center py-6">
          <LuLoader className="w-5 h-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading safes...
          </span>
        </div>
      )}

      {selection.error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <Typography variant="caption" className="text-destructive">
            {selection.error}
          </Typography>
        </div>
      )}

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
  );
}
