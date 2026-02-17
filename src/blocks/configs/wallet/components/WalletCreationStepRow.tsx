import { Typography } from "@/components/ui/Typography";
import { SafeWalletCreation } from "@/context/SafeWalletContext";
import { LuCircleCheck, LuCircleX, LuLoader } from "react-icons/lu";

type CreationStepStatus = SafeWalletCreation["createStep"];

interface WalletCreationStepRowProps {
  label: string;
  status: CreationStepStatus;
}

function StatusIcon({ status }: { status: CreationStepStatus }) {
  if (status === "pending") {
    return <LuLoader className="w-4 h-4 animate-spin text-primary" />;
  }

  if (status === "success") {
    return <LuCircleCheck className="w-4 h-4 text-success" />;
  }

  if (status === "error") {
    return <LuCircleX className="w-4 h-4 text-destructive" />;
  }

  return <span className="w-4 h-4" aria-hidden="true" />;
}

export function WalletCreationStepRow({
  label,
  status,
}: WalletCreationStepRowProps) {
  return (
    <div className="flex items-center gap-3">
      <StatusIcon status={status} />
      <Typography variant="caption" className="text-foreground">
        {label}
      </Typography>
    </div>
  );
}
