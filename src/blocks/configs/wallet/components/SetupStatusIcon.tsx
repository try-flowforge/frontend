import { OnboardingStepStatus } from "@/onboarding/context/OnboardingContext";
import { LuCircle, LuCircleCheck, LuCircleX, LuLoader } from "react-icons/lu";

interface SetupStatusIconProps {
  status: OnboardingStepStatus;
}

export function SetupStatusIcon({ status }: SetupStatusIconProps) {
  if (status === "pending") {
    return <LuLoader className="w-3.5 h-3.5 animate-spin text-primary" />;
  }

  if (status === "success") {
    return <LuCircleCheck className="w-3.5 h-3.5 text-success" />;
  }

  if (status === "error") {
    return <LuCircleX className="w-3.5 h-3.5 text-destructive" />;
  }

  return <LuCircle className="w-3.5 h-3.5 text-muted-foreground/60" />;
}
