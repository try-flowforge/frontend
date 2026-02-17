import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import { SafeWalletCreation } from "@/context/SafeWalletContext";
import { WalletCreationStepRow } from "./WalletCreationStepRow";

interface WalletCreationFlowCardProps {
  creation: SafeWalletCreation;
}

export function WalletCreationFlowCard({
  creation,
}: WalletCreationFlowCardProps) {
  return (
    <SimpleCard className="p-5 bg-white/5 border border-white/20">
      <Typography
        variant="bodySmall"
        className="font-semibold text-foreground mb-4"
      >
        Creating Safe Wallet...
      </Typography>

      <div className="space-y-2">
        <WalletCreationStepRow
          label="Creating Safe contract"
          status={creation.createStep}
        />
        <WalletCreationStepRow
          label="Signing module enable"
          status={creation.signStep}
        />
        <WalletCreationStepRow
          label="Enabling module"
          status={creation.enableStep}
        />
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
  );
}
