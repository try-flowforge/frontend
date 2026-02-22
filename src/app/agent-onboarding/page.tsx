import type { Metadata } from "next";
import NavBar from "@/components/layout/Navbar";
import AgentOnboardingPageClient from "@/components/onboarding/AgentOnboardingPageClient";
import { WorkflowProvider } from "@/context/WorkflowContext";

export const metadata: Metadata = {
  title: "Agent Onboarding - FlowForge",
  description:
    "Connect your wallet and Telegram to start interacting with the FlowForge agent.",
};

export default function AgentOnboardingPage() {
  return (
    <div className="bg-background">
      <NavBar variant="onboarding" />
      <main className="w-[90%] mx-auto mt-40">
        <WorkflowProvider>
          <AgentOnboardingPageClient />
        </WorkflowProvider>
      </main>
    </div>
  );
}

