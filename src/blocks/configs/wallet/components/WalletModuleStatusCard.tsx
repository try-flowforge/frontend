import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import { SafeWalletSelection } from "@/context/SafeWalletContext";
import { HiCog } from "react-icons/hi2";
import { LuCircleCheck, LuCircleX, LuLoader } from "react-icons/lu";

interface WalletModuleStatusCardProps {
  selection: SafeWalletSelection;
}

export function WalletModuleStatusCard({
  selection,
}: WalletModuleStatusCardProps) {
  return (
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
  );
}
